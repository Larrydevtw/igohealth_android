# cordova-plugin-igh-ble（混合方案：原生 BLE + 沿用 WebView UI）

i顧健康的藍牙核心改由原生實作（Android Kotlin / iOS Swift），UI 和業務流程（SQLite、上傳、畫面）維持原本的 jQuery WebView。

```
WebView（不動）  FnBT.DataReceiving / SaveMData / 上傳 / UI
      ▲  與舊版完全相同的 callback 與字串
www/js/NativeBleAdapter.js   覆寫 MSCordovaBLE.startScan / StopScan / btInitialize …
      ▲  事件：scanResult / connected / reading / disconnected / error
cordova-plugin-igh-ble（本目錄）
  ├─ BleCentral       掃描、自動連線、設備冷卻 / 退避、掃描節流
  ├─ GattSession      GATT 操作佇列、各階段逾時、133 / Service not found 處理
  ├─ EtbProtocol      ETB04 / ETB05 協定（純邏輯，可單元測試）
  └─ PendingStore     量測「先存再通知」，JS ack 後才刪除
```

協定細節與舊版問題分析請看 [docs/ble-protocol-spec.md](docs/ble-protocol-spec.md)。

## 啟用方式

1. 安裝外掛（在 Cordova 專案根目錄執行）：

   ```bash
   cordova plugin add ./iGoHealth/native/cordova-plugin-igh-ble
   ```

   Android 需要 Kotlin，請在 App 的 `config.xml` 加上：

   ```xml
   <preference name="GradlePluginKotlinEnabled" value="true" />
   ```

2. 在 `www/js/AppConfig.min.js` 把 `useNativeBle` 改成 `!0`（true）。
   - 預設是 `!1`（false），也就是完全走舊流程。即使已經安裝外掛，只要旗標是 false 就不會生效。
   - Android 少數機型若用硬體名稱過濾掃不到設備，可以在 AppConfig 加上 `nativeBleHardwareFilter:!1`。

3. `index.html` 已經在 `index.min.js` 之前載入 `js/NativeBleAdapter.js`，它會在 `deviceready` 時自動接管。

舊的 `cordova-plugin-bluetoothle`、`cordova-plugin-bluetooth-status` **暫時保留**：
- `FnBT` 仍使用 `cordova.plugins.BluetoothStatus` 判斷藍牙開關。
- 隨時可以把旗標改回 false 退回舊流程。

所有設備確認穩定後，再移除這兩個外掛。

## 測試

```bash
cd iGoHealth/native/cordova-plugin-igh-ble/test/android-jvm && gradle test
```

```bash
node iGoHealth/native/cordova-plugin-igh-ble/test/js/adapter.test.js
```

- `test/android-jvm`：ETB 協定與退避的單元測試（14 個），使用實機 log 的封包。
- `test/js/adapter.test.js`：以假的 App 全域物件，驗證 adapter 產生的結果字串與舊版一致。

### 目前的驗證範圍（重要）

| 項目 | 狀態 |
|---|---|
| Kotlin 協定核心 | ✅ JVM 單元測試通過 |
| Android 外掛（GattSession / BleCentral / IghBlePlugin） | ✅ 已對 Android API 35（Robolectric android-all）與 cordova-android 14.0.1 編譯通過；**尚未在實機上執行** |
| iOS Swift | ⚠️ 開發環境沒有 Xcode，**未編譯**；已逐行對照 cordova-ios 7.1.1 的標頭檔確認 API 名稱，需在 Xcode build 一次 |
| JS adapter | ✅ node 模擬測試通過 |
| 實機 BLE | ❌ 尚未測試，請依下方壓測方式驗證 |

## 實機驗收建議

1. 每台 ETB04 / ETB05 在每個平台上，連續 100 次「量測 → 自動連線 → 收到資料 → 關機」：記錄成功率、平均耗時、133 和 `Service not found` 的次數，並和舊版比較。
2. 量測完立刻再量一次：確認 20 秒冷卻不會漏收「第二筆新資料」。如果會漏收，調整 `DeviceCooldown.successCooldownMs` 和 iOS 的 `successCooldown`。
3. 配對模式（`BTMode=Y`）：未配對的設備應該出現 `Err004`；已配對的設備可以正常收資料。
4. 收到資料後立刻殺掉 App 再重開：資料應該重新送進來（PendingStore 重送）並且寫入 DB。
5. 機型：Android 10 / 12 / 14 / 15（包含三星、小米）、iOS 16 至最新版。

## 尚未包含（下一階段）

- Android Foreground Service 和 iOS `bluetooth-central` 背景模式：目前只保證「收到的資料不遺失」，**不保證在背景時會主動掃描和連線**。
- TAIDOC / Bionime / BandMate 等目前沒有啟用的設備：需要先把 `GattSession` 對 `EtbProtocol` 的依賴抽成協定介面（包含 service / characteristic UUID），再依照 `docs/ble-protocol-spec.md` 的格式為每個廠牌補上規格與測試。
