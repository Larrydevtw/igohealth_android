var MeasureScan = {
    txtCheckUserId: "txtMeasureScanU_ID",
    txtCheckCodeId: "txtMeasureScanU_Code",
    MeasureScanModeId: "divMeasureScanMode",
    MeasureScan_tbResultId: "MeasureScan_tbResult",
    MeasureScan_tbResultHeaderId: "MeasureScan_tbResultHeader",
    btnScanId: "MeasureScanMode_Manual",
    profileId: "MeasureScanMode_Profile",
    confirmId: "MeasureScanMode_Confirm",
    dataId: "MeasureScanMode_Data",
    CheckUserID: "",
    showByStep: function (step) {
        $("#" + MeasureScan.btnScanId).hide();
        $("#" + MeasureScan.profileId).hide();
        $("#" + MeasureScan.confirmId).hide();
        $("#" + MeasureScan.dataId).hide();
        $("#aMeasureScan_Back").hide();

        var title = "";
        switch (step) {
            case 1:
                title = $.i18n('掃碼量測掃碼');
                $("#" + MeasureScan.btnScanId).show();
                $("#aMeasureScan_Back").show();
                FnBT.StopScan();
                break;
            case 2:
                title = $.i18n('掃碼量測確認');
                $("#" + MeasureScan.profileId).show();
                $("#" + MeasureScan.confirmId).show();
                break;
            case 3:
                title = $.i18n('掃碼量測量測');
                $("#" + MeasureScan.profileId).show();
                $("#" + MeasureScan.dataId).show();
                break;
        }

        $("#txtMeasureScanModeTitle").html(title);
    },
    checkAuth: function () {
        var CheckUserID = $("#" + MeasureScan.txtCheckUserId).val();
        var CheckUserCode = $("#" + MeasureScan.txtCheckCodeId).val();

        Log.write(CheckUserID + " / " + CheckUserCode, 'checkAuth');

        if (CheckUserID === "" || CheckUserCode === "") {
            FnCtrl.alert($.i18n('請輸入必要資訊'));
            return;
        }

        $("#" + MeasureScan.txtCheckUserId).val("");
        $("#" + MeasureScan.txtCheckCodeId).val("");

        WiseAES.md5(CheckUserCode, function (resCheckUserCode) {
            MeasureScan.checkBranchUserInfoCode(CheckUserID, resCheckUserCode, function () {
                var targetId = MeasureScan.MeasureScanModeId;

                WiseScripts.Tool.NextPop(targetId, function () {
                    $("#mainMenu").hide();
                }, null, 'F');
            }, function () {
                Log.write("權限驗證失敗", 'checkAuth');
            });
        });
    },
    startCamera: function () { //開啟相機掃碼
        Log.write("開始", "ProjecFn.startCameraScan");
        // MeasureScan.BarCodeScan_Action();
        // return;

        app.onBackFlag = "N";

        cordova.plugins.barcodeScanner.scan(
            function (result) {
                //alert("We got a barcode\n" +
                //      "Result: " + result.text + "\n" +
                //      "Format: " + result.format + "\n" +
                //      "Cancelled: " + result.cancelled);
                var BCV = result.text;
                console.log(BCV);
                MeasureScan.BarCodeScan_Action(BCV);

                setTimeout(function () {
                    app.onBackFlag = "Y";
                }, 1000);
            },
            function (error) {
                FnCtrl.alert("Scanning failed: " + error);

                setTimeout(function () {
                    app.onBackFlag = "Y";
                }, 1000);
            }, {
                preferFrontCamera: false, // iOS and Android
                showFlipCameraButton: false, // iOS and Android
                showTorchButton: true, // iOS and Android
                torchOn: false, // Android, launch with the torch switched on (if available)
                //prompt: $.i18n("請將條碼或QRCode置于取景框內"), // Android
                resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
                //formats: "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
                orientation: "portrait" // Android only (portrait|landscape), default unset so it rotates with the device
                //,disableAnimations: true, // iOS
                //disableSuccessBeep: false // iOS
            }
        );
    },
    startMeasure: function () {

        var header = "";
        header += '<div class="header">';
        header += '<div>量測時間</div>';
        header += '<div>量測類型</div>';
        header += '</div>';

        $("#" + MeasureScan.MeasureScan_tbResultHeaderId).html(header);
        $("#" + MeasureScan.MeasureScan_tbResultId).html("");

        //Test
        // var MType = "BG";
        // var lMData = ["122","1"];
        // var isAnimate = false;
        // var MTimeStamp = "2021-07-20 05:20";
        // var DeviceModel = "ETB04";
        // MeasureScan.showValue(MType, lMData, isAnimate, MTimeStamp, DeviceModel);

        MeasureScan.showByStep(3);
        FnBT.AppMode = "Scan";   
        FnBT.StartScan("Y");
    },
    testBTData: function (AppMode) {
        FnBT.AppMode = AppMode;
        //Test
        var MTimeStamp = DateTimeFun.getFullInputDateNow();
        var max = 150,
            min = 70;
        var SBP = (Math.random() * (max - min) + min).toFixed(0);
        max = 100;
        min = 40;
        var DBP = (Math.random() * (max - min) + min).toFixed(0);
        max = 120;
        min = 40;
        var HR = (Math.random() * (max - min) + min).toFixed(0);
        var ResultStr = "ETB04,5C:31:3E:34:2B:AC," + MTimeStamp + "," + SBP + "," + DBP + "," + HR + ",0,0";
        FnBT.DataReceiving(ResultStr);
    },
    backToScan: function () {
        MeasureScan.showByStep(1);
        $("#" + MeasureScan.MeasureScan_tbResultId).html("");
        $("#MeasureScanMember_ID").val("");
    },
    Manual_Action: function () {
        var Member_ID = $("#MeasureScanMember_ID").val();
        if (Member_ID.length < 1) {
            navigator.notification.alert($.i18n('請輸入帳號'), null, $.i18n('系統訊息'), $.i18n('確定'));
            return;
        } else {
            if (!WiseScripts.Validate.isPhone(Member_ID)) {
                navigator.notification.alert($.i18n("帳號請輸入行動電話號碼"), null, $.i18n('系統訊息'), $.i18n('確定'));
                return;
            }
        }

        MeasureScan.getMemberInfo(Member_ID, function () {
            MeasureScan.showByStep(2);
        }, function () { //查無資料或有錯誤
            FnCtrl.alert($.i18n('查無資料'));
        });
    },
    BarCodeScan_Action: function (BCV) {
        Log.write(BCV, 'BarCodeScan_Action');
        WiseAES.decryptAES(BCV, AppConfig.MAesKey, AppConfig.MAesIV, "T",
            function (result) { //解密成功:後端系統正程運作
                Log.write(result, 'BarCodeScan_Action');
                MeasureScan.getMemberInfo(result, function () {
                    MeasureScan.showByStep(2);
                });
            },
            function (errMsg) { //解密失敗:後端有系統性錯誤
                WSCall.errCallback($.i18n('解密失敗'));
            }
        );

    },
    getMemberInfo: function (MemberID, successFn, errFn) {
        if (MemberID === "") {
            FnCtrl.alert($.i18n('不正確之訊息'));
            if (errFn) {
                errFn();
            }
            return;
        }

        WiseScripts.Tool.ShowLoading(true, $.i18n('資料確認中'));

        localStorage.MersureScanUserID = MemberID;

        var UploadData = {
            "UserID": MemberID
        };

        var PostInfo = {
            Url: AppConfig.AppServices + "/GetMemberInfo",
            UploadData: UploadData,
            async: true
        };
        Log.write(MemberID, "MemberID");
        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result, "GetMemberInfo WSCall success");

            WiseScripts.Tool.ShowLoading(false);

            if (result === "") { //結果為空: 查無此會員
                if (errFn) {
                    errFn();
                }
            } else {
                MeasureScan.getMemberInfoSuccess(result);

                if (successFn) {
                    successFn(result);
                }
            }
        }, function (err) { //失敗
            if (errFn) {
                errFn();
            }
            FnCtrl.alert($.i18n("獲取雲端資料失敗"));
            WiseScripts.Tool.ShowLoading(false);
        });
    },
    getMemberInfoSuccess: function (strObj) {

        var memberInfo = JSON.parse(strObj);

        var UserID = memberInfo.UserID;
        var NickName = memberInfo.NickName;
        var Zipcode = memberInfo.Zipcode;
        var BirthDay = memberInfo.BirthDay;
        var Gender = memberInfo.Gender === "M" ? "男性" : "女性";

        var BindPharmacy = memberInfo.BindPharmacy;

        var Age = memberInfo.Age + " 歲";

        $("#MeasureScan_UserID").html(UserID);
        $("#MeasureScan_NickName").html(NickName);
        $("#MeasureScan_BirthDay").html(BirthDay);
        $("#MeasureScan_Age").html(Age);
        $("#MeasureScan_Gender").html(Gender);

        if(BindPharmacy){

            $("#divMeasureScan_BindPharmacy").show();
            $("#MeasureScan_BindPharmacy").html(BindPharmacy);

        }else{

            $("#divMeasureScan_BindPharmacy").hide();

        }
    },
    showValue: function (MType, ValueArr, isAnimate, MTimeStamp, DeviceModel) {
        Log.write(MType + "/" + ValueArr + "/" + isAnimate + "/" + MTimeStamp + "/" + DeviceModel, 'MeasureScan ShowValue');

        MTimeStamp = MTimeStamp.substr(0, 16).replace(/\-/g, "/");
        MTimeStamp = MTimeStamp + "*";

        var tr1 = $('<div>').addClass("row");
        tr1.append($("<div>").html(MTimeStamp));
        tr1.append($("<div>").html($.i18n(MType)));

        MeasureScan.getDisplayMValue(MType, ValueArr, DeviceModel).then(function (DisplayMValue) {
            console.log(DisplayMValue);
            var tr2 = $("<div>").addClass("row seperate");
            tr2.append($("<div>").addClass("left").html(DisplayMValue));

            $("#" + MeasureScan.MeasureScan_tbResultId).prepend(tr2).prepend(tr1);

        });
    },
    getDisplayMValue: function (MType, ValueArr, DeviceModel) {
        return new Promise(function (resolve, reject) {
            var toFixedNum = 0;
            switch (MType) {
                case "BG":
                case "UA":
                case "CHOL":
                    toFixedNum = MeasureInfo[MType + "_Display_Num"];
                    break;
                case "BW":
                case "BF":
                case "BT":
                case "BO":
                    toFixedNum = 1;
                    break;
                default: //BP ,EC, STEP 
                    toFixedNum = 0;
                    break;
            }

            var DisplayMValue = $("<span>");
            var MTypeSection = MType;
            var timeType = ""; //量測時段 目前只有BG使用 
            var MValue = "";
            var MColor = "rgba(0, 0, 0,1)";
            switch (MType) {
                case "BG":
                    MTypeSection = "BS";
                    var BS = Number.parseFloat(ValueArr[0]).toFixed(toFixedNum);
                    timeType = ValueArr[1];
                    var displayTimeType = "<span> (" + Display.getTimeType(timeType) + ")</span>";

                    Display.isRed(MTypeSection, BS, timeType).then(function (result) {
                        Log.write("/isRed(1): " + result.IsRed + " /" + MTypeSection + " /" + BS, "Display.isRed Result");

                        BS = MeasureInfo.convertMValue(MType, BS, DeviceModel).toFixed(toFixedNum);

                        if (result.IsRed == "1") {
                            MColor = 'rgba(255, 0, 0,1)';
                        } else {
                            MColor = 'rgba(0, 0, 0,1)';
                        }

                        BS = "<span style='color:" + MColor + "'>" + BS + "</span>";
                        MValue = $.i18n('量測值:', BS) + displayTimeType;
                        DisplayMValue.html(MValue);
                    });
                    break;
                case "BP":
                    var SBP = Number.parseFloat(ValueArr[0]).toFixed(toFixedNum);
                    var DBP = Number.parseFloat(ValueArr[1]).toFixed(toFixedNum);
                    var HR = Number.parseFloat(ValueArr[2]).toFixed(toFixedNum);

                    Display.isRed("SBP", SBP, "").then(function (obj) {
                        if (obj.IsRed == "1") {
                            MColor = 'rgba(255, 0, 0,1)';
                        } else {
                            MColor = 'rgba(0, 0, 0,1)';
                        }

                        SBP = "<span style='color:" + MColor + "'>" + SBP + "</span>";

                        return Display.isRed("DBP", DBP, "");
                    }).then(function (obj) {
                        if (obj.IsRed == "1") {
                            MColor = 'rgba(255, 0, 0,1)';
                        } else {
                            MColor = 'rgba(0, 0, 0,1)';
                        }

                        DBP = "<span style='color:" + MColor + "'>" + DBP + "</span>";

                        return Display.isRed("HR", HR, "");
                    }).then(function (obj) {
                        if (obj.IsRed == "1") {
                            MColor = 'rgba(255, 0, 0,1)';
                        } else {
                            MColor = 'rgba(0, 0, 0,1)';
                        }

                        HR = "<span style='color:" + MColor + "'>" + HR + "</span>";

                        MValue = $.i18n('量測值:', SBP + "/" + DBP + "/" + HR);
                        DisplayMValue.html(MValue);
                    });
                    break;
                case "STEP":
                    var STEP = Number.parseFloat(ValueArr[0]).toFixed(toFixedNum);
                    var Distance = Number.parseFloat(ValueArr[1]).toFixed(toFixedNum);
                    var CAL = Number.parseFloat(ValueArr[2]).toFixed(toFixedNum);

                    MValue = $.i18n('量測值:', STEP + "/" + Distance + "/" + CAL);
                    DisplayMValue.html(MValue);
                    break;
                case "BW": //TODO:
                case "BF":
                    var Weight = Number.parseFloat(ValueArr[1]).toFixed(toFixedNum);
                    //var BMI = objRow.BMI;
                    var BodyRate = ValueArr[2] === undefined ? "--" : Number.parseFloat(ValueArr[2]).toFixed(toFixedNum);

                    Display.isRed("Weight", Weight, "").then(function (obj) {
                        if (obj.IsRed == "1") {
                            MColor = 'rgba(255, 0, 0,1)';
                        } else {
                            MColor = 'rgba(0, 0, 0,1)';
                        }

                        Weight = "<span style='color:" + MColor + "'>" + Weight + "</span>";

                        return Display.isRed("BodyRate", BodyRate, "");
                    }).then(function (obj) {
                        if (obj.IsRed == "1") {
                            MColor = 'rgba(255, 0, 0,1)';
                        } else {
                            MColor = 'rgba(0, 0, 0,1)';
                        }

                        BodyRate = "<span style='color:" + MColor + "'>" + BodyRate + "</span>";

                        MValue = $.i18n('量測值:', Weight + "/" + BodyRate);
                        DisplayMValue.html(MValue);
                    });
                    break;
                default: //BT, UA, CHOL, BO, HR
                    MValue = Number.parseFloat(ValueArr[0]).toFixed(toFixedNum);

                    Display.isRed(MTypeSection, MValue, timeType).then(function (result) {
                        Log.write("/isRed(1): " + result.IsRed + " /" + MTypeSection + " /" + MValue, "Display.isRed Result");

                        MValue = MeasureInfo.convertMValue(MType, MValue, DeviceModel);

                        if (result.IsRed == "1") {
                            MColor = 'rgba(255, 0, 0,1)';
                        } else {
                            MColor = 'rgba(0, 0, 0,1)';
                        }

                        MValue = "<span style='color:" + MColor + "'>" + MValue + "</span>";
                        MValue = $.i18n('量測值:', MValue);
                        DisplayMValue.html(MValue);
                    });
                    break;
            }

            resolve(DisplayMValue);
        });
    },
    checkBranchCode: function (BranchCode, successFn, errFn) {

        WiseScripts.Tool.ShowLoading(true, $.i18n('據點代碼確認中'));

        var UploadData = {
            "B_NO": FnProduct.B_NO,
            "B_Code": BranchCode
        };

        var PostInfo = {
            Url: AppConfig.AppServices + "/CheckBranchCode",
            UploadData: UploadData,
            async: true
        };

        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result, "CheckBranchCode");
            MeasureScan.checkBranchCodeSuccess(result, function () {
                if (successFn) {
                    successFn();
                }
            }, function () {
                if (errFn) {
                    errFn();
                }
            });
            WiseScripts.Tool.ShowLoading(false);
        }, function (err) { //失敗
            FnCtrl.alert($.i18n("獲取雲端資料失敗"));
            WiseScripts.Tool.ShowLoading(false);
        });
    },
    checkBranchCodeSuccess: function (strResult, successFn, errFn) {
        var obj = JSON.parse(strResult);
        var code = obj.code;
        var result = obj.result;
        switch (code) {
            case "1": //據點代碼輸入正確
                Log.write(result, 'checkBranchCodeSuccess');
                if (successFn) {
                    successFn();
                }
                break;
            default: //0: //據點代碼輸入錯誤
                FnCtrl.alert(result);
                if (errFn) {
                    errFn();
                }
                break;
        }
    },

    checkBranchUserInfoCode: function (U_ID, U_GW, successFn, errFn) {

        WiseScripts.Tool.ShowLoading(true, $.i18n('資料確認中'));

        var UploadData = {
            "UserId": U_ID,
            "UserPwd": U_GW
        };

        var PostInfo = {
            Url: AppConfig.AppServices + "/CheckBranchUserInfoCode",
            UploadData: UploadData,
            async: true
        };
        Log.write(JSON.stringify(UploadData), 'checkBranchUserInfoCode');
        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result, "CheckBranchCode");
            MeasureScan.checkBranchCodeSuccess(result, function () {
                localStorage[localStorage.UserID + "_checkBranchUserID"] = U_ID;
                MeasureScan.CheckUserID = U_ID;
                if (successFn) {
                    successFn();
                }
            }, function () {
                if (errFn) {
                    errFn();
                }
            });
            WiseScripts.Tool.ShowLoading(false);
        }, function (err) { //失敗
            FnCtrl.alert($.i18n("獲取雲端資料失敗"));
            WiseScripts.Tool.ShowLoading(false);
        });
    },
    checkBranchUserInfoCodeSuccess: function (strResult, successFn, errFn) {
        var obj = JSON.parse(strResult);
        var code = obj.code;
        var result = obj.result;
        switch (code) {
            case "1": //資料輸入正確
                Log.write(result, 'checkBranchUserInfoCodeSuccess');
                if (successFn) {
                    successFn();
                }
                break;
            default: //0: //資料輸入錯誤
                FnCtrl.alert(result);
                if (errFn) {
                    errFn();
                }
                break;
        }
    }
};