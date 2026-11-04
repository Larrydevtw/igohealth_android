package tw.com.ethink.ighble

import tw.com.ethink.ighble.EtbProtocol.Action
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.assertFalse

/**
 * 封包取自實機 log（2025-11-05/06，ETB05 實機，Android 舊版 Cordova）。
 * 期望值即舊版 JS 實際送進 FnBT.DataReceiving 的值。
 */
class EtbProtocolTest {

    private fun hex(s: String): ByteArray =
        s.split(',').filter { it.isNotBlank() }.map { it.toInt(16).toByte() }.toByteArray()

    private fun ProtocolRun.writes() = actions.filterIsInstance<Action.Write>().map { it.label.substringBefore('#') }

    private class ProtocolRun(val p: EtbProtocol) {
        val actions = ArrayList<Action>()
        fun subscribed() = actions.addAll(p.onSubscribed())
        fun timer(tag: String) = actions.addAll(p.onTimer(tag))
        fun notify(b: ByteArray) = actions.addAll(p.onNotify(b))
        fun reading() = actions.filterIsInstance<Action.Emit>().single().reading
    }

    /** 跑一次完整流程：Link → S → D（兩段） */
    private fun session(model: EtbProtocol.Model, l: String, s: String, d1: String, d2: String?): ProtocolRun {
        val r = ProtocolRun(EtbProtocol(model))
        r.subscribed()
        r.timer(EtbProtocol.TIMER_LINK)
        r.notify(hex(l))
        r.notify(hex(s))
        r.notify(hex(d1))
        if (d2 != null) r.notify(hex(d2))
        return r
    }

    @Test
    fun checksumMatchesCommandsAndDeviceFrames() {
        assertEquals(0xEF, EtbProtocol.checksum(EtbProtocol.CMD_LINK))
        assertEquals(0xF0, EtbProtocol.checksum(EtbProtocol.CMD_TYPE))
        assertEquals(0xE7, EtbProtocol.checksum(EtbProtocol.CMD_DATA))
        assertEquals(0xF9, EtbProtocol.checksum(EtbProtocol.CMD_POWER_OFF))
        // 設備回覆 {L059#D3} / {S0076270#C4}
        assertEquals(0xD3, EtbProtocol.checksum(hex("7B,4C,30,35,39,23,D3,7D")))
        assertEquals(0xC4, EtbProtocol.checksum(hex("7B,53,30,30,37,36,32,37,30,23,C4,7D")))
    }

    @Test
    fun etb05BloodGlucoseFromLog() {
        val r = session(
            EtbProtocol.Model.ETB05,
            "7B,4C,30,35,39,23,D3,7D,",
            "7B,53,30,30,37,36,32,37,30,23,C4,7D,",
            "7B,44,47,30,35,37,36,2C,30,30,30,2C,32,35,30,38,32,31,31,33,",
            "30,37,23,9D,7D,",
        )
        assertEquals(EtbProtocol.Reading("ETB05", "G", "576"), r.reading())
        assertEquals(listOf("L", "S", "D"), r.writes())
        assertTrue(r.actions.last() is Action.PowerOffAndFinish)
    }

    @Test
    fun etb05HemoglobinZeroFromLog() {
        val r = session(
            EtbProtocol.Model.ETB05,
            "7B,4C,30,33,31,23,DD,7D,",
            "7B,53,33,30,37,31,32,37,34,23,C4,7D,",
            "7B,44,48,30,30,30,30,2C,30,31,30,2C,32,35,30,38,32,31,31,33,",
            "32,30,23,92,7D,",
        )
        assertEquals(EtbProtocol.Reading("ETB05", "H", "0.0"), r.reading())
    }

    @Test
    fun etb05UricAcidFromLog() {
        val r = session(
            EtbProtocol.Model.ETB05,
            "7B,4C,30,34,34,23,DF,7D,",
            "7B,53,32,30,37,30,32,37,37,23,C7,7D,",
            "7B,44,55,31,32,30,30,2C,30,30,30,2C,32,35,30,38,32,31,31,34,",
            "34,38,23,84,7D,",
        )
        assertEquals(EtbProtocol.Reading("ETB05", "U", "120.0"), r.reading())
    }

    @Test
    fun etb05CholesterolFromLog() {
        val r = session(
            EtbProtocol.Model.ETB05,
            "7B,4C,30,33,38,23,D4,7D,",
            "7B,53,31,30,37,31,32,37,38,23,CA,7D,",
            "7B,44,43,30,31,39,39,2C,30,30,30,2C,32,35,30,38,32,31,31,34,",
            "34,38,23,90,7D,",
        )
        assertEquals(EtbProtocol.Reading("ETB05", "C", "199"), r.reading())
    }

    @Test
    fun etb05TriglycerideParsesFiveChars() {
        val p = EtbProtocol(EtbProtocol.Model.ETB05)
        p.onSubscribed(); p.onTimer(EtbProtocol.TIMER_LINK)
        p.onNotify(hex("7B,4C,30,35,39,23,D3,7D"))
        p.onNotify(hex("7B,53,34,30,37,31,32,36,34,23,C2,7D"))
        // 原 JS：parseInt(substr(3,5)) → "0298," → 298
        assertEquals(EtbProtocol.Reading("ETB05", "T", "298"), p.parse("{DT0298,000,2508211448#x}"))
    }

    @Test
    fun deviceErrorCode() {
        val p = EtbProtocol(EtbProtocol.Model.ETB05)
        // log: 量測值字串 {D15#ã}
        assertEquals(EtbProtocol.Reading("ETB05", "Err", "15"), p.parse("{D15#ã}"))
    }

    @Test
    fun etb04BloodPressureAndGlucose() {
        val bp = EtbProtocol(EtbProtocol.Model.ETB04)
        bp.onSubscribed(); bp.onTimer(EtbProtocol.TIMER_LINK)
        bp.onNotify(frame("{L050#"))
        bp.onNotify(frame("{S0#"))
        val acts = bp.onNotify(frame("{D120,080,072#"))
        assertEquals(EtbProtocol.Reading("ETB04", "P", "120,80,72"), acts.filterIsInstance<Action.Emit>().single().reading)

        val bg = EtbProtocol(EtbProtocol.Model.ETB04)
        bg.onSubscribed(); bg.onTimer(EtbProtocol.TIMER_LINK)
        bg.onNotify(frame("{L050#")); bg.onNotify(frame("{S1#"))
        assertEquals("G", bg.onNotify(frame("{D0105#")).filterIsInstance<Action.Emit>().single().reading.kind)
    }

    @Test
    fun badChecksumResendsDataThenFails() {
        val p = EtbProtocol(EtbProtocol.Model.ETB05)
        p.onSubscribed(); p.onTimer(EtbProtocol.TIMER_LINK)
        p.onNotify(hex("7B,4C,30,35,39,23,D3,7D")); p.onNotify(hex("7B,53,30,30,37,36,32,37,30,23,C4,7D"))
        val bad = hex("7B,44,47,30,35,37,36,23,00,7D")
        val a1 = p.onNotify(bad)
        assertTrue(a1.any { it is Action.Write && it.label == "D#2" })
        p.onNotify(bad)
        val a3 = p.onNotify(bad)
        assertTrue(a3.any { it is Action.Fail })
        assertTrue(p.onNotify(bad).isEmpty(), "結束後不再處理")
    }

    @Test
    fun linkRetriesAreBounded() {
        val p = EtbProtocol(EtbProtocol.Model.ETB05)
        p.onSubscribed()
        var writes = 0
        var failed = false
        repeat(EtbProtocol.LINK_MAX_TRIES + 1) {
            val a = p.onTimer(EtbProtocol.TIMER_LINK)
            writes += a.count { it is Action.Write }
            if (a.any { it is Action.Fail }) failed = true
        }
        assertEquals(EtbProtocol.LINK_MAX_TRIES, writes)
        assertTrue(failed)
    }

    @Test
    fun replyTimeoutResendsAndFails() {
        val p = EtbProtocol(EtbProtocol.Model.ETB05)
        p.onSubscribed(); p.onTimer(EtbProtocol.TIMER_LINK)
        p.onNotify(hex("7B,4C,30,35,39,23,D3,7D")) // 送出 S#1
        assertTrue(p.onTimer(EtbProtocol.TIMER_DATA).any { it is Action.Write && it.label == "S#2" })
        assertTrue(p.onTimer(EtbProtocol.TIMER_DATA).any { it is Action.Write && it.label == "S#3" })
        assertTrue(p.onTimer(EtbProtocol.TIMER_DATA).any { it is Action.Fail })
    }

    @Test
    fun framingToleratesGarbageAndArbitrarySplits() {
        val all = hex("00,FF,7B,4C,30,35,39,23,D3,7D,7B,53,30,30,37,36,32,37,30,23,C4,7D,7B,44,47,30,35,37,36,2C,30,30,30,2C,32,35,30,38,32,31,31,33,30,37,23,9D,7D")
        for (size in 1..7) {
            val p = EtbProtocol(EtbProtocol.Model.ETB05)
            p.onSubscribed(); p.onTimer(EtbProtocol.TIMER_LINK)
            val acts = all.toList().chunked(size).flatMap { p.onNotify(it.toByteArray()) }
            assertEquals("576", acts.filterIsInstance<Action.Emit>().single().reading.value, "chunk=$size")
        }
    }

    @Test
    fun unknownTypeYieldsNoData() {
        val p = EtbProtocol(EtbProtocol.Model.ETB04)
        assertEquals("NoData", p.parse("{D0105#x}").kind) // 尚未收到 S → 類型未知
    }

    @Test
    fun cooldownBackoff() {
        val c = DeviceCooldown()
        val a = "00:1E:9C:00:11:28"
        assertFalse(c.isBlocked(a, 0))
        assertEquals(2_000, c.markFailure(a, 0))
        assertEquals(4_000, c.markFailure(a, 0))
        assertEquals(8_000, c.markFailure(a, 0))
        repeat(10) { c.markFailure(a, 0) }
        assertEquals(60_000, c.remainingMs(a, 0))
        c.markSuccess(a, 100_000)
        assertEquals(0, c.failureCount(a))
        assertTrue(c.isBlocked(a, 119_999))
        assertFalse(c.isBlocked(a, 120_000))
    }

    /** 依協定組出含正確 checksum 的完整封包（輸入到 '#' 為止）。 */
    private fun frame(upToHash: String): ByteArray {
        val body = upToHash.map { it.code.toByte() }.toByteArray()
        val ck = EtbProtocol.checksum(body + byteArrayOf(0, 0x7D))!!
        return body + byteArrayOf(ck.toByte(), 0x7D)
    }
}
