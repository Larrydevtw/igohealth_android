//控制項(Control)使用函數
//使用 Plugin 
//      jquery
//      cordova-plugin-ionic-keyboard: https://github.com/ionic-team/cordova-plugin-ionic-keyboard
//      cordova-plugin-dialog
//      sweetalert2

var FnCtrl = {
    isBtnClick: false,
    focus: function (targetID) {
        //$("#btnSave_MPM").addEventListener('click',function(){
        //});    
        var platform = DeviceInfo.getOS();
        if (platform === "Android") {
            $("#" + targetID).focus();
        } else {
            Log.write(platform + "平台focus無法運作", "FnCtrl.focus");
        }
    },
    PIDShadow: function (P_ID) { //身份證字號遮蔽 //TODO目前用長度判斷
        if (P_ID.length == 18) {
            P_ID = P_ID.substring(0, 6) + "********" + P_ID.substring(14, 18);
        } else {
            P_ID = P_ID.substring(0, 2) + "****" + P_ID.substring(6, 10);
        }
        return P_ID;
    },
    alert: function (message, title, fn, _buttonName) {
        // if(device.platform === "iOS"){
        //     alert(message);
        //     return;
        // }

        if (sessionStorage.alertMessage === message) {
            if (fn !== undefined && fn != null) {
                fn();
            }
            return;
        }

        sessionStorage.alertMessage = message;

        setTimeout(function () {
            sessionStorage.alertMessage = "";
        }, 1000);

        var buttonName = "確定";
        if (_buttonName) {
            buttonName = _buttonName;
        }
        if (title === "" || title === undefined) {
            title = $.i18n('系統訊息');
        }
        navigator.notification.alert(message, alertCallback, title, buttonName);

        function alertCallback(btnIndex) {
            if (fn !== undefined && fn != null) {
                fn();
            }
        }
    },
    confirmHtml: function (settings, preConfirmFn, successFn) {
        var title = settings.title === undefined ? "" : settings.title;
        var icon = settings.icon === undefined ? "" : settings.icon;
        var txtHtml = settings.txtHtml === undefined ? "" : settings.txtHtml;
        var showCloseButton = settings.showCloseButton === undefined ? true : settings.showCloseButton;
        var confirmButtonText = settings.confirmButtonText === undefined ? $.i18n('確定') : settings.confirmButtonText;
        var cancelButtonText = settings.cancelButtonText === undefined ? $.i18n('取消') : settings.cancelButtonText;

        Swal.fire({
            title: '<strong>' + title + '</strong>',
            icon: icon,
            html: txtHtml,
            showCloseButton: false,
            showCancelButton: showCloseButton,
            focusConfirm: true,
            preConfirm: preConfirmFn,
            confirmButtonText: confirmButtonText,
            //confirmButtonAriaLabel: 'Thumbs up, great!',
            cancelButtonText: cancelButtonText,
            //cancelButtonAriaLabel: 'Thumbs down'
        }).then(function (result) {
            if (successFn) {
                successFn(result);
            }
        });
    },
    keyboardClose: function () {
 
        setTimeout(function () {
            if (device.platform.toLowerCase() === "ios") {
                Keyboard.hide(); //關閉鍵盤
            } else {
                Keyboard.hide();
            }
            console.log("k E");
        }, 100);
    },
    keyboardShow: function () { //TODO 目前暫時未用到
        console.log("k S");
        setTimeout(function () {
            if (device.platform.toLowerCase() === "ios") {
                Keyboard.show();
            } else {
                Keyboard.show();
            }
            console.log("k Open");
        }, 100);
    },
    toast: function (message, duration, position, successFn, errFn) {
        //duration: 'short', 'long', '3000', 900 (the latter are milliseconds)
        //position: 'top', 'center', 'bottom'
        if (!duration) {
            duration = "long";
        }
        if (!position) {
            position = "bottom";
        }
        window.plugins.toast.showWithOptions({
                message: message,
                duration: duration, // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
                position: position,
                addPixelsY: -40 // added a negative value to move it up a bit (default 0)
            },
            function () {
                if (successFn) {
                    successfn();
                }
            },
            function () {
                if (errFn) {
                    errFn();
                }
            });
    },
    DisplayFormat: function (MData, type) { //OCICS照護端使用
        var result = '';
        switch (type) {
            case "BP":
                result = MData[3] + "/" + MData[4] + "/" + MData[5];
                break;
            case "BT":
                result = MData[3] + " ℃";
                break;
            case "BO":
                result = MData[3] + " %";
                break;
            case "BG":
            case "UA":
            case "CHOL":
                result = MeasureInfo.convertMValue(type, MData[3]) + "(" + FnCtrl.showTimeType(MData[4].toString()) + ")";
                break;
            case "BW": //XX,XX,XX,(體重),(BMI),(體脂),(基代),(身高),(性別),(年齡)
                //,(肌肉量),(含水量),(內臟脂肪指數),(骨質密度) 
                result = MData[7] + "cm/" + MData[3] + "kg/" + MData[5] + "%";
                break;
            case "HR":
                result = MData[3] + " 次/分";
                break;
        }
        return result;
    },
    showTimeType: function (TimeType) {
        var result = '';
        switch (TimeType) {
            case 8:
            case 1: //AC (飯前)
                result = "飯前";
                break;
            case 9:
            case 2: //PC (飯後)
                result = "飯後";
                break;
            default: //case 0: //Gen
                result = "一般";
                break;
        }
        return result;
    },
    isBlockBtnClick: function (successFn) { //預防按鈕連點

        if (FnCtrl.isBtnClick) {
            Log.write(FnCtrl.isBtnClick, 'FnCtrl.isBlockBtnClick Return');
            return;
        }

        if(successFn){
            successFn();
        }

        FnCtrl.isBtnClick = true;
        setTimeout(function () {
            Log.write(FnCtrl.isBtnClick, 'FnCtrl.isBlockBtnClick setTimeout 1000');
            FnCtrl.isBtnClick = false;
        }, 1000);
    },

    ShowClientSize: function () {
        var clietWidthInfo = "網頁可見區域寬：" + document.body.clientWidth + "\r\n";
        clietWidthInfo += "網頁可見區域高：" + document.body.clientHeight + "\r\n";
        clietWidthInfo += "網頁可見區域寬：" + document.body.offsetWidth + " (包括邊線和捲軸的寬)\r\n";
        clietWidthInfo += "網頁可見區域高：" + document.body.offsetHeight + " (包括邊線的寬)\r\n";
        clietWidthInfo += "網頁正文全文寬：" + document.body.scrollWidth + "\r\n";
        clietWidthInfo += "網頁正文全文高：" + document.body.scrollHeight + "\r\n";
        clietWidthInfo += "網頁被卷去的高(ff)：" + document.body.scrollTop + "\r\n";
        clietWidthInfo += "網頁被卷去的高(ie)：" + document.documentElement.scrollTop + "\r\n";
        clietWidthInfo += "網頁被卷去的左：" + document.body.scrollLeft + "\r\n";
        clietWidthInfo += "網頁正文部分上：" + window.screenTop + "\r\n";
        clietWidthInfo += "網頁正文部分左：" + window.screenLeft + "\r\n";
        clietWidthInfo += "螢幕解析度的高：" + window.screen.height + "\r\n";
        clietWidthInfo += "螢幕解析度的寬：" + window.screen.width + "\r\n";
        clietWidthInfo += "螢幕可用工作區高度：" + window.screen.availHeight + "\r\n";
        clietWidthInfo += "螢幕可用工作區寬度：" + window.screen.availWidth + "\r\n";
        clietWidthInfo += "你的螢幕設置是 " + window.screen.colorDepth + " (位彩色)\r\n";
        clietWidthInfo += "你的螢幕設置 " + window.screen.deviceXDPI + " (像素/英寸)";
        Log.write(clietWidthInfo, "FnCtrl ShowClientSize");
    }
    // allTbEnter2tab: function (targetDiv) { //TODO
    //     $('#testContent').empty();

    //     for (var i = 0; i < 10; i++) {
    //         $('#testContent').append("textbox " + i + " : <input type=\"number\" id=\"text_box_" + i + "\" tabindex=\"" + i + "\" /><br/>");
    //     }

    //     $('#testContent :input[type=number]').enter2tab();
    // }
};
