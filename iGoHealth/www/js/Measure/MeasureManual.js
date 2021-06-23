var MeasureManual = {
    Mode: "A",
    MRowID: "",
    MRowKey: "", //P1SNo
    show: function (MRowID, _UploadStatus,isMemo) {
        var MType = MeasureInfo.MType;
        if (MType == "") { //第一次開啟這個畫面 給預設值開啟血糖
            MType = 'BG'; //預設顯示新增血糖 TODO
        }

        var UploadStatus = ""; //A:新增；U:修改；Q:上傳中；S:上傳完成
        if (_UploadStatus) {
            UploadStatus = _UploadStatus;
        }

        var title = "";

        switch (UploadStatus) {
            case "A":
                FnCtrl.alert($.i18n('資料上傳中，不可進行修改'));
                return;

            case "":
                UploadStatus = "A";
                title = $.i18n('新增手動輸入紀錄');
                break;
            case "U":
            case "S":
                UploadStatus = "U";
                MeasureManual.updateMRowStatus(MType, MRowID);
                title = $.i18n('修改');
                break;
        }

        $("#MeasurePage_Manual").attr("data-navname", title);

        MeasureManual.Mode = UploadStatus;

        if (isMemo) {
            MeasureManual.goToMemoPage(MType, MRowID);
        } else {
            MeasureManual.goToUpdatePage(MType, MRowID);
        }
    },
    goToUpdatePage: function (MType, MRowID) {
        MeasureManual.showByMType(MType, MRowID).then(function () {
            DateTimeFun.iniDate("MPM_Date", "MPM_Time"); //依據不同OS製作不同日期控件
            WiseScripts.Tool.NextPop("MeasurePage_Manual", function () {
                document.getElementById("tabManual_btn" + MType).scrollIntoView();
            }, null, 'F');
        });
    },
    goToMemoPage:function(MType, MRowID){

        $("#MPM_Memo_Text").val("");

        MeasureManual.getInfoData(MType, MRowID).then(function (obj) {
            Log.write(JSON.stringify(obj), "goToMemoPage getInfoData");

            var MRowKey = obj.MRowKey;
            MeasureManual.MRowKey = MRowKey;

            var MTimeStamp = obj.MTimeStamp;
            var DeviceModel = obj.DeviceModel;
            var Memo = obj.Memo;
            
            MTimeStamp = MTimeStamp.substr(0, 16).replace(/\-/g, "/");

            $("#MPM_Memo_Date").html(MTimeStamp);
            $("#MPM_Memo_Text").val(Memo);

            var MValue = "";
            var TimeType = "";
            switch(MType){
                case "BG":
                    MValue = MeasureInfo.convertMValue(MType, obj.BS, DeviceModel);

                    TimeType = Display.getTimeType(obj.TimeType); 
                    break;
                case "BP":
                    MValue = obj.SBP + " / ";
                    MValue += obj.DBP + " / ";
                    MValue += obj.HR;
                    break;
                default: //BT, UA, CHOL, BO, HR
                    MValue = MeasureInfo.convertMValue(MType, obj[MType]);
                    break;
            }

            if(TimeType === ""){
                $("#divMPM_Memo_TimeType").hide();
                $("#MPM_Memo_TimeType").html("");  
            }else{
                $("#divMPM_Memo_TimeType").show();
                $("#MPM_Memo_TimeType").html(TimeType);  
            }

            $("#MPM_Memo_MType").html($.i18n(MType) + "值: ");
            $("#MPM_Memo_MValue").html(MValue);

            $("#MeasurePage_Manual_Memo").attr("measure-MRowKey", MRowKey);
            $("#MeasurePage_Manual_Memo").attr("measure-type", MType);
            
            WiseScripts.Tool.NextPop("MeasurePage_Manual_Memo", function () {}, null, 'F');
        });
    },
    updateMRowStatus: function (MType, MRowID) {
        var UploadStatus = "U";
        var strSql = "Update Management_" + MType + " Set UploadStatus = '" + UploadStatus + "'  Where MRowID = '" + MRowID + "';";
        DAOFn.Query('', strSql, function (result) {
            var objList = $.parseJSON(result);
            if (objList.length == 0) {
                Log.write('無資料');
            } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                Log.write('查詢錯誤');
            } else {
                Log.write('有資料');
            }
        });
    },
    showByMType: function (MType,dataId) {
        return new Promise(function (resolve, reject) {
            Log.write(MType, "Measures ShowMPMbyMType");
            var height = "";
            if (localStorage["Height_" + localStorage.UserID]) {
                height = localStorage["Height_" + localStorage.UserID];
            }
            $("#txtMPM_Height").val(height);

            MeasureInfo.MType = MType;
            //上方tab按鈕樣式切換
            var lMType = AppConfig.lMType; //抓取AppConfig中目前有設定的量測項目
            for (var i = 0; i < lMType.length; i++) {
                document.getElementById("tabManual_btn" + lMType[i]).classList.remove("active");

                if (i == lMType.length - 1) {
                    document.getElementById("tabManual_btn" + MType).classList.add("active");
                }
            }
            $("#tabManualSection>div").hide();

            Log.write(MType,"bindInfo start");

            if(MeasureManual.Mode === "U"){
                MeasureManual.bindInfo(MType,dataId);
                MeasureManual.MRowID = dataId;
                // MeasureManual.MRowKey = "";

                $("#ulManual").hide();
                // $("#divMPM_Memo").show();
                $("#tabManual_" + MType).show(400, function () {});
            }else{
                MeasureManual.clearText(MType);
                MeasureManual.MRowID = "";
                MeasureManual.MRowKey = "";

                $("#ulManual").show();
                // $("#divMPM_Memo").hide();
                $("#tabManual_" + MType).show(400, function () {
                    MeasureManual.focusByMType(MType);//MPM_Date
                });
            }
            
            resolve();
        });

    },
    bindInfo: function (MType, MRowID) {
        Log.write(MType,"bindInfo");
        MeasureManual.getInfoData(MType, MRowID).then(function (obj) {
            Log.write(JSON.stringify(obj), "getInfoData");

            var MRowKey = obj.MRowKey;
            MeasureManual.MRowKey = MRowKey;

            var MTimeStamp = obj.MTimeStamp;
            var DeviceModel = obj.DeviceModel;
            
            DateTimeFun.iniDate("MPM_Date", "MPM_Time", MTimeStamp); //依據不同OS製作不同日期控件

            var Memo = obj.Memo ? obj.Memo : "";

            switch(MType){
                case "BG":
                    var BG = MeasureInfo.convertMValue(MType, obj.BS, DeviceModel);
                    $("#txtMPM_BG").val(BG);
                    MeasureManual.switchTimeType(MType, obj.TimeType);
                    break;
                case "BP":
                    $("#txtMPM_SBP").val(obj.SBP);
                    $("#txtMPM_DBP").val(obj.DBP);
                    $("#txtMPM_BPHR").val(obj.HR);
                    break;
                case "BW":
                case "BF":
                    $("#txtMPM_BW").val(obj.Weight);
                    $("#txtMPM_Fat").val(obj.BodyRate);
                    break;
                case "STEP":
                    $("#txtMPM_STEP").val(obj.STEP);
                    $("#txtMPM_Distance").val(obj.Distance);
                    $("#txtMPM_CAL").val(obj.CAL);
                    break;
                case "BO":
                    $("#txtMPM_"+MType).val(obj.SBP);
                    $("#txtMPM_BOHR").val(obj.SBP);
                    break;
                default: //BT, UA, CHOL, BO, HR
                    var MValue = MeasureInfo.convertMValue(MType, obj[MType]);
                    $("#txtMPM_" + MType).val(MValue);
                    break;
            }
        });
    },
    getInfoData:function(MType,MRowID,successFn){
        return new Promise(function(resolve,reject){
            var infoData;
            var strSql = "select * from Management_" + MType + " where MRowID = " + MRowID +" limit 1;";
            DAOFn.Query('', strSql, function (result) {
                var objList = $.parseJSON(result);
                if (objList.length == 0) {
                    Log.write('無資料', "getInfoData");
                } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                    Log.write('查詢錯誤', "getInfoData");
                } else {
                    Log.write('有資料' + result, "getInfoData");
                    infoData = objList[0];
                }
                resolve(infoData);
            });
        });
        
    },
    switchTimeType:function(MType,timeType){
        var $timeGroup = $("#MPM_TimeGroup_" + MType);//.val();
        var $ddlTimeType = $("#MPM_TimeType_" + MType);
        $ddlTimeType.html("");

        var $optBreakfast = $("<option>");
        var $optLunch = $("<option>");
        var $optDinner =  $("<option>");

        $optBreakfast.text($.i18n('早餐'));
        $optLunch.text($.i18n('午餐'));
        $optDinner.text($.i18n('晚餐'));

        $ddlTimeType.show();

        switch (timeType) {
            case "0":
            case "7":
                $timeGroup.val(timeType);
                $ddlTimeType.hide();
                break;
            case "1":
            case "3":
            case "5":
                $timeGroup.val("AC");

                $optBreakfast.val("1");
                $optLunch.val("3");
                $optDinner.val("5");

                $ddlTimeType.append($optBreakfast); 
                $ddlTimeType.append($optLunch);
                $ddlTimeType.append($optDinner);
                $ddlTimeType.val(timeType);
                break;
            case "2":
            case "4":
            case "6":
                $timeGroup.val("PC");

                $optBreakfast.val("2");
                $optLunch.val("4");
                $optDinner.val("6");

                $ddlTimeType.append($optBreakfast); 
                $ddlTimeType.append($optLunch);
                $ddlTimeType.append($optDinner);

                $ddlTimeType.val(timeType);
                break;
        }
    },
    onBtnSaveClick: function (_MData, _UserID, isCheckMData) {
        FnCtrl.isBlockBtnClick(function () {
            MeasureManual.insertMData(_MData, _UserID, isCheckMData);
        });
    },
    onBtnMemoSaveClick: function (_UserID) {

        if(!MainHome.CheckNet()){
            return;
        }

        FnCtrl.isBlockBtnClick(function () {

            var MRowKey = $("#MeasurePage_Manual_Memo").attr("measure-MRowKey");
            var Memo = $("#MPM_Memo_Text").val();
            var MType = $("#MeasurePage_Manual_Memo").attr("measure-type");
            Log.write("Memo: " + Memo + "MType: " + MType, 'onBtnMemoSaveClick');

            var UserID = "";
            if (_UserID) {
                UserID = _UserID;
            } else {
                UserID = localStorage.UserID;
            }

            var lParams = {
                MRowKey: MRowKey,
                Memo: Memo,
                MType: MType,
                UserID: UserID
            };

            MeasureManual.inserMData_Memo(lParams);
        });
    },
    insertMData: function (_MData, _UserID, isCheckMData) {
        //var RecordsArr=[];
        //var ResultStr="";
        //FORA D40(DeviceModel),3261214160005324(DeviceId),2018/03/22 13:47(MTimeStamp),128,75,83(量測資料) 
        //FORA IR20,1261315310001260,2018/03/22 13:48,36.2 
        //FORA D40,3261214160005324,2018/03/22 13:50,419,0 
        //FLG-756,34:81:F4:13:77:D1,2018/03/22 14:48,
        //      64.0(體重),25.0(BMI),50.00(體脂),1659(基代),160(身高),0(性別),30(年齡),1.42(肌肉量),1.29(含水量),4(內臟脂肪指數),2.00(骨質密度) 

        var UserID = "";
        if (_UserID) {
            UserID = _UserID;
        } else {
            UserID = localStorage.UserID;
        }
        
        if(!isCheckMData){ //Y:檢查資料是否重複；N:不檢查
            isCheckMData = "Y";
        }

        var isManual = "Y"; //判斷是否為手動新增:_MDATA無資料:手動新增。
        var MData = {};
        var MTimeStamp = ""; //如果_MDATA有資料，時間為當下時間；如為空，抓取使用者所設定時間

        if (_MData) {
            MData = _MData;
            //取得固定日期格式 2017/09/28 11:00:10.123
            MTimeStamp = DateTimeFun.getFullInputDateNow();//.getInputDateNow() + " " + DateTimeFun.getInputTimeNow(); 
            isManual = "N";
            MData.isManual="N";
            MeasureManual.Mode = "A";
        } else {
            var dateVal=$("#MPM_Date").val();
            var timeVal=$("#MPM_Time").val();
            
            if (dateVal == "" || timeVal == "" ) {
                FnCtrl.alert($.i18n('請輸入') + $.i18n('量測時間'));
                return;
            }

            MTimeStamp = FnDateTime.getMTimeStamp(dateVal,timeVal);
            MData.isManual="Y";
        }
        
        MData.MTimeStamp=MTimeStamp;

        var Memo = $("#MPM_Memo").val();
        var MType = MeasureInfo.MType;
        var DeviceModel =  MType+"(Manual)"; //ex: BG(Manual)
        var DeviceId = "";

        var RecordsArr = [];
        var ResultStr = "";

        var result = "";

        ResultStr += DeviceModel + "," + DeviceId + "," + MTimeStamp;

        ProjectFn.Wait([function(next){
            MeasureManual.checkMData(MData, function (MData) {
                var MValue = "";
                switch (MType) {
                    case "BG":
                        MValue=MData[MType];
                        MValue=MeasureInfo.convertSaveMValue(MType,MValue);
                        MeasureManual.getTimeType(MType,function (TimeType) {
                            ResultStr += "," + MValue + "," + TimeType;
                        });
                        break;
                    case "BP":
                        var SBP = MData.SBP;
                        var DBP = MData.DBP;
                        var HR = MData.HR;

                        ResultStr += "," + SBP + "," + DBP + "," + HR;
                        break;
                    case "BO":
                        var BO = MData.BO;
                        var BOHR = MData.BOHR;

                        ResultStr += "," + BO + "," + BOHR;
                        break;
                    case "STEP":
                        var STEP = MData.STEP;
                        var Distance = MData.Distance;
                        var CAL = MData.CAL;
                        
                        ResultStr += "," + STEP+ "," + Distance + "," + CAL;
                        break;
                    case "BW":
                        var BW = MData.BW == null ? "" : MData.BW;
                        var BMI = "";
                        var BodyRate = MData.BodyRate == null ? "" : MData.BodyRate;
                        var BaseRate = "";
                        var Height = MData.Height == null ? "" : MData.Height;
                        var Gender = MData.Gender;
                        var Age = MData.Age;
                        var MuscleMass = "";
                        var TBW = "";
                        var VisceralRate = "";
                        var BoneMass = "";

                        if (BW != "" && Height != "") {
                            var BMIHeight = (Height / 100) * (Height / 100);
                            Log.write(BMIHeight, "Height");
                            BMI = Math.round((BW / BMIHeight) * 10) / 10; //四捨五入
                            //BMI=BMI.toFixed(1);
                        }
                        Log.write(BMI, "BMI");

                        ResultStr += "," + BW + "," + BMI + "," + BodyRate + "," + BaseRate;
                        ResultStr += "," + Height + "," + Gender + "," + Age;
                        ResultStr += "," + MuscleMass + "," + TBW + "," + VisceralRate + "," + BoneMass;
                        break;
                    default: //BT, UA, CHOL, HR
                        MValue = MData[MType];
                        MValue=MeasureInfo.convertSaveMValue(MType,MValue);

                        ResultStr += "," + MValue;
                        break;
                }

                if (result != "") {
                    FnCtrl.alert(result);
                    return;
                }

                RecordsArr.push(ResultStr);
                next();
            });
        }],function(){
            
            WiseScripts.Tool.ShowLoading(true, $.i18n("儲存資料中"));

            var UploadStatus = MeasureManual.Mode;
            var MRowKey = MeasureManual.MRowKey;
            var lParams = {
                UploadStatus : UploadStatus,
                MRowKey : MRowKey,
                Memo : Memo
            };

            FnBT.SaveMData(RecordsArr, MType, "manual", UserID, lParams, function (isNewData) {
                Log.write("isNewData: " + isNewData + ",isCheckMData: " + isCheckMData + "；isCheckMData如為N不需要檢查是否資料重複", 'checkMData');
                
                WiseScripts.Tool.ShowLoading(false);

                if (!isNewData && isCheckMData === "Y") {
                    FnCtrl.alert($.i18n('此次量測值已在記錄內'), $.i18n('系統訊息'), function () {  
                    });
                    return;
                }

                if (isManual == "Y") { //手動新增才要跳以下訊息
                    switch(UploadStatus){
                        case "A":
                            var message = $.i18n("新增成功") + "!!!";
                            var title = $.i18n('系統訊息');
                            var buttonLabels = [$.i18n("繼續新增"), $.i18n("返回紀錄")];

                            navigator.notification.confirm(message, function (btnIndex) {
                                if (btnIndex == 1) {
                                    MeasureManual.showByMType(MType);
                                    MeasureManual.clearText(MType); //清除輸入框值
                                } else {
                                    Measure.showHistory(MType);
                                    MeasureManual.clearText(MType); //清除輸入框值
                                    //WiseScripts.Tool.BackPop();
                                }
                            }, title, buttonLabels);
                            break;
                        case "U":
                            FnCtrl.alert($.i18n('更新成功'), $.i18n('系統訊息'), function () {
                                Measure.showHistory(MType);
                                MeasureManual.clearText(MType); //清除輸入框值
                            });
                            break;
                    }
                }
            });
        });
    },
    checkMData: function (MData, successFn) { //檢查手動輸入欄位
        var result = "";
        var isManual = MData.isManual;
        ProjectFn.Wait([function(next){
            FnDateTime.checkMTime(MData.MTimeStamp, function (isCorrect) {
                if (isCorrect != "Y") {
                    FnCtrl.alert($.i18n('日期輸入錯誤！不可為180天前及未來一天之日期。'));
                    return;
                }
                next();
            });
        }],function(){
            var MType = MeasureInfo.MType;
            switch (MType) {
                case "BP": //TODO
                    var SBP = MData.SBP === undefined ? $("#txtMPM_SBP").val() : MData.SBP;
                    var DBP = MData.DBP === undefined ? $("#txtMPM_DBP").val() : MData.DBP;
                    var HR = MData.HR === undefined ? $("#txtMPM_BPHR").val() : MData.HR;

                    if (SBP == "" || DBP == "" || HR == "") {
                        result = $.i18n('請輸入');
                        if (SBP == "") {
                            FnCtrl.focus("txtMPM_SBP");
                            result += $.i18n('收縮壓');
                        } else if (DBP == "") {
                            FnCtrl.focus("txtMPM_DBP");
                            result += $.i18n("舒張壓");
                        } else {
                            FnCtrl.focus("txtMPM_BPHR");
                            result += $.i18n("心率");
                        }
                    } else {
                        var _SBP = parseInt(SBP);
                        var _DBP = parseInt(DBP);
                        var _HR = parseInt(HR);
                        if (_SBP < MeasureInfo.Range.BP.SBPMin || _SBP > MeasureInfo.Range.BP.SBPMax) {
                            result = $.i18n("收縮壓") + $.i18n("輸入數值不正確!");
                            FnCtrl.focus("txtMPM_SBP");
                        } else if (_DBP < MeasureInfo.Range.BP.DBPMin || _DBP > MeasureInfo.Range.BP.DBPMax) {
                            result = $.i18n("舒張壓") + $.i18n("輸入數值不正確!");
                            FnCtrl.focus("txtMPM_DBP");
                        } else if (_HR < MeasureInfo.Range.BP.HRMin || _HR > MeasureInfo.Range.BP.HRMax) {
                            result = $.i18n("心率") + $.i18n("輸入數值不正確!");
                            FnCtrl.focus("txtMPM_BPHR");
                        } else {
                            MData.SBP = SBP;
                            MData.DBP = DBP;
                            MData.HR = HR;
                        }
                    }
                    break;
                case "STEP":
                    var STEP = MData[MType] === undefined ? $("#txtMPM_" + MType).val() : MData[MType];
                    var Distance = MData.Distance === undefined ? $("#txtMPM_Distance").val() : MData.Distance;
                    var CAL = MData.CAL === undefined ? $("#txtMPM_CAL").val() : MData.CAL;

                    if (STEP === "" || Distance==="") { //輸入不可為空
                        result = $.i18n('請輸入');
                        if (STEP == "") {
                            FnCtrl.focus("txtMPM_"+MType);
                            result += $.i18n('步數');
                        }else {
                            FnCtrl.focus("txtMPM_Distance");
                            result += $.i18n("距離");
                        }
                    } else {
                        MData[MType] = STEP;
                        MData.Distance = Distance;
                        MData.CAL = CAL;
                    }
                    break;
                case "BW":
                    var BW = MData.BW === undefined ? $("#txtMPM_BW").val() : MData.BW;
                    var BMI = "";
                    var BodyRate = MData.BodyRate === undefined ? $("#txtMPM_Fat").val() : MData.BodyRate;
                    var BaseRate = "";
                    var Height = MData.Height === undefined ? $("#txtMPM_Height").val() : MData.Height;
                    var Gender = MData.Gender === undefined ? localStorage["Gender_" + localStorage.UserID] : MData.Gender;
                    var Age = MData.Age === undefined ? localStorage["Age_" + localStorage.UserID] : MData.Age;
                    var MuscleMass = "";
                    var TBW = "";
                    var VisceralRate = "";
                    var BoneMass = "";

                    if ((Height === "" || BW === "") && isManual === "Y") { //手動新增進來的資料，需檢查。
                        result = $.i18n('請輸入');
                        if (BW == "") {
                            FnCtrl.focus("txtMPM_BW");
                            result += $.i18n("體重");
                        } else {
                            FnCtrl.focus("txtMPM_Height");
                            result += $.i18n("身高");
                        }
                    } else {
                        var _BW = BW === "" ? 0 : parseInt(BW);
                        var _Height = Height === "" ? 0 : parseInt(Height);
                        var _Fat = BodyRate === "" ? 0 : parseInt(BodyRate);
                        if (isManual === "Y") { //手動新增進來的資料，需檢查體重及體脂
                            if (_BW < MeasureInfo.Range.BW.WMin || _BW > MeasureInfo.Range.BW.WMax) {
                                result = $.i18n("體重") + $.i18n("輸入數值不正確!");
                                FnCtrl.focus("txtMPM_BW");
                            } else if (_Height < MeasureInfo.Range.BW.HMin || _Height > MeasureInfo.Range.BW.HMax) {
                                result = $.i18n("身高") + $.i18n("輸入數值不正確!");
                                FnCtrl.focus("txtMPM_Height");
                            } else if (_Fat > 0 && (_Fat < MeasureInfo.Range.BW.FMin || _Fat > MeasureInfo.Range.BW.FMax)) {
                                result = $.i18n("體脂") + $.i18n("輸入數值不正確!");
                                FnCtrl.focus("txtMPM_Fat");
                            }
                        }
                        MData.BW = BW;
                        MData.Height = Height;
                        MData.BodyRate = BodyRate;
                        MData.Gender = Gender;
                        MData.Age = Age;
                    }
                    break;
                case "BO":
                    var BO = MData[MType] === undefined ? $("#txtMPM_" + MType).val() : MData[MType];
                    var BOHR = MData.BOHR === undefined ? $("#txtMPM_BOHR").val() : MData.BOHR;

                    if (BO === "") { //輸入不可為空
                        result = $.i18n('請輸入') + $.i18n(MType);
                        FnCtrl.focus("txtMPM_" + MType);
                    } else {
                        var _BO = parseInt(BO);
                        if (_BO < MeasureInfo.Range[MType].Min || _BO > MeasureInfo.Range[MType].Max) {
                            result = $.i18n('輸入數值不正確!');
                            FnCtrl.focus("txtMPM_" + MType);
                        } else {
                            MData[MType] = BO;
                            MData.BOHR = BOHR;
                        }
                    }
                    break;
                default: //BG, UA, CHOL, BT, HR
                    var MValue = MData[MType] === undefined ? $("#txtMPM_"+MType).val() : MData[MType];

                    if (MValue === "") { //輸入不可為空
                        result = $.i18n('請輸入')+$.i18n(MType);
                        FnCtrl.focus("txtMPM_"+MType);
                    } else {
                        var _MValue = parseInt(MValue);
                        if (_MValue < MeasureInfo.Range[MType].Min || _MValue > MeasureInfo.Range[MType].Max) {
                            result = $.i18n('輸入數值不正確!');
                            FnCtrl.focus("txtMPM_"+MType);
                        }else{
                            MData[MType]=MValue;
                        }
                    }
                    break;
            }

            if (result != "") {
                FnCtrl.alert(result);
            } else {
                if (successFn) {
                    successFn(MData);
                }
            }
        });

    },
    inserMData_Memo: function (lParams, _UserID) {

        return new Promise(function (resolve, reject) {

            var MRowKey = lParams.MRowKey;
            var Memo = lParams.Memo;
            var MType = lParams.MType;

            var strSql = "Update Management_" + MType + " Set Memo = '" + Memo + "'  Where MRowKey = '" + MRowKey + "';";
            DAOFn.Query('', strSql, function (result) {

                var objList = $.parseJSON(result);
                if (objList.length == 0) {
                    MeasureManual.UploadMData_Memo(lParams, function () {
                        var message = $.i18n("新增成功") + "!!!";
                        var title = $.i18n('系統訊息');
                        FnCtrl.alert(message, title, function () {
                            Measure.showHistory(MType);
                        });
                    });

                    setTimeout(function () {
                        resolve();
                    }, 500);
                } else {
                    Log.write(result, 'inserMData_Memo Error');
                    setTimeout(function () {
                        resolve(result);
                    }, 500);
                }
            });
        });

    },
    clearText: function (MType) {
        $("#MPM_Memo").val("");
        switch(MType){
            case "BP":
                $("#txtMPM_SBP").val("");
                $("#txtMPM_DBP").val("");
                $("#txtMPM_BPHR").val("");
                break;
            case "BW":
            case "BF":
                $("#txtMPM_BW").val("");
                $("#txtMPM_Fat").val("");
                break;
            case "STEP":
                $("#txtMPM_STEP").val("");
                $("#txtMPM_Distance").val("");
                $("#txtMPM_CAL").val("");
                break;
            case "BO":
                $("#txtMPM_"+MType).val("");
                $("#txtMPM_BOHR").val("");
                break;
            default: //BG, BT, UA, CHOL, BO, HR
                $("#txtMPM_"+MType).val("");
                break;
        }
    },
    focusByMType: function (MType) {
        switch (MType) {
            case "BG":
                FnCtrl.focus("txtMPM_"+MType);
                var nowHour = new Date().getHours();

                var dailyRoutine = MeasureInfo.dailyRoutine;
                var wakeUp= parseFloat(dailyRoutine.wakeUp);
                var dinner= parseFloat(dailyRoutine.dinner);
                var bedTime= parseFloat(dailyRoutine.bedTime);

                if (nowHour >= wakeUp && nowHour < dinner) {
                    timeType = "AC";
                } else if (nowHour >= bedTime || nowHour < (bedTime+2-24)) {
                    timeType = "7";
                } else {
                    timeType = "0";
                }
                $("#MPM_TimeGroup_"+MType).val(timeType);
                Log.write(timeType, MType+"量測時段");

                Display.showTimeType(MType);
                break;
            case "BP":
                FnCtrl.focus("txtMPM_SBP");
                break;
            default: //BW, BT, UA, CHOL, BO, STEP, HR
                FnCtrl.focus("txtMPM_"+MType);
                break;
        }
    },
    getTimeType: function (MType,successFn) {
        var timeType = "";

        var timeGroup = $("#MPM_TimeGroup_"+MType).val();

        if (timeGroup == "AC" || timeGroup == "PC") {
            timeType = $("#MPM_TimeType_"+MType).val();
        } else {
            timeType = timeGroup;
        }

        if (successFn) {
            successFn(timeType);
        }
    },
    UploadMData_Memo: function (lParams, successFn, errFn) {

        var MTime = DateTimeFun.getFullInputDateNow();

        var UploadData = {
            'UserID': lParams.UserID,
            'MTime': MTime,
            'MType': lParams.MType,
            'MRowKey': lParams.MRowKey,
            'Memo': lParams.Memo,
            "M_UP_Date": MTime,
            "SystemModel": AppConfig.SystemModel
        };

        var PostInfo = {
            Url: AppConfig.AppServices + '/UploadMData_Memo',
            UploadData: UploadData,
            async: true
        };

        WSCall.Post(PostInfo, function (result) { //成功 
            if (successFn) {
                successFn(result);
            }
        }, function (err) { //失敗
            Log.write("UploadMData_Memo err:" + err, "MeasureManual");
            if (errFn) {
                errFn();
            }
        });

    },
    UploadSuccess: function (MRowKey, successFn) {

        var lParams = {
            MRowKey: MRowKey,
            UploadStatus: "S"
        };

        WaitQueue.UpdateMRowKey(lParams, MType, _MRowKey, function () {
            Log.write("Update Success", 'UpdateMRowKey');
            if(successFn){
                successFn();
            }
        });
    }
};