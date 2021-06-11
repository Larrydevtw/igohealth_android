var SysTableUpd = SysTableUpd || {}, SysTableUpd =
{ 
    /*更新系統資料表*/
    UpdSysTable: function (callback)
    {
        if (NetStatusFn.getNetFlag() || WiseDT.MySetting.USBIsConnect) {
            var LastUpdDate = "2000-01-01 01:00:00";
            
            var vCallFn = function () {
                SysTableUpd.DownLoadSysTable(
                      LastUpdDate,
                      function (result) {
                          //alert(result);
                          //result 空白代表成功
                          callback();
                      }
                  );
            };

            var strSQL = "select * from CheckWebDB ";
                DAOFn.Query("", strSQL, function ResultFun(result) {
                    var objList = $.parseJSON(result);
                    if (objList.length == 0) {
                        Log.write("無資料");
                    } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                        Log.write("查詢錯誤");
                    } else {
                        Log.write("有資料");
                        LastUpdDate = objList[0].CheckDateTime;
                    }
                    vCallFn();
                });
            
        } else {
            callback();
        }
    }
    ,
    /*
    下載資料(含個案資料)
    */
    DownLoadSysTable: function (lastUpdDate,callback,Local_CM_NO)
    {
        //WiseScripts.Tool.ShowLoading(false);
        //WiseScripts.Tool.ShowLoading(true, "確認系統資料中!");
        window.plugins.toast.showShortBottom(
            $.i18n("確認系統資料中")+"!"
            , function (a) { }
            , function (b) { }
        );
        //var checkTime = DateTimeFun.dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss");

        var dObj = new DTBeans.DownloadBean();
        dObj.URL = localStorage.getItem("SP_RestURL") + "TaskHub.aspx";//設定下載的URL
        dObj.TaskName = "SysUpdate";//設定任務名稱
        var vParams = {};//此下載其他要帶的參數
        vParams["APP_Time"] = DateTimeFun.getNow();//行動端時間
        vParams["APP_Ver"] = $("#spReleaseVer").text().replace("V", "");//目前版本號(去掉V)
        vParams["SysTable_LastUpdDate"] = lastUpdDate;//系統最後一次更新時間
        vParams["Local_CM_NO"] = ((Local_CM_NO == null) ?"":Local_CM_NO);//APP中現有個案
        dObj.Params = vParams;

        localStorage.setItem("ProgressLabel", $.i18n("下載系統資料表中"));


        WiseDT.RunDataTransDownload(
            dObj
            , function (dResult) {
                //成功
                var objDateSet = $.parseJSON(dResult.Data);//「dResult.Data」已為明碼

                var RunSQL_F = "";
                var RunSQL_L = "";
                var NoDel = "";
                if(objDateSet.hasOwnProperty("RunWebSQL")){
                    try{
                        RunSQL_F = objDateSet.RunWebSQL[0]["RunSQL_F"].toString();
                        RunSQL_L = objDateSet.RunWebSQL[0]["RunSQL_L"].toString();
                        NoDel = objDateSet.RunWebSQL[0]["NoDel"].toString();
                        delete objDateSet.RunWebSQL;
                     } catch (webEx) { alert(webEx); }
                }

                var tableName = "";//sqlite insert tableName
                var strSQL = "";
                var strCol = "";//欲寫入欄位名稱
                var strQuNum = "";//sqlite 的value, 「?」個數
                var valueArray = [];//欲寫入的值
                var vCM_AppDownload = {};
                DAOFn.ExecuteSqlWithTransation(
                    '',
                    function (tx) {

                        if(RunSQL_F!=""){
                            var tmp_SQL = RunSQL_F.split(';');
                            for(var x=0;x<tmp_SQL.length;x++){
                                tx.executeSql(tmp_SQL[x]);
                            }
                        }

                        //將下載的dataset寫入sqlite DB
                        for (var vTableData in objDateSet) {
                            tableName = vTableData.toString();//sqlite insert tableName
                            
                            var vTargetTable = objDateSet[tableName];
                            if (tableName == "RunWebSQL" || NoDel.indexOf(tableName+",") >= 0) {
                                continue;
                            }
                            //if (vDBTimeFlag103 && tableName == "CheckWebDB") { continue; }

                            //先清空原本的table
                            tx.executeSql("delete from " + tableName + " ;");

                            if (tableName == "CM_CaseManager")
                            {
                                for (var i = 0; i < vTargetTable.length; i++) {
                                    //個資加密
                                    var Params = vTargetTable[i];//call by ref
                                    for (var key in Params) {
                                        switch (key)
                                        {
                                            case "CI_ID":
                                            case "CI_Name":
                                            case "CI_H_ROAD":
                                            case "CI_H_FULL_ADD":
                                            case "CI_L_ROAD":
                                            case "CI_L_FULL_ADD":
                                            case "CI_TEL":
                                            case "CI_MOBILE":
                                            case "CI_TEL2":
                                                Params[key] = ProjectFn.DBencrypt(Params[key]);//加密碼後放回
                                                break;
                                            default:
                                                break;
                                        }
                                    }
                                }
                            }

                            for (var i = 0; i < vTargetTable.length; i++) {
                                strSQL = "";
                                strCol = "";//欲寫入欄位名稱
                                strQuNum = "";//sqlite 的value, 「?」個數
                                valueArray = [];//欲寫入的值
                               
                                var Params = vTargetTable[i];
                                for (var key in Params) {
                                    strCol += key + ",";
                                    strQuNum += "?,";
                                    valueArray.push(Params[key]);
                                }
                                strCol = strCol.substring(0, strCol.length - 1);//去除最後一個,
                                strQuNum = strQuNum.substring(0, strQuNum.length - 1);//去除最後一個,
                                strSQL = " insert into " + tableName + "(" + strCol + ")values(" + strQuNum + "); ";
                                //alert(strSQL);
                                //執行SQL
                                tx.executeSql(strSQL, valueArray);
                                //alert(strSQL);
                            }
                            
                        }

                        if(RunSQL_L!=""){
                            var tmp_SQL = RunSQL_L.split(';');
                            for(var x=0;x<tmp_SQL.length;x++){
                                tx.executeSql(tmp_SQL[x]);
                            }
                        }

                    }
                    ,
                    function (result) {
                        //setTimeout(function(){
                            WiseScripts.Tool.ShowLoading(false);
                            
                            var vMsg = $.i18n("同步系統資料失敗");
                            if (result == "") {
                                vMsg = $.i18n("同步系統資料完成");
                                //ProjectFn.SetSysParams("mSys", "SysTable_LastUpdDate", checkTime, function (msg) { });
    
                                window.plugins.toast.showShortBottom(
                                    vMsg
                                    , function (a) { }
                                    , function (b) { }
                                );
                            }//失敗不顯示Toast
                            SysTableUpd.RunCheckAppVer(function () {
                                callback(result);
                            });

                        //}, 2000);
                       
                    }
                );
            }
            , function (dResult) {
                //失敗
                navigator.notification.alert($.i18n("下載系統資料失敗")+"~!" + dResult.Code + " , " + dResult.Data, null, $.i18n("系統訊息"), $.i18n("確定"));
                WiseScripts.Tool.ShowLoading(false);
                callback("Err");
            }
            , FnDT.transferProgress //處理進度
            );
    },
    /*
    載入後台管理系統參數
    */
    UseManageSystemParams:function (callback)
    {
        var strSQL = "select lower(SP_ParaName) as SP_ParaName,SP_ParaValue from SystemParams ";
        DAOFn.Query("", strSQL, function ResultFun(result) {
            var objList = $.parseJSON(result);
            //alert(result);
            if (objList.length == 0) {
                callback();
                //Log.write("無資料");
            } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                callback();
                //Log.write("查詢錯誤");
            } else {
                //Log.write("有資料");
                $.each(objList, function (i, item) {
                    switch (item.SP_ParaName) {
                        case "applog": //是否要記APP LOG
                            if (item.SP_ParaValue == "Y") {
                                localStorage.setItem("AppLog", "Y");
                            }
                            break;
                      
                        case "dbtimecheck": //PDA 與 DB容許時間誤差(n分)
                            if (item.SP_ParaValue != "") {
                                localStorage.setItem("DBTimeCheck", item.SP_ParaValue);
                            }
                            break;
                       
                        case "wifi_disbt": //WIFI傳輸時是否開關藍牙
                            if (item.SP_ParaValue != "") {
                                localStorage.setItem("Wifi_DisBT", item.SP_ParaValue);
                            } else {
                                localStorage.setItem("Wifi_DisBT", "N");
                            }
                            break;
                        case "bt_diswifi": //量測頁是否關閉WIFI
                            if (item.SP_ParaValue != "") {
                                localStorage.setItem("BT_DisWifi", item.SP_ParaValue);
                            } else {
                                localStorage.setItem("BT_DisWifi", "N");
                            }
                            break;
                        case "syskey": //授權
                            if (item.SP_ParaValue != "") {
                                var tmpArr = item.SP_ParaValue.toString().split('^');
                                if (tmpArr.length ==3 && (DateTimeFun.getNowDate()) >= parseInt(tmpArr[1])) {
                                    //var strShow = "系统每半年需进行优化维护，请于「" + DateTimeFun.DateTimeStringT(tmpArr[2], '/') + "」前联系代理商，逾期系统将无法使用";
                                    var strShow = $.i18n("系統每半年需進行優化維護，請於「$1」前聯系代理商，逾期系統將無法使用", DateTimeFun.DateTimeStringT(tmpArr[2], '/'))

                                    navigator.notification.alert(strShow, null, $.i18n("系統訊息"), $.i18n("確定"));
                                }
                            }
                            break;
                       
                        default:
                            break;
                    }
                });
                callback();
            }
        });

        
    }
};