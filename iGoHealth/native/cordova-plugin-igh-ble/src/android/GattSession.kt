package tw.com.ethink.ighble

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothProfile
import android.content.Context
import android.os.Build
import android.os.Handler
import java.util.ArrayDeque
import java.util.UUID

/**
 * 單一設備的一次連線：connect → discover → subscribe → 協定 → 關機 → close。
 *
 * 穩定性重點（對照舊版 cordova-plugin-bluetoothle + JS 計時器的問題）：
 *  1. 所有 GATT 操作進入佇列，一次只執行一個（Android GATT 不允許並行操作）。
 *  2. 每個階段都有逾時；任何失敗都一定會 disconnect + close，不會留下殭屍連線。
 *  3. status 133 / 連線失敗：close 後交由 BleCentral 退避（DeviceCooldown），不立即重連。
 *  4. 找不到 FFF0 service（舊 log 最常見的錯誤）：呼叫 BluetoothGatt.refresh() 清 GATT 快取後重新 discover 一次。
 *  5. 所有回呼都切回同一條 HandlerThread，沒有競態。
 */
@SuppressLint("MissingPermission")
class GattSession(
    private val context: Context,
    private val handler: Handler,
    val device: BluetoothDevice,
    val name: String,
    private val protocol: EtbProtocol,
    private val listener: Listener,
) {
    interface Listener {
        fun onSessionEvent(session: GattSession, type: String, message: String)
        fun onReading(session: GattSession, reading: EtbProtocol.Reading)
        /** 一定只會呼叫一次。success = 有讀到資料（含設備錯誤碼）。 */
        fun onFinished(session: GattSession, success: Boolean, reason: String)
    }

    private sealed class Op {
        data class Write(val bytes: ByteArray, val label: String, val then: (() -> Unit)? = null) : Op()
        object EnableNotify : Op()
    }

    private var gatt: BluetoothGatt? = null
    private var characteristic: BluetoothGattCharacteristic? = null
    private val queue = ArrayDeque<Op>()
    private var inFlight: Op? = null
    private var refreshedOnce = false
    private var gotReading = false
    private var finished = false
    private var disconnecting = false
    private val timers = HashMap<String, Runnable>()

    val address: String get() = device.address

    fun start() {
        listener.onSessionEvent(this, "connecting", "連線中 $name/$address")
        startTimer(T_SESSION, SESSION_TIMEOUT_MS) { finish(false, "整體逾時") }
        startTimer(T_CONNECT, CONNECT_TIMEOUT_MS) { finish(false, "連線逾時") }
        gatt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            device.connectGatt(context, false, callback, BluetoothDevice.TRANSPORT_LE)
        } else {
            device.connectGatt(context, false, callback)
        }
        if (gatt == null) finish(false, "connectGatt 回傳 null")
    }

    /** 外部要求中止（藍牙關閉、stopScan 等）。 */
    fun abort(reason: String) = handler.post { finish(false, reason) }

    // ---------- GATT callback（Binder 執行緒 → 切回 handler） ----------

    private val callback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(g: BluetoothGatt, status: Int, newState: Int) {
            handler.post { onConnectionState(g, status, newState) }
        }

        override fun onServicesDiscovered(g: BluetoothGatt, status: Int) {
            handler.post { onDiscovered(g, status) }
        }

        override fun onDescriptorWrite(g: BluetoothGatt, d: BluetoothGattDescriptor, status: Int) {
            handler.post { onOpComplete(status, "descriptor") }
        }

        override fun onCharacteristicWrite(g: BluetoothGatt, c: BluetoothGattCharacteristic, status: Int) {
            handler.post { onOpComplete(status, "write") }
        }

        // API 33+
        override fun onCharacteristicChanged(g: BluetoothGatt, c: BluetoothGattCharacteristic, value: ByteArray) {
            val copy = value.copyOf()
            handler.post { onNotify(copy) }
        }

        // API < 33
        @Deprecated("Deprecated in API 33")
        override fun onCharacteristicChanged(g: BluetoothGatt, c: BluetoothGattCharacteristic) {
            @Suppress("DEPRECATION") val copy = c.value?.copyOf() ?: return
            handler.post { onNotify(copy) }
        }
    }

    private fun onConnectionState(g: BluetoothGatt, status: Int, newState: Int) {
        if (finished) { safeClose(g); return }
        if (status == BluetoothGatt.GATT_SUCCESS && newState == BluetoothProfile.STATE_CONNECTED) {
            cancelTimer(T_CONNECT)
            listener.onSessionEvent(this, "connected", "已連線 $name/$address")
            // 連線後稍等再 discover（bonding / 連線參數更新期間 discover 容易失敗）
            startTimer(T_DISCOVER, DISCOVER_TIMEOUT_MS) { finish(false, "Discover 逾時") }
            handler.postDelayed({ if (!finished) g.discoverServices() }, DISCOVER_DELAY_MS)
        } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
            val why = if (status == 133) "GATT_ERROR 133" else "斷線 status=$status"
            if (disconnecting) finish(gotReading, "正常斷線") else finish(gotReading, why)
        }
    }

    private fun onDiscovered(g: BluetoothGatt, status: Int) {
        if (finished) return
        val svc = g.getService(UUID.fromString(EtbProtocol.SERVICE_UUID))
        val chr = svc?.getCharacteristic(UUID.fromString(EtbProtocol.CHAR_UUID))
        if (status != BluetoothGatt.GATT_SUCCESS || chr == null) {
            if (!refreshedOnce) {
                refreshedOnce = true
                listener.onSessionEvent(this, "log", "找不到 FFF0/FFF1（status=$status），清除 GATT 快取後重新 discover")
                refreshCache(g)
                handler.postDelayed({ if (!finished) g.discoverServices() }, REFRESH_DELAY_MS)
                return
            }
            finish(false, "Service not found")
            return
        }
        cancelTimer(T_DISCOVER)
        characteristic = chr
        enqueue(Op.EnableNotify)
    }

    private fun onNotify(value: ByteArray) {
        if (finished) return
        run(protocol.onNotify(value))
    }

    // ---------- 協定動作 ----------

    private fun run(actions: List<EtbProtocol.Action>) {
        for (a in actions) {
            if (finished) return
            when (a) {
                is EtbProtocol.Action.Write -> enqueue(Op.Write(a.bytes, a.label))
                is EtbProtocol.Action.StartTimer -> startTimer("p:" + a.tag, a.delayMs) { run(protocol.onTimer(a.tag)) }
                is EtbProtocol.Action.CancelTimer -> cancelTimer("p:" + a.tag)
                is EtbProtocol.Action.Emit -> { gotReading = true; listener.onReading(this, a.reading) }
                is EtbProtocol.Action.PowerOffAndFinish -> {
                    enqueue(Op.Write(a.bytes, "PowerOff") {
                        // 原 JS：關機指令寫入成功後等 2 秒再斷線
                        handler.postDelayed({ disconnect() }, POWER_OFF_DISCONNECT_DELAY_MS)
                    })
                    startTimer(T_POWER_OFF, POWER_OFF_FALLBACK_MS) { disconnect() }
                }
                is EtbProtocol.Action.Fail -> finish(gotReading, a.reason)
                is EtbProtocol.Action.Log -> listener.onSessionEvent(this, "log", a.message)
            }
        }
    }

    // ---------- 操作佇列 ----------

    private fun enqueue(op: Op) {
        queue.add(op)
        if (inFlight == null) next()
    }

    private fun next() {
        if (finished || inFlight != null) return
        val op = queue.poll() ?: return
        val g = gatt ?: return
        val chr = characteristic ?: return finish(false, "characteristic 不存在")
        inFlight = op
        startTimer(T_OP, OP_TIMEOUT_MS) { finish(gotReading, "GATT 操作逾時: $op") }
        val ok = when (op) {
            is Op.EnableNotify -> enableNotify(g, chr)
            is Op.Write -> write(g, chr, op.bytes)
        }
        if (!ok) {
            inFlight = null
            cancelTimer(T_OP)
            finish(gotReading, "GATT 操作送出失敗: $op")
        }
    }

    private fun onOpComplete(status: Int, kind: String) {
        val op = inFlight ?: return
        inFlight = null
        cancelTimer(T_OP)
        if (finished) return
        if (status != BluetoothGatt.GATT_SUCCESS) {
            // 關機指令寫入失敗也視同完成（設備可能已自行關機）
            if (op is Op.Write && op.then != null) { op.then.invoke(); return }
            finish(gotReading, "$kind 失敗 status=$status")
            return
        }
        when (op) {
            is Op.EnableNotify -> {
                listener.onSessionEvent(this, "subscribed", "訂閱成功")
                run(protocol.onSubscribed())
            }
            is Op.Write -> op.then?.invoke()
        }
        next()
    }

    private fun enableNotify(g: BluetoothGatt, c: BluetoothGattCharacteristic): Boolean {
        if (!g.setCharacteristicNotification(c, true)) return false
        val cccd = c.getDescriptor(CCCD) ?: return false
        val value = if (c.properties and BluetoothGattCharacteristic.PROPERTY_INDICATE != 0 &&
            c.properties and BluetoothGattCharacteristic.PROPERTY_NOTIFY == 0
        ) BluetoothGattDescriptor.ENABLE_INDICATION_VALUE else BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
        return if (Build.VERSION.SDK_INT >= 33) {
            g.writeDescriptor(cccd, value) == BLUETOOTH_STATUS_SUCCESS
        } else {
            @Suppress("DEPRECATION")
            run { cccd.value = value; g.writeDescriptor(cccd) }
        }
    }

    private fun write(g: BluetoothGatt, c: BluetoothGattCharacteristic, bytes: ByteArray): Boolean {
        // 原 JS 使用預設（有回應）寫入；若特徵值只支援無回應則改用無回應
        val type = if (c.properties and BluetoothGattCharacteristic.PROPERTY_WRITE != 0)
            BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT else BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
        return if (Build.VERSION.SDK_INT >= 33) {
            g.writeCharacteristic(c, bytes, type) == BLUETOOTH_STATUS_SUCCESS
        } else {
            @Suppress("DEPRECATION")
            run { c.writeType = type; c.value = bytes; g.writeCharacteristic(c) }
        }
    }

    // ---------- 結束 ----------

    private fun disconnect() {
        if (finished || disconnecting) return
        disconnecting = true
        val g = gatt ?: return finish(gotReading, "無 gatt")
        g.disconnect()
        // 部分機型不會回 STATE_DISCONNECTED，保底直接 close
        startTimer(T_DISCONNECT, DISCONNECT_FALLBACK_MS) { finish(gotReading, "斷線（逾時保底）") }
    }

    private fun finish(success: Boolean, reason: String) {
        if (finished) return
        finished = true
        timers.values.forEach { handler.removeCallbacks(it) }
        timers.clear()
        queue.clear()
        inFlight = null
        gatt?.let { g ->
            try { g.disconnect() } catch (_: Exception) {}
            safeClose(g)
        }
        gatt = null
        listener.onFinished(this, success, reason)
    }

    private fun safeClose(g: BluetoothGatt) {
        try { g.close() } catch (_: Exception) {}
    }

    /** 隱藏 API：清除 GATT 快取（業界常用的 133 / service not found 修復手段）。 */
    private fun refreshCache(g: BluetoothGatt) {
        try {
            val m = g.javaClass.getMethod("refresh")
            m.invoke(g)
        } catch (_: Exception) {
        }
    }

    private fun startTimer(tag: String, ms: Long, block: () -> Unit) {
        cancelTimer(tag)
        val r = Runnable { timers.remove(tag); if (!finished) block() }
        timers[tag] = r
        handler.postDelayed(r, ms)
    }

    private fun cancelTimer(tag: String) {
        timers.remove(tag)?.let { handler.removeCallbacks(it) }
    }

    companion object {
        val CCCD: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")
        private const val BLUETOOTH_STATUS_SUCCESS = 0 // BluetoothStatusCodes.SUCCESS

        const val CONNECT_TIMEOUT_MS = 12_000L
        const val DISCOVER_DELAY_MS = 600L
        const val DISCOVER_TIMEOUT_MS = 12_000L
        const val REFRESH_DELAY_MS = 600L
        const val OP_TIMEOUT_MS = 5_000L
        const val SESSION_TIMEOUT_MS = 60_000L
        const val POWER_OFF_DISCONNECT_DELAY_MS = 2_000L
        const val POWER_OFF_FALLBACK_MS = 4_000L
        const val DISCONNECT_FALLBACK_MS = 2_000L

        private const val T_SESSION = "session"
        private const val T_CONNECT = "connect"
        private const val T_DISCOVER = "discover"
        private const val T_OP = "op"
        private const val T_POWER_OFF = "poweroff"
        private const val T_DISCONNECT = "disconnect"
    }
}
