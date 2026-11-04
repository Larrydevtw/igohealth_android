package tw.com.ethink.ighble

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * 尚未被 JS 確認（ack）寫入 SQLite 的量測資料。
 * 原生收到量測值後「先存再通知」，WebView 被系統回收或 App 在背景時也不會遺失；
 * JS 端寫入 DB 成功後呼叫 IghBle.ack(id) 才會刪除。
 */
class PendingStore(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences("igh_ble_pending", Context.MODE_PRIVATE)

    @Synchronized
    fun add(reading: JSONObject) {
        val arr = all()
        arr.put(reading)
        // 安全上限，避免異常狀況下無限成長
        val trimmed = if (arr.length() > 200) JSONArray().also { n -> for (i in arr.length() - 200 until arr.length()) n.put(arr.get(i)) } else arr
        prefs.edit().putString(KEY, trimmed.toString()).apply()
    }

    @Synchronized
    fun ack(id: String): Boolean {
        val arr = all()
        val out = JSONArray()
        var removed = false
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i)
            if (o.optString("id") == id) removed = true else out.put(o)
        }
        prefs.edit().putString(KEY, out.toString()).apply()
        return removed
    }

    @Synchronized
    fun all(): JSONArray = try { JSONArray(prefs.getString(KEY, "[]")) } catch (e: Exception) { JSONArray() }

    companion object { private const val KEY = "readings" }
}
