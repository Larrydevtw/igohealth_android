//藍牙模組使用函數
//DAOFn、藍牙相關套件，需在此之前就引用。
var FnBT = {
  ScandDevices: [], //儲存已掃過的設備
  NonDevices: [], //儲存未在配對模式中的設備
  // IsAutoConnect: true,//是否為自動連線模式(智能連線)
  AppMode: "People", //App模式: Care:照護模式  People:民眾模式 Scan: 掃碼量測模式
  OnlyOneData: true, //接收模式是否為單筆
  bluetoothStatus: "N", //目前藍牙狀態
  isOpenBTMode: "N", //是否開啟藍牙模式選擇功能
  DeviceInfo: function (successFn, errFn) {
    var strSQL = "delete from DevicesInfo";
    try {
      DAOFn.Query("", strSQL, function ResultFun(qResult) {
        var InsertArray = [
          {
            //聿新易立測/中山瑞福(大陸)血糖/尿酸/膽固醇三合一
            DeviceReceiveItem: "BG,UA,CHOL",
            DeviceModel: "ETB04",
            DeviceName: "易立測三高機",
            DeviceBrand: "Bioptik",
          },
          {
            //泰博體溫(TAIDOC TD1261)
            DeviceReceiveItem: "BT",
            DeviceModel: "FORA IR20",
            DeviceName: "FORA 耳溫槍",
            DeviceBrand: "FORA",
          },
          {
            //泰博體溫(TAIDOC TD1261)
            DeviceReceiveItem: "BT",
            DeviceModel: "FORA IR21",
            DeviceName: "FORA 耳溫槍",
            DeviceBrand: "FORA",
          },
          {
            //泰博體溫
            DeviceReceiveItem: "BT",
            DeviceModel: "TAIDOC TD1261",
            DeviceName: "FORA 耳溫槍",
            DeviceBrand: "FORA",
          },
        ];

        DAOFn.MutiInsertData(
          "",
          "DevicesInfo",
          InsertArray,
          function ResultFun(result) {
            //回傳值：成功→空字串、失敗→錯誤訊息；若IsUpdate設為F為不執行Update並會回傳「NoUpdate」字串
            if (result == "") {
              if (successFn) {
                successFn();
              }
            } else {
              //失敗
              if (errFn) {
                errFn();
              }
            }
          }
        );
      });
    } catch (e) {
      alert(e);
    }
  },
  DeviceToName: function (DeviceModel) {
    return new Promise(function (resolve, reject) {
      var deviceName = "量測設備";
      var strSql =
        "Select DeviceName From DevicesInfo Where DeviceModel='" +
        DeviceModel +
        "';";
      DAOFn.Query("", strSql, function (result) {
        var objList = $.parseJSON(result);
        if (objList.length == 0) {
          Log.write("無資料");
        } else if (objList.length == 1 && objList[0].hasOwnProperty("Err")) {
          Log.write("查詢錯誤");
        } else {
          Log.write("有資料");
          deviceName = objList[0].DeviceName;
        }
        Log.write(deviceName);
        resolve(deviceName);
      });
    });
  },
  GetDeviceType: function (Data) {
    //回傳設備量測類型
    return new Promise(function (resolve, reject) {
      var DeviceModel = Data[0];
      var DeviceReceiveItem = "";
      var strSql =
        "Select DeviceReceiveItem From DevicesInfo Where DeviceModel='" +
        DeviceModel +
        "'";
      DAOFn.Query("", strSql, function (result) {
        var objList = $.parseJSON(result);
        if (objList.length == 0) {
          Log.write("無資料");
        } else if (objList.length == 1 && objList[0].hasOwnProperty("Err")) {
          Log.write("查詢錯誤");
        } else {
          Log.write("有資料");
          if (DeviceModel == "ETB04") {
            switch (Data.length) {
              case 6:
                switch (Data[5]) {
                  case "G":
                    DeviceReceiveItem = "BG";
                    break;
                  case "C":
                    DeviceReceiveItem = "CHOL";
                    break;
                  case "U":
                    DeviceReceiveItem = "UA";
                    break;
                  case "Err":
                    Log.write(
                      "Data.length: " + Data.length + ", Data" + Data,
                      "ETB04 Data err"
                    );
                    DeviceReceiveItem = "Err";
                    break;
                }
                break;
              case 8:
                DeviceReceiveItem = "BP";
                break;
              default:
                Log.write(
                  "Data.length: " + Data.length + ", Data" + Data,
                  "ETB04 Data err"
                );
                DeviceReceiveItem = "Err";
                break;
            }
          } else if (
            DeviceModel == "FORA D40" ||
            DeviceModel == "UniTai TD3261"
          ) {
            if (Data.length == 6) {
              DeviceReceiveItem = "BP";
            } else if (Data.length == 4 || Data.length == 5) {
              DeviceReceiveItem = "BG";
            }
          } else {
            DeviceReceiveItem = objList[0].DeviceReceiveItem;
          }

          resolve(DeviceReceiveItem);
        }
      });
    });
  },
  iniBT: function (successFn, errFn) {
    //初始化藍牙
    Log.alert("初始化藍牙", "FnBT iniBT");
    try {
      //設定藍牙操作時所需使用到的變數
      FnBT.ScandDevices = []; //把已掃過的設備清空
      localStorage["BTScanConfirm"] = "N"; //設定目前 是否正在詢問連線至設備的對話框
      localStorage["BTScanActive"] = "N"; //設定目前是開啟掃描功能
      localStorage["BTConnect"] = "N"; //設定目前藍牙是否正在連線中；Connect後設為Y，斷線後設為N
      //localStorage["isOnlyOneData"]=isOnlyOneData;//單筆模式 //TODO

      //設定各種CallBack(類似委派)
      BTSetting.initCallBackFn = FnBT.initBTSuccess; //搜尋設備時會呼叫的函數

      BTSetting.ResultCallBackFn = FnBT.DataReceiving; //接收量測時會呼叫的函數
      BTSetting.ScanCallBackFn = FnBT.ScanCallBack; //搜尋設備時會呼叫的函數
      BTSetting.ConnectCallBackFn = FnBT.ConnectCallBack; //連接設備時會呼叫的函數
      BTSetting.ErrorCallBackFn = FnBT.ErrorCallBack; //發生錯誤時會呼叫的函數
      BTSetting.GetMultiDataCallBackFn = FnBT.GetMultiDataCallBack; //接收回傳多筆量測資料時會呼叫的函數
      //BTSetting.GetStorageNumberOfDataCallBackFn = GetStorageNumberOfDataCallBack; //接收回傳多筆量測資料總筆數時會呼叫的函數

      //設定各種參數開關
      BTSetting.FilterHistoryData = true;
      BTSetting.AutoConnect = true;
      BTSetting.ForcePair = false;

      //專屬於歐瑟若體脂機的3個數據,在此app中是暫時給一組固定值, //TODO
      //未來在真實應用的app中則須要有介面讓user把這3個數據設定進來
      // BTSetting.UserAge = 30;
      // BTSetting.UserGender = 0;
      // BTSetting.UserHeight = 160.0;

      BTSetting.ClearData = true; //量測完畢，刪除設備資料

      //Pooling 單一藍牙設備模式
      BTSetting.SingleDevicePoolingMode = false; //false -> 正常的scan模式, true -> pooling 單一藍牙設備模式

      var OS = DeviceInfo.GetOS();

      //在單一模式下要被Pooling 的藍牙設備位址
      if (OS === "android") {
        //android 格式
        BTSetting.SingleDevicePoolingAddress = "C0:26:DF:00:AC:1E";
        //TAIDOC TD4286 泰博血糖 address
        //BTSetting.SingleDevicePoolingAddress = "C0:26:DF:00:89:2C";
        ////FORA IR21 泰博體溫 address
      } else {
        //ios 格式,ios很嚴謹,如果格式不對則無法 connect !
        BTSetting.SingleDevicePoolingAddress =
          "F2F89531-F6EC-D97B-B5C5-5AC4981E1424";
        //TAIDOC TD4286 泰博血糖 address
        //BTSetting.SingleDevicePoolingAddress = "5A5FD1C2-B91D-EA87-F699-5704BDD7760B";
        ////FORA IR21 泰博體溫 address
      }

      //量測資料回傳模式: true -> 只回傳最新一筆 / false -> 回傳多筆
      BTSetting.OnlyLastestData = FnBT.OnlyOneData;

      FnBT.GetBTMode(function (BTMode) {
        //判斷使用者目前是設定配對模式還是智能掃描模式
        Log.write("BTMode:" + BTMode, "FnBT iniBT");
        if (BTMode == "Y") {
          BTSetting.AutoConnect = true;
          BTSetting.ForcePair = true;
        }
      });
      Log.alert("MSCordovaBLE.InitSetting");
      //Scan確定間隔，如果超過時間就重啟模組(0:代表不檢查)
      MSCordovaBLE.checkBLE = 10000;
      //最大連線數
      MSCordovaBLE.MaxConnCnt = 6;
      //設定初始化
      MSCordovaBLE.InitSetting();

      //藍牙初始化
      setTimeout(function () {
        if (MSCordovaBLE.MySetting.SingleDevicePoolingMode == false) {
          MSCordovaBLE.btInitialize(); //false -> 正常的 scan 模式
        } else {
          SingleDevicePooling.btInitialize(); //true -> pooling 單一藍牙設備模式
        }
      }, 100);

      if (successFn) {
        successFn();
      }

      // FnBT.OpenBT(function () {
      //     if (successFn) {
      //         successFn();
      //     }
      // });
    } catch (err) {
      Log.alert("BT" + err);
      FnBT.switchBTStatus("N");
      if (errFn) {
        errfn();
      }
    }
  },
  initBTSuccess: function () {
    var BT_Init_OK = MSCordovaBLE.BT_Init_OK;

    Log.write("initBTSuccess:" + BT_Init_OK, "FnBT");

    if (!BT_Init_OK) {
      FnBT.switchBTStatus("N");
      return;
    }

    FnBT.switchBTStatus("Y");

    //藍牙狀態套件初始化 (BluetoothStatus) 抓取手機目前藍牙狀態(開啟或關閉)
    cordova.plugins.BluetoothStatus.initPlugin();

    //註冊藍牙監聽事件
    window.addEventListener("BluetoothStatus.enabled", function () {
      FnBT.switchBTStatus("Y");
      Log.write("藍牙已開啟", "藍牙監聽事件");
      Log.alert("藍牙已開啟", "藍牙監聽事件");

      FnBT.StartScan("Y");

      BandMate.init();
    });

    //當藍牙關閉時，要做什麼？
    window.addEventListener("BluetoothStatus.disabled", function () {
      FnBT.switchBTStatus("N");
      BandMate.disConn();
      Log.write("藍牙已關閉", "藍牙監聽事件");
      Log.alert("藍牙已關閉", "藍牙監聽事件");
      localStorage.setItem("BT_Enable", "N");
    });
  },
  SetBTMode: function (successFn) {
    var BTMode = AppConfig.BTPairMode;
    ProjectFn.setSysParams("mSys", "BTMode", BTMode, function (msg) {
      Log.write(
        msg + "FnBTMode:" + BTMode + "，儲存設定至SQLLite中",
        "FnBTPair SwitchBTMode"
      );
    });
    if (BTMode === "Y") {
      $("#divBTPairSwitch").hide();
    } else {
      $("#divBTPairSwitch").show();
    }

    if (successFn) {
      successFn();
    }
  },
  OpenBT: function (successFn, errFn) {
    //開啟藍牙掃描功能 //TODO 開關藍牙
    Log.write("藍牙已關閉");
    //sessionStorage["BTenabled"] = "0";
    // if (BTWinHasOpen) //todo 目前不知道功用為何
    //     return;
    //BTWinHasOpen = true;
    var OS = WiseScripts.Tool.MobileType.IsAndroid() ? "android" : "iOS";
    if (OS === "android") {
      //android 格式

      cordova.plugins.BluetoothStatus.enableBT(); //開啟藍牙(Android Only)
      if (successFn) {
        successFn();
      }
      // ExitAPP.disableBT(function(){ //TODO Cordova6.5.0可能不支援此寫法
      //     //alert("藍牙關閉成功");

      //     setTimeout(function () {
      //         cordova.plugins.BluetoothStatus.enableBT();//開啟藍牙(Android Only)
      //         //alert("藍牙開啟成功");
      //     }, 2000);

      //     if(successFn){
      //         successFn();
      //     }
      // }, function(){
      //     alert("藍牙關閉失敗");
      //     if(errFn){
      //         errFn();
      //     }
      // });
    } else {
      //ios 格式,ios很嚴謹,如果格式不對則無法 connect !
      //TODO
      // if (AppConfig.askBTTimes < 1) {
      //     AppConfig.askBTTimes = 1;
      // }
      if (successFn) {
        successFn();
      }
      // navigator.notification.confirm(
      //     '目前藍牙未開啟，請開啟藍牙。',
      //     function (button) {
      //         //alert(button);
      //         //BTWinHasOpen = false;
      //         if (button == 1) {
      //             if (typeof cordova.plugins.settings.openSetting != undefined) {
      //                 if (WiseScripts.Tool.MobileType.IsAndroid()) {
      //                     ble.showBluetoothSettings();
      //                 }
      //                 else {
      //                     //alert("IOS設定畫面");
      //                     cordova.plugins.settings.open();
      //                 }
      //             }
      //         }
      //         if (successFn) {
      //             successFn();
      //         }
      //     },
      //     $.i18n('系統訊息'), '設定,取消');
    }
  },
  StartScan: function (isStartScan, isClearBTResult, ScanOpen) {
    //isStartScan:Y/N, isClearBTResult:Y/N,ScanOpen:Y/N

    var BT_Init_OK = MSCordovaBLE.BT_Init_OK;
    Log.write("BT_Init_OK:" + BT_Init_OK, "FnBT StartScan");

    if (!BT_Init_OK) {
      Log.write("BT_Init false. Return Scan", "FnBT StartScan");
      return;
    }

    //alert("start Scan:"+isStartScan);
    MSCordovaBLE.MySetting.ScanCallBackFn = FnBT.ScanCallBack;
    FnBT.ScandDevices = []; //把已掃過的設備清空
    FnBT.NonDevices = []; //把未在配對清單中的設備清空

    Log.write(
      "isStartScan:" + isStartScan + ",ScanOpen:" + ScanOpen,
      "FnBT StartScan"
    );

    var txtBTMode = "";
    var txtBTStatus = "";

    ProjectFn.getSysParams("mSys", "BTMode", function (BTMode) {
      Log.write("BTMode:" + BTMode, "FnBT BTMode");
      if (BTMode == "Y") {
        // MSCordovaBLE.MySetting.ClearData = true;    //會刪資料
        MSCordovaBLE.MySetting.AutoConnect = true;
        MSCordovaBLE.MySetting.ForcePair = true;
        txtBTMode =
          "模式:配對模式<span style='font-size:80%;'>(配對成功設備會自動傳輸量測資料)</span>";
        txtBTStatus = $.i18n("開始掃描周圍設備($1)", $.i18n("配對模式"));
      } else {
        // MSCordovaBLE.MySetting.ClearData = true;
        MSCordovaBLE.MySetting.AutoConnect = true;
        MSCordovaBLE.MySetting.ForcePair = false;
        txtBTMode =
          "模式:智能連線模式<span style='font-size:80%;'>(不需配對設備，會自動接收可接收設備量測資料。)</span>";
        txtBTStatus = $.i18n("開始掃描周圍設備($1)", $.i18n("智能連線模式"));
      }
      //TODO
      // window.plugins.toast.showWithOptions({
      //     message: txtBTStatus,
      //     duration: "long", // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
      //     position: "bottom",
      //     addPixelsY: -40 // added a negative value to move it up a bit (default 0)
      // });

      if (FnBT.AppMode == "Care") {
        Log.write(FnBT.AppMode, "FnBT AppMode");

        var divBTMode = document.getElementById("divBTMode");
        var divBTStatus = document.getElementById("divBTStatus");
        var divBTResult = document.getElementById("divBTResult");

        if (!isClearBTResult || isClearBTResult == "Y") {
          divBTResult.innerHTML = ""; //TODO 進畫面後直接將舊有查詢結果清除
        }

        divBTMode.innerHTML = txtBTMode;
        divBTStatus.innerHTML = "";

        if (ScanOpen == "Y") {
          //20180424新增ScanOpen 配對模式再量測頁中不關閉藍牙
          divBTStatus.style.display = "block";
          divBTStatus.innerHTML = txtBTStatus + "</br>";
        } else {
          if (isStartScan == "Y") {
            divBTStatus.style.display = "block";
            divBTStatus.innerHTML = txtBTStatus + "</br>";
          } else {
            divBTStatus.style.display = "none";
          }
        }
      }

      if (ScanOpen == "Y") {
        //20180424新增ScanOpen 配對模式再量測頁中不關閉藍牙
        Log.write(
          "ScanOpen:" + ScanOpen,
          "FnBT StartScan 配對模式再量測頁中不關閉藍牙"
        );

        localStorage["BTScanActive"] = "Y"; //開啟掃功能
        localStorage["BTScanConfirm"] = "N"; //設定目前 是否正在詢問連線至設備的對話框
        localStorage["BTConnect"] = "N";
      } else {
        if (isStartScan == "Y") {
          localStorage["BTScanConfirm"] = "N"; //設定目前 是否正在詢問連線至設備的對話框
          localStorage["BTScanActive"] = "Y"; //開啟掃描功能
          localStorage["BTConnect"] = "N";

          var os = window.cordova.platformId;
          Log.alert(
            "os:" +
              os +
              "\ncordova.plugins.BluetoothStatus.BTenabled:" +
              cordova.plugins.BluetoothStatus.BTenabled +
              "\ncordova.plugins.BluetoothStatus.hasBTLE" +
              cordova.plugins.BluetoothStatus.hasBTLE +
              "\ncordova.plugins.BluetoothStatus.hasBT" +
              cordova.plugins.BluetoothStatus.hasBT
          );
          FnBT.bluetoothStatus = cordova.plugins.BluetoothStatus.BTenabled;
          if (os === "android") {
            //android 格式
            // alert("android");
            if (!cordova.plugins.BluetoothStatus.BTenabled) {
              cordova.plugins.BluetoothStatus.enableBT(); //開啟藍牙(Android Only)
            }
            MSCordovaBLE.startScan();
            FnBT.switchBTStatus("Y");
          } else if (os === "ios") {
            //ios 格式,ios很嚴謹,如果格式不對則無法 connect !
            // alert("iosAuthorized"+cordova.plugins.BluetoothStatus.iosAuthorized); //TODO IOS藍牙要求權限
            if (!cordova.plugins.BluetoothStatus.BTenabled) {
              if (AppConfig.askBTTimes < 1) {
                FnCtrl.alert(
                  $.i18n("請開啟藍牙，以接收藍牙設備量測資料。"),
                  ""
                );
                AppConfig.askBTTimes = 1;
              }
              FnBT.switchBTStatus("N");
            } else {
              MSCordovaBLE.startScan();
              FnBT.switchBTStatus("Y");
            }

            // alert("iosAuthorized");
            // if(cordova.plugins.BluetoothStatus.iosAuthorized){
            //     alert(cordova.plugins.BluetoothStatus.iosAuthorized);
            // }else{
            //     alert(cordova.plugins.BluetoothStatus.iosAuthorized);
            // }//藍牙(IOS Only)
          }
        } else {
          FnBT.StopScan();
        }
      }
    });
  },
  switchBTStatus: function (status) {
    var currentPage = sessionStorage.WhereAmI;

    if (currentPage === "MainHome") {
      $("#aBluetooth").show();
      if (FnBT.isOpenBTMode === "Y") {
        $("#aBluetooth").attr(
          "onclick",
          "FnBTPair.ShowPage(1);FnBT.StopScan();"
        );
      }
    }

    var BT_Init_OK = MSCordovaBLE.BT_Init_OK;
    var BT_ErrMsg = MSCordovaBLE.BT_ErrMsg ? MSCordovaBLE.BT_ErrMsg : "";

    Log.write("BT_Init_OK:" + BT_Init_OK, "FnBT StopScan");

    if (status === "Y" && BT_Init_OK) {
      $("#aBluetooth").attr("src", "./images/bluetooth_on.svg");
      //BandMate.switch("Y");
      FnBT.bluetoothStatus = "Y";
    } else {
      $("#aBluetooth").attr("src", "./images/bluetooth_off.svg");

      $("#aBluetooth").attr(
        "onclick",
        "FnCtrl.alert($.i18n('請開啟藍牙，以接收藍牙設備量測資料。" +
          BT_ErrMsg +
          "'));"
      );

      if (BT_ErrMsg !== "") {
        FnCtrl.toast(BT_ErrMsg);
      }

      if (FnBT.isOpenBTMode === "Y") {
        $("#aBluetooth").attr(
          "onclick",
          "FnCtrl.alert($.i18n('請開啟藍牙，以接收藍牙設備量測資料。'));"
        );
      } //BandMate.switch("N");
      FnBT.bluetoothStatus = "N";
    }
  },
  StopScan: function (successFn) {
    var BT_Init_OK = MSCordovaBLE.BT_Init_OK;
    Log.write("BT_Init_OK:" + BT_Init_OK, "FnBT StopScan");

    if (!BT_Init_OK) {
      Log.write("BT_Init false. Return StopScan", "FnBT StopScan");
      return;
    }

    FnBT.switchBTStatus("N");
    bluetoothle.stopScan(
      //停止 scan 模式
      function () {
        //success
        localStorage["BTScanActive"] = "N"; //關閉掃描功能
        Log.write("success", "FnBT STOPScan");

        if (successFn) {
          successFn();
        }
      },
      function (err) {
        localStorage["BTScanActive"] = "N"; //關閉掃描功能
        Log.write("err" + err, "FnBT STOPScan");
      }
    );
  },
  GetBTMode: function (successFn) {
    //取得目前藍牙設定模式 Y:配對模式；N:一般掃描模式
    ProjectFn.getSysParams("mSys", "BTMode", function (BTMode) {
      Log.write(BTMode, "BTMode");
      if (successFn) {
        successFn(BTMode);
      }
    });
  },
  CheckSameMData: function (MType, _Params) {
    return new Promise(function (resolve, reject) {
      if (!_Params) {
        resolve(false);
        Log.write("Params為空!", "CheckSameMData");
        return;
      }

      var strSql = "";
      var valueArray = [];

      var Params = Object.assign({}, _Params);
      delete Params.DeviceId;
      delete Params.DeviceModel;
      delete Params.TimeType;
      delete Params.StandardLevel;
      delete Params.Warnings;
      delete Params.MFlag;
      delete Params.RedItem;

      strSql += "select * from Management_" + MType;
      strSql += " Where ";
      for (var key in Params) {
        if (key === "Account" || key === "MTimeStamp") {
          valueArray.push(key + " = '" + Params[key] + "'");
        } else {
          valueArray.push(
            "Cast(" +
              key +
              " as double)" +
              " = " +
              "Cast('" +
              Params[key] +
              "' as double)"
          );
        }
      }

      strSql += valueArray.join(" and ");
      // Log.write(strSql, 'CheckSameMData');
      // DAOFn.Query("", "select * from Management_" + MType+" order by MTimeStamp desc",
      //     function ResultFun(result) {
      //         Log.write(result, "CheckSameMData");
      //     });
      DAOFn.Query("", strSql, function ResultFun(result) {
        var objList = $.parseJSON(result);
        if (objList.length == 0) {
          //沒有重覆，新增記錄，並往下做事
          Log.write("沒有重覆", "CheckSameMData");
          resolve(true);
        } else {
          Log.write("資料重覆", "CheckSameMData");
          resolve(false);
        }
      });
    });
  },
  //TODO: 目前為單筆模式 未來改成多筆
  SaveMData: function (
    RecordsArr,
    MType,
    dataType,
    _UserID,
    lParams,
    successFn
  ) {
    // alert("FnBT SaveMData"+RecordsArr+MType);
    //RecordsArr格式:["FORA IR20,C0:26:DF:00:53:6B,2017/09/21 13:15,36.1" ,
    //               "FORA IR20,C0:26:DF:00:53:6B,2017/09/22 10:42,32.9" ,
    //               "FORA IR20,C0:26:DF:00:53:6B,2017/09/22 18:09,37.4",
    //               "ETB04",00:1E:9C:00:0D:C6,2018/12/04 17:57,10.5,0,U
    //               ]
    // var caseID = localStorage.UserID;
    //Log.write(MType+"SaveMData"+RecordsArr,"SaveMData");
    var UploadStatus = "A";
    var MRowKey = "";
    var Memo = "";
    if (lParams) {
      UploadStatus = lParams.UploadStatus;
      MRowKey = lParams.MRowKey;
      Memo = lParams.Memo;
    }

    var M_UP_Date = "";

    if (UploadStatus === "U") {
      //更新流程
      M_UP_Date = DateTimeFun.getFullInputDateNow();
    }

    lParams.M_UP_Date = M_UP_Date;

    var UserID = "";
    if (_UserID) {
      UserID = _UserID;
    } else {
      UserID = localStorage.UserID;
    }
    var UserKind = AppConfig.UserKind;
    var CardID = UserID;

    var rCount = RecordsArr.length;
    var _count = 0;
    Log.write(
      "RecordsArr:" + RecordsArr + "；rCount:" + rCount,
      "SaveMData RecordsArr"
    );

    var InsertArray = []; //存入DB的資料
    for (var i = 0; i < rCount; i++) {
      var ResultStr = RecordsArr[i];
      //Log.write(ResultStr, "SaveMData");
      var lMData = ResultStr.split(",");

      if (MType == "BW" || MType == "BF") {
        var tmpGender = lMData[8].toString();
        Log.alert(tmpGender + MType, "SaveMData");
        switch (tmpGender) {
          case "0":
          case "M":
            lMData[8] = "M";
            break;
          case "1":
          case "F":
            lMData[8] = "F";
            break;
        }
        Log.alert(lMData[5], "SaveMData E");
      }

      Log.write("顯示量測值：" + lMData);
      //存進離線DB
      //2016-03-01 02:25:XX.XXX;
      var MTimeStamp = lMData[2].replace(/\//g, "-");
      lMData[2] = MTimeStamp;

      var DeviceModel = lMData[0];
      var DeviceId = lMData[1];
      var mainMeasureData = lMData[3];
      var Params = {
        Account: UserID,
        MTimeStamp: MTimeStamp,
        DeviceModel: DeviceModel,
        DeviceId: DeviceId,
        StandardLevel: "",
        Warnings: "",
        MFlag: "",
        RedItem: "",
        UploadStatus: UploadStatus,
        MRowKey: MRowKey,
        Memo: Memo,
        M_UP_Date: M_UP_Date,
      };
      switch (MType) {
        case "BP":
          Params.SBP = mainMeasureData;
          Params.DBP = lMData[4];
          Params.HR = lMData[5];
          break;
        case "STEP":
          Params.STEP = mainMeasureData;
          Params.Distance = lMData[4];
          Params.CAL = lMData[5];
          break;
        case "BG":
          Params.BS = mainMeasureData;
          Params.TimeType = lMData[4];
          break;
        case "BO":
          Params.SPO2 = mainMeasureData;
          Params.HR = lMData[4];
          break;
        case "BW":
        case "BF":
          //alert(lMData.length);
          Log.write(lMData, "FnBT SaveData");
          //[3]體重,BMI,[5]體脂,基代,[7]身高,性別,[9]年齡
          Params.Weight = mainMeasureData;
          Params.Gender = lMData[8];
          Params.Age = lMData[9];
          Params.Height = lMData[7];
          Params.BMI = lMData[4];
          Params.BaseRate = lMData[6];
          Params.BodyRate = lMData[5];
          MType = "BW";
          break;
        default: //BT, UA, CHOL, HR
          Params[MType] = mainMeasureData;
          break;
      }

      FnBT.CheckSameMData(MType, Params).then(function (isNewData) {
        if (isNewData) {
          //Log.write(JSON.stringify(Params),"Params");
          switch (UploadStatus) {
            case "A":
              Params.MRowKey = Params.MTimeStamp;
              InsertArray.push(Params);
              FnBT.SaveDataToDB(Params, MType, function () {
                Log.write("Insert Success", "SaveMData");
              });
              break;
            case "U":
              FnBT.UpdateDataToDB(Params, MType, function () {
                Log.write("Update Success", "SaveMData");
              });
              break;
          }

          //塞入待上傳序
          //alert("塞入待上傳序");
          ResultStr = lMData.join(",");
          //Log.write("ResultStr"+ResultStr+"；"+"UserAge"+BTSetting.UserAge+ "；UserGender:"+BTSetting.UserGender+ "；UserHeight:"+BTSetting.UserHeight,"ResultStr FnBT");
          WaitQueue.Add(ResultStr, MType, UserID, UserKind, CardID, lParams);
          //}

          //改為每筆都顯示出來
          lMData.shift();
          lMData.shift();
          lMData.shift();

          var isAnimate = false;
          if (dataType === "device") {
            isAnimate = true;
          } else {
            isAnimate = false;
          }

          switch (FnBT.AppMode) {
            case "People":
              Measure.showValue(
                MType,
                lMData,
                isAnimate,
                MTimeStamp,
                DeviceModel
              );
              break;
            case "Scan":
              MeasureScan.showValue(
                MType,
                lMData,
                isAnimate,
                MTimeStamp,
                DeviceModel
              );
              break;
          }
        }

        //WriteLog.write(RecordsArr[i], "multiresult");
        if (_count == rCount - 1) {
          //最後一筆

          if (!isNewData && dataType === "device") {
            FnCtrl.alert($.i18n("此次量測值已在記錄內"));
          }

          if (successFn) {
            successFn(isNewData);
          }

          // FnBT.SaveDataToDB(InsertArray, MType, function () {
          //     if (successFn) {
          //         successFn(isNewData);
          //     }
          // });
        }
        _count++;
      });
    }
  },
  SaveDataToDB: function (lParams, MType, successFn) {
    DAOFn.InsertData("", "Management_" + MType, lParams, function (result) {
      Log.write(MType + ":" + JSON.stringify(lParams), "SaveDataToDB");
      setTimeout(function () {
        //Measure.readByMType(MType);
        if (successFn) {
          successFn();
        }
      }, 500);
    });
  },
  UpdateDataToDB: function (lParams, MType, successFn) {
    var MRowKey = lParams.MRowKey;
    lParams.M_UP_Date = DateTimeFun.getFullInputDateNow();
    DAOFn.UpdateData(
      "",
      "Management_" + MType,
      lParams,
      "MRowKey",
      MRowKey,
      "",
      function (result) {
        Log.write(MType + ":" + JSON.stringify(lParams), "UpdateDataToDB");
        setTimeout(function () {
          //Measure.readByMType(MType);
          if (successFn) {
            successFn();
          }
        }, 500);
      }
    );
  },
  SetDeviceTime: function (device, successFn, errFn) {
    if (device.name != "ETB04") {
      //聿新科的三合一接收資料就會做時間校正，所以配對時不做
      //WiseScripts.Tool.ShowLoading(true, "設備時間校正中..");
      var OS = WiseScripts.Tool.MobileType.IsAndroid() ? "android" : "iOS";
      //if(OS==="android"){//TODO IOS目前沒有關機指令，之後再做測試．
      MSCordovaBLE.SetTimeAlone(
        "4.0",
        device,
        function () {
          //success
          //WiseScripts.Tool.ShowLoading(false);
          if (OS === "android") {
            //TODO IOS目前沒有關機指令，之後再做測試．
            window.plugins.toast.showShortBottom(
              $.i18n("設備時間校正成功"),
              function (a) {},
              function (b) {}
            );
          }
          if (successFn) {
            successFn();
          }
        },
        function (e) {
          //fail
          //WiseScripts.Tool.ShowLoading(false);
          //FnBT.startScan(false);
          window.plugins.toast.showShortBottom(
            $.i18n("設備時間校正失敗..") + e,
            function (a) {},
            function (b) {}
          );
          if (errFn) {
            errFn();
          }
        },
        true
      );
    }
  },
  fn_DataMode: function (isOnlyOneData) {
    //切換多筆和單筆
    MSCordovaBLE.MySetting.OnlyLastestData = isOnlyOneData;
  },
  confirmBTPair: function (Device) {
    if (sessionStorage.WhereAmI !== "MainHome") {
      Log.write("不在主畫面，不用檢查是否有配對過設備", "confirmBTPair");
      return;
    }
    var confirmBTPair = "N";
    ProjectFn.setSysParams(
      "mSys",
      "confirmBTPair",
      confirmBTPair,
      function (msg) {
        Log.write(
          msg + "confirmBTPair:" + confirmBTPair + "，儲存設定至SQLLite中",
          "FnBTPair SwitchBTMode"
        );
      }
    );

    Log.write(Device, "confirmBTPair");
    var message = $.i18n("未配對任何藍牙設備，是否前往配對畫面進行配對?");
    var buttonLabels = [$.i18n("好"), $.i18n("不再提醒")];
    navigator.notification.confirm(
      message,
      confirmCallback,
      $.i18n("系統訊息"),
      buttonLabels
    );

    function confirmCallback(btnIndex) {
      switch (btnIndex) {
        case 0:
          confirmBTPair = "Y";
          break;
        case 1:
          FnBT.StopScan();
          FnBTPair.ShowPage(1);
          confirmBTPair = "Y";
          break;
        case 2:
          confirmBTPair = "N";
          break;
      }
      ProjectFn.setSysParams(
        "mSys",
        "confirmBTPair",
        confirmBTPair,
        function (msg) {
          Log.write(
            msg + "confirmBTPair:" + confirmBTPair + "，儲存設定至SQLLite中",
            "FnBTPair SwitchBTMode"
          );
        }
      );
    }
  },
  getConfirmBTPair: function (successFn) {
    ProjectFn.getSysParams("mSys", "confirmBTPair", function (confirmBTPair) {
      if (successFn) {
        successFn(confirmBTPair);
      }
    });
  },
  ScanCallBack: function (Device) {
    //掃描CallBack
    //傳進來的 Device 物件內容如下:
    //{
    //    "address": "C0:26:DF:00:53:6B",
    //    "name": "FORA IR20",
    //    "rssi": -91,
    //    "advertisement": "FQlGT1JBIElSMjAAAAAAAAAAAAAAAAMZAAMCAQUHAwkYDxgKGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    //    "status": "scanResult"
    //}
    //WriteLog.write("ScanCallBack：" + Device.name + "/" + Device.address, "result");
    //var BTScanDevice = Device.name + Device.address;

    if (localStorage.UserID == "") {
      return;
    }
    if (BandMate.lDeviceNames.indexOf(Device.name) > -1) {
      Log.write(Device.name + "，只有配對模式需要掃到", "FnBT");
      MSCordovaBLE.MySetting.AutoConnect = false;
      return;
    }

    MSCordovaBLE.MySetting.AutoConnect = true;
    console.log(JSON.stringify(Device));
    FnBT.GetBTMode(function (BTMode) {
      if (BTMode == "Y") {
        //判斷是否為配對模式
        Log.write("配對模式", "FnBT ScanCallBack");
        var arrDevPair = $.parseJSON(localStorage.getItem("BT40P").toString());
        Log.write(arrDevPair, "FnBT ScanCallBack");
        if (arrDevPair.length === 0) {
          var confirmBTPair = "N";
          ProjectFn.Wait(
            [
              function (next) {
                FnBT.getConfirmBTPair(function (result) {
                  confirmBTPair = result;
                  next();
                });
              },
            ],
            function () {
              if (confirmBTPair === "Y" || confirmBTPair === "") {
                FnBT.confirmBTPair(Device);
              }
              Log.write("confirmBTPair: " + confirmBTPair, "ScanCallBack");
            }
          );
        } else {
          if (MSCordovaBLE.inPairedList(Device.address)) {
            //判斷是否在配對清單之中
            Log.write("配對模式:設備在配對清單之中", "FnBT ScanCallBack");
            FnBT.ShowConnectInfo(Device.name);
          }
        }
      } else {
        FnBT.ShowConnectInfo(Device.name);
      }
    });
  },
  ShowConnectInfo: function (deviceName) {
    FnBT.DeviceToName(deviceName).then(function (result) {
      window.plugins.toast.showShortBottom(
        $.i18n("發現:$1，正在連線中..", result),
        function (a) {},
        function (b) {}
      );
    });
  },
  ConnectCallBack: function (Device) {
    //已連線CallBack
    //傳進來的 Device 物件內容如下:
    //{
    //    "address": "C0:26:DF:00:53:6B",
    //    "name": "FORA IR20",
    //    "status": "connected"
    //}
    //$("#divBTStatus").html($.i18n("<div>開始連線至</br>設備: $1</br>設備Mac: $2</div>",Device.name,Device.address));
    WriteLog.write(
      "ConnectCallBack：" + Device.name + "/" + Device.address,
      "result"
    );
  },
  DataReceiving: function (ResultStr) {
    //$("#WiseLogoB").prop('src', 'images/logoB.png');
    if (ResultStr == "") {
      //無量測資料
      return;
    }
    //Log.write(ResultStr, "DataReceiving");
    //ResultStr = "ETB04,5C:31:3E:34:2B:AC,2020/12/24 14:48,137,89,Y,0,P";
    //TODO window.plugins.toast.showShortBottom($.i18n("不收取質控模式的量測值"), null, null);
    var UserID = "";
    switch (FnBT.AppMode) {
      case "People":
        UserID = localStorage.UserID;
        break;
      case "Scan":
        UserID = localStorage.MersureScanUserID;
        break;
    }

    Log.write(ResultStr, "ResultCallBack ResultStr");
    var RecordsArr = [];

    var lMData = ResultStr.split(",");
    var DeviceModel = lMData[0];
    var MType = ""; //量測類型;
    var UploadStatus = "A";
    FnBT.GetDeviceType(lMData).then(function (_MType) {
      if (_MType === "Err") {
        var errCode = lMData.length > 4 ? lMData[3] : "";
        var message = FnBT.ShowDeviceErrCode(DeviceModel, errCode); //"E" + errCode+"\n \n 請參閱ETB04異常排除";
        FnCtrl.alert(message, "藍牙設備錯誤");
        return;
      }

      MType = _MType;

      ProjectFn.Wait(
        [
          function (next) {
            FnDateTime.checkMTime(lMData[2], function (isCorrect) {
              if (isCorrect != "Y") {
                lMData[2] = DateTimeFun.getFullInputDateNow(); //取得固定日期格式 2017-09-28 11:00:10.123
              } else {
                var TheDay = new Date();
                var seconds = DateTimeFun.addZC(TheDay.getSeconds());
                var milliseconds = WiseScripts.IO.padLeft(
                  TheDay.getMilliseconds(),
                  3,
                  "0"
                );
                lMData[2] =
                  lMData[2].substring(0, 16).replace(/\//g, "-") +
                  ":" +
                  seconds +
                  "." +
                  milliseconds;
              }
              next();
            });
          },
          function (next) {
            //MValue數值轉換
            //alert("MValue數值轉換");
            if (MType === "BG" || MType === "UA" || MType === "CHOL") {
              lMData[3] = MeasureInfo.convertSaveMValue(MType, lMData[3], "Y");
              next();
            } else {
              next();
            }
          },
          function (next) {
            Measure.checkMValue(lMData, MType, function (result) {
              if (result === "") {
                next();
              } else {
                FnCtrl.alert(result);
              }
            });
          },
        ],
        function () {
          //alert("success");
          Log.write(lMData, "FnBT DataReceiving");
          ResultStr = lMData.join(",");
          Log.write(MType + ":" + ResultStr, "DataReceive Data");
          var lParams = {
            UploadStatus: UploadStatus,
            MRowKey: lMData[2],
            Memo: "",
          };

          switch (MType) {
            case "BG":
              if (AppConfig.BGTimeTypeConfirm === "N") {
                confirmCallback(0); //血糖為隨機時段
                return;
              }

              var message = $.i18n(
                "請選擇量測時段。如為隨機時段請點擊對話框外任一地方。"
              );
              var title = $.i18n("請選擇量測時段");
              var buttonLabels = [
                $.i18n("飯前"),
                $.i18n("飯後"),
                $.i18n("睡前"),
              ];

              navigator.notification.confirm(
                message,
                confirmCallback,
                title,
                buttonLabels
              );
              //Gen 0;
              //AC (飯前) 8;
              //PC (飯後) lMData[4] = 9;
              //1:早飯前;2:早飯後2小時;3:午飯前;4:午飯後2小時;5:晚飯前;6:晚飯後2小時;7:睡前;8:飯前;9:飯後;0:不分時段；
              function confirmCallback(btnIndex) {
                var timeType = "0";
                //var nowHour = new Date().getHours();
                var _timeType = btnIndex.toString(); //1飯前,2飯後,3睡前;
                if (_timeType == "3" || _timeType == "0") {
                  //睡前不用選擇用餐時段
                  if (_timeType == "3") {
                    timeType = 7;
                  } else if (_timeType == "0") {
                    timeType = 0;
                  }

                  lMData[4] = timeType;

                  ResultStr = lMData.join(",");
                  RecordsArr.push(ResultStr);
                  FnBT.SaveMData(RecordsArr, MType, "device", UserID, lParams);
                  return;
                }

                title = $.i18n("請選擇用餐時段");
                buttonLabels = [$.i18n("早餐"), $.i18n("午餐"), $.i18n("晚餐")];
                navigator.notification.confirm(
                  message,
                  confirmCallback,
                  title,
                  buttonLabels
                );
                //Gen 0;
                //AC (飯前) 8;
                //PC (飯後) lMData[4] = 9;
                //1:早飯前;2:早飯後2小時;3:午飯前;4:午飯後2小時;5:晚飯前;6:晚飯後2小時;7:睡前;8:飯前;9:飯後;0:不分時段；
                function confirmCallback(btnIndex) {
                  _timeType += btnIndex.toString(); //1早餐,2午餐,3晚餐
                  switch (_timeType) {
                    //_timeType:{bBreakfast:4,B_ETime:10,L_STime:10,L_ETime:15,D_STime:15,D_ETime:22},
                    case "11":
                      timeType = 1;
                      break;
                    case "12":
                      timeType = 3;
                      break;
                    case "13":
                      timeType = 5;
                      break;
                    case "21":
                      timeType = 2;
                      break;
                    case "22":
                      timeType = 4;
                      break;
                    case "23":
                      timeType = 6;
                      break;
                    default:
                      timeType = 0;
                      Log.write(timeType, "量測時段");
                      break;
                  }
                  lMData[4] = timeType;

                  ResultStr = lMData.join(",");
                  RecordsArr.push(ResultStr);
                  FnBT.SaveMData(RecordsArr, MType, "device", UserID, lParams);
                }
              }
              break;
            default:
              RecordsArr.push(ResultStr);
              FnBT.SaveMData(RecordsArr, MType, "device", UserID, lParams);
              break;
          }
        }
      );
    });
  },
  ShowDeviceErrCode: function (DeviceModel, errCode) {
    var result = "";
    var errMsg = "";
    switch (DeviceModel) {
      case "ETB04":
        switch (errCode) {
          case "01":
            errMsg =
              "請將試紙拔除後確認密碼卡是否確實插入，然後再插入試紙，若仍顯示錯誤訊息請聯絡客戶服務專線。";
            break;
          case "03":
            errMsg =
              "請確認脈帶是否配戴正確並重複量測, 若仍顯示錯誤訊息請聯絡客戶服務專線。";
            break;
          case "51":
            errMsg =
              "請確認脈帶是否配戴正確並重複量測, 若仍顯示錯誤訊息請聯絡客戶服務專線。";
            break;
          case "52":
            errMsg =
              "可能在量測血壓時手臂有移動了, 請靜置量測, 若仍顯示錯誤訊息請聯絡客戶服務專線。";
            break;
          case "53":
            errMsg =
              "請確認脈帶是否配戴正確並重複量測, 若仍顯示錯誤訊息請聯絡客戶服務專線。";
            break;
          default: //E02、E54
            errMsg = "請聯絡客戶服務專線。";
            break;
        }
        result += "E" + errCode;
        result += "\n \n";
        result += errMsg;
        result += "\n \n";
        result += "客戶服務專線：0800-800789";
        break;
      default:
        result = "E" + errCode + "\n \n 請參閱" + DeviceModel + "異常排除";
        break;
    }

    return result;
  },
  GetMultiDataCallBack: function (RecordsArr) {
    //回傳多筆量測資料CallBack
    //傳進來的 RecordArr 是一個陣列,其中每一個陣列 item 字串的內容如下:
    //
    //[
    //  "FORA IR20,C0:26:DF:00:53:6B,2017/09/21 13:15,36.1" ,
    //  "FORA IR20,C0:26:DF:00:53:6B,2017/09/22 10:42,32.9" ,
    //  "FORA IR20,C0:26:DF:00:53:6B,2017/09/22 18:09,37.4"
    //]

    //其中每一個 item 字串可以再切割如下的 subStr:
    //FORA IR20         <--Device name
    //C0:26:DF:00:53:6B <--Device address
    //2017/09/22 10:42  <--Device time
    //32.9              <--value
    if (Object.prototype.toString.apply(RecordsArr) === "[object Array]") {
      if (RecordsArr.length > 0) {
        window.plugins.toast.showShortBottom(
          "已接收" + RecordsArr.length + "筆資料",
          function (a) {},
          function (b) {}
        );
      }
    }
  },
  GetStorageNumberOfDataCallBack: function (Num) {
    //回傳多筆量測資料總筆數時會呼叫的CallBack

    //傳進來的 Num 是一個整數,是量測設備內的紀錄總筆數,根據這個總筆數的變化,判斷要做何事

    WriteLog.write(
      "GetStorageNumberOfDataCallBack：設備目前紀錄總筆數：" + Num + " 筆.",
      "multiresult"
    );

    if (Num < 1) {
      localStorage.BTScanConfirm = "Y"; //設定目前 是否正在詢問連線至設備的對話框
      FnCtrl.alert("設備無量測資料", "", function () {
        localStorage.BTScanConfirm = "N"; //設定目前 是否正在詢問連線至設備的對話框
      });
      MSCordovaBLE.MySetting.ClearData = true; //刪資料 //20180509改為單筆也要將資料都清除
    } else {
      MSCordovaBLE.MySetting.ClearData = true; //會刪資料
    }
  },
  ErrorCallBack: function (ErrorCode) {
    //錯誤CallBack
    // $("#WiseLogoB").prop('src', 'images/logoB.png');
    var tmp = ErrorCode.split(":");
    var errCode = tmp[0];

    switch (errCode) {
      case "Err001":
        Log.write("裝置藍牙固障：掃描啟動失敗");
        navigator.notification.alert(
          $.i18n("藍牙功能無法正常運作！"),
          null,
          $.i18n("系統訊息"),
          $.i18n("確定")
        );
        break;
      case "Err002":
        Log.write("正有其它設備連線中");
        window.plugins.toast.showShortBottom(
          $.i18n("藍牙無法連線，已有其它設備連線中.."),
          function (a) {},
          function (b) {}
        );
        break;
      case "Err003":
        Log.write(tmp[1] + "未在設備清單內");
        break;
      case "Err004":
        Log.write(FnBT.NonDevices + "；" + tmp, "未配對 設備清單");

        var HasFind = false;
        for (var i = 0; i < FnBT.NonDevices.length; i++) {
          if (tmp[1] == FnBT.NonDevices[i]) {
            HasFind = true;
            break;
          }
        }
        if (HasFind) {
          return;
        }
        FnBT.NonDevices.push(tmp[1]);
        //TODO 暫時不顯示
        // var message = tmp[1] + "未在配對清單中,\n 請前往藍牙設定進行設備配對；或是，將藍牙模式調整為智能連線模式。";
        // FnCtrl.alert(message, "", function () {

        // });

        // var title = "系統訊息";
        // var buttonLabels = ["是", "否"];

        // navigator.notification.confirm(message, confirmCallback, title, buttonLabels);

        // function confirmCallback(btnIndex) {
        //     if (btnIndex == 1) {
        //         FnBTPair.ShowPage(1);
        //     } else {

        //     }
        // }
        break;
      case "Err005":
        Log.write(tmp[1] + "連線失敗");
        FnBT.DeviceToName(Device.name).then(function (deviceName) {
          window.plugins.toast.showShortBottom(
            "「" + deviceName + "」已斷線",
            function (a) {},
            function (b) {}
          );
        });
        break;
      case "Err006":
        //重覆量測
        window.plugins.toast.showShortBottom(
          $.i18n("此次量測值已在記錄內"),
          null,
          null
        );
        //setTimeout(function () { ColorBoxClose(); }, 1000);
        break;
      case "Err007":
        Log.write("設備無量測資料");
        localStorage.BTScanConfirm = "Y"; //設定目前 是否正在詢問連線至設備的對話框
        FnCtrl.alert($.i18n("設備無量測資料"), "", function () {
          localStorage.BTScanConfirm = "N"; //設定目前 是否正在詢問連線至設備的對話框
        });
        break;
      case "Err008":
        Log.write("裝置藍牙固障：掃瞄無法停止");
        navigator.notification.alert(
          $.i18n("藍牙功能無法正常運作！"),
          null,
          $.i18n("系統訊息"),
          $.i18n("確定")
        );
        break;
      case "Err009":
      //if (sessionStorage["Step5"] == null) {
      //    Log.write("設備資料傳輸過程中發生異常");
      //}
      case "Err010":
        if (sessionStorage.InErr10Msg == null) {
          sessionStorage.InErr10Msg = "Y";
          navigator.notification.alert(
            $.i18n("量測體脂前，請先設定身高、性別、年齡"),
            function () {
              MainHome.goToProfile();
            },
            $.i18n("系統訊息"),
            $.i18n("確定")
          );
        }
        break;
      case "Err011":
        navigator.notification.confirm(
          $.i18n("無法自動配對，此設備需要配對才可傳輸資料"),
          function (btnIndex) {
            if (btnIndex == 1) {
              ble.showBluetoothSettings();
            }
          },
          $.i18n("系統訊息"),
          ["進行配對", "取消"]
        );

        break;
    }
  },
  ConnectDevice: function (address, name, rssi, advertisement, status) {
    //連接設備
    var Device = {
      address: address,
      name: name,
      rssi: rssi,
      advertisement: advertisement,
      status: status,
    };

    var message =
      $.i18n("設備名稱: $1", Device.name) +
      "\n" +
      $.i18n("設備Mac: $1", Device.address);
    var title = "連接設備";
    var buttonLabels = ["是", "否"];

    localStorage.BTScanConfirm = "Y"; //設定目前 是否正在詢問連線至設備的對話框
    navigator.notification.confirm(
      message,
      confirmCallback,
      title,
      buttonLabels
    );

    function confirmCallback(btnIndex) {
      localStorage.BTScanConfirm = "N";
      if (btnIndex == 1) {
        localStorage.BTConnect = "Y";
        $("#divBTStatus").html(
          $.i18n(
            "<div>開始連線至</br>設備: $1</br>設備Mac: $2</div>",
            Device.name,
            Device.address
          )
        );
        Log.write("開始連線至設備" + name, "index.js/ScanCallBack");
        MSCordovaBLE.connect(Device); //不檢查是否在配對清單(假性配對清單)中 --> 開始連線
      } else {
        //使用者按下否。不做處理。
      }
    }
  },

  //==============測試用=========================================================
  standardJSON: function () {
    var HSV_Gender = localStorage["Gender_" + localStorage.UserID];
    var HSV_HMIItem = "BodyRate";
    var Age = 20;
    var MValue = 24;
    var timeType = "8";
    var strSql = "With tmpTable as ( ";
    strSql +=
      "SELECT HSV_HMIItem,HSV_Gender,HSV_Condition,Cast(HSV_CValueL as real) HSV_CValueL,Cast(HSV_CValueG as real) HSV_CValueG,HSV_CValueE";
    strSql +=
      ",Cast(HSV_Min as real) HSV_Min,Cast(HSV_Max as real) HSV_Max,HSL_HSESNo,HSL_Name,HSL_Level,HSL_IsNormal,HSL_IsRed,HSL_Warnings ";
    strSql += "FROM StandardJSON ";
    strSql += "WHERE HSV_HMIItem='" + HSV_HMIItem + "' ";
    strSql += ") ";
    // strSql += "--Age: bodyrate、Grip、SitStand、LiftLeg";
    // strSql += "--Weight: BoneMass";
    strSql += "Select * From tmpTable ";
    strSql +=
      "Where (HSV_Condition='Age' or  HSV_Condition='Weight') and HSV_Gender='" +
      HSV_Gender +
      "' ";
    strSql += "and HSV_CValueL<=" + Age + " ";
    strSql += "and (IFNULL(HSV_CValueG,'')='' or HSV_CValueG>=" + Age + ") ";
    strSql += "and HSV_Min<=" + MValue + " ";
    strSql += "and (IFNULL(HSV_Max,'')='' or HSV_Max>=" + MValue + ") ";
    //strSql += "--BMI、DBP、SBP、SPO2、TBWPercentage、VisceralRate";
    strSql += "union ";
    strSql += "Select * From tmpTable ";
    strSql += "Where HSV_Condition='X' ";
    strSql += "and HSV_Min<=" + MValue + " ";
    strSql += "and (IFNULL(HSV_Max,'')='' or HSV_Max>=" + MValue + ") ";
    // strSql += "--BS";
    strSql += "union ";
    strSql += "Select * From tmpTable ";
    strSql +=
      "Where HSV_Condition='BGType' and HSV_CValueE='" + timeType + "' ";
    strSql += "and HSV_Min<=" + MValue + " ";
    strSql += "and (IFNULL(HSV_Max,'')='' or HSV_Max>=" + MValue + ") ";
    strSql += "ORDER BY HSL_Level; ";
    console.log(strSql);

    return strSql;
  },
  testSql: function () {
    var strSQL = $("#testSql").val();
    Log.write(strSQL);
    if (strSQL == "") {
      strSQL = FnBT.standardJSON();
      $("#testSql").val(strSQL);
    }
    DAOFn.QueryAsync("", strSQL).then(function (result) {
      var objList = $.parseJSON(result);
      if (objList.length == 0) {
        alert("無資料");
        $("#dynamicTable").html("");
        return;
      } else if (objList.length == 1 && objList[0].hasOwnProperty("Err")) {
        alert("查詢錯誤");
        return;
      } else {
        alert("有資料");
        FnDynamic.createTable("dynamicTable", objList);
      }
    });
  },
  testJSON: function () {
    HATMService.SaveStandardJSON(function () {
      alert("Successssssssssss");
    });
    // alert('test');
    // var file= "./js/data/StandardVal.json";//$("#testSql").val();
    // alert(file);
    // var result;
    // $.getJSON(file, function(InsertArray) {
    //     // $.each(objList, function (i, item) {
    //     //     var result = "";
    //     //     var arrResult = $.map(item, function (value, index) {
    //     //         return [value];
    //     //     });

    //     //     for (var i = 0; i < arrResult.length; i++) {
    //     //         var val = arrResult[i];
    //     //         if (val == null) {
    //     //             val = "''";
    //     //         }
    //     //         result += val + ",";
    //     //     }
    //     //     div += result + "\n";
    //     // });
    //     DAOFn.MutiInsertData('', 'StandardJSON', InsertArray, function ResultFun(result) {
    //         //Log.write("resultFun_Insert:" + result);
    //         alert("success");
    //     });
    //     result=JSON.stringify(objList);
    //     $("#testResult").val(result);

    // });
  },
};
