/*
============================================================================================
 __        ___          ____ _____   _             ____  _            _       _      
 \ \      / (_)___  ___|  _ \_   _| | |__  _   _  / ___|(_)_ __   ___| | __ _(_)_ __ 
  \ \ /\ / /| / __|/ _ \ | | || |   | '_ \| | | | \___ \| | '_ \ / __| |/ _` | | '__|
   \ V  V / | \__ \  __/ |_| || |   | |_) | |_| |  ___) | | | | | (__| | (_| | | |   
    \_/\_/  |_|___/\___|____/ |_|   |_.__/ \__, | |____/|_|_| |_|\___|_|\__,_|_|_|   
                                           |___/                                     
============================================================================================
http://ascii.mastervb.net/
*/

/*
需import的plugin
1.File
2.File Transfer
3.AppVersion
https://github.com/whiteoctober/cordova-plugin-app-version
4.Wise AES
5.SpinnerDialog
https://github.com/filfat-Studios-AB/cordova-plugin-spinnerdialog
6.Camera(測試檔案上傳用)
7.Sqlite(測試資料上傳下載用)
8.Network Information
9.WifiWizard(控制WIFI)
https://github.com/parsonsmatt/WifiWizard

需import的js
1.jquery.min.js
2.DateTimeFun.js
3.NetStatus.js
4.WriteLog.js
5.jszip.min.js
5.projectFn.js
6.iniDB.js(初始化DB與參數用)

★☆★★☆★★☆★★☆★★☆★↓↓↓這隻程式裡有↓↓↓★☆★★☆★★☆★★☆★★☆★★☆★
1、資料傳輸(WIFI,USB)
2、資料(解)壓縮
3、產生(刪除)資料夾
4、新增(刪除)檔案
5、檔案更名
6、讀取文字檔案
7、檔案是否存在
★☆★★☆★★☆★★☆★★☆★↑↑↑這隻程式裡有↑↑↑★☆★★☆★★☆★★☆★★☆★★☆★
 
 ★WIFI資料上傳PATH:[ExchangePath+/WiseAPP/+PackageName]/WIFI/upload/Data.txt(伺服器直接回應，不另存檔案)
 ★WIFI資料下載PATH:[ExchangePath+/WiseAPP/+PackageName]/WIFI/download/Data.txt(伺服器回應Data_return.txt)
 ★確認USB是否接上PATH:file:///sdcard/USBCheck/usb.txt ,USB check位置固定寫死，目的是未來一台PC只需安裝一個WindowService，即可服務多個APP
 ★USB資料交換PATH:[ExchangePath+/WiseAPP/+PackageName]/USB/exchange/Data.txt(伺服器回應Data_return.txt)
*/

//====================傳輸資料架構===============================
var DTBeans = DTBeans || {}, DTBeans =
{
    //檔案
    FileBean: function () {
        this.fileDataRel = "";//檔案與資料關聯KEY
        this.fileName = "";//檔名
        this.fileContent = "";//資料內容-base64
    }
    ,
    //上傳
    UploadBean: function () {
        this.URL = "";//POST的目標URL
        this.TaskName = "";//上傳任務名稱
        this.Params = {};//上傳參數 (UserID,DevID,TaskName這三個參數為系統使用，不能再使用這三個參數名稱)
        this.Data = "";//多筆資料內容(JSON)，這裡的資料會被ZIP後AES加密
        this.FileArray = [];//FileBean array
    }
    ,
    //下載
    DownloadBean: function () {
        this.URL = "";//POST的目標URL
        this.TaskName = "";//下載任務名稱
        //下載時所帶的參數，因為是採用request.querystring，所以不要太長
        //DownloadBean.Params = {"UUID":"123","cp":"333"}
        this.Params = {};//(UserID,DevID,TaskName這三個參數為系統使用，不能再使用這三個參數名稱)
    }
    ,
    //上傳結果
    UploadResult: function () {
        this.Code = "";//200:上傳成功，其他:失敗
        this.TaskName = "";//上傳任務名稱
        this.Response = "";//WEB傳回的訊息
        this.Sent = "";//總共上傳的資料長度
    }
    ,
    //下載結果
    DownloadResult: function () {
        this.Code = "";//200:下載成功，其他:失敗
        this.TaskName = "";//下載任務名稱
        this.Data = "";//下載的資料(明碼JSON字串),若失敗就是錯誤訊息
        this.FileArray = [];//FileBean array
    }
}

//====================參數===============================
var DTSetting = DTSetting || {}, DTSetting = {
    TranType: ["WIFI"]//傳輸模式(依陣列先後次序) ["USB","WIFI"]
    //↓，WIFI,USB交換檔案的路徑，完整PATH:ExchangePath+PackageName+[WIFI/USB]/
    , AesKey: "WISE"//傳輸加密KEY
    , AesIv: "mHealth"//傳輸加密IV
    , DevID: ""//設備ID
    , LoginAccount: ""//登入者帳號
    , ExchangePath: "file:///sdcard/"//資料交換資料夾
    /*WIFI相關參數*/
    , LockSSID: "" //鎖定僅能連接的SSID名稱陣列，不鎖定給空字串
    , StartOpenWIFI: true //傳輸開啟時若WIFI沒有打開就協助打開，若設定false當遇到WIFI沒有開啟則會呼叫ErrorCallBack(目前暫沒使用)
    , FinishCloseWIFI: false //完成傳輸後關閉WIFI(目前暫沒使用)
    , WIFITimeout: 60//WIFI timeout sec. (目前暫沒使用)   
    /*USB相關參數*/
    , USBTimeout: 60//USB timeout sec.
    , USBCheckTime: 2//檢查USB是否連接中週期(sec.) 不要小於2秒
    , USBConnectCallBack: function () { }//USB接上呼叫的函數，當連接狀態改變時才呼叫1次(EX:拔除→接上時)
    , USBRemoveCallBack: function () { }//USB拔除呼叫的函數，當連接狀態改變時才呼叫1次(EX:接上→拔除時)
    , USBIsConnect: false//USB是否連接中
}


//====================WiseDT(public)===============================
var WiseDT = WiseDT || {}, WiseDT = {
    //各別設定
    MySetting: null
    ,
    //各別設定初始化
    InitSetting: function (UserSetting) {
        WiseDT.MySetting = DTSetting;
        $.extend(WiseDT.MySetting, UserSetting);
    }
   ,
    //WiseDT初始化
    Init: function (successFn) {

        WiseDT.InitSetting();
        
        //為了避免一台設備裝了兩個使用WiseDT的APP，所以多增加一層PackageName
        cordova.getAppVersion.getPackageName(function (PackageName) {
            if (WiseDT.MySetting.ExchangePath.indexOf(PackageName) < 0) {
                WiseDT.MySetting.ExchangePath = WiseDT.MySetting.ExchangePath + /WiseAPP/ +PackageName + "/";
            }
            //建立資料夾
            WiseDT.FileIO.CreateDirectory(WiseDT.MySetting.ExchangePath + "WIFI/upload/", function () { });
            WiseDT.FileIO.CreateDirectory(WiseDT.MySetting.ExchangePath + "WIFI/download/", function () { });
            WiseDT.FileIO.CreateDirectory("file:///sdcard/USBCheck/", function () { });
            WiseDT.FileIO.CreateDirectory(WiseDT.MySetting.ExchangePath + "USB/exchange/", function () { });

            //如果傳輸模式有設定USB，這裡再啟動偵測是否有接上USB
            if (WiseDT.MySetting.TranType.indexOf("USB") >= 0 ) {
                WiseDT.RunCheckUSBConnect();
            }
            if(successFn){
                successFn();
            }
        });
    },/*
    
    WIFI開啟後再執行指定的函數(指定連至某SSID以逗號分隔,執行成功呼叫函數,失敗函數)
      使用方式：
        WiseDT.OpenWifiCallback(
              localStorage.getItem("SSID_only").toString()
              , function () {
                 alert('成功');
              }
          , function () {
             alert('失敗');
          });
    */
    OpenWifiCallback: function (SSID_Only, SuccessFn, FailFn) {
        Log.write("Wifi開啟中");
        var MaxErrTimes = 30;//最大錯誤次數
        var CheckTimes = 0;
        var ConnTimes = 0;//此SSID連接次數
        var CurrentConnIndex = 0;//目前連接SSID的index
        var checkWifiOK = function () {
            setTimeout(function () {
                window.plugins.spinnerDialog.hide();
                window.plugins.spinnerDialog.show("WIFI", "check WIFI...", true);
                if (!NetStatusFn.getNetFlag()) {
                    CheckTimes++;
                    if (CheckTimes < MaxErrTimes)
                        checkWifiOK();
                    else {
                        CheckTimes = 0;
                        //navigator.notification.alert("Wifi于时限内無法开启!\n请排除异常状况，再次同步或手动开启Wifi", null, "系统讯息", "确定");
                        Log.write("Wifi無法時限內開啟");
                        window.plugins.spinnerDialog.hide();
                        alert($.i18n("Wifi無法於時限內開啟"));
                        
                        FailFn();
                    }
                }
                else {
                    CheckTimes = 0;
                    setTimeout(function () {
                        window.plugins.spinnerDialog.hide();
                        SuccessFn(); //WIFI剛開時會很不穩，慢個2秒再做同步上傳,下載
                    }, 2000);

                }
            }, 1000);


        };

        //鎖定只連某個SSID
        var checkWifiSSID = function () {

          
            if (SSID_Only == null || SSID_Only === undefined) { SSID_Only = ""; }
            var vSSID_Array = SSID_Only.split(',');//localStorage.getItem("SSID_only").toString().split(',');
            if (SSID_Only != "" && vSSID_Array.length > 0) {

                if (CheckTimes < MaxErrTimes) {
                    CheckTimes++;
                    try {
                        if (ConnTimes >= 3) { CurrentConnIndex++; ConnTimes = 0; }//失敗3次更換下一個SSID
                        if (CurrentConnIndex >= vSSID_Array.length) { CurrentConnIndex = 0; }


                        WifiWizard.getCurrentSSID(
                                    function (getSSID) {
                                        if (vSSID_Array[CurrentConnIndex].toUpperCase() == getSSID.toString().replace(/\"/g, "").toUpperCase()) {
                                            //SSID 連接成功
                                            checkWifiOK();
                                        } else {

                                            window.plugins.spinnerDialog.hide();
                                            window.plugins.spinnerDialog.show("WIFI", "connect " + vSSID_Array[CurrentConnIndex] + "...", true);

                                            //SSID 連接錯誤，接到指定WIFI
                                            WifiWizard.connectNetwork(
                                                vSSID_Array[CurrentConnIndex]
                                                , function () {
                                                    //成功連線至指定的SSID
                                                    //CheckTimes = 0;
                                                    //checkWifiOK();

                                                    //2秒後再次檢查SSID(再檢查一次較保險)
                                                    setTimeout(function () {
                                                        WifiWizard.getCurrentSSID(
                                                        function (getSSID2) {
                                                            if (vSSID_Array[CurrentConnIndex].toUpperCase() == getSSID2.toString().replace(/\"/g, "").toUpperCase()) {
                                                                //SSID 連接成功
                                                                CheckTimes = 0;
                                                                checkWifiOK();
                                                            } else {
                                                                //SSID 連接錯誤
                                                                checkWifiSSID();
                                                            }
                                                        }
                                                        ,
                                                        function () {
                                                            //SSID 連接錯誤
                                                            checkWifiSSID();
                                                        }
                                                        );
                                                    }, 2000);


                                                }
                                                , function () {
                                                    //SSID 連接錯誤
                                                    ConnTimes++;
                                                    checkWifiSSID();
                                                }
                                            );
                                        }
                                    }
                                    ,
                                    function () {
                                        //SSID 連接錯誤
                                        checkWifiSSID();
                                    }
                       );

                    } catch (SSID_EX) { }
                } else {
                    Log.write("Wifi無法時限內连至指定SSID");
                    window.plugins.spinnerDialog.hide();
                    alert($.i18n("Wifi無法於時限內連至指定SSID"));
                 
                    FailFn();
                }
            }
            else {
                checkWifiOK();
            }


        };

        if (!NetStatusFn.getNetFlag()) {
            window.plugins.spinnerDialog.hide();
            window.plugins.spinnerDialog.show("WIFI", "turn on WIFI...", true);
            WifiWizard.setWifiEnabled(true, function () {
                checkWifiSSID();
            }, function () {
                alert($.i18n("無法開啟WIFI,請手動開啟WIFI"));
            });
        } else {
            checkWifiSSID();
        }


    }
     ,
    /*
    確認USB是否連接
    */
    RunCheckUSBConnect: function () {

        var vUSBIsConnect = false;
        var iCount = 1;
        var iCheckTimes = 2;//連續2次都是USB/WIFI才變更狀態

        var UsbCheckEvent = function () {
            if (WiseDT.MySetting.TranType.indexOf("USB") >= 0 ) {
                setTimeout(
                    function () {
                        //先重新命名
                        var checkDir = "file:///sdcard/USBCheck/";
                        //WiseDT.FileIO.RenameFile(checkDir, "usb.txt", "usb_del.txt", function (msg) {
                            //if (msg == "") {
                        WiseDT.FileIO.ReadFile(checkDir, "usb.txt", function (context) {
                                    Log.write("USBcheck:" + context);
                                    if (context.length != 17 || context == "$ReadErr$") {
                                        if (vUSBIsConnect) {
                                            //原本是USB
                                            iCount = 1;
                                        } else {
                                            iCount++;
                                        }
                                        vUSBIsConnect = false;
                                        
                                        if (iCount >= iCheckTimes) {
                                            WiseDT.MySetting.USBIsConnect = false;
                                            WiseDT.MySetting.USBRemoveCallBack();
                                        }
                                        UsbCheckEvent();
                                    } else {
                                        try {
                                            var TheDay = new Date();
                                            var DeviceF = parseFloat(TheDay.getFullDateL17());
                                            var ContextF = parseFloat(context);
                                            var vDeviation = 10 * 60 * 1000;//容許誤差秒數-10分鐘
                                            var vDif = DeviceF - ContextF;
                                            if (vDif >= (vDeviation * (-1)) && vDif <= vDeviation) {//容許誤差在+-vDeviation內
                                                if (vUSBIsConnect) {
                                                    //原本是USB
                                                    iCount++;
                                                } else {
                                                    iCount = 1;
                                                }
                                                vUSBIsConnect = true;

                                                if (iCount >= iCheckTimes) {
                                                    WiseDT.MySetting.USBIsConnect = true;
                                                    WiseDT.MySetting.USBConnectCallBack();
                                                }
                                                UsbCheckEvent();
                                            } else {
                                                if (vUSBIsConnect) {
                                                    //原本是USB
                                                    iCount = 1;
                                                } else {
                                                    iCount++;
                                                }
                                                vUSBIsConnect = false;

                                                if (iCount >= iCheckTimes) {
                                                    WiseDT.MySetting.USBIsConnect = false;
                                                    WiseDT.MySetting.USBRemoveCallBack();
                                                }
                                                UsbCheckEvent();
                                            }
                                        } catch (err) {
                                            if (vUSBIsConnect) {
                                                //原本是USB
                                                iCount = 1;
                                            } else {
                                                iCount++;
                                            }
                                            vUSBIsConnect = false;

                                            if (iCount >= iCheckTimes) {
                                                WiseDT.MySetting.USBIsConnect = false;
                                                WiseDT.MySetting.USBRemoveCallBack();
                                            }
                                            UsbCheckEvent();
                                        }
                                        finally {
                                            //最後，再刪除檔案
                                            WiseDT.FileIO.DeleteFile(checkDir, "usb.txt", function (msg) { });
                                        }

                                    }
                                });
                            //} else {
                                //WiseDT.MySetting.USBIsConnect = false;
                                //WiseDT.MySetting.USBRemoveCallBack();
                                //UsbCheckEvent();
                            //}
                        //});

                        //WiseDT_Private.USBConnectCheck(
                        //    //完整PATH:file:///sdcard/USBCheck/usb.txt
                        //    "file:///sdcard/USBCheck/"
                        //    ,
                        //    "usb.txt"
                        //    , function () {
                        //        if (!WiseDT.MySetting.USBIsConnect) {
                        //            //拔除→接上

                        //            WiseDT.MySetting.USBIsConnect = true;
                        //            WiseDT.MySetting.USBConnectCallBack();
                        //            UsbCheckEvent();
                        //            //WiseDT.RunCheckUSBConnect();
                        //        }
                        //    }
                        //    , function () {
                        //        if (WiseDT.MySetting.USBIsConnect) {
                        //            //接上→拔除

                        //            WiseDT.MySetting.USBIsConnect = false;
                        //            WiseDT.MySetting.USBRemoveCallBack();
                        //            UsbCheckEvent();
                        //            //WiseDT.RunCheckUSBConnect();
                        //        }
                        //    }
                        // );

                    }
                    , WiseDT.MySetting.USBCheckTime * 1000 //檢查週期
                );
            } else {
                //不檢查
                setTimeout(
                    function () {
                        UsbCheckEvent();
                        //WiseDT.RunCheckUSBConnect();
                    },
                    WiseDT.MySetting.USBCheckTime * 1000 //檢查週期
                );
            }
        };
        UsbCheckEvent();
    }
    ,
    /*
    執行資料傳輸上傳(UploadBean,傳輸完成呼叫的函數,傳輸失敗呼叫的函數,傳輸進度呼叫的函數)
    */
    RunDataTransUpload: function (objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack) {
        var vUploadResult = new DTBeans.UploadResult();//建立回傳結果物件
        vUploadResult.Code = "900";//200:上傳成功，其他:失敗
        vUploadResult.Response = "error";//WEB傳回的訊息
        vUploadResult.Sent = "0";//總共上傳的資料長度
        vUploadResult.TaskName = objBean.TaskName;//任務名稱

        for (var i = 0 ; WiseDT.MySetting.TranType.length; i++)
        {
            if (WiseDT.MySetting.TranType[i] == "USB") {
                if (WiseDT.MySetting.USBIsConnect) {
                    //USB有接上
                    WiseDT.DataTransUploadWithUSB(objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack);
                    break;
                } else {
                    //USB沒接上，而且也不使用WIFI
                    if (WiseDT.MySetting.TranType.length == 1) {
                        vUploadResult.Response = "USB unconnect";
                        ErrorCallBack(vUploadResult);
                        break;
                    } else {
                        //換WIFI連線
                        continue;
                    }
                }
            } else {
                //WIFI
                if (NetStatusFn.getNetFlag()) {
                    //有WIFI

                    if (WiseDT.MySetting.LockSSID == "") {
                        //沒有鎖定SSID
                        WiseDT.DataTransUploadWithWIFI(objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack);
                    } else {
                        //有鎖定SSID
                        WiseDT.OpenWifiCallback(
                             LockSSID
                             , function () {
                                 WiseDT.DataTransUploadWithWIFI(objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack);
                             }
                         , function () {
                             //alert("連接WIFI失敗");
                             if (WiseDT.MySetting.TranType.length == 1) {
                                 vUploadResult.Response = "WIFI unconnect";
                                 ErrorCallBack(vUploadResult);
                             } else {
                                 //換USB連線
                             }
                         });
                    }
                    break;
                } else {
                    //無WIFI，而且也不使用USB
                    if (WiseDT.MySetting.TranType.length == 1) {
                        vUploadResult.Response = "WIFI unconnect";
                        ErrorCallBack(vUploadResult);
                        break;
                    } else {
                        //換USB連線
                        continue;
                    }
                }
            }
        }
    }
    ,
    /*
    執行資料傳輸下載(DownloadBean,傳輸完成呼叫的函數,傳輸失敗呼叫的函數,傳輸進度呼叫的函數)
    */
    RunDataTransDownload: function (objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack) {
        var vDownloadResult = new DTBeans.DownloadResult();//建立回傳結果物件
        vDownloadResult.Code = "900";//200:上傳成功，其他:失敗
        vDownloadResult.Data = "";//下載的資料(已解碼的JSON字串)
        vDownloadResult.FileArray = [];//檔案陣列
        vDownloadResult.TaskName = objBean.TaskName;//任務名稱

        //alert("執行資料傳輸下載(DownloadBean");
        //alert(JSON.stringify(WiseDT.MySetting));
        for (var i = 0 ; WiseDT.MySetting.TranType.length; i++) {
            if (WiseDT.MySetting.TranType[i] == "USB") {
                if (WiseDT.MySetting.USBIsConnect) {
                    //USB有接上
                    WiseDT.DataTransDownloadWithUSB(objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack);
                    break;
                } else {
                    //USB沒接上，而且也不使用WIFI
                    if (WiseDT.MySetting.TranType.length == 1) {
                        vDownloadResult.Data = "USB unconnect";
                        ErrorCallBack(vDownloadResult);
                        break;
                    } else {
                        //換WIFI連線
                        continue;
                    }
                }
            } else {
                //WIFI
                if (NetStatusFn.getNetFlag()) {
                    //有WIFI
                    // alert("有WIFI");
                    if (WiseDT.MySetting.LockSSID == "") {
                        //沒有鎖定SSID
                        // alert("沒有鎖定SSID");
                        WiseDT.DataTransDownloadWithWIFI(objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack);
                    } else {
                        //有鎖定SSID
                        // alert("有鎖定SSID");
                        WiseDT.OpenWifiCallback(
                             LockSSID
                             , function () {
                                 WiseDT.DataTransDownloadWithWIFI(objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack);
                             }
                         , function () {
                             //alert("連接WIFI失敗");
                             if (WiseDT.MySetting.TranType.length == 1) {
                                 vDownloadResult.Data = "WIFI unconnect";
                                 ErrorCallBack(vDownloadResult);
                             } else {
                                 //換USB連線
                             }
                         });
                    }
                    break;
                } else {
                    //無WIFI，而且也不使用USB
                    if (WiseDT.MySetting.TranType.length == 1) {
                        vDownloadResult.Data = "WIFI unconnect";
                        ErrorCallBack(vDownloadResult);
                        break;
                    } else {
                        //換USB連線
                        continue;
                    }
                }
            }
        }
    }
    ,
    /*
    資料傳輸上傳-WIFI
    */
    DataTransUploadWithWIFI: function (objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack) {
        
        var vUploadResult = new DTBeans.UploadResult();//建立回傳結果物件
        vUploadResult.Code = "100";//200:上傳成功，其他:失敗
        vUploadResult.Response = "zip error";//WEB傳回的訊息
        vUploadResult.Sent = "0";//總共上傳的資料長度
        vUploadResult.TaskName = objBean.TaskName;//任務名稱


        //自製的ProgressObj
        var myProgressObj = {};
        myProgressObj["lengthComputable"] = true;
        myProgressObj["total"] = 100;
        myProgressObj["loaded"] = 0;
        myProgressObj["processName"] = "data process";

        //先出現0%
        ProgressCallBack(myProgressObj);

        //先處理欲POST的資料(JSON→ZIP→BASE64 file→AES→BASE 64 string)
        //ZIP壓縮=============↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓=============
        WiseDT.ZIP.ZipString(objBean.Data
            , function (zipString) {
                //AES加密=============↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓=============
                WiseAES.enpryptAES(
                    zipString
                    , WiseDT.MySetting.AesKey
                    , WiseDT.MySetting.AesIv
                    , "T"
                    , function SFun(enData) {//加密後
                        objBean.Data = enData;//將原本明碼的Data改為壓縮且加密後的字串
                        var vPostURL = objBean.URL;//POST URL
                        //delete DataBean.URL;//將欲上傳的Bean裡面的URL移除

                        var vTmpBean = {};
                        $.extend(vTmpBean, objBean);//copy object
                        delete vTmpBean['Params'];//參數會以POST出去，不用再另外打包加密
                        var vWriteStr = JSON.stringify(objBean);//object to string
                        //產生POST file
                        //先刪除上傳資料夾(減少空間)，再開始將資料寫到file
                        //完整PATH:ExchangePath+/WiseAPP/+PackageName+WIFI/upload/Data.txt
                        WiseDT.FileIO.DeleteDirectory(
                            WiseDT.MySetting.ExchangePath + "WIFI/"
                            , "upload"
                            , function (msg) {
                                if (msg != "") {
                                    vUploadResult.Code = "400";
                                    vUploadResult.Response = msg;
                                    vUploadResult.Sent = 0;
                                    ErrorCallBack(vUploadResult);
                                } else {
                                    //建立資料夾後開始將資料寫到file
                                    WiseDT.FileIO.CreateDirectory(
                                        WiseDT.MySetting.ExchangePath + "WIFI/upload/"
                                        ,
                                        function () {
                                            WiseDT.FileIO.WriteFile(
                                               WiseDT.MySetting.ExchangePath + "WIFI/upload/"
                                               , "Data.txt"
                                               , vWriteStr
                                               ,
                                                function (msg) {
                                                    if (msg != "") {
                                                        //寫入檔案失敗
                                                        vUploadResult.Code = "400";
                                                        vUploadResult.Response = msg;
                                                        vUploadResult.Sent = 0;
                                                        ErrorCallBack(vUploadResult);
                                                    } else {
                                                        var fileURL = WiseDT.MySetting.ExchangePath + "WIFI/upload/Data.txt";
                                                        //開始上傳
                                                        var win = function (r) {
                                                            //上傳成功
                                                            //console.log("Code = " + r.responseCode);
                                                            //console.log("Response = " + r.response);//WEB回應的訊息
                                                            //console.log("Sent = " + r.bytesSent);
                                                            //刪除傳輸檔案，節省空間
                                                            WiseDT.FileIO.DeleteFile(
                                                                WiseDT.MySetting.ExchangePath + "WIFI/upload/"
                                                                , "Data.txt"
                                                                , function (msg) { }
                                                            );


                                                            //處理完成出現100%
                                                            myProgressObj.loaded = 100;
                                                            ProgressCallBack(myProgressObj);

                                                            var vWebResponse = $.parseJSON(r.response);//json to object
                                                            if (vWebResponse.Code == "200") {
                                                                //伺服器回應成功
                                                                vUploadResult.Code = "200";
                                                                vUploadResult.Response = "";
                                                                vUploadResult.Sent = r.bytesSent;
                                                                SuccessCallBack(vUploadResult);
                                                            } else {
                                                                //伺服器回應失敗
                                                                vUploadResult.Code = "501";
                                                                vUploadResult.Response = vWebResponse.Response;
                                                                vUploadResult.Sent = r.bytesSent;
                                                                ErrorCallBack(vUploadResult);
                                                            }


                                                        };

                                                        var fail = function (error) {
                                                            //上傳失敗
                                                            //console.log("An error has occurred: Code = " + error.code);
                                                            //console.log("upload error source " + error.source);
                                                            //console.log("upload error target " + error.target);

                                                            //刪除傳輸檔案，節省空間
                                                            WiseDT.FileIO.DeleteFile(
                                                                WiseDT.MySetting.ExchangePath + "WIFI/upload/"
                                                                , "Data.txt"
                                                                , function (msg) { }
                                                            );

                                                            vUploadResult.Code = error.code;
                                                            vUploadResult.Response = "upload error";
                                                            vUploadResult.Sent = 0;
                                                            ErrorCallBack(vUploadResult);

                                                        };

                                                        var options = new FileUploadOptions();
                                                        options.fileKey = "file";
                                                        options.fileName = fileURL;
                                                        options.mimeType = "text/plain";

                                                        var params = {};
                                                        //系統固定參數值
                                                        params.UserID = WiseDT.MySetting.LoginAccount;
                                                        params.DevID = WiseDT.MySetting.DevID;
                                                        params.TaskName = objBean.TaskName;
                                                        //使用者自定參數值
                                                        for (var p in objBean.Params) {
                                                            if (objBean.Params.hasOwnProperty(p) && p != "URL") {
                                                                params[p] = objBean.Params[p];
                                                            }
                                                        }

                                                        options.params = params;

                                                        var ftU = new FileTransfer();
                                                        ftU.onprogress = ProgressCallBack;
                                                        ftU.upload(fileURL, encodeURI(vPostURL), win, fail, options);
                                                    }
                                                }
                                           );
                                        }
                                    );
                                    
                                }
                            }
                        );
                       

                    }
                    , function FFun(result) {
                        vUploadResult.Code = "500";
                        vUploadResult.Response = "AES encryption error";
                        vUploadResult.Sent = 0;
                        ErrorCallBack(vUploadResult);
                    }
                 );
                //AES加密=============↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑=============
            });
        //ZIP壓縮=============↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑=============
    }
    ,
    /*
    資料傳輸下載-WIFI
    */
    DataTransDownloadWithWIFI: function (objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack) {
        //開始接收資料與檔案
        //alert("開始接收資料與檔案");
        //var DResultObj = {};//回傳結果物件
        //DResultObj["Code"] = "100";//200:下載成功，其他:失敗
        //DResultObj["Data"] = "";//下載的資料(已解碼的JSON字串)
        //DResultObj["file"] = "";//檔案陣列(DResultObj.file.fileDataRel→檔案與資料關碼、DResultObj.file.fileName→檔名、DResultObj.file.fileContent→檔案base64 string)

        var vDownloadResult = new DTBeans.DownloadResult();//建立回傳結果物件
        vDownloadResult.Code = "100";//200:上傳成功，其他:失敗
        vDownloadResult.Data = "";//下載的資料(已解碼的JSON字串)
        vDownloadResult.FileArray = [];//檔案陣列
        vDownloadResult.TaskName = objBean.TaskName;//任務名稱

        //alert("自製的ProgressObj");
        //自製的ProgressObj
        var myProgressObj = {
            "lengthComputable": true,
            "total": 100,
            "loaded": 0,
            "processName": "data process"
        };
        
        //alert("ProgressCallBack");
        //先出現0%
        ProgressCallBack(myProgressObj);
        // alert("先刪除下載資料夾(減少空間)，再開始將資料寫到file");
        //先刪除下載資料夾(減少空間)，再開始將資料寫到file
        WiseDT.FileIO.DeleteDirectory(
            WiseDT.MySetting.ExchangePath + "WIFI/"
            , "download"
            , function (msg) {
                // alert(msg);
                if (msg != "") {
                    vDownloadResult.Code = "400";
                    vDownloadResult.Data = msg;
                    vDownloadResult.FileArray = [];
                    ErrorCallBack(vDownloadResult);
                } else {
                    //建立資料夾後開始將資料寫到file
                    WiseDT.FileIO.CreateDirectory(
                        WiseDT.MySetting.ExchangePath + "WIFI/download/"
                        ,
                        function () {
                            //開始下載檔案
                            var fileURL = WiseDT.MySetting.ExchangePath + "WIFI/download/Data_return.txt";
                            //下載函數
                            var ftD = new FileTransfer();
                            //產生完整的URL
                            //系統固定參數值
                            var vTmpURL =
                               objBean.URL
                               + "?UserID=" + btoa(WiseDT.MySetting.LoginAccount)
                               + "&DevID=" + btoa(WiseDT.MySetting.DevID)
                               + "&TaskName=" + btoa(objBean.TaskName);

                            //使用者自定參數值
                            for (var p in objBean.Params) {
                                if (objBean.Params.hasOwnProperty(p) && p != "URL") {
                                    vTmpURL += "&" +p + "=" +btoa(objBean.Params[p]);
                                }
                            }
                            //將完整URL取得原本的URL
                            objBean.URL = encodeURI(vTmpURL);
                            ftD.onprogress = ProgressCallBack;
                            //alert("將完整URL取得原本的URL");
                            //alert(objBean.URL);
                            ftD.download(
                                objBean.URL
                                ,fileURL//下載檔案路徑
                                ,function (entry) {
                                    //console.log("download complete: " + entry.fullPath);
                                    //下載完成，讀取已下載的檔案
                                    //alert("下載完成，讀取已下載的檔案");
                                    WiseDT.FileIO.ReadFile(
                                        WiseDT.MySetting.ExchangePath + "WIFI/download/"
                                        , "Data_return.txt"
                                        ,
                                        function (context) {
                                            //alert("開始解析檔案");
                                            //console.log("找到檔案，檔案長度:" + context.length);
                                            //開始解析檔案
                                            //將json string to object
                                            var tmpObj = JSON.parse(context);
                                            //alert(context);
                                            Log.write(tmpObj,'WiseDT DataTransDownloadWithWIFI');
                                            if (tmpObj.Code === "200" || tmpObj.Code === 200) {
                                                //alert(WiseDT.MySetting.AesKey);
                                                //alert(WiseDT.MySetting.AesIv);
                                                //alert("tmpObj.Data: "+tmpObj.Data);
                                                Log.write(tmpObj.Data,'WiseDT tmpObj.Data');
                                                //先進行資料的AES解密
                                                WiseAES.decryptAES(
                                                    tmpObj.Data, WiseDT.MySetting.AesKey, WiseDT.MySetting.AesIv, "T",
                                                    function SFun(result) {
                                                        //console.log("解密成功");
                                                        //ZIP解壓縮=============↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓=============
                                                        WiseDT.ZIP.UnzipString(
                                                            result,
                                                            function (contentString) {

                                                                //解密後讀取ZIP裡的資料
                                                                vDownloadResult.Data = contentString; //JSON string
                                                                //↓↓↓每個檔案(不會加密&壓縮)
                                                                vDownloadResult.FileArray = [];
                                                                try {
                                                                    for (var i = 0; i < tmpObj.FileArray.length; i++) {
                                                                        var fileInfo = new DTBeans.FileBean();
                                                                        fileInfo.fileDataRel = tmpObj.FileArray[i].fileDataRel; //檔案與資料關聯KEY
                                                                        fileInfo.fileName = tmpObj.FileArray[i].fileName; //檔名
                                                                        fileInfo.fileContent = tmpObj.FileArray[i].fileContent; //base64 file
                                                                        vDownloadResult.FileArray.push(fileInfo);
                                                                    }
                                                                } catch (fileErr) {}


                                                                //刪除傳輸檔案，節省空間
                                                                WiseDT.FileIO.DeleteFile(
                                                                    WiseDT.MySetting.ExchangePath + "WIFI/download/", "Data_return.txt",
                                                                    function (msg) {}
                                                                );

                                                                vDownloadResult.Code = "200"; //成功

                                                                //處理完成出現100%
                                                                myProgressObj.loaded = 100;
                                                                ProgressCallBack(myProgressObj);

                                                                SuccessCallBack(vDownloadResult);
                                                            }
                                                        );

                                                        //ZIP解壓縮=============↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑=============
                                                    },
                                                    function FFun(result) {
                                                        //解密失敗
                                                        vDownloadResult.Code = "400";
                                                        vDownloadResult.Data = "AesError";
                                                        vDownloadResult.FileArray = [];
                                                        WiseScripts.Tool.ShowLoading(false);
                                                        ErrorCallBack(vDownloadResult);
                                                    }
                                                );
                                            } else {
                                                //伺服器回傳有誤
                                                alert("伺服器回傳有誤");
                                                vDownloadResult.Code = "500";
                                                vDownloadResult.Data = tmpObj.Data;
                                                vDownloadResult.FileArray = [];
                                                WiseScripts.Tool.ShowLoading(false);
                                                ErrorCallBack(vDownloadResult);
                                            }
                                        }
                                    );
                                }
                                ,
                                function (error) {
                                    alert("下載失敗");
                                    //console.log("download error source " + error.source);
                                    //console.log("download error target " + error.target);
                                    //console.log("upload error code" + error.code);
                                    vDownloadResult.Code = "500";
                                    vDownloadResult.Data = "DownloadError";
                                    vDownloadResult.FileArray = [];
                                    ErrorCallBack(vDownloadResult);
                                }

                            );
                        }
                    );
                }
            }
       );

        
    }
    ,
    /*
    資料傳輸上傳-USB
    */
    DataTransUploadWithUSB: function (objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack) {

        var TheWriteDay = new Date();
        var WriteDayF = parseFloat(TheWriteDay.getFullDateL17());//執行函數時間(float)
        var vDeviation = (WiseDT.MySetting.USBTimeout) * 1000;//USBTimeout時間(S)
        var vWaitCount = 0;

        var vUploadResult = new DTBeans.UploadResult();//建立回傳結果物件
        vUploadResult.Code = "100";//200:上傳成功，其他:失敗
        vUploadResult.Response = "zip error";//WEB傳回的訊息
        vUploadResult.Sent = "0";//總共上傳的資料長度
        vUploadResult.TaskName = objBean.TaskName;//任務名稱


        //自製的ProgressObj
        var myProgressObj = {};
        myProgressObj["lengthComputable"] = true;
        myProgressObj["total"] = 100;
        myProgressObj["loaded"] = 0;
        myProgressObj["processName"] = "data process";

        //先出現0%
        ProgressCallBack(myProgressObj);

        //先處理欲POST的資料(JSON→ZIP→BASE64 file→AES→BASE 64 string)
        //ZIP壓縮=============↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓=============
        WiseDT.ZIP.ZipString(objBean.Data
            , function (zipString) {
                //AES加密=============↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓=============
                WiseAES.enpryptAES(
                    zipString
                    , WiseDT.MySetting.AesKey
                    , WiseDT.MySetting.AesIv
                    , "T"
                    , function SFun(enData) {//加密後
                        objBean.Data = enData;//將原本明碼的Data改為壓縮且加密後的字串
                        var vPostURL = objBean.URL;//POST URL
                        //delete DataBean.URL;//將欲上傳的Bean裡面的URL移除

                        var vTmpBean = {};
                        $.extend(vTmpBean, objBean);//copy object
                        delete vTmpBean['Params'];//參數會以POST出去，不用再另外打包加密
                        var vWriteStr = "";//要寫入傳輸檔案的文字內容
                        //產生POST file
                        //先刪除上傳資料夾(減少空間)，再開始將資料寫到file
                        //完整PATH:[ExchangePath+/WiseAPP/+PackageName]/USB/exchange/Data.txt(伺服器回應Data_return.txt)
                        WiseDT.FileIO.DeleteDirectory(
                            WiseDT.MySetting.ExchangePath + "USB/"
                            , "exchange"
                            , function (msg) {
                                if (msg != "") {
                                    vUploadResult.Code = "400";
                                    vUploadResult.Response = msg;
                                    vUploadResult.Sent = 0;
                                    ErrorCallBack(vUploadResult);
                                } else {
                                    //建立資料夾後開始將資料寫到file
                                    WiseDT.FileIO.CreateDirectory(
                                        WiseDT.MySetting.ExchangePath + "USB/exchange/"
                                        ,
                                        function () {

                                            var vTmpParams = {};
                                            $.extend(vTmpParams, objBean.params);//copy object
                                            vTmpParams["UserID"] = WiseDT.MySetting.LoginAccount;
                                            vTmpParams["DevID"] = WiseDT.MySetting.DevID;
                                            vTmpParams["TaskName"] = objBean.TaskName.toString();
                                            // this.Params = {};//上傳參數 (UserID,DevID,TaskName這三個參數為系統使用，不能再使用這三個參數名稱)
                                            var vParamsStr = JSON.stringify(vTmpParams);//Params to string

                                            var vTmpBean = {};
                                            $.extend(vTmpBean, objBean);//copy object
                                            delete vTmpBean['Params'];//參數會以POST出去，不用再另外打包加密

                                            //要寫入TXT的格式：APP時間^PostURL^Params Json string^欲傳輸內容(如果是下載模式這個參數是空值)
                                            vWriteStr = WriteDayF.toString() + "^" + objBean.URL + "^" + vParamsStr + "^";
                                            vWriteStr += JSON.stringify(objBean);//object to string

                                            WiseDT.FileIO.WriteFile(
                                               WiseDT.MySetting.ExchangePath + "USB/exchange/"
                                               , "Data_tmp.txt"
                                               , vWriteStr
                                               ,
                                                function (msg) {
                                                    if (msg != "") {
                                                        //寫入檔案失敗
                                                        vUploadResult.Code = "400";
                                                        vUploadResult.Response = msg;
                                                        vUploadResult.Sent = 0;
                                                        ErrorCallBack(vUploadResult);
                                                    } else {
                                                        //完整成功寫入後，將變更檔案，讓service可以掃到
                                                        //WiseDT.FileIO.RenameFile()
                                                        WiseDT.FileIO.RenameFile(
                                                        WiseDT.MySetting.ExchangePath + "USB/exchange/"
                                                        , "Data_tmp.txt"
                                                        , "Data.txt", function (msg) {
                                                            if (msg != "") {
                                                                //寫入檔案失敗
                                                                vUploadResult.Code = "400";
                                                                vUploadResult.Response = msg;
                                                                vUploadResult.Sent = 0;
                                                                ErrorCallBack(vUploadResult);
                                                            } else {
                                                                myProgressObj = {};
                                                                myProgressObj["lengthComputable"] = true;
                                                                myProgressObj["total"] = 100;
                                                                myProgressObj["loaded"] = 25;

                                                                //成功寫入檔案，給25%
                                                                ProgressCallBack(myProgressObj);
                                                                //開始等待Service回寫檔案
                                                                var Wait = function () {

                                                                    try {
                                                                        //var TheDay = new Date();
                                                                        //var DeviceF = parseFloat(TheDay.getFullDateL17());
                                                                        
                                                                        //var vDif = DeviceF - WriteDayF;
                                                                        var vDif = vWaitCount*1000;
                                                                        if (vDif >= (vDeviation * (-1)) && vDif <= vDeviation) {//容許誤差在+-vDeviation內



                                                                            //開始讀取檔案
                                                                            WiseDT.FileIO.ReadFile(WiseDT.MySetting.ExchangePath + "USB/exchange/", "Data_return.txt", function (context) {
                                                                                if (context.length == 0 || context == "$ReadErr$") {
                                                                                    //等待檔案中，Loop
                                                                                    myProgressObj = {};
                                                                                    myProgressObj["lengthComputable"] = true;
                                                                                    myProgressObj["total"] = 100;
                                                                                    myProgressObj["loaded"] = 50;
                                                                                    ProgressCallBack(myProgressObj);

                                                                                    vWaitCount++;//等待次數+1
                                                                                    setTimeout(function () { Wait(); }, 1000); //1秒後執行
                                                                                } else {
                                                                                    //有資料了
                                                                                    myProgressObj = {};
                                                                                    myProgressObj["lengthComputable"] = true;
                                                                                    myProgressObj["total"] = 100;
                                                                                    myProgressObj["loaded"] = 75;
                                                                                    ProgressCallBack(myProgressObj);

                                                                                    //刪除傳輸檔案，節省空間
                                                                                    WiseDT.FileIO.DeleteFile(
                                                                                        WiseDT.MySetting.ExchangePath + "USB/exchange/"
                                                                                        , "Data.txt"
                                                                                        , function (msg) { }
                                                                                    );

                                                                                    //刪除傳輸檔案，節省空間
                                                                                    WiseDT.FileIO.DeleteFile(
                                                                                        WiseDT.MySetting.ExchangePath + "USB/exchange/"
                                                                                        , "Data_return.txt"
                                                                                        , function (msg) { }
                                                                                    );

                                                                                    //解析資料
                                                                                    var vWebResponse = $.parseJSON(context);//json to object

                                                                                    myProgressObj = {};
                                                                                    myProgressObj["lengthComputable"] = true;
                                                                                    myProgressObj["total"] = 100;
                                                                                    myProgressObj["loaded"] = 100;
                                                                                    myProgressObj["processName"] = "data process";
                                                                                    ProgressCallBack(myProgressObj);

                                                                                    if (vWebResponse.Code == "200") {

                                                                                        //伺服器回應成功
                                                                                        vUploadResult.Code = "200";
                                                                                        vUploadResult.Response = "";
                                                                                        vUploadResult.Sent = 100;
                                                                                        SuccessCallBack(vUploadResult);
                                                                                    } else {
                                                                                        //伺服器回應失敗
                                                                                        vUploadResult.Code = "501";
                                                                                        vUploadResult.Response = vWebResponse.Response;
                                                                                        vUploadResult.Sent = 0;
                                                                                        ErrorCallBack(vUploadResult);
                                                                                    }
                                                                                }
                                                                            });
                                                                        } else {
                                                                            //逾時
                                                                            vUploadResult.Code = "509";
                                                                            vUploadResult.Response = "USB timeout";
                                                                            vUploadResult.Sent = 0;
                                                                            ErrorCallBack(vUploadResult);
                                                                        }
                                                                    } catch (err) {
                                                                        setTimeout(function () { Wait(); }, 1000); //1秒後執行
                                                                    }

                                                                };
                                                                setTimeout(function () { Wait(); }, 1000); //1秒後執行
                                                            }

                                                        });
                                                       
                                                    

                                                    }
                                                }
                                           );
                                        }
                                    );

                                }
                            }
                        );


                    }
                    , function FFun(result) {
                        vUploadResult.Code = "500";
                        vUploadResult.Response = "AES encryption error";
                        vUploadResult.Sent = 0;
                        ErrorCallBack(vUploadResult);
                    }
                 );
                //AES加密=============↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑=============
            });
        //ZIP壓縮=============↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑=============
    }
    ,
    /*
    資料傳輸下載-USB
    */
    DataTransDownloadWithUSB: function (objBean, SuccessCallBack, ErrorCallBack, ProgressCallBack) {
        //開始接收資料與檔案

        var TheWriteDay = new Date();
        var WriteDayF = parseFloat(TheWriteDay.getFullDateL17());//執行函數時間(float)
        var vDeviation = (WiseDT.MySetting.USBTimeout) * 1000;//USBTimeout時間(S)
        var vWaitCount = 0;

        var vDownloadResult = new DTBeans.DownloadResult();//建立回傳結果物件
        vDownloadResult.Code = "100";//200:上傳成功，其他:失敗
        vDownloadResult.Data = "";//下載的資料(已解碼的JSON字串)
        vDownloadResult.FileArray = [];//檔案陣列
        vDownloadResult.TaskName = objBean.TaskName;//任務名稱

        //完整PATH: [ExchangePath + /WiseAPP/ + PackageName] / USB / exchange / Data.txt(伺服器回應Data_return.txt)


        //自製的ProgressObj
        var myProgressObj = {};
        myProgressObj["lengthComputable"] = true;
        myProgressObj["total"] = 100;
        myProgressObj["loaded"] = 0;
        myProgressObj["processName"] = "data process";

        //先出現0%
        ProgressCallBack(myProgressObj);

        //先刪除下載資料夾(減少空間)，再開始將資料寫到file
        WiseDT.FileIO.DeleteDirectory(
            WiseDT.MySetting.ExchangePath + "USB/"
            , "exchange"
            , function (msg) {
                if (msg != "") {
                    vDownloadResult.Code = "400";
                    vDownloadResult.Data = msg;
                    vDownloadResult.FileArray = [];
                    ErrorCallBack(vDownloadResult);
                } else {
                    //建立資料夾後開始將資料寫到file
                    WiseDT.FileIO.CreateDirectory(
                        WiseDT.MySetting.ExchangePath + "USB/exchange/"
                        ,
                        function () {

                            var vTmpParams = {};
                            //$.extend(vTmpParams, objBean.Params);//copy object
                            vTmpParams["UserID"] = WiseDT.MySetting.LoginAccount;
                            vTmpParams["DevID"] = WiseDT.MySetting.DevID;
                            vTmpParams["TaskName"] = objBean.TaskName.toString();
                            // this.Params = {};//上傳參數 (UserID,DevID,TaskName這三個參數為系統使用，不能再使用這三個參數名稱)
                            //使用者自定參數值
                            for (var p in objBean.Params) {
                                if (objBean.Params.hasOwnProperty(p) && p != "URL") {
                                    //vTmpURL += "&" + p + "=" + btoa(objBean.Params[p]);
                                    vTmpParams[p] = objBean.Params[p];
                                }
                            }

                            var vParamsStr = JSON.stringify(vTmpParams);//Params to string

                            var vWriteStr = "";//要寫入檔案的文字
                            //要寫入TXT的格式：APP時間^PostURL^Params Json string^欲傳輸內容(如果是下載模式這個參數是空值)
                            vWriteStr = WriteDayF.toString() + "^" + objBean.URL + "^" + vParamsStr + "^";

                            WiseDT.FileIO.WriteFile(
                                               WiseDT.MySetting.ExchangePath + "USB/exchange/"
                                               , "Data_tmp.txt"
                                               , vWriteStr
                                               ,
                                                function (msg) {
                                                    if (msg != "") {
                                                        //寫入檔案失敗
                                                        vDownloadResult.Code = "400";
                                                        vDownloadResult.Data = msg;
                                                        vDownloadResult.FileArray = [];
                                                        ErrorCallBack(vDownloadResult);
                                                    } else {
                                                        //完整成功寫入後，將變更檔案，讓service可以掃到
                                                        WiseDT.FileIO.RenameFile(
                                                        WiseDT.MySetting.ExchangePath + "USB/exchange/"
                                                        , "Data_tmp.txt"
                                                        , "Data.txt", function (msg) {
                                                            if (msg != "") {
                                                                //寫入檔案失敗
                                                                vDownloadResult.Code = "400";
                                                                vDownloadResult.Data = msg;
                                                                vDownloadResult.FileArray = [];
                                                                ErrorCallBack(vDownloadResult);
                                                            } else { 
                                                                //更名成功

                                                                myProgressObj = {};
                                                                myProgressObj["lengthComputable"] = true;
                                                                myProgressObj["total"] = 100;
                                                                myProgressObj["loaded"] = 25;

                                                                //成功寫入檔案，給25%
                                                                ProgressCallBack(myProgressObj);
                                                                //開始等待Service回寫檔案
                                                                var Wait = function () {

                                                                    try {
                                                                        //var TheDay = new Date();
                                                                        //var DeviceF = parseFloat(TheDay.getFullDateL17());
                                                                        
                                                                        //var vDif = DeviceF - WriteDayF;
                                                                        var vDif = vWaitCount * 1000;
                                                                        if (vDif >= (vDeviation * (-1)) && vDif <= vDeviation) {//容許誤差在+-vDeviation內
                                                                            //開始讀取檔案
                                                                            WiseDT.FileIO.ReadFile(WiseDT.MySetting.ExchangePath + "USB/exchange/", "Data_return.txt", function (context) {
                                                                                if (context.length == 0 || context == "$ReadErr$") {
                                                                                    //等待檔案中，Loop
                                                                                    myProgressObj = {};
                                                                                    myProgressObj["lengthComputable"] = true;
                                                                                    myProgressObj["total"] = 100;
                                                                                    myProgressObj["loaded"] = 50;
                                                                                    ProgressCallBack(myProgressObj);

                                                                                    vWaitCount++;//等待次數+1
                                                                                    setTimeout(function () { Wait(); }, 1000); //1秒後執行
                                                                                } else {
                                                                                    //有資料了
                                                                                    myProgressObj = {};
                                                                                    myProgressObj["lengthComputable"] = true;
                                                                                    myProgressObj["total"] = 100;
                                                                                    myProgressObj["loaded"] = 75;
                                                                                    ProgressCallBack(myProgressObj);

                                                                                    //刪除傳輸檔案，節省空間
                                                                                    WiseDT.FileIO.DeleteFile(
                                                                                        WiseDT.MySetting.ExchangePath + "USB/exchange/"
                                                                                        , "Data.txt"
                                                                                        , function (msg) { }
                                                                                    );

                                                                                    //刪除傳輸檔案，節省空間
                                                                                    WiseDT.FileIO.DeleteFile(
                                                                                        WiseDT.MySetting.ExchangePath + "USB/exchange/"
                                                                                        , "Data_return.txt"
                                                                                        , function (msg) { }
                                                                                    );

                                                                                    //解析資料
                                                                                    var vWebResponse = $.parseJSON(context);//json to object

                                                                                    myProgressObj = {};
                                                                                    myProgressObj["lengthComputable"] = true;
                                                                                    myProgressObj["total"] = 100;
                                                                                    myProgressObj["loaded"] = 100;
                                                                                    myProgressObj["processName"] = "data process";
                                                                                    ProgressCallBack(myProgressObj);

                                                                                    if (vWebResponse.Code == "200") {
                                                                                        Log.write("download USB:200");
                                                                                        //伺服器回應成功
                                                                                        //先進行資料的AES解密
                                                                                        WiseAES.decryptAES(
                                                                                                vWebResponse.Data
                                                                                                , WiseDT.MySetting.AesKey
                                                                                                , WiseDT.MySetting.AesIv
                                                                                                , "T"
                                                                                                , function SFun(result) {
                                                                                                    Log.write("download USB: AES pass");
                                                                                                    //console.log("解密成功");
                                                                                                    //ZIP解壓縮=============↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓=============
                                                                                                    WiseDT.ZIP.UnzipString(
                                                                                                        result
                                                                                                        , function (contentString) {
                                                                                                            Log.write("download USB: unZip pass");
                                                                                                            //解密後讀取ZIP裡的資料
                                                                                                            vDownloadResult.Data = contentString;//JSON string
                                                                                                            //↓↓↓每個檔案(不會加密&壓縮)
                                                                                                            vDownloadResult.FileArray = [];
                                                                                                            try {
                                                                                                                for (var i = 0; i < vWebResponse.FileArray.length; i++) {
                                                                                                                    var fileInfo = new DTBeans.FileBean();
                                                                                                                    fileInfo.fileDataRel = vWebResponse.FileArray[i].fileDataRel;//檔案與資料關聯KEY
                                                                                                                    fileInfo.fileName = vWebResponse.FileArray[i].fileName;//檔名
                                                                                                                    fileInfo.fileContent = vWebResponse.FileArray[i].fileContent;//base64 file
                                                                                                                    vDownloadResult.FileArray.push(fileInfo);
                                                                                                                }
                                                                                                            } catch (fileErr) {
                                                                                                            }


                                                                                                            //刪除傳輸檔案，節省空間
                                                                                                            WiseDT.FileIO.DeleteFile(
                                                                                                                WiseDT.MySetting.ExchangePath + "USB/exchange/"
                                                                                                                , "Data_return.txt"
                                                                                                                , function (msg) {
                                                                                                                }
                                                                                                            );

                                                                                                            vDownloadResult.Code = "200";//成功

                                                                                                            //處理完成出現100%
                                                                                                            myProgressObj.loaded = 100;
                                                                                                            ProgressCallBack(myProgressObj);

                                                                                                            SuccessCallBack(vDownloadResult);
                                                                                                        }
                                                                                                    );

                                                                                                    //ZIP解壓縮=============↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑=============
                                                                                                }
                                                                                                    , function FFun(result) {
                                                                                                        //解密失敗
                                                                                                        vDownloadResult.Code = "400";
                                                                                                        vDownloadResult.Data = "AesError";
                                                                                                        vDownloadResult.FileArray = [];
                                                                                                        ErrorCallBack(vDownloadResult);
                                                                                                    }
                                                                                          );
                                                                                    } else {
                                                                                        //伺服器回應失敗
                                                                                        vDownloadResult.Code = "500";
                                                                                        vDownloadResult.Data = vWebResponse.Data;
                                                                                        vDownloadResult.FileArray = [];
                                                                                        ErrorCallBack(vDownloadResult);
                                                                                        
                                                                                    }
                                                                                }
                                                                            });
                                                                        } else {
                                                                            //逾時
                                                                            vUploadResult.Code = "509";
                                                                            vUploadResult.Response = "USB timeout";
                                                                            vUploadResult.Sent = 0;
                                                                            ErrorCallBack(vUploadResult);
                                                                        }
                                                                    } catch (err) {
                                                                        setTimeout(function () { Wait(); }, 1000); //1秒後執行
                                                                    }

                                                                };
                                                                setTimeout(function () { Wait(); }, 1000); //1秒後執行
                                                            }
                                                        });
                                                    }
                                                }
                            );

                        }//CreateDirectory
                    );
                }
            }
       );


    }
    ,
    /*顯示處理進度*/
    transferProgress: function (progressEvent) {
    if (progressEvent.lengthComputable) {
        var vP = progressEvent.loaded / progressEvent.total;
        vP = Math.floor(vP * 100);//只取整數

        //if (progressEvent.hasOwnProperty("processName")) {//只有在「資料處理」的0%、與100%會進到這
        //    if (vP == 0) {
        //        WiseScripts.Tool.ShowLoading(false);//100%
        //        WiseScripts.Tool.ShowLoading(true, "傳輸資料中(0%)");
        //    } else if (vP == 100) {
        //        WiseScripts.Tool.ShowLoading(false);//100%
        //    }
        //} else {
        //    if (vP > 0 && vP < 100) {
        //        WiseScripts.Tool.ShowLoading(false);//100%
        //        WiseScripts.Tool.ShowLoading(true, "傳輸資料中(" + vP + "%)");
        //    }
        //}

        console.log("檔案處理中:" + vP + " %");
           
    }
}
    ,
    FileIO:
    {
        /*
        產生資料夾 EX:file:///sdcard/mHealthTemp/
        WiseDT.FileIO.CreateDirectory(vPath, function () {});
        */
        CreateDirectory: function (DirPath, gCallback) {
            var vPathArray = DirPath.split('/');
            var iIndex = 4;
            if (vPathArray.length > 4) {
                //從「file:///sdcard/」開始算

                var createDir = function (rootDir, DirName, callback) {
                    if (iIndex < vPathArray.length) {
                        window.resolveLocalFileSystemURL(rootDir, function (fileEntry) {

                            fileEntry.getDirectory(DirName, { create: true },
                                function (dirE) {
                                    //資料夾創建成功
                                    iIndex++;
                                    createDir(rootDir + "/" + DirName + "/", vPathArray[iIndex], callback);
                                })
                        });
                    } else {
                        callback();
                    }
                };

                createDir("file:///sdcard/", vPathArray[iIndex], gCallback);

            }
            //alert(vPathArray.length);
        }
            ,
        /*
        刪除資料夾 
        WiseDT.FileIO.DeleteDirectory("file:///sdcard/", "mHealthTemp", function (msg) {});
        回傳：
        成功→空字串
        失敗→錯誤訊息
        */
        DeleteDirectory: function (rootDir, DirName, callback) {
            // alert("DeleteDirectory");
            try {
                window.resolveLocalFileSystemURL(rootDir, function (fileEntry) {

                    fileEntry.getDirectory(DirName, { create: true, exclusive: false },
                        function (dirE) {
                            dirE.removeRecursively(
                                function () {
                                    Log.write("Remove " + DirName + " Succeeded");
                                    callback("");
                                },
                                function (evt) {
                                    Log.write("FILE SYSTEM FAILURE" + evt.target.error.code);
                                    callback("FILE SYSTEM FAILURE" + evt.target.error.code);
                                }
                            );
                        });
                });
            } catch (err) {
                alert("FILE SYSTEM FAILURE"+err);
                callback("FILE SYSTEM FAILURE");
            }

        }
            ,
        /*
        刪除檔案 
        WiseDT.FileIO.DeleteFile("file:///sdcard/", "Data.txt", function (msg) {});
        回傳：
        成功→空字串
        失敗→錯誤訊息
        */
        DeleteFile: function (rootDir, FileName, callback) {
            try {
                window.resolveLocalFileSystemURL(rootDir, function (dir) {
                    dir.getFile(
                        FileName
                        ,
                        { create: false, exclusive: false }
                        ,
                        function (fEntry) {
                            fEntry.remove(function () {
                                // The file has been removed succesfully
                                callback("");
                            }, function (error) {
                                // Error deleting the file
                                Log.write("Error deleting the file");
                                callback("Error deleting the file");
                                
                            }, function () {
                                // The file doesn't exist
                                callback("");
                            });
                        }
                        , function () {
                            // The file doesn't exist
                            callback("");
                        }
                    );
                });
            } catch (err) {
                Log.write("Error deleting the file");
                callback("Error deleting the file");
            }

        }
            ,
        /*
        檔案更名
        WiseDT.FileIO.RenameFile("file:///sdcard/", "Data.txt", "Data2.txt", function (msg) {});
        回傳：
        成功→空字串
        失敗→錯誤訊息
        */
        RenameFile: function (rootDir, CurrentFileName, NewFileName, callback) {
            try {
                window.resolveLocalFileSystemURL(
                    rootDir
                    ,
                    function (dir) {
                        dir.getFile(
                            CurrentFileName
                            ,
                            { create: false, exclusive: false }
                            ,
                            function (fEntry) {
                                window.resolveLocalFileSystemURL(
                                    rootDir
                                    ,
                                    function (dirTo) {
                                        fEntry.moveTo(
                                            dirTo
                                            , NewFileName
                                            , function () {
                                                Log.write("重新命名成功");
                                                callback("");
                                            }
                                            ,
                                             function () {
                                                 Log.write("重新命名失敗");
                                                 callback("RenameError");
                                             }
                                        );
                                    }
                                );

                            }
                        );
                    }
                );
            } catch (err) {
                Log.write("重新命名失敗");
                callback("RenameError");
            }

        }
            ,
        /*
        寫入資料至檔案
        WiseDT.FileIO.WriteFile(vPath, vFileName, inputString, function (msg) {});
        回傳：
        成功→空字串
        失敗→錯誤訊息
        */
        WriteFile: function (DirPath, vFileName, inputString, callback) {
            //開始產生有資料的檔案
            window.resolveLocalFileSystemURL(DirPath, function (dir) {
                dir.getFile(vFileName, { create: true }, function (file) {
                    var vFileObj = file;
                    if (!vFileObj) { callback("無法寫入"); };

                    //開始寫入
                    vFileObj.createWriter(function (fileWriter) {

                        //先定義修改資料後要做的事件
                        fileWriter.onwriteend = function (evt) {
                            fileWriter.seek(0);//將寫入的游標移到index 0
                            //改掉原本修改資料後要做的事件
                            fileWriter.onwriteend = function (evt) {

                                callback("");//寫入完成
                            };
                            fileWriter.write(inputString);//寫入資料
                        };
                        fileWriter.truncate(0);//將原本的資料先清空


                    }, function (e) {
                        Log.write("無法寫入:" + e);
                        callback("無法寫入:" + e);//寫入失敗
                    });
                });
            });
        }
            ,
        /*
        讀取文字檔案
        WiseDT.FileIO.ReadFile(vPath, vFileName, function (content) {});
        回傳：
        成功→文字內容
        失敗→回傳「$ReadErr$」
        */
        ReadFile: function (DirPath, vFileName, callback) {
            //開始產生有資料的檔案
            try {
                WiseDT.FileIO.FileExist(DirPath, vFileName, function (IsExist) {
                    if (IsExist) {
                        window.resolveLocalFileSystemURL(
                    DirPath
                    ,
                    function (dir) {
                        dir.getFile(
                            vFileName
                            , { create: false }
                            , function (file) {
                                var vFileObj = file;
                                if (!vFileObj) { callback(""); } else {
                                    //開始讀取
                                    vFileObj.file(
                                        function (fileRead) {
                                            try {
                                                var reader = new FileReader();

                                                reader.onloadend = function (e) {
                                                    callback(this.result.toString());
                                                };
                                                reader.readAsText(fileRead);
                                            } catch (InReadErr) {
                                                callback("$ReadErr$");//讀取失敗回傳空字串
                                            }

                                        }
                                        ,
                                        function (e) {
                                            callback("$ReadErr$");//讀取失敗回傳空字串
                                            Log.write("無法讀取:" + e);
                                        }
                                    );
                                }
                            }
                        );
                    }
                );
                    } else {
                        callback("");
                    }
                });

                
            } catch (err) {
                callback("$ReadErr$");//讀取失敗回傳空字串
            }
        }
        ,
        /*
        確認檔案是否存在
        WiseDT.FileIO.FileExist(vPath, vFileName, function (IsExist) {});
        WiseDT.FileIO.FileExist(vPath, vFileName, function (IsExist) {},3*1024*1024);//需要再驗證檔案大小(byte)
        回傳：
        檔案存在→true
        檔案不存在→false
        */
        FileExist: function (DirPath, vFileName, callback,checkFileSize) {
            try {
                window.resolveLocalFileSystemURL(
                    DirPath
                    ,
                    function (dir) {
                        dir.getFile(
                            vFileName
                            , { create: false, exclusive: false }
                            , function (file) {
                                if (checkFileSize !== undefined) {
                                    //需要再驗證檔案大小
                                    file.getMetadata(
                                        function (metadata) {
                                            var vFileSize = metadata.size; // get file size
                                            if (vFileSize < checkFileSize) {//檔案太小，有問題，刪掉
                                                file.remove(function () {
                                                    // The file has been removed succesfully
                                                    callback(false);
                                                }, function (error) {
                                                    // Error deleting the file
                                                    callback(false);

                                                }, function () {
                                                    // The file doesn't exist
                                                    callback(false);
                                                });
                                            } else {
                                                callback(true);//驗證成功，PASS
                                            }

                                        },
                                        function (error) { }
                                    );
                                } else {
                                    callback(true);//檔案存在
                                }
                            },
                            function () {
                                callback(false);//檔案不存在
                            }
                        );
                    }
                );
            } catch (err) {
                callback(false);//讀取失敗回傳空字串
            }
        }
        ,
        /*
        base64 string to Blob
        */
        B64toBlob: function (b64Data, contentType, sliceSize,callback) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, { type: contentType });
            //return blob;
            callback(blob);
        }
        ,
        /*
        將Blob物件另存成檔案
        */
        SaveBlobAsFile: function (folderpath, filename,BlobObj,callback)
        {
            window.resolveLocalFileSystemURL(folderpath, function (dir) {
                //console.log("Access to the directory granted succesfully");
                dir.getFile(filename, { create: true }, function (file) {
                    //console.log("File created succesfully.");
                    file.createWriter(function (fileWriter) {
                        //console.log("Writing content to file");
                        fileWriter.write(BlobObj);
                        callback("");
                    }, function () {
                        alert('Unable to save file in path ' + folderpath);
                        callback("Save As File Error");
                    });
                });
            });
        }
    }
    ,
    ZIP:
    {
        /*
        壓縮，將文字壓縮成ZIP base64 file 
        回傳：壓縮後的base64 file string
        使用方式：
        WiseDT.ZIP.ZipString(
        "data"//欲壓縮的文字
        ,
        function(zipString){}//執行完成後要呼叫的函數
        );
        */
        ZipString: function (inputString, callback) {
            var zip = new JSZip();
            zip.file("Data.txt", inputString);
            var content = zip.generate({
                type: "base64"
                , compression: "DEFLATE"
                , compressionOptions: { level: 6 } //壓縮率 between 1 (best speed) and 9 (best compression)
            });
            callback(content);
        }
        ,
        /*
        解壓縮，將ZIP base64 file解壓縮取出文字
        回傳：解壓縮後，壓縮檔內的Data.txt文字內容
        使用方式：
        WiseDT.ZIP.UnzipString(
        "base64FileString"//已被壓縮的base64 file string
        ,
        function(contentString){}//執行完成後要呼叫的函數
        );
        */
        UnzipString: function (base64FileString, callback) {
            var new_zip = new JSZip();
            new_zip.load(base64FileString, { base64: true });
            var vRtn = new_zip.file("Data.txt").asText();
            callback(vRtn);
        }
    }
}

/*================以下放private的函數============================*/
var WiseDT_Private = WiseDT_Private || {}, WiseDT_Private = {
    /*
    驗証USB是否連線(檔案資料夾路徑,檔案名稱,連接成功,連接失敗)
    */
    USBConnectCheck: function (checkDir, checkFileName, connectFn, removeFn) {

       
        //    //先改名
        //WiseDT.FileIO.RenameFile(checkDir, checkFileName, "usb_del.txt", function (msg) {
        //    //if (msg == "") {
        //    //    WiseDT.FileIO.ReadFile(checkDir, "usb_del.txt", function (context) {
        //    //        if (context.length == 0 || context == "$ReadErr$") {
        //    //            removeFn();
        //    //        } else {
        //    //            try {
        //    //                var TheDay = new Date();
        //    //                var DeviceF = parseFloat(TheDay.getFullDateL17());
        //    //                var ContextF = parseFloat(context);
        //    //                var vDeviation = 10 * 60 * 1000;//容許誤差秒數-10分鐘
        //    //                var vDif = DeviceF - ContextF;
        //    //                if (vDif >= (vDeviation * (-1)) && vDif <= vDeviation) {//容許誤差在+-vDeviation內
        //    //                    connectFn();
        //    //                } else {
        //    //                    removeFn();
        //    //                }
        //    //            } catch (err) {
        //    //                removeFn();
        //    //            }
        //    //            finally {
        //    //                //最後，再刪除檔案
        //    //                WiseDT.FileIO.DeleteFile(checkDir, "usb_del.txt", function (msg) { });
        //    //            }

        //    //        }
        //    //    });
        //    //} else {
        //    //    removeFn();
        //    //}
        //});
       
        WiseDT.FileIO.ReadFile(checkDir, checkFileName, function (context) {
            if (context.length == 0 || context == "$ReadErr$") {
                removeFn();
            } else {
                try {
                    var TheDay = new Date();
                    var DeviceF = parseFloat(TheDay.getFullDateL17());
                    var ContextF = parseFloat(context);
                    var vDeviation = 1 * 60 * 1000;//容許誤差秒數-1分鐘
                    var vDif = DeviceF - ContextF;
                    if (vDif >= (vDeviation * (-1)) && vDif <= vDeviation) {//容許誤差在+-vDeviation內
                        connectFn();
                    } else {
                        removeFn();
                    }
                } catch (err) {
                    removeFn();
                }
                finally {
                    //先改名
                    //WiseDT.FileIO.RenameFile(checkDir, checkFileName, "usb_del.txt", function (msg) {
                    //    if (msg == "") {
                    //        //最後，再刪除檔案
                    //        WiseDT.FileIO.DeleteFile(checkDir, "usb_del.txt", function (msg) { });
                    //    }
                    //});
                }

           }
        });
    }
}