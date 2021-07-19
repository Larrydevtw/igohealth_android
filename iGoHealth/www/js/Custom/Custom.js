//Cordova Plugin: phonegap-mobile-accessibility
var Custom = {
    init: function (successFn) {

        CustomInfo.switchByDomain().then(function () {
            return CustomInfo.setValidate();
        }).then(function () {
            return Custom.setMType(AppConfig.lMType);
        }).then(function () {
            return Custom.setFontSize();
        }).then(function () {
            var platform = DeviceInfo.getOS();

            if (platform === "iOS") {
                Custom.iOSKeyboardBlur();
            }

            if (successFn) {
                successFn();
            }
        });
    },
    setMType: function (AppConfiglMType) {
        return new Promise(function (resolve, reject) {
            var lMType = AppConfiglMType;


            for (var i = 0; i < lMType.length; i++) {
                var mType = lMType[i];
                $("#M" + mType).show();
                $("#tabHistory_btn" + mType).show();
                $("#tabManual_btn" + mType).show();
            }
            resolve();
        });
    },
    setFontSize: function () {
        Log.write("setFontSize Start", 'Custom setFontSize');
        return new Promise(function (resolve, reject) {
            function setTextZoomCallback(textZoom) {
                Log.write('WebView text should be scaled ' + textZoom + '%', 'Custom setFontSize');
            }

            function getTextZoomCallback(textZoom) {
                Log.write('WebView text should be scaled to the preferred value ' + textZoom + '%', 'Custom setFontSize');

                if (textZoom === 100) {
                    Log.write("調整.chartType .btn文字大小", 'Custom setFontSize');
                    $(".chartType .btn").css("font-size", "1.7em");
                }

                // var maxFontSize = 100;
                // var MeasureImageSize = 125; //default
                // var MeasureImageSizeAdjust = 0;

                // if (textZoom > maxFontSize) {
                //     MeasureImageSizeAdjust = 20;
                //     var adJustImgSize = (MeasureImageSize - MeasureImageSizeAdjust) + "px";

                //     Log.write("Set textzoom", 'Custom setFontSize');
                //     $(".chart-box").css("width", adJustImgSize).css("height", adJustImgSize);
                //     $(".chart-box > .num").css("width", adJustImgSize);
                //     $(".chart-box > .main_icon").css("width", adJustImgSize).css("height", adJustImgSize);
                //     $(".chart-box > svg").css("width", adJustImgSize).css("height", adJustImgSize).css("background-size", adJustImgSize);
                //     MobileAccessibility.setTextZoom(maxFontSize, setTextZoomCallback);
                // }

                // localStorage.MeasureImageSizeAdjust = MeasureImageSizeAdjust;
            }

            try {
                MobileAccessibility.usePreferredTextZoom(false);
                MobileAccessibility.getTextZoom(getTextZoomCallback);
            } catch (error) {
                Log.write(error, 'Custom setFontSize');
            }

            resolve();
        });
    },
    iOSKeyboardBlur: function () {

        $('input').on('blur', function () {
            setTimeout(function () {
                var scrollHeight = document.documentElement.scrollTop || document.body.scrollTop || 0;
                window.scrollTo(0, Math.max(scrollHeight - 1, 0));
            }, 100);
        });
        $('select').on('blur', function () {
            setTimeout(function () {
                var scrollHeight = document.documentElement.scrollTop || document.body.scrollTop || 0;
                window.scrollTo(0, Math.max(scrollHeight - 1, 0));
            }, 100);
        });
        $('textarea').on('blur', function () {
            setTimeout(function () {
                var scrollHeight = document.documentElement.scrollTop || document.body.scrollTop || 0;
                window.scrollTo(0, Math.max(scrollHeight - 1, 0));
            }, 100);
        });
    }
};