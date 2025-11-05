//因為要執行更新，所以需加上 https://github.com/pwlin/cordova-plugin-file-opener2 這個plugin
//https://github.com/whiteoctober/cordova-plugin-app-version
//"V_Type" = "Personal"; //Personal:民眾端、Care:照護者
var FnDT = {
    init: function (successFn) {
        if(DeviceInfo.OS!=="android"){
            //alert("FnDT 非Android設備");
            return;
        }
        if(Domain.Address!=="ocics.cn" && Domain.Address !== "larrytp13" && Domain.Address !== "192.168.0.112"  && Domain.Address !== "192.168.43.133"){
            //alert("FnDT return");
            return;
        }
        
        //alert("FnDT init");
        //alert("初始化檔案上傳下載模組");
        localStorage.setItem("SP_RestURL","http://"+Domain.Address+"/OCICS_WS/taskhub.aspx");//"http://"+Domain.Address+Domain.ServiceRoot+"/HATM_Services/api/ApkDownload/Check" ); //114.55.104.189"http://192.168.0.112/OCICS_WS/"
        localStorage.setItem("AesKey", "WiseOCICS");
        localStorage.setItem("AesIv", "mHealth");
        localStorage.setItem("ApkPath", "file:///sdcard/Download"); //APK下載路徑

        //初始化WiseDT==============start============
        DTSetting.DevID = AppConfig.EquipmentID; //這個參數值在登入時會被換掉
        DTSetting.LoginAccount = "ocics"; //這個參數值在登入時會被換掉
        DTSetting.AesKey = localStorage.getItem("AesKey");
        DTSetting.AesIv = localStorage.getItem("AesIv");
        DTSetting.TranType = ["WIFI"];

        DTSetting.USBConnectCallBack = function () {}; //USB接上呼叫的函數，當連接狀態改變時才呼叫1次(EX:拔除→接上時)
        DTSetting.USBRemoveCallBack = function () {}; //USB拔除呼叫的函數，當連接狀態改變時才呼叫1次(EX:接上→拔除時)

        ProjectFn.Wait([function (next) {
            //alert("初始資料交換模組");
            WiseDT.Init(function () { //初始資料交換模組
                next();
            });
        }, function (next) {
            //先確認App是否第一次安裝 第一次安裝不用檢查更新
            FnDT.getAppVersion().then(function (AppInfo) {
                if (AppInfo.appVersion === "") {
                    //alert("App初始化設定");
                    FnDT.iniAppVersion();
                    next();
                } else {
                    //alert("RunCheckAppVer");
                    FnDT.RunCheckAppVer(function () {
                        // alert("RunCheckAppVer success");
                        next();
                    });
                }
            });
        }], function () {
            //alert("pjsuccess");
            if (successFn) {
                successFn();
            }
        });
    },
    iniAppVersion: function () {
        return new Promise(function (resolve, reject) {
            var V_APKName = 'Wise' + Domain.Version + '.apk';
            var lVersionNo = Domain.VersionNo.split('.');
            var V_Version1 = 0;
            var V_Version2 = 0;
            var V_Version3 = 0;

            if (lVersionNo.length > 2) {
                V_Version1 = lVersionNo[0];
                V_Version2 = lVersionNo[1];
                V_Version3 = lVersionNo[2];
            }

            var params = {
                'V_APKName': V_APKName,
                'V_Version1': V_Version1,
                'V_Version2': V_Version2,
                'V_Version3': V_Version3,
                'V_DESP': ""
            };
            DAOFn.SimpleMerge('', 'APP_Version', params, 'V_APKName', V_APKName, '',
                function ResultFun(result) {
                    resolve();
                }
            );
        });
    },
    getAppVersion: function () {
        //alert("getAppVersion");
        return new Promise(function (resolve, reject) {
            var strSql = "select V_APKName,(V_Version1 || '.' || V_Version2 || '.' || V_Version3) as appVersion,ifnull(V_DESP,'') as V_DESP from APP_Version order by V_ID desc limit 1;";
            DAOFn.Query('', strSql, function ResultFun(result) {
                var objList = $.parseJSON(result);
                var AppInfo = {
                    "appName": "",
                    "appVersion": "",
                    "appDesp": ""
                };
                if (objList.length == 0) {
                    Log.write('無資料');
                } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                    Log.write('查詢錯誤');
                } else {
                    Log.write('有資料');
                    AppInfo={
                        "appName":objList[0].V_APKName,
                        "appVersion":objList[0].appVersion,
                        "appDesp":objList[0].V_DESP
                    }     
                }
                resolve(AppInfo);
            });

        });
    },
    RunCheckAppVer: function (successFn,errFn) { //確認APP是否有更新檔
        //alert("RunCheckAppVer S");
        ProjectFn.Wait([function (next) {
            FnDT.GetVerInfo(false, function (msg) {
                //alert("GetVerInfo success");
                if (msg != "") {
                    alert(msg);
                    Log.write("GetVerInfo has Error:" + msg);
                    errFn("GetVerInfo has Error:" + msg);
                } else {
                    next();
                }
            });
        }], function () {
            FnDT.CheckAPPVersion().then(function(){
                if(successFn){
                    successFn();
                }

            });
        });
    },
    //從管理端取得最新APP資訊(會下載檔案)
    //IsDownload→是否要下載檔案(Y/N)
    GetVerInfo: function (IsDownload, callback) {
        //alert("GetVerInfo");
        if (!NetStatusFn.getNetFlag() && !WiseDT.MySetting.USBIsConnect) {
            callback("No WIFI or USB connection");
            return;
        }


        var errMsg = errMsg = $.i18n('下載伺服器失敗_Info');
        if (IsDownload) {
            FnDT.ProgressLabel=$.i18n('下載APP中...');
            FnDT.ProgressLabelSuccess=$.i18n('下載成功');   
        } else {
            FnDT.ProgressLabel=$.i18n('確認APP版本中...');
            FnDT.ProgressLabelSuccess="";   
        }

        var dObj = new DTBeans.DownloadBean();
        dObj.URL = localStorage.getItem("SP_RestURL"); //設定下載的URL + "TaskHub.aspx"
        dObj.TaskName = "CheckVer"; //設定任務名稱

        var vParams = { //此下載其他要帶的參數
            "APP_Time": DateTimeFun.getNow(),
            "APP_Ver": Domain.VersionNo, //目前版本號(去掉V)
            "IsDLFile": (IsDownload ? "Y" : "N"), //是否要下載檔案
            "V_Type": "Personal" //Personal:民眾端、Care:照護者
        };

        dObj.Params = vParams;
        // alert(JSON.stringify(dObj));
        //alert("GetVerInfo RunDataTransDownload ");
        
        WiseDT.RunDataTransDownload(
            dObj,
            function (dResult) {
                //成功
                // alert(dResult.Data);            
                if (IsDownload) {//儲存下載的檔案
                    for (var i = 0; i < dResult.FileArray.length; i++) {
                        var vFileInfo = dResult.FileArray[i];
                        //先刪除檔案，再重新下載
                        WiseDT.FileIO.DeleteFile(
                            vFileInfo.fileDataRel //EX:file:///sdcard/Download/
                            , vFileInfo.fileName,
                            function (msg) {
                                //base64 to Blob
                                WiseDT.FileIO.B64toBlob(
                                    vFileInfo.fileContent, "application/vnd.android.package-archive", null,
                                    function (vBlob) {
                                        //Blob to file 
                                        WiseDT.FileIO.SaveBlobAsFile(vFileInfo.fileDataRel, vFileInfo.fileName, vBlob, function (FileMsg) {
                                            callback(FileMsg);
                                        });
                                    });
                            }
                        );

                    }
                }else{//檢查App版本
                    var params = $.parseJSON(dResult.Data).APP_Version[0]; //「dResult.Data」已為明碼
                    DAOFn.SimpleMerge('', 'APP_Version', params, 'V_APKName', params.V_APKName, '',
                        function ResultFun(result) {
                            //alert("檢查App版本 DAOFn.SimpleMerge Success");
                            callback("");
                        }
                    );
                }
            },
            function (dResult) {//失敗            
                alert(errMsg + dResult.Code + " , " + dResult.Data);
                callback("Download Error:" + dResult.Code + " , " + dResult.Data);
            }, FnDT.transferProgress //處理進度
        );
    },
    //檢查是否有更新檔，有更新檔詢問使用者是否下載
    CheckAPPVersion: function (successFn) {
        //alert("CheckAPPVersion");
        FnDT.getAppVersion().then(function (AppInfo) {
            var appName = AppInfo.appName;
            var appVersion = AppInfo.appVersion;
            var appDesp = AppInfo.appDesp;
            if (appVersion === "") {
                FnDT.NoNewVersion(function(){
                   if (successFn) {
                       successFn();
                   }
                });
            } else {
                var versionNo = (Domain.VersionNo).replace(/\./g,""); //現在版本號
                var _versionNo =appVersion.replace(/\./g,""); //最新版本號
                //alert("versionNo"+versionNo+"_versionNo"+_versionNo);
                try {
                    //確認版本號碼
                    if (_versionNo > versionNo) { //不強制更新，詢問使用者是否進行更新    
                        FnDT.NewVersion(false, appName, appDesp,function(){
                            if (successFn) {
                                successFn();
                            }
                        });
                    }else {
                        FnDT.NoNewVersion(function(){
                            if (successFn) {
                                successFn();
                            }
                        });
                    }

                } catch (e) {
                    navigator.notification.alert("版本解析过程中发生异常!!!" + error.Message, null, "系统讯息", "确定");
                    Log.write("版本解析過程中發生異常：" + e);
                }
            }
            
        });   
    },
    NoNewVersion:function(successFn){
        FnCtrl.toast($.i18n('資料同步成功'),'short','bottom');
        if(successFn){
            successFn();
        }
    },
    //NewVersion(ForceUpdate,FileName) ForceUpdate回傳true時，強制更新，不更新無法使用系統；FileName回傳APK NAME
    NewVersion:function (ForceUpdate, APKName, VerDescription,successFn) {
        //alert("ForceUpdate"+ForceUpdate+"APKName"+APKName+"VerDescription"+VerDescription);
        //alert("NewVersion");
        if (ForceUpdate) {
            Log.write("強制更新");
            //WiseScripts.Tool.ShowLoading(true, "APP版本過舊，強制更新中..");
            FnDT.UpdateAPP(APKName, function () {
                successFn("");
            });
        } else {
            Log.write("非強制更新");

            if (!sessionStorage["UpdateTip_show"]) {
                sessionStorage["UpdateTip_show"] = true;

                //呼叫更新提示
                navigator.notification.confirm("發現更新檔，是否進行更新？\n" + VerDescription,
                    function (btnIndex) {
                        sessionStorage["UpdateTip_show"] = false;

                        if (btnIndex == 1) {
                            if (WiseScripts.Tool.MobileType.IsAndroid()) {
                                //WiseScripts.Tool.ShowLoading(true, "APP更新中..");
                                FnDT.UpdateAPP(APKName, function () {
                                    successFn("");
                                });
                            } else {
                                Log.write("不是Android設備");
                                successFn("");
                            }
                        } else {
                            Log.write("使用者選擇不更新");
                            successFn("");
                        }
                    }, "系統訊息", ["確定", "取消"]);
            }
        }
    },

    ExePath: function (FilePath,successFn) { //執行更新檔
        console.log("ExePath");
        console.log(FilePath);
        cordova.plugins.fileOpener2.open(
            FilePath,
            'application/vnd.android.package-archive', {
                error: function (e) {
                    console.log('Error status: ' + e.status + ' - Error message: ' + e.message);
                    alert("error" + e.message);
                },
                success: function () {
                    FnCtrl.alert($.i18n('安裝apk_Info'));
                    if(successFn){
                        successFn();
                    }
                }
            }
        );
    },
    UpdateAPP: function (APKName, callback) {
        //檢查檔案是否存在
        WiseDT.FileIO.FileExist(localStorage["ApkPath"], APKName, function (IsExist) {
            if (IsExist) {
                //alert("更新檔已存在");
                Log.write("更新檔已存在","FnDT UpdateAPP");
                //檔案存在直接執行安裝
                FnDT.ExePath(localStorage["ApkPath"] + "/" + APKName,function(){
                    callback("");
                });
            } else {
                //call download
                Log.write('call download',"FnDT UpdateAPP");
                FnDT.GetVerInfo(true, function (msg) {
                    //下載完成後，等個5秒後再執行，較穩定
                    if (msg == "") {
                        setTimeout(function () {
                            FnDT.ExePath(localStorage["ApkPath"] + "/" + APKName);
                            callback("");
                        }, 5000);
                        
                    } else {
                        callback("");
                        navigator.notification.alert("更新APP失败~!" + msg, null, "系统讯息", "确定");
                    }
                });
            }
        });


    },
    /*處理進度(為了不要讓顯示進度太快開關)*/
    showProcess: 0,
    ProgressLabel:"",
    ProgressLabelSuccess:"",
    transferProgress: function (progressEvent) { //顯示處理進度
        //alert("transferProgress顯示處理進度");
        Log.write("progressEvent.lengthComputable:"+progressEvent.lengthComputable,'transferProgress');
        if (progressEvent.lengthComputable) {
            //var vP = progressEvent.loaded / progressEvent.total;
            Log.write(progressEvent.loaded+"\nprogressEvent.total:"+progressEvent.total,'transferProgress');
            var progressLoaded = progressEvent.loaded;
            //vP = Math.floor(vP * 100); //只取整數
            if (progressEvent.hasOwnProperty("processName")){
                switch (progressLoaded) {
                    case 0:
                        Log.write("Progress Start",'transferProgress');
                        WiseScripts.Tool.ShowLoading(true, FnDT.ProgressLabel);
                        break;
                    case 100:
                        Log.write("Progress End", 'transferProgress');
                        WiseScripts.Tool.ShowLoading(false);
                        if(FnDT.ProgressLabelSuccess!=""){
                            FnCtrl.toast(FnDT.ProgressLabelSuccess,'short','bottom');
                        } 
                        break;
                }
            }
        }else{
            Log.write("progressEvent.lengthComputable false",'transferProgress');
        }
    }

};