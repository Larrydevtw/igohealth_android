//cordova-plugin-device
var DeviceInfo = {
  OS: "",
  OSVersion: "",
  OSVersionNo: 0,
  init: function (successFn) {
    DeviceInfo.GetOS(function () {
      DeviceInfo.GetOSVerion();
      DeviceInfo.GetModel();
      if (successFn) {
        successFn();
      }
    });
  },
  GetOS: function (successFn) {
    var OS = "android";
    //Android ios
    if (typeof device !== "undefined") {
      OS = device.platform;
    }

    if (OS == "Android") {
      OS = "android";
    }
    DeviceInfo.OS = OS;

    Log.write(OS, "DeviceInfo OS");

    if (successFn) {
      successFn();
    }
  },
  GetModel: function () {
    //Android ios

    var model = "";

    try {
      model = device.model;
      Log.write(model, "DeviceInfo model");

      if (DeviceInfo.OS == "ios") {
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
    switch (DeviceInfo.OS) {
      case "ios":
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
    return DeviceInfo.OS + "_" + DeviceInfo.OSVersion;
  },
  GetPlatformVersion: function () {
    return DeviceInfo.GetPlatform() + "^" + DeviceInfo.GetModel();
  },
  GetUniqueId: function () {
    return new Promise((resolve) => {
      let instanceId = window.localStorage.getItem("ig_app_id");

      if (instanceId) {
        Log.write(
          "Found existing Instance ID:" + instanceId,
          "DeviceInfo GetUniqueId"
        );
        resolve(instanceId);
        return;
      }

      if (window.crypto && window.crypto.randomUUID) {
        instanceId = window.crypto.randomUUID();
      } else {
        instanceId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            var r = (Math.random() * 16) | 0,
              v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }
        );
      }

      window.localStorage.setItem("ig_app_id", instanceId);
      Log.write(
        "Generated new Instance ID:" + instanceId,
        "DeviceInfo GetUniqueId"
      );
      resolve(instanceId);
    });
  },
};
