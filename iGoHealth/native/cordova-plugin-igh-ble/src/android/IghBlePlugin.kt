package tw.com.ethink.ighble

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaInterface
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.CordovaWebView
import org.apache.cordova.PluginResult
import org.json.JSONArray
import org.json.JSONObject

/**
 * JS 介面（見 www/ighBle.js）：
 *   setListener(cb)          事件串流：state / scanResult / connecting / connected / subscribed / reading / disconnected / error / log
 *   configure(cfg)           { deviceNames, autoConnect, forcePair, pairedAddresses, hardwareFilter }
 *   requestPermissions()     Android 12+：BLUETOOTH_SCAN / BLUETOOTH_CONNECT；以下：ACCESS_FINE_LOCATION
 *   startScan() / stopScan()
 *   ack(id)                  JS 已將量測寫入 SQLite，原生端刪除暫存
 *   getPending()             取回尚未 ack 的量測
 *   getState()
 *   enableBluetooth() / openBluetoothSettings()
 */
class IghBlePlugin : CordovaPlugin() {

    private var central: BleCentral? = null
    private var listener: CallbackContext? = null
    private var permissionCallback: CallbackContext? = null

    override fun initialize(cordova: CordovaInterface, webView: CordovaWebView) {
        super.initialize(cordova, webView)
        central = BleCentral(cordova.activity.applicationContext) { evt -> send(evt) }
    }

    override fun execute(action: String, args: JSONArray, cb: CallbackContext): Boolean {
        val c = central ?: return false
        when (action) {
            "setListener" -> {
                listener = cb
                val r = PluginResult(PluginResult.Status.NO_RESULT); r.keepCallback = true
                cb.sendPluginResult(r)
                c.emitState()
                // 重送尚未 ack 的量測（例如 WebView 重新載入、App 在背景時收到的資料）
                val pend = c.pendingReadings()
                for (i in 0 until pend.length()) send(pend.getJSONObject(i).put("replayed", true))
            }
            "configure" -> {
                val o = args.optJSONObject(0) ?: JSONObject()
                c.configure(
                    BleCentral.Config(
                        deviceNames = o.optJSONArray("deviceNames").toStringSet().ifEmpty { setOf("ETB04", "ETB05") },
                        autoConnect = o.optBoolean("autoConnect", true),
                        forcePair = o.optBoolean("forcePair", false),
                        pairedAddresses = o.optJSONArray("pairedAddresses").toStringSet().map { it.uppercase() }.toSet(),
                        hardwareFilter = o.optBoolean("hardwareFilter", true),
                    )
                )
                cb.success()
            }
            "requestPermissions" -> {
                val need = requiredPermissions().filterNot { cordova.hasPermission(it) }
                if (need.isEmpty()) cb.success(JSONObject().put("granted", true))
                else { permissionCallback = cb; cordova.requestPermissions(this, REQ_PERMISSIONS, need.toTypedArray()) }
            }
            "startScan" -> {
                if (!requiredPermissions().all { cordova.hasPermission(it) }) { cb.error("permission"); return true }
                c.startScan(); cb.success()
            }
            "stopScan" -> { c.stopScan(); cb.success() }
            "ack" -> { cb.success(if (c.pending.ack(args.getString(0))) 1 else 0) }
            "getPending" -> cb.success(c.pendingReadings())
            "getState" -> cb.success(
                JSONObject().put("enabled", c.isEnabled()).put("hasBle", c.hasBle())
                    .put("permission", requiredPermissions().all { cordova.hasPermission(it) })
            )
            "enableBluetooth" -> {
                cordova.activity.startActivity(Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)); cb.success()
            }
            "openBluetoothSettings" -> {
                cordova.activity.startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS)); cb.success()
            }
            else -> return false
        }
        return true
    }

    @Deprecated("cordova-android 仍會呼叫此方法")
    override fun onRequestPermissionResult(requestCode: Int, permissions: Array<out String>?, grantResults: IntArray?) {
        if (requestCode != REQ_PERMISSIONS) return
        val granted = grantResults != null && grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
        permissionCallback?.success(JSONObject().put("granted", granted))
        permissionCallback = null
        central?.emitState()
    }

    override fun onDestroy() {
        central?.destroy()
        central = null
        super.onDestroy()
    }

    private fun send(evt: JSONObject) {
        val cb = listener ?: return
        val r = PluginResult(PluginResult.Status.OK, evt)
        r.keepCallback = true
        cb.sendPluginResult(r)
    }

    private fun requiredPermissions(): List<String> =
        if (Build.VERSION.SDK_INT >= 31) listOf(Manifest.permission.BLUETOOTH_SCAN, Manifest.permission.BLUETOOTH_CONNECT)
        else listOf(Manifest.permission.ACCESS_FINE_LOCATION)

    private fun JSONArray?.toStringSet(): Set<String> {
        if (this == null) return emptySet()
        return (0 until length()).mapNotNull { optString(it, null) }.filter { it.isNotBlank() }.toSet()
    }

    companion object { private const val REQ_PERMISSIONS = 7311 }
}
