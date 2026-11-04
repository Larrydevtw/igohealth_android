package tw.com.ethink.ighble

/**
 * 聿新 Bioptik ETB04 / ETB05 藍牙協定（純 Kotlin，不依賴 Android，可在 JVM 單元測試）。
 *
 * 移植自原 Cordova 版：
 *   www/js/WiseBLE/Bioptik_ETB04_BP.js（物件名 Bioptik_ETB04）
 *   www/js/WiseBLE/Bioptik_ETB05.js
 *
 * 封包格式（ASCII，前後以 '{' 0x7B / '}' 0x7D 包住）：
 *   App → 設備：  {L#<ck>}  Link       {S#<ck>}  取得類型     {D#<ck>}  取得資料     {Z#<ck>}  關機
 *   設備 → App：  {L<電量?>#<ck>}      {S<type>...#<ck>}     {D<資料>#<ck>}
 * <ck> = 從 '{' 後第一個 byte 開始 XOR 到 '#'（含），最後 OR 0x80；因此 <ck> >= 0x80，不會與 '}' 衝突。
 * 資料封包常被拆成兩個 notify（20 bytes MTU），這裡以 '{'..'}' 自行組框，不依賴拆包位置。
 *
 * 協定本身不處理計時與藍牙 I/O，只回傳 [Action]，由 GattSession 執行。
 */
class EtbProtocol(val model: Model) {

    enum class Model { ETB04, ETB05 }

    sealed class Action {
        data class Write(val bytes: ByteArray, val label: String) : Action() {
            override fun equals(other: Any?) = other is Write && other.label == label && other.bytes.contentEquals(bytes)
            override fun hashCode() = label.hashCode() * 31 + bytes.contentHashCode()
        }
        data class StartTimer(val tag: String, val delayMs: Long) : Action()
        data class CancelTimer(val tag: String) : Action()
        data class Emit(val reading: Reading) : Action()
        /** 寫入關機指令後結束連線（session 會等寫入完成再延遲斷線）。 */
        data class PowerOffAndFinish(val bytes: ByteArray) : Action() {
            override fun equals(other: Any?) = other is PowerOffAndFinish && other.bytes.contentEquals(bytes)
            override fun hashCode() = bytes.contentHashCode()
        }
        data class Fail(val reason: String) : Action()
        data class Log(val message: String) : Action()
    }

    /**
     * 一筆量測結果。
     * kind：G 血糖 / C 膽固醇 / U 尿酸 / H 血紅素 / T 三酸甘油脂 / P 血壓 / Err 設備錯誤碼（value 為錯誤碼）。
     * value 與原 JS 送給 FnBT.DataReceiving 的第 4 欄完全相同（血壓為 "收縮,舒張,脈搏"）。
     */
    data class Reading(val model: String, val kind: String, val value: String, val bgType: Int = 0)

    companion object {
        const val SERVICE_UUID = "0000FFF0-0000-1000-8000-00805F9B34FB"
        const val CHAR_UUID = "0000FFF1-0000-1000-8000-00805F9B34FB"

        val CMD_LINK = byteArrayOf(0x7B, 0x4C, 0x23, 0xEF.toByte(), 0x7D)
        val CMD_TYPE = byteArrayOf(0x7B, 0x53, 0x23, 0xF0.toByte(), 0x7D)
        val CMD_DATA = byteArrayOf(0x7B, 0x44, 0x23, 0xE7.toByte(), 0x7D)
        val CMD_POWER_OFF = byteArrayOf(0x7B, 0x5A, 0x23, 0xF9.toByte(), 0x7D)

        const val TIMER_LINK = "link"
        const val TIMER_DATA = "data"

        /** 訂閱成功後第一次送 Link 的延遲（原 JS：1000ms）。 */
        const val FIRST_LINK_DELAY_MS = 1000L
        /** Link 重送間隔（原 JS：2000ms）。 */
        const val LINK_RETRY_MS = 2000L
        /** Link 最多重送次數。原 JS 為 100 次（=200 秒），容易卡住連線；改為 15 次（30 秒）後斷線重來。 */
        const val LINK_MAX_TRIES = 15
        /** 送出 S/D 後等待回覆的逾時（原 JS 沒有，會一直卡住）。 */
        const val REPLY_TIMEOUT_MS = 5000L
        const val REPLY_MAX_TRIES = 3

        fun modelOf(deviceName: String?): Model? = when (deviceName) {
            "ETB04" -> Model.ETB04
            "ETB05" -> Model.ETB05
            else -> null
        }

        /** 原 JS ETB_CheckSum。 */
        fun checksum(frame: ByteArray): Int? {
            var x: Int? = null
            var i = 0
            while (i < frame.size) {
                val b = frame[i].toInt() and 0xFF
                when {
                    b == 0x7B -> { i++; if (i < frame.size) x = frame[i].toInt() and 0xFF }
                    b == 0x23 -> return ((x ?: 0) xor b) or 0x80
                    x != null -> x = x xor b
                }
                i++
            }
            return null
        }

        /** 等同 JavaScript parseInt(str)：取開頭的整數，取不到回傳 null（JS 的 NaN）。 */
        fun jsParseInt(s: String): Int? {
            val t = s.trimStart()
            var end = 0
            if (end < t.length && (t[end] == '-' || t[end] == '+')) end++
            val digitsStart = end
            while (end < t.length && t[end].isDigit()) end++
            if (end == digitsStart) return null
            return t.substring(0, end).toIntOrNull()
        }

        /** 等同 JavaScript String.prototype.substr(start, length)。 */
        fun substr(s: String, start: Int, length: Int): String {
            if (start >= s.length) return ""
            return s.substring(start, minOf(s.length, start + length))
        }

        fun ascii(bytes: ByteArray): String = String(CharArray(bytes.size) { (bytes[it].toInt() and 0xFF).toChar() })
    }

    private val rx = ArrayList<Byte>()
    private var linked = false
    private var linkTries = 0
    private var thisType: String? = null
    private var pending: String? = null // 目前等待回覆的指令："S" 或 "D"
    private var replyTries = 0
    private var finished = false

    /** 訂閱 notify 成功後呼叫。 */
    fun onSubscribed(): List<Action> {
        reset()
        return listOf(Action.StartTimer(TIMER_LINK, FIRST_LINK_DELAY_MS))
    }

    fun onTimer(tag: String): List<Action> {
        if (finished) return emptyList()
        return when (tag) {
            TIMER_LINK -> {
                if (linked) emptyList()
                else if (linkTries >= LINK_MAX_TRIES) fail("Link 無回應（已送 $linkTries 次）")
                else {
                    linkTries++
                    listOf(Action.Write(CMD_LINK, "L#$linkTries"), Action.StartTimer(TIMER_LINK, LINK_RETRY_MS))
                }
            }
            TIMER_DATA -> {
                val cmd = pending ?: return emptyList()
                if (replyTries >= REPLY_MAX_TRIES) fail("指令 $cmd 無回應")
                else send(cmd)
            }
            else -> emptyList()
        }
    }

    fun onNotify(chunk: ByteArray): List<Action> {
        if (finished) return emptyList()
        val out = ArrayList<Action>()
        for (b in chunk) rx.add(b)
        while (true) {
            val start = rx.indexOf(0x7B.toByte())
            if (start < 0) { rx.clear(); break }
            if (start > 0) repeat(start) { rx.removeAt(0) }
            val end = rx.indexOf(0x7D.toByte())
            if (end < 0) break
            val frame = ByteArray(end + 1) { rx[it] }
            repeat(end + 1) { rx.removeAt(0) }
            out += onFrame(frame)
            if (finished) break
        }
        return out
    }

    private fun onFrame(frame: ByteArray): List<Action> {
        val text = ascii(frame)
        if (frame.size < 4) return listOf(Action.Log("忽略過短封包 $text"))
        return when (text[1]) {
            'L' -> {
                if (linked) return listOf(Action.Log("重複的 L 回覆"))
                linked = true
                listOf(Action.CancelTimer(TIMER_LINK), Action.Log("Link OK $text")) + send("S", reset = true)
            }
            'S' -> {
                if (pending != "S") return listOf(Action.Log("非預期的 S 回覆 $text"))
                thisType = substr(text, 2, 1)
                listOf(Action.Log("類型 $thisType")) + send("D", reset = true)
            }
            'D' -> {
                if (pending != "D") return listOf(Action.Log("非預期的 D 回覆 $text"))
                val ck = checksum(frame)
                if (ck == null || ck != (frame[frame.size - 2].toInt() and 0xFF)) {
                    return if (replyTries >= REPLY_MAX_TRIES) fail("CheckSum Error")
                    else listOf(Action.Log("CheckSum Error，重送 D")) + send("D")
                }
                finished = true
                pending = null
                listOf(Action.CancelTimer(TIMER_DATA), Action.Emit(parse(text)), Action.PowerOffAndFinish(CMD_POWER_OFF))
            }
            else -> listOf(Action.Log("未知封包 $text"))
        }
    }

    /** 依原 JS getMeasurementData 解析（substr 位置完全一致）。 */
    fun parse(text: String): Reading {
        val m = model.name
        if (text.substringBefore('#').length == 4) {
            return Reading(m, "Err", substr(text, 2, 2))
        }
        val type = thisType
        fun int(start: Int, len: Int) = jsParseInt(substr(text, start, len))
        fun tenth(start: Int, len: Int) = int(start, len)?.let { String.format(java.util.Locale.US, "%.1f", it / 10.0) }
        val (kind, value) = when (model) {
            Model.ETB04 -> when (type) {
                "0" -> {
                    val a = int(2, 3); val b = int(6, 3); val c = int(10, 3)
                    "P" to if (a == null || b == null || c == null) null else "$a,$b,$c"
                }
                "1" -> "G" to int(2, 4)?.toString()
                "2" -> "C" to int(2, 4)?.toString()
                else -> "" to null
            }
            Model.ETB05 -> when (type) {
                "0" -> "G" to int(3, 4)?.toString()
                "1" -> "C" to int(3, 4)?.toString()
                "2" -> "U" to tenth(3, 4)
                "3" -> "H" to tenth(3, 4)
                "4" -> "T" to int(3, 5)?.toString()
                else -> "" to null
            }
        }
        // 原 JS：measurementValue == "" 時回報 Err007（設備無量測資料）
        return if (value == null) Reading(m, "NoData", "") else Reading(m, kind, value)
    }

    private fun send(cmd: String, reset: Boolean = false): List<Action> {
        if (reset) replyTries = 0
        pending = cmd
        replyTries++
        val bytes = if (cmd == "S") CMD_TYPE else CMD_DATA
        return listOf(Action.Write(bytes, "$cmd#$replyTries"), Action.StartTimer(TIMER_DATA, REPLY_TIMEOUT_MS))
    }

    private fun fail(reason: String): List<Action> {
        finished = true
        return listOf(Action.CancelTimer(TIMER_LINK), Action.CancelTimer(TIMER_DATA), Action.Fail(reason))
    }

    private fun reset() {
        rx.clear(); linked = false; linkTries = 0; thisType = null; pending = null; replyTries = 0; finished = false
    }
}
