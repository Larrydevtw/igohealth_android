//==================== MSCordovaBLE ===============================
//MSCordovaBLE 定義了本系統藍牙功能的主要流程,工業上BLE 標準的流程如下:
// 1.initialize
// 2.scan (if device address is unknown)
// 3.connect
// 4.discover OR services/characteristics/descriptors (iOS)
// 5.read/subscribe/write characteristics AND read/write descriptors
// 6.disconnect
// 7.close

var MSCordovaBLE = MSCordovaBLE || {},
  MSCordovaBLE = {
    foundDevices: [],
    connDevices: [],
    delayReceive: 100, //延遲接收資料 by sinclair
    checkBLE: 10000, //Scan確定間隔，如果超過時間就重啟模組(0:代表不檢查)by sinclair
    NowStep: "", //記錄目前執行到的函數
    sUUID: "",
    cUUID: "",
    MaxConnCnt: 1, //最大連線數
    BT_Init_OK: false,
    BT_ErrMsg: "", //錯誤訊息
    BT_Auth: false, //是否取得權限 //各別設定
    //,//這個變數平常都是false,當藍牙設備被Bond成功時,這個變數會被設成true,
    //isBondSuccess: false

    MySetting: null, //各別設定初始化

    InitSetting: function (UserSetting) {
      MSCordovaBLE.MySetting = BTSetting;
      $.extend(MSCordovaBLE.MySetting, UserSetting); //JQuery的指令
    }, //初使化藍牙
    //-------------------------------------------

    //-------------------------------------------
    //與藍牙流程有關的函式

    btInitialize: function () {
      MSCordovaBLE.BT_Init_OK = false;
      MSCordovaBLE.NowStep = "btInitialize";
      //added by sinclair 20170930
      localStorage.setItem("inDeviceList", "[]"); //暫取可配對清單
      MSCordovaBLE.connDevices = []; //清空目前連線數

      WriteLog.write("目前的作業模式: 正常的 scan 模式", "status");
      WriteLog.write("目前的作業平台: " + window.cordova.platformId, "status");

      if (window.cordova.platformId === "android") {
        MSCordovaBLE.checkPermission()
          .then(
            MSCordovaBLE.btInitialize_android,
            MSCordovaBLE.btInitializeError
          )
          .then(MSCordovaBLE.btInitializeSuccess, MSCordovaBLE.handleError);
      } else if (window.cordova.platformId === "ios") {
        MSCordovaBLE.btInitialize_iOS().then(
          MSCordovaBLE.btInitializeSuccess,
          MSCordovaBLE.handleError
        );
      } else {
        WriteLog.write(
          "目前不支援 " + window.cordova.platformId + " 這種作業平台 !",
          "status"
        );
      }
    },
    btInitialize_android: function () {
      return new Promise(function (resolve) {
        bluetoothle.initialize(resolve, {
          request: true,
          statusReceiver: false, //default 值 false
        });
      });
    },
    btInitialize_iOS: function () {
      return new Promise(function (resolve) {
        //TODO:
        MSCordovaBLE.BT_Auth = true;

        bluetoothle.initialize(resolve, {
          request: true,
          statusReceiver: true, //如果設成false --> ios會不能initialize藍芽 !!!
        });
      });
    },
    checkPermission: function () {
      return new Promise(function (resolve, reject) {
        if (window.cordova.platformId === "android") {
          MSCordovaBLE.BT_Auth = false;

          var OSVersionNo = DeviceInfo.OSVersionNo;

          //先處理Android權限
          WriteLog.write("先處理Android權限");
          // bluetoothle.hasPermission(MSCordovaBLE.hasPermissionSuccess);
          // bluetoothle.isLocationEnabled(MSCordovaBLE.isLocationEnabledSuccess, MSCordovaBLE.handleError);
          MSCordovaBLE.hasPermission(function (result) {
            WriteLog.write("先處理Android權限 hasPermission: " + result);

            if (!result) {
              MSCordovaBLE.BT_ErrMsg = "未取得藍牙權限";
              reject();
              return;
            }

            WriteLog.write(
              "Android版本 DeviceInfo.OSVersion / " +
                DeviceInfo.OSVersion +
                " / " +
                OSVersionNo
            );

            if (OSVersionNo < 12) {
              WriteLog.write(
                "Android12以下版本 hasPermission / " +
                  DeviceInfo.OSVersion +
                  " / " +
                  OSVersionNo
              );
              MSCordovaBLE.BT_Auth = true;
              resolve();
              return;
            }

            MSCordovaBLE.hasPermissionBtScan(function (result) {
              WriteLog.write(
                "先處理Android權限 hasPermissionBtScan: " + result
              );

              if (!result) {
                MSCordovaBLE.BT_ErrMsg = "未取得藍牙鄰近裝置權限";
                reject();
                return;
              }

              MSCordovaBLE.hasPermissionBtConnect(function (result) {
                WriteLog.write(
                  "先處理Android權限 hasPermissionBtConnect: " + result
                );

                if (!result) {
                  MSCordovaBLE.BT_ErrMsg = "未取得藍牙鄰近裝置權限";
                  reject();
                  return;
                }

                MSCordovaBLE.BT_Auth = true;
                resolve();
              });
            });
          });
        }
      });
    },
    btInitializeSuccess: function (result) {
      var BT_Init_OK = true;

      MSCordovaBLE.BT_Init_OK = BT_Init_OK;
      MSCordovaBLE.NowStep = "btInitializeSuccess";
      if (result.status === "enabled") {
        WriteLog.write("藍牙初始化成功！", "status");

        MSCordovaBLE.startScan();
      } else {
        WriteLog.write("藍牙目前尚未開啟:" + result.status, "status");
      }

      MSCordovaBLE.MySetting.initCallBackFn(BT_Init_OK);

      MSCordovaBLE.autoRepairBLE();
    },
    btInitializeError: function () {
      return new Promise(function (resolve, reject) {
        var BT_Init_OK = false;

        MSCordovaBLE.BT_Init_OK = BT_Init_OK;
        MSCordovaBLE.NowStep = "btInitializeError";

        WriteLog.write("藍牙目前尚未開啟", "status");

        MSCordovaBLE.MySetting.initCallBackFn(BT_Init_OK);

        reject();
      });
    },
    autoRepairBLE: function () {
      //確認是否啟動修復,每隔10(checkBLE)秒檢查scan間隔有沒有超過10秒
      //，有的代表藍牙被lock，重啟!↓↓↓
      if (MSCordovaBLE.checkBLE > 0) {
        var vCheckScan = function () {
          if (MSCordovaBLE.connDevices.length < MSCordovaBLE.MaxConnCnt) {
            var tDate = new Date();
            var dDay1 = tDate.getTime();
            if (!sessionStorage["checkBLETime"]) {
              sessionStorage["checkBLETime"] = dDay1;
            }
            var dDay2 = sessionStorage["checkBLETime"];
            var vDif = dDay1 - dDay2;
            //sessionStorage["checkBLETime"] = dDay1.getTime();
            if (vDif > MSCordovaBLE.checkBLE) {
              WriteLog.write(
                "check scan!" + dDay1 + "," + dDay2 + "," + vDif,
                "status"
              );
              WriteLog.write("啟動修復!", "error");
              //MSCordovaBLE.btInitialize();

              MSCordovaBLE.startScan();
              WriteLog.write("藍牙scan逾時，重啟scan!", "error");
            }
            //else {
            //    //WriteLog.write("check scan!" + dDay1 + "," + dDay2 + "," + vDif, "status");
            //    vCheckScan();
            //}
          }
        };
        var myTimer = setInterval(vCheckScan, MSCordovaBLE.checkBLE);
      }
      //確認是否啟動修復↑↑↑
    },
    //掃瞄藍牙設備
    startScan: function () {
      if (!MSCordovaBLE.BT_Auth) {
        WriteLog.write("未取得藍牙權限！ 無法進入掃描", "startScan");
        return;
      }

      if (MSCordovaBLE.NowStep === "startScan") {
        WriteLog.write("藍牙已進入掃描！ 無法再次進入掃描", "startScan");
        return;
      }

      MSCordovaBLE.NowStep = "startScan";
      MSCordovaBLE.foundDevices = [];

      if (window.cordova.platformId != "windows") {
        try {
          //modified by sinclair 20170930
          var vStartFn = function () {
            if (MSCordovaBLE.connDevices.length >= MSCordovaBLE.MaxConnCnt) {
              //超過最大連線數，就不用scan
              return;
            }

            if (window.cordova.platformId === "android") {
              bluetoothle.startScan(
                MSCordovaBLE.startScanSuccess,
                MSCordovaBLE.handleError,
                {
                  services: [
                    //"180D",
                    // "180F"
                  ],
                  scanMode: bluetoothle.SCAN_MODE_LOW_LATENCY,
                  //    /*
                  //     1、SCAN_MODE_BALANCED：
                  //     Perform Bluetooth LE scan in balanced power mode.
                  //     2、SCAN_MODE_LOW_LATENCY：
                  //     Scan using highest duty cycle.
                  //     3、SCAN_MODE_LOW_POWER(default)：
                  //     Perform Bluetooth LE scan in low power mode.
                  //     4、SCAN_MODE_OPPORTUNISTIC：
                  //     A special Bluetooth LE scan mode.
                  //    */
                  matchMode: bluetoothle.MATCH_MODE_AGGRESSIVE,
                  //    /*
                  //     1、MATCH_MODE_AGGRESSIVE(default)：
                  //     In Aggressive mode, hw will determine a match sooner even with feeble signal strength and few number of sightings/match in a duration.
                  //     2、MATCH_MODE_STICKY：
                  //     For sticky mode, higher threshold of signal strength and sightings is required before reporting by hw
                  //    */
                  //matchNum: bluetoothle.MATCH_NUM_MAX_ADVERTISEMENT,
                  //callbackType: bluetoothle.CALLBACK_TYPE_ALL_MATCHES
                }
              );
            } else if (window.cordova.platformId === "ios") {
              bluetoothle.startScan(
                MSCordovaBLE.startScanSuccess,
                MSCordovaBLE.handleError,
                {
                  services: [
                    //"180D",
                    // "180F"
                  ],
                  allowDuplicates: true, //allowDuplicates 對iOS是很重要的屬性,如果allowDuplicates=false則藍芽設備只能被scan一次,再來就不會再被scan到了!
                }
              );
            }
          };

          bluetoothle.stopScan(
            function () {
              setTimeout(function () {
                vStartFn();
              }, 2000);
            },
            function () {
              setTimeout(function () {
                vStartFn();
              }, 2000);
            }
          );
        } catch (error) {
          MSCordovaBLE.handleError(error);
        }
      }
    },

    startScanSuccess: function (result) {
      if (result.name == null) {
        return;
      }

      //確認是否啟動修復↓↓↓
      if (MSCordovaBLE.checkBLE > 0) {
        var dDay1 = new Date();
        sessionStorage["checkBLETime"] = dDay1.getTime();
      }
      //確認是否啟動修復↑↑↑
      MSCordovaBLE.NowStep = "startScanSuccess";
      if (result.status === "scanStarted") {
        WriteLog.write("掃瞄藍牙設備中...", "status");
      } else if (result.status === "scanResult") {
        //debug
        //if (
        //    result.name.toString() == "DS3"
        //    ||
        //    (result.name.toString().length > 3
        //        &&
        //        result.name.toString().substr(0, 3) == "ETB"
        //    )
        //) {
        //    WriteLog.write("Debug:" + result.name + "/" + result.address, "status");

        //}

        if (
          !MSCordovaBLE.foundDevices.some(function (device) {
            return device.address === result.address;
          })
        ) {
          //如果 foundDevices 的陣列中比對得到的項目就返回(不作任何事),否則就繼續往下作!
          //如果不在設備清單內,就在設備清單(DevicesInfo)中, 加入華廣血糖機的 deviceName
          //
          //華廣設備模糊名:
          //if (Bionime_GM282.deviceNameSearching(result.name) == true) //但一定要確定是華廣血糖機才會做這事,其他的一概不理!
          //{
          //    var Params = {
          //        'DeviceModel': result.name
          //    };
          //    DAOFn.SimpleMerge('', 'DevicesInfo', Params, 'DeviceModel', result.name, "", function ResultFun(rv) {
          //        //WriteLog.write("rv : " + rv, "status");
          //    }, 'F');
          //}
          //
          ////力康模糊名:
          //if (HealForce_60F.deviceNameSearching(result.name) == true)
          //{
          //    var Params = {
          //        'DeviceModel': result.name
          //    };
          //    DAOFn.SimpleMerge('', 'DevicesInfo', Params, 'DeviceModel', result.name, "", function ResultFun(rv) {
          //        //WriteLog.write("rv : " + rv, "status");
          //    }, 'F');
          //}
          ////普雲康血壓模糊名:
          //if (Portal_BP.deviceNameSearching(result.name) == true) {
          //    var Params = {
          //        'DeviceModel': result.name
          //    };
          //    DAOFn.SimpleMerge('', 'DevicesInfo', Params, 'DeviceModel', result.name, "", function ResultFun(rv) {
          //        //WriteLog.write("rv : " + rv, "status");
          //    }, 'F');
          //}
          //
          //泰菱模糊名:
          if (
            typeof ZYTEMP != "undefined" &&
            ZYTEMP.deviceNameSearching(result.name) == true
          ) {
            var Params = {
              DeviceModel: result.name,
            };
            DAOFn.SimpleMerge(
              "",
              "DevicesInfo",
              Params,
              "DeviceModel",
              result.name,
              "",
              function ResultFun(rv) {
                //WriteLog.write("rv : " + rv, "status");
              },
              "F"
            );
          }

          //B設備模糊名:
          //...

          //WriteLog.write("找到設備:" + result.name + "/" + result.address);
          MSCordovaBLE.inDeviceList(
            result.name,
            function (
              flag //避免一直open DB造成速度下降
            ) {
              if (flag) {
                //如果有在設備清單內
                //document.getElementById("devices").innerHTML = "";
                //document.getElementById("services").innerHTML = "";
                //document.getElementById("output").innerHTML = "";
                //清除裝置畫面上的輸出訊息
                WriteLog.clearDisplay();

                WriteLog.write(
                  "掃描到藍牙設備:" + result.name + "/" + result.address,
                  "status"
                );
                WriteLog.write(result);
                MSCordovaBLE.foundDevices.push(result);

                MSCordovaBLE.MySetting.ScanCallBackFn(result); //呼叫外部的 ScanCallBackFn

                //如果自動連線
                if (MSCordovaBLE.MySetting.AutoConnect) {
                  //檢查是否在配對清單(假性配對清單)中
                  if (MSCordovaBLE.MySetting.ForcePair) {
                    if (MSCordovaBLE.inPairedList(result.address)) {
                      MSCordovaBLE.connect(result); //在配對清單(假性配對清單)中 --> 開始連線
                    } else {
                      //未在配對清單中
                      MSCordovaBLE.MySetting.ErrorCallBackFn(
                        "Err004:" + result.name
                      );

                      //程式先擋住一段時間再往下執行
                      var Wait = function () {
                        setTimeout(function () {
                          MSCordovaBLE.foundDevices = [];
                          WriteLog.write("休息1000微秒！");
                        }, 1000); //1000微秒
                      };
                      Wait(); //休息1秒！
                    }
                  } else {
                    MSCordovaBLE.connect(result); //不檢查是否在配對清單(假性配對清單)中 --> 開始連線
                  }
                } else {
                  //程式先擋住一段時間再往下執行
                  var Wait = function () {
                    setTimeout(function () {
                      MSCordovaBLE.foundDevices = [];
                      WriteLog.write("休息1000微秒！");
                    }, 1000); //1000微秒
                  };
                  Wait(); //休息1秒！
                }
              }
            }
          );
        }
      }
    }, //連線藍牙設備

    connect: function (result) {
      MSCordovaBLE.NowStep = "connect";
      if (window.cordova.platformId === "android") {
        if (result.name === "FLG-756") {
          //歐瑟若體脂機需要先做硬體配對,不然讀寫資料會失敗!
          WriteLog.write("檢查硬體設備配對... : " + result.address, "status");
          MSCordovaBLE.addPairDevices(result.address, null, null); //加入硬體配對
          ////MSCordovaBLE.removePairDevices(result.address, null, null);//移除硬體配對

          // //debug
          //WriteLog.write("MSCordovaBLE.isBondSuccess = " + MSCordovaBLE.isBondSuccess, "status");
          //
          //if (MSCordovaBLE.isBondSuccess == true)
          //{
          //    ////程式先擋住一段時間再往下執行
          //    //var Wait = function () {
          //    //    setTimeout(function () { MSCordovaBLE.foundDevices = []; WriteLog.write("休息2345微秒！"); }, 2345);//2000微秒
          //    //}
          //    //Wait();//休息2秒！
          //
          //    //斷開藍牙連接
          //    //MSCordovaBLE.disconnectSuccess(result);
          //}
          //else
          //{
          //    WriteLog.write("連接到設備中... : " + result.address, "status");
          //    new Promise(function (resolve, reject) {
          //        bluetoothle.connect(resolve, reject,
          //        {
          //            address: result.address
          //        });
          //    }).then(MSCordovaBLE.connectSuccess, MSCordovaBLE.handleErrorAndToClose);
          //}

          WriteLog.write("連接到設備中... : " + result.address, "status");
          new Promise(function (resolve, reject) {
            bluetoothle.connect(resolve, reject, {
              address: result.address,
            });
          }).then(
            Oserio_FLG_756.connectSuccess,
            MSCordovaBLE.handleErrorAndToClose
          );
        } else if (result.name == "TSB-631") {
          //廣州同聲BP，GATT模式
          WriteLog.write(
            "連接到設備中(TSB-631)... : " + result.address,
            "status"
          );
          new Promise(function (resolve, reject) {
            bluetoothle.connect(resolve, reject, {
              address: result.address,
            });
          }).then(TSB631.connectSuccess, MSCordovaBLE.handleErrorAndToClose);
        } else if (
          result.name == "DS3"
          //&& result.address.toString() == "C8:B2:1E:A1:02:B0"
        ) {
          //GATT模式
          WriteLog.write(
            "連接到設備中(DS3 GATT)... : " + result.address,
            "status"
          );
          new Promise(function (resolve, reject) {
            bluetoothle.connect(resolve, reject, {
              address: result.address,
            });
          }).then(
            Loson_DS3_GATT.connectSuccess,
            MSCordovaBLE.handleErrorAndToClose
          );
        }
        //中山瑞福血糖機作硬體配對這一段要MARK起來,不然後面要對血糖機送出 LINK packet時很常遇到沒有回LinkAck的情況!
        //這是經過多次測試測出來的 !!
        //else if (result.name === "ETB04") //中山瑞福血糖機需要先做硬體配對,不然讀寫資料會失敗!
        //{
        //    WriteLog.write("檢查硬體設備配對... : " + result.address, "status");
        //    MSCordovaBLE.addPairDevices(result.address, null, null); //加入硬體配對

        //    WriteLog.write("連接到設備中... : " + result.address, "status");
        //    new Promise(function (resolve, reject) {
        //        bluetoothle.connect(resolve, reject,
        //        {
        //            address: result.address
        //        });
        //    }).then(MSCordovaBLE.connectSuccess, MSCordovaBLE.handleErrorAndToClose);
        //}
        //else if (result.name === "2282RAA0429") //華廣血糖機是是屬於模糊藍牙名這一類的,所以須採用模糊比對!

        //else if (Portal_BP.deviceNameSearching(result.name) == true) //華廣血糖機需要先做硬體配對,不然讀寫資料會失敗!
        //{
        //    //WriteLog.write("檢查硬體設備配對... : " + result.address, "status");
        //    //MSCordovaBLE.addPairDevices(result.address, null, null); //加入硬體配對

        //    WriteLog.write("連接到設備中... : " + result.address, "status");
        //    new Promise(function (resolve, reject) {
        //        bluetoothle.connect(resolve, reject,
        //            {
        //                address: result.address
        //            });
        //    }).then(Portal_BP.connectSuccess, MSCordovaBLE.handleErrorAndToClose);
        //} //歐瑟若體脂機以外的設備不需要硬體配對,就可以讀的到資料.
        else {
          WriteLog.write("連接到設備中... : " + result.address, "status");
          new Promise(function (resolve, reject) {
            bluetoothle.connect(resolve, reject, {
              address: result.address,
            });
          }).then(
            MSCordovaBLE.connectSuccess,
            MSCordovaBLE.handleErrorAndToClose
          );
        }
      } else if (window.cordova.platformId === "ios") {
        if (result.name === "FLG-756") {
          //歐瑟若體脂機需要監控一個以上的uuid,discover的方式是不一樣的!
          WriteLog.write("連接到設備中... : " + result.address, "status");
          new Promise(function (resolve, reject) {
            bluetoothle.connect(resolve, reject, {
              address: result.address,
            });
          }).then(
            Oserio_FLG_756.connectSuccess,
            MSCordovaBLE.handleErrorAndToClose
          );
        } else if (
          typeof Portal_BP != "undefined" &&
          Portal_BP.deviceNameSearching(result.name) == true
        ) {
          //華廣血糖機需要先做硬體配對,不然讀寫資料會失敗!
          WriteLog.write("檢查硬體設備配對... : " + result.address, "status");

          WriteLog.write("連接到設備中... : " + result.address, "status");
          new Promise(function (resolve, reject) {
            bluetoothle.connect(resolve, reject, {
              address: result.address,
            });
          }).then(Portal_BP.connectSuccess, MSCordovaBLE.handleErrorAndToClose);
        } //歐瑟若體脂機以外的設備只需要監控一個uuid
        else {
          WriteLog.write("連接到設備中... : " + result.address, "status");
          new Promise(function (resolve, reject) {
            bluetoothle.connect(resolve, reject, {
              address: result.address,
            });
          }).then(
            MSCordovaBLE.connectSuccess,
            MSCordovaBLE.handleErrorAndToClose
          );
        }
      }
    },

    connectSuccess: function (result) {
      MSCordovaBLE.NowStep = "connectSuccess";
      WriteLog.write(result);

      if (result.status === "connected") {
        //記錄已連接設備
        //name,address,status
        MSCordovaBLE.connDevices.push(result);

        WriteLog.write(
          "藍牙連接成功！(" + MSCordovaBLE.connDevices.length + ")",
          "status"
        );

        if (MSCordovaBLE.connDevices.length >= MSCordovaBLE.MaxConnCnt) {
          //超過最大連線數，停止scan
          WriteLog.write("到達最大連線數，停止scan", "status");
          bluetoothle.stopScan(
            function () {
              WriteLog.write("到達最大連線數，停止成功", "status");
            },
            function () {
              WriteLog.write("到達最大連線數，停止失敗", "status");
            }
          );
        }

        ////2020.8.6 added by sinclair
        //if (result.name == "Mini Grill") {
        //    KT_MINI_GRILL.getMacAddress(
        //        result.address
        //        ,
        //        function(sObj){
        //            //add item
        //            result["TrueMAC"] = sObj.value;
        //            MSCordovaBLE.MySetting.ConnectCallBackFn(result);//呼叫外部的 ConnectCallBackFn
        //        });

        //} else {
        //    MSCordovaBLE.MySetting.ConnectCallBackFn(result);//呼叫外部的 ConnectCallBackFn
        //}

        MSCordovaBLE.MySetting.ConnectCallBackFn(result); //呼叫外部的 ConnectCallBackFn

        MSCordovaBLE.discoverDeviceServices(result);
      } else if (result.status === "disconnected") {
        MSCordovaBLE.disconnectSuccess(result);
      }
    },
    /*
        取得sUUID與cUUID

         var vUUID = MSCordovaBLE.UUID_List("HC-08");
         vUUID = vUUID.split('^');
         MSCordovaBLE.sUUID = vUUID[0];
         MSCordovaBLE.cUUID = vUUID[1];
        */
    UUID_List: function (DevName) {
      var platform = window.cordova.platformId;
      var sUUID = "";
      var cUUID = "";

      switch (DevName) {
        case "TAIDOC TD4231":
        case "TAIDOC TD4286":
        case "TAIDOC BG":
        case "TAIDOC TD4289":
        case "FORA GD40":
        case "FORA D40":
        case "UniTai TD3261":
        case "DIAMOND CUFF BP":
        case "FORA IR21":
        case "FORA IR20":
        case "FORA IR40":
        case "FORA IR42":
        case "TAIDOC TD1261":
        case "FORA P30 PLUS":
          sUUID = "00001523-1212-EFDE-1523-785FEABCD123";
          cUUID = "00001524-1212-EFDE-1523-785FEABCD123";
          break;
        case "Tyson bio_NCIT":
          sUUID = "0000706D-7547-4F49-5047-676E6F6C7553";
          cUUID = "0200706D-7547-4F49-5047-676E6F6C7553";
          break;
        case "Tysonbio_BPM":
        case "Tyson bio_BPM":
          if (platform === "android") {
            sUUID = "0000FC00-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FCA1-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FC00"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FCA1";
          }
          break;
        case "TSB-631":
          if (platform === "android") {
            sUUID = "0000FFF0-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FFF2-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FFF0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FFF2";
          }
          break;
        case "Tysonbio_BGM":
          if (platform === "android") {
            sUUID = "0000FC00-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FCA1-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FC00"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FCA1";
          }
          break;
        case "Tyson_NC100":
          if (platform === "android") {
            sUUID = "0000FC00-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FCA1-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FC00"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FCA1";
          }
          break;
        case "USB_HOST": //亞培血糖
          if (platform === "android") {
            sUUID = "943D0001-C9AF-4033-AC41-0C857E0EE45A";
            cUUID = "943D0003-C9AF-4033-AC41-0C857E0EE45A";
          } else if (platform === "ios") {
            sUUID = "FC00"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FCA1";
          }
          break;
        //case "FLG-756":
        //    MSCordovaBLE.sUUID = "181D";
        //    MSCordovaBLE.cUUID = "2A9D";
        //    break;
        case "ETB04":
          //case "ETB":
          WriteLog.write(
            "ETB power status..." + Bioptik_ETB04.poweroffIng.toString(),
            "status"
          );
          if (platform === "android") {
            sUUID = "0000FFF0-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FFF1-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FFF0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FFF1";
          }
          break;
        case "ETB05":
          WriteLog.write(
            "ETB power status..." + Bioptik_ETB05.poweroffIng.toString(),
            "status"
          );
          if (platform === "android") {
            sUUID = "0000FFF0-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FFF1-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FFF0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FFF1";
          }
          break;
        case "YBT": //優瑞恩-額溫
          if (platform === "android") {
            sUUID = "0000FFF0-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FFF1-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FFF0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FFF1";
          }
          break;
        case "Bluetooth BP": //優瑞恩-血壓
          if (platform === "android") {
            sUUID = "0000FFF0-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FFF1-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FFF0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FFF1";
          }
          break;
        case "DS3": //樂生
          if (platform === "android") {
            //MSCordovaBLE.sUUID = "0000FFF0-0000-1000-8000-00805F9B34FB";
            //MSCordovaBLE.cUUID = "0000FFF1-0000-1000-8000-00805F9B34FB";
            sUUID = "0000FFF0-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FFF1-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FFF0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FFF1";
          }
          break;
        case "DS5": //樂生
          if (platform === "android") {
            sUUID = "0000FFE0-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FFE2-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FFE0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FFE2";
          }
          break;
        case "Blue2": //森鴻
          sUUID = "f2b32c77-ea68-464b-9cd7-a22cbffb98bd";
          cUUID = "78544003-4394-4fc2-8cfd-be6a00aa701b";
          break;
        case "Mini Grill": //開泰
          if (platform === "android") {
            sUUID = "0000FFF0-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FFF2-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            sUUID = "FFF0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            cUUID = "FFF2";
          }
          break;
        case "MATE1": //手環
          if (platform === "android") {
            sUUID = "00002A37-0000-1000-8000-00805F9B34FB";
            cUUID = "0000FFF1-0000-1000-8000-00805F9B34FB";
          } else if (platform === "ios") {
            //sUUID = "FFF0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
            //cUUID = "FFF1";
          }
          break;
        default:
          if (
            typeof ZYTEMP != "undefined" &&
            ZYTEMP.deviceNameSearching(DevName) == true
          ) {
            //力康血氧
            WriteLog.write("發現new ZYTEMP！", "status");
            //泰菱
            if (platform === "android") {
              sUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
              cUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
              //MSCordovaBLE.cUUID = "2A52";
            } else if (platform === "ios") {
              sUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
              cUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
            }
          } //華廣血糖機是是屬於模糊藍牙名這一類的,所以須採用模糊比對!
          else if (
            typeof Bionime_GM282 != "undefined" &&
            Bionime_GM282.deviceNameSearching(DevName) == true
          ) {
            //華廣血糖機
            if (platform === "android") {
              sUUID = "0000FEE0-0000-1000-8000-00805F9B34FB";
              cUUID = "0000FEE2-0000-1000-8000-00805F9B34FB";
            } else if (platform === "ios") {
              sUUID = "FEE0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
              cUUID = "FEE2";
            }
          } else if (
            typeof HealForce_60F != "undefined" &&
            HealForce_60F.deviceNameSearching(DevName) == true
          ) {
            //力康血氧
            WriteLog.write("發現力康血氧！", "status");
            if (platform === "android") {
              sUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
              cUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
            } else if (platform === "ios") {
              sUUID = "6e400001";
              cUUID = "6e400003";
            }
          } else if (
            typeof Portal_BP != "undefined" &&
            Portal_BP.deviceNameSearching(DevName) == true
          ) {
            //力康血壓
            WriteLog.write("發現new bp！", "status");
            if (platform === "android") {
              sUUID = "0x1810";
              cUUID = "00002A52-0000-1000-8000-00805F9B34FB";
              //cUUID = "2A52";
            } else if (platform === "ios") {
              sUUID = "1810";
              cUUID = "2A52";
            }
          }
      }

      return sUUID + "^" + cUUID;
    }, //發現出藍牙設備上提供了哪些服務
    discoverDeviceServices: function (result) {
      MSCordovaBLE.NowStep = "discoverDeviceServices";
      WriteLog.write("Discover 設備服務中...", "status");

      var platform = window.cordova.platformId;
      //if (Bioptik_ETB04.deviceNameSearching(result.name) == true) {
      //    //聿新科
      //    result.name = "ETB";
      //}
      //if (result.name.length > 5) {
      //    var vTemp = result.name.substr(0, 6);
      //    if (vTemp == "ETB-01-") {
      //        result.name = "ETB";
      //    }
      //}
      var vUUID = MSCordovaBLE.UUID_List(result.name);
      vUUID = vUUID.split("^");
      MSCordovaBLE.sUUID = vUUID[0];
      MSCordovaBLE.cUUID = vUUID[1];

      //確認 Discover
      var vCheckScanAD = function () {
        WriteLog.write("5秒後判斷是否修復 Android discover!", "error");
        setTimeout(function () {
          var tDate = new Date();
          var dDay1 = tDate.getTime();
          if (
            sessionStorage.getItem("checkDiscover_" + result.address) == null
          ) {
            WriteLog.write("啟動修復 Android discover!", "error");

            //MSCordovaBLE.btInitialize();
            //再確認是否還連線著
            bluetoothle.isConnected(
              function () {
                //已連接
                WriteLog.write("啟動修復，連接還存在，立即斷開！", "error");
                MSCordovaBLE.disconnectSuccess({
                  address: result.address,
                });
              },
              function () {
                //已斷開連接
              },
              {
                address: result.address,
              }
            );
          } else {
            WriteLog.write("釋放discover!", "error");
            //sessionStorage["checkDiscover_" + result.address] = null;
            sessionStorage.removeItem("checkDiscover_" + result.address);
          }
        }, 5000);
      };
      vCheckScanAD();
      //確認 Discover

      if (platform === "android") {
        new Promise(function (resolve, reject) {
          //發現設備的 服務/特徵/描述項 這3種資訊。
          //android呼叫一個bluetoothle.discover()就搞定一切
          bluetoothle.discover(resolve, reject, {
            address: result.address,
          });
        }).then(
          MSCordovaBLE.discoverSuccess,
          MSCordovaBLE.handleErrorAndToClose
        );
      } else if (platform === "ios") {
        var arrSevices = [];

        if (result.name === "Mini Grill") {
          arrSevices = ["FFF0", "180A"];
        } else if (
          typeof ZYTEMP != "undefined" &&
          ZYTEMP.deviceNameSearching(result.name) == true
        ) {
          arrSevices = [vUUID[0], vUUID[1]];
        } else {
          arrSevices = [MSCordovaBLE.sUUID];
        }

        new Promise(function (resolve, reject) {
          //ios不像android呼叫一個discover()就搞定一切,ios必須按下面的步驟循序呼叫才能完成等同discover的功能
          // 1. bluetoothle.services()
          // 2. bluetoothle.characteristics()
          // 3. bluetoothle.descriptors()
          bluetoothle.services(resolve, reject, {
            address: result.address,
            services: arrSevices,
          });
        }).then(
          MSCordovaBLE.iOSServicesSuccess,
          MSCordovaBLE.handleErrorAndToClose
        );
      } else {
        WriteLog.write(
          "不支援的平臺: '" + window.cordova.platformId + "'",
          "error"
        );
        MSCordovaBLE.disconnectSuccess(result);
      }
    }, //For Android 的 discover ==> 設備的 服務/特徵/描述項 這3種資訊。

    discoverSuccess: function (result) {
      MSCordovaBLE.NowStep = "discoverSuccess";
      WriteLog.write("Discover 回傳狀態: " + result.status, "status");

      if (result.status === "discovered") {
        //確認是否啟動修復↓↓↓
        var dDay1 = new Date();
        sessionStorage.setItem(
          "checkDiscover_" + result.address,
          dDay1.getTime()
        );
        //確認是否啟動修復↑↑↑

        //2020.8.10 added by sinclair
        if (result.name == "Mini Grill") {
          KT_MINI_GRILL.getMacAddress(result.address, function (sObj) {
            //add item
            result["TrueMAC"] = sObj.value;
            MSCordovaBLE.MySetting.DiscoverCallBackFn(result); //呼叫外部的 ConnectCallBackFn
          });
        } else {
          MSCordovaBLE.MySetting.DiscoverCallBackFn(result); //呼叫外部的 ConnectCallBackFn
        }

        setTimeout(function () {
          MSCordovaBLE.receiveData(
            result.name,
            result.address,
            MSCordovaBLE.sUUID,
            MSCordovaBLE.cUUID
          );
        }, MSCordovaBLE.delayReceive);
      }
    }, //For iOS 的 discover ==> 設備的 服務資訊。

    iOSServicesSuccess: function (result) {
      WriteLog.write("Services 回傳狀態: " + result.status, "status");

      if (result.status === "services") {
        for (var key in result.services) { //foreach 的等價寫法
          //for (var key in objs) ... 其中宣告一個key變數,然後走訪services陣列,key顯示出來會是陣列索引
          var sItem = result.services[key].toString().toUpperCase();
          WriteLog.write("sItem: " + sItem, "status");
          //Log.write(sItem, "iOSServicesSuccess");

          if (
            sItem === MSCordovaBLE.sUUID.toString().toUpperCase() ||
            sItem === "180A"
          ) {
            WriteLog.write("sItem: " + sItem + "符合!", "status");
            //Log.write(sItem, "iOSServicesSuccess 符合");
            new Promise(function (resolve, reject) {
              bluetoothle.characteristics(resolve, reject, {
                address: result.address,
                service: sItem,
                characteristics: [],
              });
            }).then(
              MSCordovaBLE.iOSCharacteristicsSuccess,
              MSCordovaBLE.handleErrorAndToClose
            );
          }
        }
      }
    }, //For iOS 的 discover ==> 設備的 特徵資訊。

    iOSCharacteristicsSuccess: function (result) {
      WriteLog.write("Characteristics 回傳狀態: " + result.status, "status");
      //確認是否啟動修復↓↓↓
      var dDay1 = new Date();
      sessionStorage.setItem(
        "checkDiscover_" + result.address,
        dDay1.getTime()
      );
      //確認是否啟動修復↑↑↑

      if (result.status === "characteristics") {
        Log.write(JSON.stringify(result), "DiscoverCallBackFn");

        //2020.8.10 added by sinclair
        if (result.name == "Mini Grill" && result.service === "180A") {
          KT_MINI_GRILL.getMacAddress(result.address, function (sObj) {
            //add item
            result["TrueMAC"] = sObj.value;
            MSCordovaBLE.MySetting.DiscoverCallBackFn(result); //呼叫外部的 ConnectCallBackFn
          });
        } else {
          MSCordovaBLE.MySetting.DiscoverCallBackFn(result); //呼叫外部的 ConnectCallBackFn
        }

        for (var key in result.characteristics) { //foreach 的等價寫法
          //for (var key in objs) ... 其中宣告一個key變數,然後走訪characteristics物件,key顯示出來會是物件的屬性名稱
          var cItem = result.characteristics[key];
          WriteLog.write("cItem.uuid: " + cItem.uuid, "status");

          if (cItem.uuid.toString().toUpperCase() === MSCordovaBLE.cUUID) {
            //WriteLog.write("result.service: " + result.service + "符合!", "status");
            WriteLog.write("cItem.uuid: " + cItem.uuid + "符合!", "status");

            MSCordovaBLE.receiveData(
              result.name,
              result.address,
              result.service,
              cItem.uuid
            );

            break;
          }
        }
      }
    }, //開始接收藍牙設備傳過來的資料(真正開發建立訂閱)

    receiveData: function (
      deviceName,
      address,
      serviceUuid,
      characteristicsUuid
    ) {
      MSCordovaBLE.NowStep = "receiveData"; //★

      //debug:
      //WriteLog.write("address: " + address, "status");
      //WriteLog.write("serviceUuid: " + serviceUuid, "status");
      //WriteLog.write("characteristicsUuid: " + characteristicsUuid, "status");

      //debug
      WriteLog.write(
        "訂閱... " +
          address +
          "/" +
          serviceUuid +
          "/" +
          characteristicsUuid +
          "(wait:" +
          MSCordovaBLE.delayReceive.toString() +
          ")",
        "debug"
      );

      var returnData = "";
      bluetoothle.subscribe(
        function (result) {
          if (result.status == "subscribed") {
            WriteLog.write("訂閱成功！", "status");

            MSCordovaBLE.dataDispacher(
              result.name,
              address,
              serviceUuid,
              characteristicsUuid,
              ""
            );
          } else if (result.status == "subscribedResult") {
            var gyroscopeValueBytes = bluetoothle.encodedStringToBytes(
              result.value
            );
            //var gyroscopeValueString = bluetoothle.bytesToString(gyroscopeValueBytes);
            //data = gyroscopeValueString;
            returnData = WiseScripts.IO.toHexString(gyroscopeValueBytes); //把收到的資料轉成16進位的字串(以逗號隔開)

            //以下這行是debug用
            //WriteLog.write("從" + result.name + "收到資料: " + returnData, "receive");

            MSCordovaBLE.dataDispacher(
              result.name,
              address,
              serviceUuid,
              characteristicsUuid,
              returnData
            );
          }
        },
        MSCordovaBLE.handleErrorAndToClose,
        {
          address: address,
          service: serviceUuid,
          characteristic: characteristicsUuid,
        }
      );
    }, //解析藍牙資料

    dataDispacher: function (
      deviceName,
      address,
      serviceUuid,
      characteristicsUuid,
      returnData
    ) {
      MSCordovaBLE.NowStep = "dataDispacher";
      MSCordovaBLE.delayReceive = 100; //可能會有問題的subscribe已過去，初始化時間

      //if (Bioptik_ETB04.deviceNameSearching(deviceName) == true) {
      //    //聿新科
      //    deviceName = "ETB";
      //}
      //if (deviceName.length > 5) {
      //    var vTemp = deviceName.substr(0, 6);
      //    if (vTemp == "ETB-01-") {
      //        deviceName = "ETB";
      //    }
      //}

      switch (deviceName) {
        case "HC-08":
          Fusional_HC08.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        case "TAIDOC TD4231":
        case "TAIDOC TD4286":
        case "TAIDOC BG":
        case "TAIDOC TD4289":
        case "FORA GD40":
        case "FORA D40":
        case "UniTai TD3261":
        case "DIAMOND CUFF BP":
        case "FORA IR21":
        case "FORA IR20":
        case "FORA IR40":
        case "FORA IR42":
        case "TAIDOC TD1261":
        case "FORA P30 PLUS":
          //目前泰博的機型有支援並開發出 "回傳多筆紀錄" 的功能
          if (MSCordovaBLE.MySetting.OnlyLastestData == true) {
            //true -> 只回傳最新的一筆紀錄
            TAIDOC.procReturn(
              deviceName,
              address,
              serviceUuid,
              characteristicsUuid,
              returnData
            );
          } //false -> 回傳多筆紀錄
          else {
            TAIDOC_MultiRecord.procReturn(
              deviceName,
              address,
              serviceUuid,
              characteristicsUuid,
              returnData
            );
          }
          break;
        case "Tyson bio_NCIT":
          TysonBio_TP.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        case "Tysonbio_BPM":
        case "Tyson bio_BPM":
          TysonBio_BPM.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        case "TSB-631":
          TSB631.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        case "Tysonbio_BGM":
          TysonBio_BGM.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        case "Tyson_NC100":
          Tyson_NC100.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        case "USB_HOST":
          Freestyle_BG.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        case "YBT": //優瑞恩-額溫
          Urion_BT.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        case "Bluetooth BP": //優瑞恩-血壓
          Urion_BP.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        //case "FLG-756":
        //    OSERIO.procReturn(deviceName, address, serviceUuid, characteristicsUuid, returnData);
        //    break;
        case "ETB04": //聿新科血糖、尿酸、膽固醇三合一
          //case "ETB"://聿新科血壓、血糖、膽固醇三合一

          //目前中山瑞福(大陸)的機型有支援並開發出 "回傳多筆紀錄" 的功能
          if (MSCordovaBLE.MySetting.OnlyLastestData == true) {
            //true -> 只回傳最新的一筆紀錄
            Bioptik_ETB04.procReturn(
              deviceName,
              address,
              serviceUuid,
              characteristicsUuid,
              returnData
            );
          } //false -> 回傳多筆紀錄
          else {
            Bioptik_MultiRecord.procReturn(
              deviceName,
              address,
              serviceUuid,
              characteristicsUuid,
              returnData
            );
          }
          break;
        case "ETB05": //聿新科血糖、尿酸、膽固醇、三酸甘油脂、血紅素 五合一
          //無 "回傳多筆紀錄" 的功能
          if (MSCordovaBLE.MySetting.OnlyLastestData == true) {
            //true -> 只回傳最新的一筆紀錄
            Bioptik_ETB05.procReturn(
              deviceName,
              address,
              serviceUuid,
              characteristicsUuid,
              returnData
            );
          } //false -> 回傳多筆紀錄
          else {
            //Bioptik_MultiRecord.procReturn(deviceName, address, serviceUuid, characteristicsUuid, returnData);
          }
          break;
        case "Blue2":
          //目前森鴻的機型沒有支援並開發出 "回傳多筆紀錄" 的功能
          Blue2_BT.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        case "Mini Grill":
          //目前開泰的機型沒有支援並開發出 "回傳多筆紀錄" 的功能
          KT_MINI_GRILL.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          break;
        case "DS3":
          //樂生
          //if (MSCordovaBLE.MySetting.OnlyLastestData == true)         //true -> 只回傳最新的一筆紀錄
          //{
          Loson_DS3.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          //}
          //else                                                        //false -> 回傳多筆紀錄
          //{//藍牙4.0版沒有做多筆接收
          //    Loson_DS3_MultiRecord.procReturn(deviceName, address, serviceUuid, characteristicsUuid, returnData);
          //}

          break;
        case "DS5":
          //樂生
          //if (MSCordovaBLE.MySetting.OnlyLastestData == true)         //true -> 只回傳最新的一筆紀錄
          //{
          Loson_DS5.procReturn(
            deviceName,
            address,
            serviceUuid,
            characteristicsUuid,
            returnData
          );
          //}
          //else                                                        //false -> 回傳多筆紀錄
          //{//藍牙4.0版沒有做多筆接收
          //    Loson_DS3_MultiRecord.procReturn(deviceName, address, serviceUuid, characteristicsUuid, returnData);
          //}

          break;
        default:
          //華廣血糖機是是屬於模糊藍牙名這一類的,所以須採用模糊比對!
          if (
            typeof Bionime_GM282 != "undefined" &&
            Bionime_GM282.deviceNameSearching(deviceName) == true
          ) {
            //華廣血糖機
            //目前華廣的機型有支援並開發出 "回傳多筆紀錄" 的功能
            if (MSCordovaBLE.MySetting.OnlyLastestData == true) {
              //true -> 只回傳最新的一筆紀錄
              Bionime_GM282.procReturn(
                deviceName,
                address,
                serviceUuid,
                characteristicsUuid,
                returnData
              );
            } //false -> 回傳多筆紀錄
            else {
              Bionime_MultiRecord.procReturn(
                deviceName,
                address,
                serviceUuid,
                characteristicsUuid,
                returnData
              );
            }
          } else if (
            typeof HealForce_60F != "undefined" &&
            HealForce_60F.deviceNameSearching(deviceName) == true
          ) {
            //華廣血糖機
            //力康血氧
            //WriteLog.write("剖析力康血氧！", "status");
            HealForce_60F.procReturn(
              deviceName,
              address,
              serviceUuid,
              characteristicsUuid,
              returnData
            );
          } else if (
            typeof ZYTEMP != "undefined" &&
            ZYTEMP.deviceNameSearching(deviceName) == true
          ) {
            //華廣血糖機
            //WriteLog.write("剖析new ZYTEMP！", "status");
            //血壓
            ZYTEMP.procReturn(
              deviceName,
              address,
              serviceUuid,
              characteristicsUuid,
              returnData
            );
          }
        //else if (Portal_BP.deviceNameSearching(deviceName) == true)//華廣血糖機
        //{
        //    WriteLog.write("剖析new bp！", "status");
        //    //血壓
        //    Portal_BP.procReturn(deviceName, address, serviceUuid, characteristicsUuid, returnData);

        //}
      }
    }, //解除訂閱

    unReceiveData: function (address, serviceUuid, characteristicsUuid) {
      new Promise(function (resolve, reject) {
        bluetoothle.unsubscribe(resolve, reject, {
          address: address,
          service: serviceUuid,
          characteristic: characteristicsUuid,
        });
      }).then(
        MSCordovaBLE.unsubscribeSuccess,
        MSCordovaBLE.handleErrorAndToClose
      );
    },

    unsubscribeSuccess: function (result) {
      WriteLog.write("取消訂閱成功！", "status");
      WriteLog.write(result);
    }, //斷開藍牙連接

    disconnectSuccess: function (result) {
      WriteLog.write("從設備斷開藍牙連接！", "status");
      WriteLog.write(result);

      //官網文件說從iOS 10開始,藍芽close之前一定要先呼叫disconnect才行 !!!
      //但是因為iOS在處理disconnect的速度沒有很快速(猜想可能是iOS較嚴謹之故)!藍芽設備已經關了導致接下close無法再與藍芽設備溝通而出錯.
      //故在此依舊採取與android做法一致,不呼叫disconnect直接close藍芽~
      if (window.cordova.platformId === "ios") {
        //20171201
        new Promise(function (resolve, reject) {
          bluetoothle.disconnect(resolve, reject, {
            address: result.address,
          });
        }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);
      } else if (window.cordova.platformId === "android") {
        new Promise(function (resolve, reject) {
          bluetoothle.close(resolve, reject, {
            address: result.address,
          });
        }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);
      }

      //new Promise(function (resolve, reject) {

      //        bluetoothle.disconnect(resolve, reject,
      //        {
      //            address: result.address
      //        });
      //}).then(function () {
      //    WriteLog.write("disconnect！", "status");
      //        new Promise(function (resolve, reject) {

      //            bluetoothle.close(resolve, reject,
      //                {
      //                    address: result.address
      //                });
      //        }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);

      //    }, MSCordovaBLE.handleError);
    },

    closeSuccess: function (result) {
      WriteLog.write("關閉連線！", "status");
      //WriteLog.write(result);
      //Bioptik_ETB04.poweroffIng = false;

      //程式先擋住一段時間再往下執行
      var Wait = function () {
        if (window.cordova.platformId === "android") {
          setTimeout(function () {
            MSCordovaBLE.foundDevices = [];
            WriteLog.write("休息1000微秒！");
          }, 1000); //1000微秒
        } else if (window.cordova.platformId === "ios") {
          setTimeout(function () {
            MSCordovaBLE.foundDevices = [];
            WriteLog.write("休息3000微秒！");
          }, 3000); //3000微秒
        }
      };

      var WaitForSingleDevicePoolingMode = function () {
        if (window.cordova.platformId === "android") {
          setTimeout(function () {
            MSCordovaBLE.foundDevices = [];
            WriteLog.write("休息1000微秒！");
            SingleDevicePooling.devicePooling();
          }, 1000); //1000微秒
        } else if (window.cordova.platformId === "ios") {
          setTimeout(function () {
            MSCordovaBLE.foundDevices = [];
            WriteLog.write("休息3000微秒！");
            SingleDevicePooling.devicePooling();
          }, 3000); //3000微秒
        }
      };

      if (MSCordovaBLE.MySetting.SingleDevicePoolingMode == true) {
        WaitForSingleDevicePoolingMode(); //pooling 單一藍牙設備模式
      } else {
        Wait(); //正常的scan模式
      }

      //移除已連線清單
      for (var i = 0; i < MSCordovaBLE.connDevices.length; i++) {
        var vItem = MSCordovaBLE.connDevices[i];
        if (vItem.address == result.address) {
          MSCordovaBLE.connDevices.splice(i, 1);
          i--;
        }
      }
    },

    reportValue: function (serviceUuid, characteristicUuid, value) {
      document.getElementById(
        serviceUuid + "." + characteristicUuid
      ).textContent = value;
    },

    //-------------------------------------------
    //與藍牙權限有關的函式
    hasPermission: function (successFn, errFn) {
      bluetoothle.hasPermission(function (result) {
        var hasPermission = result.hasPermission;

        if (hasPermission === false) {
          bluetoothle.requestPermission(
            function (result) {
              var requestPermission = result.requestPermission;

              if (successFn) {
                successFn(requestPermission);
              }
              MSCordovaBLE.requestPermissionSuccess(requestPermission);
            },
            function (result) {
              if (errFn) {
                errFn(result);
              }
              MSCordovaBLE.handleError(result);
            }
          );
        } else {
          if (successFn) {
            successFn(hasPermission);
          }
        }
      });
    },
    requestPermissionSuccess: function (result) {
      WriteLog.write("requestPermissionSuccess" + result);
    },
    hasPermissionBtScan: function (successFn, errFn) {
      WriteLog.write("hasPermissionBtScan");

      bluetoothle.hasPermissionBtScan(function (result) {
        WriteLog.write("requestPermissionBtScan 1:" + JSON.stringify(result));

        var hasPermission = result.hasPermission;

        if (hasPermission === false) {
          bluetoothle.requestPermissionBtScan(
            function (result) {
              WriteLog.write(
                "requestPermissionBtScan 2:" + JSON.stringify(result)
              );

              var requestPermission = result.requestPermission;

              if (successFn) {
                successFn(requestPermission);
              }
              MSCordovaBLE.requestPermissionBtScanSuccess(requestPermission);
            },
            function (result) {
              if (errFn) {
                errFn(result);
              }
              MSCordovaBLE.handleError(result);
            }
          );
        } else {
          //WriteLog.write(result);
          if (successFn) {
            successFn(hasPermission);
          }
        }
      });
    },
    requestPermissionBtScanSuccess: function (result) {
      WriteLog.write("requestPermissionBtScanSuccess" + result);
    },
    hasPermissionBtConnect: function (successFn, errFn) {
      WriteLog.write("hasPermissionBtConnect");

      bluetoothle.hasPermissionBtConnect(function (result) {
        var hasPermission = result.hasPermission;

        if (hasPermission === false) {
          bluetoothle.requestPermissionBtConnect(
            function (result) {
              var requestPermission = result.requestPermission;

              if (successFn) {
                successFn(requestPermission);
              }
              MSCordovaBLE.requestPermissionBtConnectSuccess(requestPermission);
            },
            function (result) {
              if (errFn) {
                errFn(result);
              }
              MSCordovaBLE.handleError(result);
            }
          );
        } else {
          //WriteLog.write(result);
          if (successFn) {
            successFn(hasPermission);
          }
        }
      });
    },
    requestPermissionBtConnectSuccess: function (result) {
      WriteLog.write("requestPermissionBtConnectSuccess:" + result);
    },
    isLocationEnabledSuccess: function (result) {
      if (result.isLocationEnabled === false) {
        bluetoothle.requestLocation(
          MSCordovaBLE.requestLocationSuccess,
          MSCordovaBLE.handleError
        );
      } else {
        //WriteLog.write(result);
      }
    },

    requestLocationSuccess: function (result) {
      WriteLog.write(result);
    },
    //-------------------------------------------
    //與錯誤處理有關的函式
    handleError: function (error) {
      var msg;
      if (error.error && error.message) {
        var errorItems = [];
        if (error.service) {
          errorItems.push(
            "service: " + (uuids[error.service] || error.service)
          );
        }

        if (error.characteristic) {
          errorItems.push(
            "characteristic: " +
              (uuids[error.characteristic] || error.characteristic)
          );
        }

        msg =
          "Error on " +
          error.error +
          ": [" +
          error.name +
          "/" +
          error.address +
          "] " +
          error.message +
          (errorItems.length && " (" + errorItems.join(", ") + ")");
      } else {
        msg = error;
      }
      WriteLog.write(msg, "error");

      if (error.error === "read" && error.service && error.characteristic) {
        MSCordovaBLE.reportValue(
          error.service,
          error.characteristic,
          "Error: " + error.message
        );
      }
    },

    handleErrorAndToClose: function (error) {
      if (MSCordovaBLE.NowStep == "receiveData") {
        //在訂閱時出錯，為了解決service not found問題!延遲下一次訂閱時間
        if (
          MSCordovaBLE.delayReceive < 1000 ||
          MSCordovaBLE.delayReceive > 10000
        ) {
          MSCordovaBLE.delayReceive = 2000;
        } else if (MSCordovaBLE.delayReceive <= 10000) {
          MSCordovaBLE.delayReceive *= 2;
        }
      }
      MSCordovaBLE.NowStep = "handleErrorAndToClose";
      MSCordovaBLE.handleError(error);
      //---------------------------------------
      new Promise(function (resolve, reject) {
        bluetoothle.close(resolve, reject, {
          address: error.address,
        });
      }).then(MSCordovaBLE.closeSuccess, function (error) {
        MSCordovaBLE.handleError(error);
        //MSCordovaBLE.closeSuccess("關閉失敗，強制清空!");
      });
    }, //檢查 deviceName 是否在設備清單(db)中
    //-------------------------------------------
    //Sqlite DB 處理函式

    inDeviceList: function (deviceName, callBack) {
      if (deviceName == null) {
        callBack(false);
        return;
      }
      //-----------------------------------------------------------
      //modified by jerry 20180612，處理模糊藍牙名
      if (
        (typeof Bionime_GM282 != "undefined" &&
          Bionime_GM282.deviceNameSearching(deviceName) == true) || //如果確定是 華廣血糖機(具有模糊藍牙名)就不用檢查,則一概回傳 true!
        (typeof HealForce_60F != "undefined" &&
          HealForce_60F.deviceNameSearching(deviceName) == true) ||
        (typeof Portal_BP != "undefined" &&
          Portal_BP.deviceNameSearching(deviceName) == true) ||
        (typeof ZYTEMP != "undefined" &&
          ZYTEMP.deviceNameSearching(deviceName) == true)
        // || xxxx_A血糖機.deviceNameSearching(deviceName) == true  //如果確定是 A品牌血糖機(具有模糊藍牙名)就不用檢查,則一概回傳 true!
        // || xxxx_B血糖機.deviceNameSearching(deviceName) == true  //如果確定是 B品牌血糖機(具有模糊藍牙名)就不用檢查,則一概回傳 true!
      ) {
        callBack(true); //不用檢查,一概回傳 true!
        return;
      }

      //if (Bioptik_ETB04.deviceNameSearching(deviceName) == true) {
      //    //聿新科
      //    callBack(true);//不用檢查,一概回傳 true!
      //    return;
      //}
      //-----------------------------------------------------------
      //modified by sinclair 20170930，避免一直open DB造成速度下降
      var vDevList = localStorage.getItem("inDeviceList"); //取得可配對清單
      var _DeviceList = $.parseJSON(vDevList);
      if (_DeviceList.length > 0) {
        for (var i = 0; i < _DeviceList.length; i++) {
          if (
            deviceName != "undefined" &&
            deviceName == _DeviceList[i].DeviceModel
          ) {
            callBack(true);
            return;
          }
        }
        callBack(false);
      } else {
        DAOFn.Query(
          "",
          "select DeviceModel from DevicesInfo",
          function (result) {
            localStorage.setItem("inDeviceList", result);
            _DeviceList = $.parseJSON(result);
            for (var i = 0; i < _DeviceList.length; i++) {
              if (
                deviceName != "undefined" &&
                deviceName == _DeviceList[i].DeviceModel
              ) {
                callBack(true);
                return;
              }
            }
            callBack(false);
          }
        );
      }
      //-----------------------------------------------------------
      //DAOFn.Query('', "select DeviceModel from DevicesInfo",
      //   function (result) {
      //
      //       for (var i = 0; i < _DeviceList.length; i++) {
      //           if (deviceName == _DeviceList[i].DeviceModel &&
      //               deviceName != "undefined" )
      //           {
      //               callBack(true);
      //               return;
      //           }
      //       }
      //       callBack(false);
      //   }
      //);
    }, //根據保留天數來刪除 DeviceLog 的資料

    delDeviceLog: function (flag, filterDays) {
      if (flag) {
        //刪除N天以前的資料
        DAOFn.Query(
          "",
          "delete from DeviceLog where DL_WriteTime < date('now', '-" +
            filterDays +
            " days');",
          function () {}
        );
      }
    }, //寫入設備歷史量測值

    writeHistoryLog: function (dl_Date, dl_Mac, dl_Value) {
      dl_Date = dl_Date.replace("/", "").replace("/", "");
      dl_Date = dl_Date.replace(":", "").replace(";", "");
      dl_Date = dl_Date.replace(" ", "").replace(".", "");
      var Params = {
        DL_Date: dl_Date,
        DL_Mac: dl_Mac,
        DL_Value: dl_Value,
      };
      DAOFn.InsertData("", "DeviceLog", Params, function ResultFun(result) {});
    }, //判斷量測值有沒有重覆：true 沒重覆，false 重覆

    checkHistoryLog: function (dl_Date, dl_Mac, dl_Value, CallBack) {
      dl_Date = dl_Date.replace("/", "").replace("/", "");
      dl_Date = dl_Date.replace(":", "").replace(";", "");
      dl_Date = dl_Date.replace(" ", "").replace(".", "");
      //判斷有沒有重覆
      DAOFn.Query(
        "",
        "select * from DeviceLog where DL_Date='" +
          dl_Date +
          "' and DL_Mac='" +
          dl_Mac +
          "' and DL_Value='" +
          dl_Value +
          "'",
        function ResultFun(result) {
          var objList = $.parseJSON(result);
          if (objList.length == 0) {
            //沒有重覆，新增記錄，並往下做事
            MSCordovaBLE.writeHistoryLog(dl_Date, dl_Mac, dl_Value);

            CallBack(true);
          } else {
            CallBack(false);
          }
        }
      );
    }, //回傳是否在配對清單中

    inPairedList: function (deviceID) {
      var vResult = false;
      var vDevPairObj = [];
      try {
        vDevPairObj = $.parseJSON(localStorage.getItem("BT40P").toString()); //json to object
      } catch (err) {}
      for (var i = 0; i < vDevPairObj.length; i++) {
        if (vDevPairObj[i].DevAdr.toString() == deviceID.toString()) {
          vResult = true;
          break;
        }
      }
      return vResult;
    },

    //sleep: function(time) {//NOT WORK!!!
    //return new Promise((resolve) => setTimeout(resolve, time));
    //}
    sleep: function (milliseconds) {
      //WORK.
      var start = new Date().getTime();
      for (var i = 0; i < 1e7; i++) {
        if (new Date().getTime() - start > milliseconds) {
          break;
        }
      }

      WriteLog.write("休息" + milliseconds + "微秒！");
    }, //移除配對設備(Android only)

    //-------------------------------------------
    //與硬體配對有關的函式

    removePairDevices: function (address, CB, FB) {
      if (window.cordova.platformId === "android") {
        bluetoothle.unbond(
          //做硬體配對
          function (result) {
            WriteLog.write(result.name + " 移除配對成功.", "status");
            if (CB) {
              CB();
            }
          },
          function (err) {
            WriteLog.write(
              err.name + " 無法移除配對! {message: " + err.message + "}",
              "status"
            );
            if (FB) {
              FB();
            }
          },
          {
            address: address,
          }
        );
      }
    }, //設備做硬體配對(Android only)

    addPairDevices: function (address, CB, FB) {
      if (window.cordova.platformId === "android") {
        new Promise(function (resolve, reject) {
          bluetoothle.isBonded(resolve, reject, {
            address: address,
          });
        }).then(function (result) {
          //WriteLog.write(result);
          //MSCordovaBLE.isBondSuccess = false;//這個變數平常都是false,當藍牙設備被Bond成功時,這個變數才會被設成true,

          if (result.isBonded == true) {
            //isBonded = true/false
            WriteLog.write("此設備已經配對過.", "status");
            if (FB !== undefined) {
              FB();
            }
          } else {
            WriteLog.write("此設備尚未配對，自動配對中...", "status");
            bluetoothle.bond(
              //做硬體配對
              function (result) {
                //MSCordovaBLE.isBondSuccess = true;
                WriteLog.write(result.name + " 配對成功.", "status");
                if (CB !== undefined) {
                  CB();
                }
              },
              function (err) {
                WriteLog.write(
                  err.name + " 無法配對! {message: " + err.message + "}",
                  "status"
                );
                if (FB !== undefined) {
                  FB();
                }
              },
              {
                address: result.address,
              }
            );
          }
        }, MSCordovaBLE.handleError);
      }
    },

    //-------------------------------------------
    //獨立設定時間 (這個程式信任的 app 會用到)

    //device = { name: device.name, id: device.id },
    //Success Callback,
    //Failed Callback,
    //是否關機的旗標
    SetTimeAlone: function (Ver, device, SFn, FFn, PowerOffFlag) {
      WriteLog.write("獨立設定時間", "status");

      SetPeripheralTimeAlone.setTimeAloneConnect(
        Ver,
        device,
        SFn,
        FFn,
        PowerOffFlag
      );
    },
    /*
        斷開所有藍牙連線
        MSCordovaBLE.DisAllConnect(function(){});
        */
    DisAllConnect: function (callback) {
      //斷開所有藍牙
      for (var i = 0; i < MSCordovaBLE.connDevices.length; i++) {
        //vItem.address
        var vItem = MSCordovaBLE.connDevices[i];
        MSCordovaBLE.disconnectSuccess(vItem);
      }
      if (callback) {
        callback();
      }
    },
  };
