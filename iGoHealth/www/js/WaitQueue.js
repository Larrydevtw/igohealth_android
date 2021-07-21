//上傳數據去雲端
var MeasFN0001_02_Err_Time;
var MeasFN0001_02_Err_Closed = false;
var WaitQueue = WaitQueue || {}, WaitQueue =
{
    RollBack: function () {

        if (localStorage["WaitQueue"])
            WaitQueue.Queue = JSON.parse(localStorage["WaitQueue"]);

        WaitQueue.Count = parseInt(localStorage["WaitQueueCount"]);
    }, 
    Queue: [], 
    Count: 0,
    // Todo 2018/08/07 取消此機制 防止網路訊號不穩所造成的資料遺失
    errCount: 0, //記錄錯誤次數
    errCountMax: 1, //錯誤次數大於此次數，則將這筆資料放到最後，之後再嘗試上傳    
    //Running
    UploadStatus: "",
    Add: function (RS, DeviceType, UserID, UserKind, CardID,lParams) {

        if (!localStorage["WaitQueueCount"])
            localStorage["WaitQueueCount"] = "0";

        localStorage["WaitQueueCount"] = parseInt(localStorage["WaitQueueCount"]) + 1;
        //Log.write(RS, "Upload Params RS S");

        var UploadStatus = "A";
        var MRowKey = "";
        var Memo = "";
        var M_UP_Date = "";
        if(lParams){
            UploadStatus = lParams.UploadStatus;
            MRowKey = lParams.MRowKey;
            Memo = lParams.Memo;
            M_UP_Date = lParams.M_UP_Date;
        }

        var Data = RS.split(',');

        var MValues = "";

        var MTime = Data[2];
        var MDeviceID = Data[1];
        var DeviceModel = Data[0];
        var CreateUser = FnBT.AppMode === "Scan" ? MeasureScan.CheckUserID : "";

        try {
            //TODO
            //撈取量測值；前面三項為:DeviceModel、MDeviceID、MTime
            Data.shift();
            Data.shift();
            Data.shift();
            MValues = Data.join(",");
        } catch (e) { }
        //Log.write(MValues, "Upload Params E");
        var Params = {
            'UserKind': UserKind, //CMNO:被照顧者流水號 4:身分證字號    
            'CardID': CardID, //暫時存:姓名^出生日期^性別                
            'User': UserID,
            'MTime': MTime,
            'MType': DeviceType,
            'MValue': MValues,
            'MDeviceID': MDeviceID,
            'DeviceModel': DeviceModel,
            'UploadStatus': UploadStatus,
            'MRowKey': MRowKey,
            'Memo': Memo,
            "M_UP_Date": M_UP_Date,
            "CreateUser": CreateUser
        };

        Log.write(JSON.stringify(Params), "WaitAdd");
        WaitQueue.Queue.push(Params);

        localStorage["WaitQueue"] = JSON.stringify(WaitQueue.Queue);

        WaitQueue.StartUpload();
    },
    StartUpload: function () {
        Log.write(WaitQueue.UploadStatus, "StartUpload UploadStatus");
        if (WaitQueue.UploadStatus == "Runing")
            return;
        else
            WaitQueue.UploadStatus = "Runing";

        if (NetStatusFn.getNetFlag()) {
            //alert(WaitQueue.Queue.length);
            if (WaitQueue.Queue.length > 0) {
                var CheckCode = DateTimeFun.getNow();
                var UploadData = WaitQueue.Queue[0];
                var resUploadData = "";
                var EquipmentID = AppConfig.EquipmentID;
                var SystemModel = AppConfig.SystemModel; //todo //WiseHC應該不用使用OID OCICS1^OID OCICS1: 照護者端； OID  
                Log.write("CheckCode:" + CheckCode + "\nUploadData:" + UploadData + "\nEquipment:" + EquipmentID + "\nSystemModel:" + SystemModel, "StartUpload S");
                //資料加密
                ProjectFn.Wait([
                    function (next) {
                        WiseAES.enpryptAES(CheckCode, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                            function (res) {
                                CheckCode = res;
                                next();
                            });
                    },
                    function (next) {
                        WiseAES.enpryptAES(JSON.stringify(UploadData), AppConfig.ASKey1, AppConfig.ASKey2, "T",
                            function (res) {
                                resUploadData = res;
                                next();
                            });
                    },
                    function (next) {
                        WiseAES.enpryptAES(EquipmentID, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                            function (res) {
                                EquipmentID = res;
                                next();
                            });
                    }
                ], function () {
                    //上傳資料
                    Log.write("UploadData: " + UploadData + "\nEquipmentID:" + EquipmentID + "\nCheckCode:" + CheckCode, "WaitQueue WiseAES加密後");
                    var UData = {
                        Act: 'UploadMData',
                        UploadData: encodeURI(resUploadData),
                        EquipmentID: encodeURI(EquipmentID),
                        CheckCode: encodeURI(CheckCode),
                        SystemModel: encodeURI(SystemModel)
                    };
                    Log.write(AppConfig.AppServices + "/UploadMData", "WaitQueue StartUpload");
                    $.ajax({
                        url: AppConfig.AppServices + "/UploadMData",
                        data: UData,
                        type: "POST",
                        timeout: 5000, // in milliseconds
                        success: function (clsReturn) { //200:回傳值正常，進行後續動作
                            if (clsReturn.Code == "200") {
                                //解密
                                WiseAES.decryptAES(clsReturn.Data, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                                    //解密成功:後端系統正程運作
                                    function (result) {
                                        var errMsg = "";
                                        var arrReturn = result.split('^');
                                        var code = "";
                                        var MRowKey = "";
                                        if(arrReturn.length>0){
                                            code = arrReturn[0];
                                        }
                                        if(arrReturn.length>1){
                                            MRowKey = arrReturn[1];
                                        }
                                        Log.write("code: " + code + " MRowKey:" + MRowKey, "StartUpload success");
                                        switch (code) {
                                            case "OK!":
                                            case "ReceiveFN0006_00":
                                                result = "";
                                                errMsg = "資料上傳成功";
                                                //資料上傳成功
                                                Log.write(UploadData,'UploadData');
                                                WaitQueue.UploadSuccess(UploadData, MRowKey);
                                                //刪除資料
                                                WaitQueue.Queue.shift();
                                                localStorage["WaitQueue"] = JSON.stringify(WaitQueue.Queue);
                                                break;
                                            case "ReceiveFN0005_04":
                                                result = "";
                                                errMsg = "量測數據重複重送";
                                                //刪除資料
                                                WaitQueue.Queue.shift();
                                                localStorage["WaitQueue"] = JSON.stringify(WaitQueue.Queue);
                                                break;
                                            case "ReceiveFN0005_02":
                                                result = "";
                                                errMsg = "量測數據解密失敗"; //TODO 捨棄掉這筆資料
                                                //刪除資料
                                                WaitQueue.Queue.shift();
                                                localStorage["WaitQueue"] = JSON.stringify(WaitQueue.Queue);
                                                break;
                                            default:
                                                errMsg = "資料上傳失敗：";
                                                break;
                                        }
                                        Log.write(errMsg + result, "WaitQueue Upload 200");
                                        // alert(errMsg + result);
                                        //再次執行上傳
                                        setTimeout(function () {
                                            WaitQueue.UploadStatus = "";
                                            WaitQueue.StartUpload();
                                        }, 1000);
                                    },

                                    //解密失敗:後端有系統性錯誤
                                    function (result) {
                                        WaitQueue.fn_Err(result);
                                    });

                            } else { //400:不正確請求信息 500:流程出現錯誤
                                WiseScripts.Tool.ShowLoading(false);
                                navigator.notification.alert(clsReturn.Data,
                                    function () {
                                        WaitQueue.fn_Err(result);
                                    }, "", "確定");
                            }
                        },

                        error: function (xhr, ajaxOptions, thrownError) {
                            WaitQueue.fn_Err(thrownError);
                        }
                    });

                });
            } else{
                WaitQueue.UploadStatus = "";
            }
        } else {
            //Log.write
            console.log("無網路可上傳資料");
        }
    },
    UploadSuccess: function (MRow, MRowKey) {
        Log.write(JSON.stringify(MRow), 'UploadSuccess');
        Log.write(MRowKey, 'UploadSuccess');
        var MType = MRow.MType;
        var UploadStatus = MRow.UploadStatus;
        var _MRowKey = UploadStatus === "A" ? MRow.MTime : MRowKey;
        Log.write(_MRowKey, "_MRowKey MTime");

        var lParams = {
            MRowKey: MRowKey,
            UploadStatus: "S"
        };

        WaitQueue.UpdateMRowKey(lParams, MType, _MRowKey, function () {
            Log.write("Update Success", 'UpdateMRowKey');
        });
    }, 
    UpdateMRowKey: function (lParams, MType, _MRowKey, successFn) {
        DAOFn.UpdateData('', 'Management_' + MType, lParams, 'MRowKey', _MRowKey, '',
            function (result) {
                Log.write(result, "UpdateMRowKey");
                Log.write(MType + ":" + JSON.stringify(lParams), "UpdateMRowKey");
                setTimeout(function () {
                    if (successFn) {
                        successFn();
                    }
                }, 500);
            }
        );
    },
    fn_Err:function(errMsg){ //TODO
        WaitQueue.errCount++;
        Log.write("資料上傳-連線逾時；再次執行上傳。錯誤次數:" + WaitQueue.errCount, "WaitQueue Upload");

        if (WaitQueue.errCount > WaitQueue.errCountMax) {
            Log.write("錯誤次數" + WaitQueue.errCount + " 將這筆上傳資料放到最後，等待上傳。", "WaitQueue Upload err");
            WaitQueue.errCount = 0;
            //排到後面
            var vErrParamsObj = WaitQueue.Queue.shift();
            WaitQueue.Queue.push(vErrParamsObj);
            localStorage["WaitQueue"] = JSON.stringify(WaitQueue.Queue);
        }
        //再次執行上傳
        setTimeout(function () {
            WaitQueue.UploadStatus = "";
            WaitQueue.StartUpload();
        }, 5000);
    },
};