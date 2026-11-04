package tw.com.ethink.ighble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.SystemClock
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/**
 * 掃描 + 自動連線的總控（取代舊 JS 的 MSCordovaBLE.startScan / connect / closeSuccess 流程）。
 * 所有狀態都在單一 HandlerThread 上處理。
 */
@SuppressLint("MissingPermission")
class BleCentral(private val context: Context, private val emit: (JSONObject) -> Unit) : GattSession.Listener {

    data class Config(
        val deviceNames: Set<String>,
        val autoConnect: Boolean,
        val forcePair: Boolean,
        val pairedAddresses: Set<String>,
        /** true：用 ScanFilter(deviceName) 交給藍牙晶片過濾（省電、背景可用）；少數機型若掃不到可設 false。 */
        val hardwareFilter: Boolean = true,
    )

    private val thread = HandlerThread("igh-ble").apply { start() }
    val handler = Handler(thread.looper)
    private val adapter: BluetoothAdapter? =
        (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
    private val cooldown = DeviceCooldown()
    val pending = PendingStore(context)

    private var config = Config(setOf("ETB04", "ETB05"), autoConnect = true, forcePair = false, pairedAddresses = emptySet())
    private var scanWanted = false
    private var scanning = false
    private var session: GattSession? = null
    private val scanStarts = ArrayDeque<Long>()
    private val reportedUnpaired = HashSet<String>()
    private val lastScanReport = HashMap<String, Long>()

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context, i: Intent) {
            val st = i.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)
            handler.post {
                when (st) {
                    BluetoothAdapter.STATE_ON -> { emitState(); if (scanWanted) startScanInternal() }
                    BluetoothAdapter.STATE_TURNING_OFF, BluetoothAdapter.STATE_OFF -> {
                        scanning = false
                        session?.abort("藍牙已關閉")
                        emitState()
                    }
                }
            }
        }
    }

    init {
        val f = IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED)
        if (Build.VERSION.SDK_INT >= 33) context.registerReceiver(stateReceiver, f, Context.RECEIVER_EXPORTED)
        else context.registerReceiver(stateReceiver, f)
    }

    fun isEnabled(): Boolean = adapter?.isEnabled == true
    fun hasBle(): Boolean = adapter != null

    fun configure(c: Config) = handler.post { config = c }

    fun startScan() = handler.post {
        scanWanted = true
        reportedUnpaired.clear()
        startScanInternal()
    }

    fun stopScan() = handler.post {
        scanWanted = false
        stopScanInternal()
    }

    fun destroy() {
        handler.post {
            scanWanted = false
            stopScanInternal()
            session?.abort("plugin destroy")
        }
        try { context.unregisterReceiver(stateReceiver) } catch (_: Exception) {}
        thread.quitSafely()
    }

    fun emitState() {
        emit(JSONObject().put("type", "state").put("enabled", isEnabled()).put("hasBle", hasBle())
            .put("scanning", scanning).put("busy", session != null))
    }

    // ---------- 掃描 ----------

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            handler.post { onScanResultInternal(result) }
        }

        override fun onBatchScanResults(results: MutableList<ScanResult>) {
            handler.post { results.forEach { onScanResultInternal(it) } }
        }

        override fun onScanFailed(errorCode: Int) {
            handler.post {
                scanning = false
                log("掃描失敗 errorCode=$errorCode")
                emitError("Err001", "掃描啟動失敗 ($errorCode)", null, null)
                // SCAN_FAILED_ALREADY_STARTED(1) 以外的錯誤：稍後重試
                if (scanWanted && errorCode != SCAN_FAILED_ALREADY_STARTED) handler.postDelayed({ startScanInternal() }, 5_000)
            }
        }
    }

    private fun startScanInternal() {
        if (!scanWanted || scanning || session != null) return
        val scanner = adapter?.takeIf { it.isEnabled }?.bluetoothLeScanner ?: run { emitState(); return }
        // Android 7+：30 秒內超過 5 次 startScan 會被系統靜默封鎖，這裡主動節流
        val now = SystemClock.elapsedRealtime()
        while (scanStarts.isNotEmpty() && now - scanStarts.first() > 30_000) scanStarts.removeFirst()
        if (scanStarts.size >= 4) {
            val wait = 30_000 - (now - scanStarts.first()) + 500
            log("掃描節流，${wait}ms 後再開始")
            handler.postDelayed({ startScanInternal() }, wait)
            return
        }
        scanStarts.addLast(now)
        val filters = if (config.hardwareFilter) config.deviceNames.map { ScanFilter.Builder().setDeviceName(it).build() } else emptyList()
        val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).apply {
            if (Build.VERSION.SDK_INT >= 23) {
                setCallbackType(ScanSettings.CALLBACK_TYPE_ALL_MATCHES)
                setMatchMode(ScanSettings.MATCH_MODE_AGGRESSIVE)
            }
        }.build()
        try {
            scanner.startScan(filters, settings, scanCallback)
            scanning = true
            log("開始掃描 ${config.deviceNames}")
            emitState()
        } catch (e: Exception) {
            emitError("Err001", "掃描啟動失敗: ${e.message}", null, null)
        }
    }

    private fun stopScanInternal() {
        if (!scanning) return
        scanning = false
        try { adapter?.bluetoothLeScanner?.stopScan(scanCallback) } catch (_: Exception) {}
        emitState()
    }

    private fun onScanResultInternal(r: ScanResult) {
        val name = r.scanRecord?.deviceName ?: try { r.device.name } catch (_: SecurityException) { null } ?: return
        if (name !in config.deviceNames) return
        val address = r.device.address
        val now = SystemClock.elapsedRealtime()

        fun report() = emit(JSONObject().put("type", "scanResult").put("name", name).put("address", address).put("rssi", r.rssi))

        // 非自動連線（配對頁面列出設備）：同一台 3 秒內只回報一次
        if (!config.autoConnect) {
            if ((lastScanReport[address] ?: 0L) + 3_000 < now) { lastScanReport[address] = now; report() }
            return
        }
        if (session != null) return
        if (config.forcePair && address !in config.pairedAddresses) {
            if (reportedUnpaired.add(address)) emitError("Err004", name, name, address)
            return
        }
        if (cooldown.isBlocked(address, now)) return
        val model = EtbProtocol.modelOf(name) ?: return
        report() // 自動連線模式：只在真的要連線時回報（JS 會顯示「發現設備，正在連線中」）

        stopScanInternal() // 連線期間停止掃描，提高連線成功率
        val s = GattSession(context, handler, r.device, name, EtbProtocol(model), this)
        session = s
        emitState()
        s.start()
    }

    // ---------- GattSession.Listener（皆在 handler 執行緒） ----------

    override fun onSessionEvent(session: GattSession, type: String, message: String) {
        log("[${session.name}] $message")
        if (type != "log") emit(JSONObject().put("type", type).put("name", session.name).put("address", session.address).put("message", message))
    }

    override fun onReading(session: GattSession, reading: EtbProtocol.Reading) {
        val o = JSONObject()
            .put("type", "reading")
            .put("id", UUID.randomUUID().toString())
            .put("model", reading.model)
            .put("name", session.name)
            .put("address", session.address)
            .put("kind", reading.kind)
            .put("value", reading.value)
            .put("bgType", reading.bgType)
            .put("measuredAt", System.currentTimeMillis())
        pending.add(o) // 先存再通知
        emit(o)
    }

    override fun onFinished(session: GattSession, success: Boolean, reason: String) {
        if (this.session !== session) return
        this.session = null
        val now = SystemClock.elapsedRealtime()
        if (success) {
            cooldown.markSuccess(session.address, now)
        } else {
            val backoff = cooldown.markFailure(session.address, now)
            log("[${session.name}] 失敗：$reason，${backoff}ms 內不重連（第 ${cooldown.failureCount(session.address)} 次）")
            emitError("Err005", reason, session.name, session.address)
        }
        emit(JSONObject().put("type", "disconnected").put("name", session.name).put("address", session.address)
            .put("success", success).put("reason", reason))
        emitState()
        // 原 JS：close 後 Android 休息 1 秒再掃描
        handler.postDelayed({ startScanInternal() }, 1_000)
    }

    fun pendingReadings(): JSONArray = pending.all()

    private fun emitError(code: String, message: String, name: String?, address: String?) {
        emit(JSONObject().put("type", "error").put("code", code).put("message", message)
            .put("name", name ?: JSONObject.NULL).put("address", address ?: JSONObject.NULL))
    }

    private fun log(msg: String) {
        Log.d("IghBle", msg)
        emit(JSONObject().put("type", "log").put("message", msg))
    }

    companion object {
        private const val SCAN_FAILED_ALREADY_STARTED = 1
    }
}
