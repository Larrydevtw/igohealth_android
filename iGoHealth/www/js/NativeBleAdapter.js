//==================== NativeBleAdapter ===============================
// 混合方案：把 MSCordovaBLE（JS 控制 GATT）換成原生 BLE 外掛 cordova-plugin-igh-ble。
//
// 啟用條件：AppConfig.useNativeBle === true 且已安裝外掛（window.IghBle 存在）。
// 否則完全不動，舊流程照常運作（可隨時切回）。
//
// 做法：覆寫 MSCordovaBLE 的 btInitialize / startScan / StopScan / connect / autoRepairBLE，
// 原生回傳的事件轉成與舊版完全相同的 callback 與字串格式，
// 因此 FnBT.DataReceiving / SaveMData / 上傳 / UI 都不需要修改。
//   舊版 Bioptik_ETB0x → ResultCallBackFn("ETB05,<address>,yyyy/MM/dd HH:mm,<value>,0,<kind>")
var NativeBleAdapter = {
  active: false,
  handled: {}, // 已處理的 reading id（避免重送與即時事件重複）

  install: function () {
    if (NativeBleAdapter.active) return true;
    if (typeof AppConfig === "undefined" || AppConfig.useNativeBle !== true) return false;
    if (!window.IghBle) {
      Log.write("AppConfig.useNativeBle=true 但未安裝 cordova-plugin-igh-ble，沿用舊流程", "NativeBleAdapter");
      return false;
    }
    NativeBleAdapter.active = true;
    MSCordovaBLE.btInitialize = NativeBleAdapter.btInitialize;
    MSCordovaBLE.startScan = NativeBleAdapter.startScan;
    MSCordovaBLE.StopScan = NativeBleAdapter.stopScan;
    MSCordovaBLE.connect = NativeBleAdapter.connect;
    MSCordovaBLE.autoRepairBLE = function () {}; // 原生端自行處理重試與退避
    MSCordovaBLE.DisAllConnect = function (callback) {
      NativeBleAdapter.stopScan();
      if (callback) callback();
    };
    window.IghBle.on(NativeBleAdapter.onEvent);
    Log.write("已切換為原生 BLE", "NativeBleAdapter");
    return true;
  },

  btInitialize: function () {
    MSCordovaBLE.BT_Init_OK = false;
    MSCordovaBLE.NowStep = "btInitialize";
    localStorage.setItem("inDeviceList", "[]");
    MSCordovaBLE.connDevices = [];
    window.IghBle.requestPermissions().then(
      function (r) {
        if (!r || !r.granted) {
          MSCordovaBLE.BT_Auth = false;
          MSCordovaBLE.BT_ErrMsg = "未取得藍牙權限";
          MSCordovaBLE.NowStep = "btInitializeError";
          MSCordovaBLE.MySetting.initCallBackFn(false);
          return;
        }
        MSCordovaBLE.BT_Auth = true;
        MSCordovaBLE.BT_Init_OK = true;
        MSCordovaBLE.NowStep = "btInitializeSuccess";
        WriteLog.write("原生藍牙初始化成功！", "status");
        MSCordovaBLE.MySetting.initCallBackFn(true);
        NativeBleAdapter.startScan();
      },
      function (e) {
        MSCordovaBLE.BT_ErrMsg = "藍牙初始化失敗";
        MSCordovaBLE.NowStep = "btInitializeError";
        WriteLog.write("原生藍牙初始化失敗: " + JSON.stringify(e), "error");
        MSCordovaBLE.MySetting.initCallBackFn(false);
      }
    );
  },

  /** 讀取 DevicesInfo 的可連線設備型號（與舊版 inDeviceList 相同來源） */
  getDeviceNames: function (callback) {
    DAOFn.Query("", "select DeviceModel from DevicesInfo", function (result) {
      var names = [];
      try {
        var list = $.parseJSON(result);
        for (var i = 0; i < list.length; i++) {
          if (list[i].DeviceModel) names.push(list[i].DeviceModel);
        }
      } catch (e) {}
      if (names.length === 0) names = ["ETB04", "ETB05"];
      callback(names);
    });
  },

  getPairedAddresses: function () {
    var out = [];
    try {
      var list = $.parseJSON(localStorage.getItem("BT40P").toString());
      for (var i = 0; i < list.length; i++) out.push(String(list[i].DevAdr));
    } catch (e) {}
    return out;
  },

  /** 依目前 MySetting 更新原生設定後開始掃描 */
  startScan: function () {
    if (!MSCordovaBLE.BT_Auth) {
      WriteLog.write("未取得藍牙權限！ 無法進入掃描", "startScan");
      return;
    }
    MSCordovaBLE.NowStep = "startScan";
    MSCordovaBLE.isScanStart = true;
    MSCordovaBLE.foundDevices = [];
    NativeBleAdapter.getDeviceNames(function (names) {
      var s = MSCordovaBLE.MySetting || {};
      window.IghBle.configure({
        deviceNames: names,
        autoConnect: s.AutoConnect !== false,
        forcePair: s.ForcePair === true,
        pairedAddresses: NativeBleAdapter.getPairedAddresses(),
        hardwareFilter: AppConfig.nativeBleHardwareFilter !== false,
      }).then(function () {
        return window.IghBle.startScan();
      }).catch(function (e) {
        WriteLog.write("原生掃描啟動失敗: " + JSON.stringify(e), "error");
        MSCordovaBLE.isScanStart = false;
      });
    });
  },

  stopScan: function () {
    MSCordovaBLE.isScanStart = false;
    window.IghBle.stopScan();
  },

  /** FnBT.ConnectDevice（手動確認連線）：原生端只做自動連線，改為以自動連線模式掃描 */
  connect: function (device) {
    MSCordovaBLE.MySetting.AutoConnect = true;
    NativeBleAdapter.startScan();
  },

  formatTime: function (ms) {
    var d = ms ? new Date(ms) : new Date();
    return WiseScripts.Format.Date_yyyyMMddHHmm(d);
  },

  onEvent: function (e) {
    if (!e || !e.type) return;
    var s = MSCordovaBLE.MySetting;
    switch (e.type) {
      case "log":
        WriteLog.write(e.message, "IghBle");
        break;
      case "state":
        WriteLog.write("原生藍牙狀態: " + JSON.stringify(e), "IghBle");
        break;
      case "scanResult":
        if (localStorage["BTScanActive"] == "N" && s.AutoConnect !== false) return; // 與舊版相同：關閉掃描時忽略
        var device = { address: e.address, name: e.name, rssi: e.rssi, advertisement: "", status: "scanResult" };
        MSCordovaBLE.foundDevices.push(device);
        if (s.ScanCallBackFn) s.ScanCallBackFn(device);
        break;
      case "connected":
        localStorage["BTConnect"] = "Y";
        MSCordovaBLE.connDevices = [{ address: e.address, name: e.name, status: "connected" }];
        if (s.ConnectCallBackFn) s.ConnectCallBackFn({ address: e.address, name: e.name, status: "connected" });
        break;
      case "disconnected":
        localStorage["BTConnect"] = "N";
        MSCordovaBLE.connDevices = [];
        MSCordovaBLE.foundDevices = [];
        WriteLog.write("設備已斷線 " + e.name + " (" + e.reason + ")", "status");
        break;
      case "reading":
        NativeBleAdapter.onReading(e);
        break;
      case "error":
        WriteLog.write("原生藍牙錯誤 " + e.code + ": " + e.message, "error");
        if (e.code === "Err004") {
          s.ErrorCallBackFn("Err004:" + e.name);
        } else if (e.code === "Err001") {
          s.ErrorCallBackFn("Err001");
        }
        // Err005（連線失敗）：原生端已處理退避，舊版也只寫 log，不轉給 FnBT
        break;
    }
  },

  onReading: function (e) {
    if (NativeBleAdapter.handled[e.id]) {
      window.IghBle.ack(e.id);
      return;
    }
    NativeBleAdapter.handled[e.id] = true;
    var s = MSCordovaBLE.MySetting;
    var time = NativeBleAdapter.formatTime(e.measuredAt);
    var done = function () { window.IghBle.ack(e.id); };
    WriteLog.write("原生量測值: " + JSON.stringify(e), "info");

    if (e.kind === "NoData") {
      s.ResultCallBackFn("");
      s.ErrorCallBackFn("Err007");
      done();
      return;
    }
    var resultStr = [e.model, e.address, time, e.value, e.bgType || 0, e.kind].join(",");
    if (e.kind !== "Err" && s.FilterHistoryData) {
      MSCordovaBLE.checkHistoryLog(time, e.address, e.value, function (flag) {
        if (flag) s.ResultCallBackFn(resultStr);
        else s.ErrorCallBackFn("Err006");
        done();
      });
    } else {
      s.ResultCallBackFn(resultStr);
      done();
    }
  },
};

document.addEventListener(
  "deviceready",
  function () {
    NativeBleAdapter.install();
  },
  false
);
