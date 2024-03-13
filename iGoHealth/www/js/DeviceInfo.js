//cordova-plugin-device
var DeviceInfo = {
  OS: "",
  OSVersion: "",
  OSVersionNo: 0,
  init: function () {
    DeviceInfo.GetOS();
    DeviceInfo.GetOSVerion();
    DeviceInfo.GetModel();
  },
  GetOS: function () {
    //Android iOS
    var OS = device.platform;
    if (OS == "Android") {
      OS = "android";
    }
    DeviceInfo.OS = OS;

    Log.write(OS, "DeviceInfo OS");

    return OS;
  },
  GetModel: function () {
    //Android iOS

    var model = "";

    try {
      model = device.model;
      Log.write(model, "DeviceInfo model");

      if (DeviceInfo.OS == "iOS") {
        model = model.substr(6, model.indexOf(",") - 6) - 1;
      }
    } catch (error) {
      model = error;
      Log.write(error, "DeviceInfo");
    }

    Log.write(DeviceInfo.OS + " / " + model, "DeviceInfo model");

    return model;
  },
  GetOSVerion: function (successFn) {
    var OSVersion = "";
    switch (DeviceInfo.GetOS()) {
      case "iOS":
        var iOSVersion;
        var v;
        if (/iP(hone|od|ad)/.test(navigator.platform)) {
          v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
          iOSVersion = {
            status: true,
            version: parseInt(v[1], 10),
            info:
              parseInt(v[1], 10) +
              "." +
              parseInt(v[2], 10) +
              "." +
              parseInt(v[3] || 0, 10),
          };
        } else {
          iOSVersion = {
            status: false,
            version: false,
            info: "",
          };
        }
        OSVersion = iOSVersion.info;
        break;
      case "android":
        var ua = navigator.userAgent.toLowerCase();
        var version = null;
        if (ua.indexOf("android") > 0) {
          var reg = /android [\d._]+/gi;
          var v_info = ua.match(reg);
          version = (v_info + "")
            .replace(/[^0-9|_.]/gi, "")
            .replace(/_/gi, "."); //得到版本號4.2.2
          //version = parseInt(version.split('.')[0]); // 得到版本號第一位
        }
        OSVersion = version;
        break;
    }

    DeviceInfo.OSVersion = OSVersion;
    DeviceInfo.OSVersionNo = OSVersion.split(".")[0];

    Log.write(OSVersion, "DeviceInfo");

    if (successFn) {
      successFn(OSVersion);
    }
  },
  GetPlatform: function () {
    return DeviceInfo.GetOS() + "_" + DeviceInfo.OSVersion;
  },
  GetPlatformVersion: function () {
    return DeviceInfo.GetPlatform() + "^" + DeviceInfo.GetModel();
  },
};
