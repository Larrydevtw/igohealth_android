package tw.com.ethink.ighble

/**
 * 每台設備的冷卻 / 退避管理（純 Kotlin，可單元測試）。
 *
 * 舊版 log（BT_20251106_*.txt）顯示：ETB05 關機中或 GATT 快取過期時仍在廣播，
 * JS 會在 1 秒後立刻重連，導致「connect → Service not found → close → 再 connect」無限循環。
 *  - 成功讀到資料並關機後：同一台設備 [successCooldownMs] 內不再連線。
 *  - 連線失敗：指數退避 base * 2^(n-1)，上限 [maxBackoffMs]。
 */
class DeviceCooldown(
    private val successCooldownMs: Long = 20_000,
    private val baseBackoffMs: Long = 2_000,
    private val maxBackoffMs: Long = 60_000,
) {
    private val blockedUntil = HashMap<String, Long>()
    private val failures = HashMap<String, Int>()

    @Synchronized
    fun isBlocked(address: String, now: Long): Boolean = (blockedUntil[address] ?: 0L) > now

    @Synchronized
    fun remainingMs(address: String, now: Long): Long = maxOf(0L, (blockedUntil[address] ?: 0L) - now)

    @Synchronized
    fun markSuccess(address: String, now: Long) {
        failures.remove(address)
        blockedUntil[address] = now + successCooldownMs
    }

    /** 回傳這次的退避毫秒數。 */
    @Synchronized
    fun markFailure(address: String, now: Long): Long {
        val n = (failures[address] ?: 0) + 1
        failures[address] = n
        val shift = minOf(n - 1, 16)
        val delay = minOf(maxBackoffMs, baseBackoffMs shl shift)
        blockedUntil[address] = now + delay
        return delay
    }

    @Synchronized
    fun failureCount(address: String): Int = failures[address] ?: 0

    @Synchronized
    fun clear() { blockedUntil.clear(); failures.clear() }
}
