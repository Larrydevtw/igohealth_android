# Bioptik ETB04 / ETB05 藍牙協定規格（從舊版 JS 與實機 log 整理）

來源：
- 舊版原始碼（git 歷史 `a0702a8^`）：`www/js/WiseBLE/Bioptik_ETB04_BP.js`（物件 `Bioptik_ETB04`）、`Bioptik_ETB05.js`、`Bioptik.js`、`Bionime.js`、`Core/MSCordovaBLE.js`
- 實機 log：2025-11-05 / 11-06，ETB05，Android（舊 `00_Info/CordovaFile/00_android/Log/`，已從 git 歷史移除，備份於清理前的 bundle）

> 目前 App 實際啟用的設備只有 ETB04、ETB05（`FnBT.DeviceInfo` 寫入 `DevicesInfo` 的清單）。
> TAIDOC、Bionime、BandMate、Oserio 等程式碼仍在，但沒有啟用，所以不在這次移植範圍內。

## GATT

| 項目 | UUID |
|---|---|
| Service | `0000FFF0-0000-1000-8000-00805F9B34FB`（iOS：`FFF0`） |
| Characteristic（write + notify） | `0000FFF1-0000-1000-8000-00805F9B34FB`（iOS：`FFF1`） |
| 廣播名稱 | `ETB04` / `ETB05`（完全比對） |

## 封包

ASCII 字元，格式為 `{` + 指令 + 內容 + `#` + checksum + `}`。

**Checksum**：從 `{` 之後的第一個 byte 開始，XOR 到 `#`（包含 `#`），最後再 OR `0x80`。所以 checksum 一定 ≥ 0x80，不會跟 `}`（0x7D）混淆，可以安全地用 `{`…`}` 來切封包。

| 方向 | 指令 | Bytes | 說明 |
|---|---|---|---|
| App→設備 | Link | `7B 4C 23 EF 7D` `{L#.}` | 訂閱後 1 秒送第一次，每 2 秒重送一次直到收到 `{L…}` |
| 設備→App | Link 回覆 | `{L059#D3}` | 數字意義未知（可能是電量），不使用 |
| App→設備 | 取類型 | `7B 53 23 F0 7D` `{S#.}` | |
| 設備→App | 類型 | `{S0076270#C4}` | 第 3 個字元是量測類型（見下表） |
| App→設備 | 取資料 | `7B 44 23 E7 7D` `{D#.}` | |
| 設備→App | 資料 | `{DG0576,000,2508211307#9D}` | 常被拆成 2 個 notify（20 bytes 一段） |
| App→設備 | 關機 | `7B 5A 23 F9 7D` `{Z#.}` | 寫入成功後等 2 秒再斷線 |

### 類型（`{S` 後第 1 個字元）與數值解析（JS `substr` 位置）

| 機型 | 類型 | kind | 數值 |
|---|---|---|---|
| ETB04 | 0 | P 血壓 | `substr(2,3)`,`substr(6,3)`,`substr(10,3)` → 收縮,舒張,脈搏 |
| ETB04 | 1 | G 血糖 | `parseInt(substr(2,4))` |
| ETB04 | 2 | C 膽固醇 | `parseInt(substr(2,4))` |
| ETB05 | 0 | G 血糖 | `parseInt(substr(3,4))` |
| ETB05 | 1 | C 膽固醇 | `parseInt(substr(3,4))` |
| ETB05 | 2 | U 尿酸 | `parseInt(substr(3,4))/10`，取 1 位小數 |
| ETB05 | 3 | H 血紅素 | `parseInt(substr(3,4))/10`，取 1 位小數 |
| ETB05 | 4 | T 三酸甘油脂 | `parseInt(substr(3,5))` |

- **設備錯誤**：`#` 之前的長度為 4（例如 `{D15#.}`）時，錯誤碼是 `substr(2,2)`，kind 為 `Err`。
- **類型未知**：數值會是空的，舊版的處理是回報 `Err007`（設備無量測資料）。

### 實機樣本（作為單元測試的 golden data）

| L | S | D（兩段） | 結果 |
|---|---|---|---|
| `{L059#}` | `{S0076270#}` | `{DG0576,000,25082113` + `07#9D}` | ETB05 G 576 |
| `{L031#}` | `{S3071274#}` | `{DH0000,010,25082113` + `20#92}` | ETB05 H 0.0 |
| `{L044#}` | `{S2070277#}` | `{DU1200,000,25082114` + `48#84}` | ETB05 U 120.0 |
| `{L038#}` | `{S1071278#}` | `{DC0199,000,25082114` + `48#90}` | ETB05 C 199 |

## 交給 App 的結果字串（與舊版相同）

`FnBT.DataReceiving` 收到的格式：

```
<model>,<address>,<yyyy/MM/dd HH:mm>,<value>,<bgType=0>,<kind>
例：ETB05,00:1E:9C:00:11:28,2025/11/05 16:14,576,0,G
```

- `address`：Android 是 MAC；iOS 是 `CBPeripheral.identifier`（與 cordova-plugin-bluetoothle 相同，所以已配對清單 `BT40P` 可以沿用）。
- 時間：使用手機時間（舊版 `Bioptik.getPeripheralTime` 就是這樣做），原生版改用「原生端收到資料的時間」。

## 舊版 log 看到的問題，以及原生版的對應方式

| 現象（log） | 原因 | 原生版處理 |
|---|---|---|
| 同一台設備每 20～30 秒反覆 connect → `Service not found` → close | 設備關機中仍在廣播，或 GATT 快取過期；JS 在 close 後 1 秒就重新掃描並重連 | Android 先呼叫 `BluetoothGatt.refresh()` 再 discover 一次；仍失敗就進入指數退避（2s→4s→…→60s）。讀取成功後同一台設備 20 秒內不重連 |
| `Scanning already in progress` | JS 的多條計時器重複呼叫 startScan | 掃描狀態由原生端統一管理；另外依照 Android「30 秒內最多 5 次」的限制主動節流 |
| `status=133` | Android GATT_ERROR | 一律 `close()`，再交給退避處理 |
| Link 最多重送 100 次（約 200 秒） | 連線卡住期間無法量測其他設備 | 改成 15 次（30 秒）；S/D 指令加上 5 秒逾時，最多重送 3 次 |
| 資料封包只有一段時，舊版不做 checksum 也不送關機指令 | 舊版程式邏輯有分支漏洞 | 統一處理：一律組成完整封包、驗證 checksum、送出關機指令 |
