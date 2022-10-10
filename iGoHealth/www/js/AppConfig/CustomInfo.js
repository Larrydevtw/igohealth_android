var CustomInfo = {
    PID_Validate: "N", //註冊時身分證字號是否必填(N:選填，Y:必填)
    EMail_Validate: "N", //註冊時EMail是否必填(N:選填，Y:必填)
    Member_CheckType: "03", //01:生日 02:EMail 03:手機號碼
    MainHome_scrollIntoView: "N", //是否自動移至量測項目區塊(三個以上量測項目使用)
    switchByDomain: function () {
        return new Promise(function (resolve, reject) {

            var lFunction = Domain.lFunction;
            var lDevFunction = Domain.lDevFunction;
            lFunction.forEach(function (item, idx) {
                var isEnabled = true;
                if (lDevFunction.indexOf(item) > -1) {
                    isEnabled = false;
                }
                CustomInfo.enableFunction(item, isEnabled);
            });

            switch (Domain.Address) {
                case "ocics.cn/Beta":
                case "test.ocics.cn":
                case "ocics.cn":
                    Lang.locale = "zh-hans";
                    WiseScripts.Validate.region = "zh-hans";
                    CustomInfo.PID_Validate = "Y";
                    CustomInfo.EMail_Validate = "N";
                    CustomInfo.Member_CheckType = "01"; //01:生日 02:EMail 03:手機號碼
                    break;
                case "ethink.ocics.tw":
                case "test.ocics.tw":
                case "ocics.tw":
                    Lang.locale = "zh-hant";
                    WiseScripts.Validate.region = "zh-hant";
                    CustomInfo.PID_Validate = "N";
                    CustomInfo.EMail_Validate = "Y";
                    CustomInfo.Member_CheckType = "02"; //01:生日 02:EMail 03:手機號碼
                    break;
            }

            CustomInfo.checkDevMode();
            resolve();
        });
    },
    checkDevMode: function () {
        try {
            var UserID = localStorage.UserID;
            Log.write(UserID, "checkDevMode");
            if (localStorage.UserID) {
                var strCheck = UserID + localStorage["NickName_" + UserID];
                WiseAES.md5(strCheck, function (res) {
                    Log.write(res, "checkDevMode");
                    if (res === "f5ece4e2499d95a35eb0990f3c1e7212") {
                        $("#MeasureScanMode_Test").show();
                    }
                });
            }
        } catch (err) {
            Log.write(err, checkDevMode);
        }

    },
    setValidate: function () {
        return new Promise(function (resolve, reject) {
            if (CustomInfo.PID_Validate === "Y") {
                $("#txtSignup_PID").html("<b style='color:red;'> *</b>");
            } else {
                $("#txtSignup_PID").html("(<span data-i18n='選填'></span>)");
            }

            if (CustomInfo.EMail_Validate === "Y") {
                $("#txtSignup_Mail").html("<b style='color:red;'> *</b>");
            } else {
                $("#txtSignup_Mail").html("(<span data-i18n='選填'></span>)");
            }

            //01:生日 02:EMail 03:手機號碼
            $("#divForget_mail").hide();
            $("#divForget_bir").hide();
            switch (CustomInfo.Member_CheckType) {
                case "01":
                    $("#divForget_bir").show();
                    break;
                case "02":
                    $("#divForget_mail").show();
                    break;
                case "03":
                    break;
            }
            resolve();
        });
    },
    enableFunction: function (functionType, isEnabled) {

        Log.write(functionType + ":" + isEnabled, 'CustomInfo enableFunction');

        if (isEnabled && functionType != "Product") {
            $("#li" + functionType).show();
            localStorage["isEnabled" + functionType] = "Y";
        } else {
            $("#li" + functionType).hide();
            localStorage["isEnabled" + functionType] = "N";
        }

        switch (functionType) {
            case "Point":
                if (isEnabled) {
                    $("#aPointTotal").show();
                    $("#liPoint_History").show();
                } else {
                    $("#aPointTotal").hide();
                    $("#liPoint_History").hide();
                }
                break;
            case "Product":
                if (isEnabled) {
                    $("#aProduct").show();
                    $("#liPoint_Product").show();
                } else {
                    $("#aProduct").hide();
                    $("#liPoint_Product").hide();
                }
                break;
            case "MeasureScan":
                if (isEnabled) {
                    $("#btnMeasureScan").show();
                } else {
                    $("#btnMeasureScan").hide();
                }            
                break;
            case "SyncAppInfo":

                break;
        }
    }
};