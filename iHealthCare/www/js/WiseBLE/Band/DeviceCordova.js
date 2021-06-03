var DeviceCordova = {
  BandType: "Gofit",
  callError: function (successCallback, errorCallback) {
    switch (DeviceCordova.BandType) {
      case "Gofit":
        DeviceGofit.callError(successCallback, errorCallback);
        break;
    }
  },
  callOK: function (msg, successCallback, errorCallback) {
    switch (DeviceCordova.BandType) {
      case "Gofit":
        DeviceGofit.callOK(msg, successCallback, errorCallback);
        break;
    }
  },
  initCRP: function (strWeight, strHeight, strGender, strAge, successCallback, errorCallback) {
    switch (DeviceCordova.BandType) {
      case "Gofit":
        DeviceGofit.initCRP(strWeight, strHeight, strGender, strAge, successCallback, errorCallback);
        break;
    }
  },
  scanCRP: function (strMAC, successCallback, errorCallback) {
    Log.write(DeviceCordova.BandType,'DeviceCordova.BandType');
    switch (DeviceCordova.BandType) {
      case "Gofit":
        Log.write("DeviceGofit.scanCRP",'DeviceGofit.scanCRP');
        DeviceGofit.scanCRP(strMAC, successCallback, errorCallback);
        break;
    }
  },
  connCRP: function (strMAC, successCallback, errorCallback) {
    switch (DeviceCordova.BandType) {
      case "Gofit":
        DeviceGofit.connCRP(strMAC, successCallback, errorCallback);
        break;
    }
  },
  disConnCRP: function (successCallback, errorCallback) {
    switch (DeviceCordova.BandType) {
      case "Gofit":
        DeviceGofit.disConnCRP(successCallback, errorCallback);
        break;
    }
  },
  // sendTodayWeather: function (city, temp, weather, successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "sendTodayWeather", [
  //     city, temp, weather
  //   ]);
  // },
  // getStep: function (successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "getStep", []);
  // },
  // findDevice: function (successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "findDevice", []);
  // },
  // sendMessage: function (message, successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "sendMessage", [
  //     message
  //   ]);
  // },
  // sendDeviceLanguage: function (langLocale, successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "sendDeviceLanguage", [
  //     langLocale
  //   ]);
  // },
  // startMeasureDynamicRate: function (successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "startMeasureDynamicRate", []);
  // },
  // stopMeasureDynamicRtae: function (successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "stopMeasureDynamicRtae", []);
  // },
  // queryLastDynamicRate: function (successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "queryLastDynamicRate", []);
  // },
  // startMeasureBP: function (successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "startMeasureBP", []);
  // },
  // stopMeasureBP: function (successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "stopMeasureBP", []);
  // },
  // startMeasureBO: function (successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "startMeasureBO", []);
  // },
  // stopMeasureBO: function (successCallback, errorCallback) {
  //   cordova.exec(successCallback, errorCallback, "DeviceGofit", "stopMeasureBO", []);
  // }

};
