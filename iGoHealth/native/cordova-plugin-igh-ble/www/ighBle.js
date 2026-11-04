/* cordova-plugin-igh-ble：原生 BLE（Android Kotlin / iOS Swift）的 JS 介面，掛在 window.IghBle */
var exec = require("cordova/exec");

var SERVICE = "IghBle";
var listeners = [];
var listening = false;

function call(action, args) {
  return new Promise(function (resolve, reject) {
    exec(resolve, reject, SERVICE, action, args || []);
  });
}

function dispatch(evt) {
  for (var i = 0; i < listeners.length; i++) {
    try {
      listeners[i](evt);
    } catch (e) {
      if (window.console) console.error("IghBle listener error", e);
    }
  }
}

module.exports = {
  /**
   * 註冊事件監聽。事件 type：
   *  state / scanResult / connecting / connected / subscribed / reading / disconnected / error / log
   * reading：{ id, model, name, address, kind, value, bgType, measuredAt, replayed? }
   *   處理完畢後務必呼叫 ack(id)，否則下次 setListener 時會重送。
   */
  on: function (fn) {
    listeners.push(fn);
    if (!listening) {
      listening = true;
      exec(dispatch, function (err) {
        listening = false;
        if (window.console) console.error("IghBle setListener error", err);
      }, SERVICE, "setListener", []);
    }
  },
  off: function (fn) {
    listeners = listeners.filter(function (l) { return l !== fn; });
  },
  /** { deviceNames:[], autoConnect, forcePair, pairedAddresses:[], hardwareFilter } */
  configure: function (cfg) { return call("configure", [cfg || {}]); },
  requestPermissions: function () { return call("requestPermissions"); },
  startScan: function () { return call("startScan"); },
  stopScan: function () { return call("stopScan"); },
  ack: function (id) { return call("ack", [id]); },
  getPending: function () { return call("getPending"); },
  getState: function () { return call("getState"); },
  enableBluetooth: function () { return call("enableBluetooth"); },
  openBluetoothSettings: function () { return call("openBluetoothSettings"); },
};
