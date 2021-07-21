//cordova-plugin-device
var DeviceInfo = {
    GetOS: function () { //Android iOS
        return device.platform;
    },
    GetOSVerion: function () {
        var OSVersion = "";
        switch (DeviceInfo.GetOS()) {
            case "iOS":
                var iOSVersion;
                var v;
                if (/iP(hone|od|ad)/.test(navigator.platform)) {
                    v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
                    iOSVersion = {
                        status: true,
                        version: parseInt(v[1], 10),
                        info: parseInt(v[1], 10) + '.' + parseInt(v[2], 10) + '.' + parseInt(v[3] || 0, 10)
                    };
                } else {
                    iOSVersion = {
                        status: false,
                        version: false,
                        info: ''
                    }
                }
                OSVersion = iOSVersion.info;
                break;
            case "Android":
                var ua = navigator.userAgent.toLowerCase();
                var version = null;
                if (ua.indexOf("android") > 0) {
                    var reg = /android [\d._]+/gi;
                    var v_info = ua.match(reg);
                    version = (v_info + "").replace(/[^0-9|_.]/ig, "").replace(/_/ig, "."); //得到版本號4.2.2
                    //version = parseInt(version.split('.')[0]); // 得到版本號第一位
                }
                OSVersion = version;
                break;
        }
        return OSVersion;
    },
    GetPlatform: function () {
        return DeviceInfo.GetOS() + "_" + DeviceInfo.GetOSVerion();
    }
};