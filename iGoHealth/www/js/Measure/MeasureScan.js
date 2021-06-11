var MeasureScan = {
    txtCheckCodeId: "txtMeasureCheckCode",
    MeasureScanModeId: "divMeasureScanMode",
    MeasureScan_tbResultId:"MeasureScan_tbResult",
    btnScanId: "MeasureScanMode_Scan",
    profileId: "MeasureScanMode_Profile",
    confirmId: "MeasureScanMode_Confirm",
    dataId: "MeasureScanMode_Data",
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
        var BranchCode = $("#" + MeasureScan.txtCheckCodeId).val();
        Log.write(BranchCode, 'checkAuth');

        $("#" + MeasureScan.txtCheckCodeId).val("");

        MeasureScan.checkBranchCode(BranchCode, function () {
            var targetId = MeasureScan.MeasureScanModeId;

            WiseScripts.Tool.NextPop(targetId, function () {}, null, 'T');
        }, function () {
            Log.write("權限驗證失敗", 'checkAuth');
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
        MeasureScan.showByStep(3);
        FnBT.AppMode = "Scan";
        FnBT.StartScan();
    },
    backToScan: function () {
        MeasureScan.showByStep(1);
        $("#"+MeasureScan.MeasureScan_tbResultId).html("");
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
    getMemberInfo: function (MemberID, successFn) {
        if(MemberID === ""){
            FnCtrl.alert($.i18n('不正確之QRCode訊息'));
            return;
        }

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
            Log.write(result, "GetMemberInfo success");
            MeasureScan.getMemberInfoSuccess(result);
            if (successFn) {
                successFn(result);
            }
        }, function (err) { //失敗
            FnCtrl.alert($.i18n("獲取雲端資料失敗"));
        });
    },
    getMemberInfoSuccess:function(strObj){
        var memberInfo = JSON.parse(strObj);

        var UserID = memberInfo.UserID;
        var NickName = memberInfo.NickName;
        var BirthDay = memberInfo.BirthDay;
        var Gender = memberInfo.Gender === "M" ? "男性" : "女性";

        var Age = memberInfo.Age;
        
        $("#MeasureScan_UserID").val(UserID);
        $("#MeasureScan_NickName").val(NickName);
        $("#MeasureScan_BirthDay").val(BirthDay);
        $("#MeasureScan_Gender").val(Gender);
    },
    showValue:function(MType, ValueArr, isAnimate, MTimeStamp, DeviceModel){
        Log.write(MType + "/" + ValueArr + "/" + isAnimate + "/" + MTimeStamp + "/" + DeviceModel, 'MeasureScan ShowValue');
        
        MTimeStamp = MTimeStamp.substr(0, 16).replace(/\-/g, "/");

        var tr1 = $("<tr>");
        tr1.append($("<td>").html(MTimeStamp));
        tr1.append($("<td>").html($.i18n(MType)));

        MeasureScan.getDisplayMValue(MType, ValueArr, DeviceModel).then(function(DisplayMValue){
            console.log(DisplayMValue);
            var tr2 = $("<tr>");      
            var td2 = $("<td>").append(DisplayMValue);
            td2.attr("colspan", "2");
            tr2.append(td2);
        
            $("#"+MeasureScan.MeasureScan_tbResultId).append(tr1).append(tr2);

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
                        }else{
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
                        }else{
                            MColor = 'rgba(0, 0, 0,1)';
                        } 

                        SBP = "<span style='color:" + MColor + "'>" + SBP + "</span>";

                        return Display.isRed("DBP", DBP, "");
                    }).then(function (obj) {
                        if (obj.IsRed == "1") {
                            MColor = 'rgba(255, 0, 0,1)';
                        }else{
                            MColor = 'rgba(0, 0, 0,1)';
                        } 

                        DBP = "<span style='color:" + MColor + "'>" + DBP + "</span>";

                        return Display.isRed("HR", HR, "");
                    }).then(function (obj) {
                        if (obj.IsRed == "1") {
                            MColor = 'rgba(255, 0, 0,1)';
                        }else{
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
                        }else{
                            MColor = 'rgba(0, 0, 0,1)';
                        } 

                        Weight = "<span style='color:" + MColor + "'>" + Weight + "</span>";

                        return Display.isRed("BodyRate", BodyRate, "");
                    }).then(function (obj) {
                        if (obj.IsRed == "1") {
                            MColor = 'rgba(255, 0, 0,1)';
                        }else{
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
    checkBranchCode: function (BranchCode, successFn,errFn) {

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
            MeasureScan.checkBranchCodeSuccess(result,function(){
                if (successFn) {
                    successFn();
                }
            },function(){
                if(errFn){
                    errFn();
                }
            });
            WiseScripts.Tool.ShowLoading(false);
        }, function (err) { //失敗
            FnCtrl.alert($.i18n("獲取雲端資料失敗"));
            WiseScripts.Tool.ShowLoading(false);
        });
    },
    checkBranchCodeSuccess: function (strResult,successFn,errFn) {
        var obj = JSON.parse(strResult);
        var code = obj.code;
        var result = obj.result;
        switch (code) {
            case "1": //據點代碼輸入正確
                Log.write(result, 'checkBranchCodeSuccess');
                if(successFn){
                    successFn();
                }      
                break;
            default: //0: //據點代碼輸入錯誤
                FnCtrl.alert(result);
                if(errFn){
                    errFn();
                }
                break;
        }
    },
};