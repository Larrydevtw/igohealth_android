//==========QR掃碼登錄使用================
var LoginQR= LoginQR||{},LoginQR={
    Proccess:"N", //是否為開啟QR登入的畫面
    CheckQR: function (_url) {
        var Action = _url.substr(0, 1);
        var UserID = localStorage.UserID;
        var UserEMail = localStorage["EMail_" + UserID];

        var Acct = '';
        var CheckCode = DateTimeFun.getNow();
        if (Action == "^") { //TODO ||_url.toLowerCase().includes("cnwise_cloud_mngt") 未來上架要拿掉
            WiseAES.enpryptAES(CheckCode + "^" + UserID, //使用者帳號加密
                AppConfig.MAesKey, AppConfig.MAesIV,
                "T",
                function (res1) {
                    var url = _url.substr(1) + "&ac=" + res1;
                    ProjectFn.OpenWebUrl(url, function () {
                        Log.write("btnQRLoginshow", "ProjecFn.btnQRLoginshow");
                        $("#btnQRLogin").show();
                        LoginQR.Proccess="Y";
                    });
                }
            );
            return;
        }
        if (Action == "@" && Domain.Address != Domain.AddressNT) { //帶入Email 管使用
            WiseAES.enpryptAES(CheckCode + "^" + UserEMail, //使用者EMail加密
                AppConfig.MAesKey, AppConfig.MAesIV,
                "T",
                function (res1) {
                    var url = _url.substr(1) + "&ac=" + res1;
                    ProjectFn.OpenWebUrl(url, function () {
                        Log.write("btnQRLoginshow", "ProjecFn.btnQRLoginshow");
                        $("#btnQRLogin").show();
                        LoginQR.Proccess="Y";
                    });
                }
            );
            return;
        }

        $("#btnQRLogin").hide();
        url = _url;
        $("#IfWebView").prop('src', url);
        Log.write("url" + url, "ProjecFn.OpenWebUrl");
        ProjectFn.OpenWebUrl(url);
    },
    confirmLogin: function () {
        if (!NetStatusFn.getNetFlag()) {
            FnCtrl.alert("請於有網路狀態下進行操作。");
        } else {
            $('#IfWebView').contents().find('#divOK').click();
            $("#btnQRLogin").hide();
            LoginQR.Proccess="N";
            app.onBack();
        }
    },
    cancelLogin: function () {
        if (!NetStatusFn.getNetFlag()) {
            FnCtrl.alert("請於有網路狀態下進行操作。");
        } else {
            // $('#IfWebView').contents().find('#divCancel').click();
            // $("#btnQRLogin").hide();
            app.onBack();
        }
    },


};