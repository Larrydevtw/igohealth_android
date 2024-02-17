//==================== Bioptik_ETB04 ===============================
//此程式支援的設備型號:
// 'ETB04' 聿新易立測/中山瑞福(大陸)血糖/尿酸/膽固醇三合一

var Bioptik_ETB04 = Bioptik_ETB04 || {},
  Bioptik_ETB04 = {
    //放目前紀錄index的全域變數
    currentRecordIndex: 0,

    //放總紀錄筆數的全域變數
    storageNumberOfData: 0,

    TestFlag: false, //測試checksum用Flag
    //控制重送 Link 封包的全域變數
    linkResending: true, //true:重送 / false:不重送
    offResending: true, //true:重送 / false:不重送
    poweroffIng: false, //true:目前正處於關機階段 / false:
    resendingCount: 0, //重送次數

    LastPowerOff: true, //收到量測後是否關閉ETB04
    ThisType: "", //此筆記錄類別//1:血糖 2:膽固醇 0:血壓

    procReturn: function (
      deviceName,
      address,
      serviceUuid,
      characteristicsUuid,
      returnData
    ) {
      //debug
      WriteLog.write(deviceName + " Post 封包 = " + returnData, "debug");
      WriteLog.write(
        deviceName + " Post 封包長度 = " + returnData.length,
        "debug"
      );

      switch (deviceName) {
        case "ETB04":
          if (
            !Bioptik_ETB04.poweroffIng &&
            //&& Bioptik_ETB04.linkResending
            returnData == ""
          ) {
            sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
            sessionStorage["DeviceTime" + address] = ""; //宣告出存放設備系統時間的全域變數,並給空字串為初值
            sessionStorage["ReturnValue" + address] = "";

            Bioptik_ETB04.currentRecordIndex = 0; //清空全域變數
            Bioptik_ETB04.storageNumberOfData = 0; //清空全域變數
            //-----------------------------------
            //送出 LINK packet
            Bioptik_ETB04.linkResending = true; //清空全域變數
            Bioptik_ETB04.resendingCount = 0; //清空全域變數

            setTimeout(function () {
              //指標移到最新一筆
              //Bioptik_ETB04.linkResending = false;  //送一次link就好
              Bioptik_ETB04.sendLink(address, serviceUuid, characteristicsUuid);
            }, 1000);
          }
          //else if (!Bioptik_ETB04.poweroffIng
          //    && returnData.indexOf("00,") == 0)  //送LINK後收到的回應...
          //{
          //    Bioptik_ETB04.linkResending = false;
          //    //-----------------------------------
          //    //以藍芽位址取代設備序號資料
          //    Bioptik.getDeviceSerial(address);
          //    //-----------------------------------
          //    //以系統時間取代設備時間資料
          //    Bioptik.getPeripheralTime(address);
          //}
          //else if (!Bioptik_ETB04.poweroffIng
          //    && returnData.indexOf("7B,30,32,23,39,44,7D,") == 0)  //收到 LinkAck{02#9D} 回應...
          //{
          //    Bioptik_ETB04.linkResending = false;
          //    //-----------------------------------
          //    if (Bioptik_ETB04.linkResending == false) {
          //        //以藍芽位址取代設備序號資料
          //        Bioptik.getDeviceSerial(address);
          //        //-----------------------------------
          //        //以系統時間取代設備時間資料
          //        Bioptik.getPeripheralTime(address);
          //    }

          //}
          //else if (!Bioptik_ETB04.poweroffIng
          //    && returnData.indexOf("7B,30,33,") == 0)              //收到 Data 封包資料...
          //{
          //    //從收到的資料中取出量測數據(或錯誤訊息)
          //    Bioptik_ETB04.getMeasurementData(deviceName, address, returnData);
          //    //-----------------------------------

          //    //發送設備關機指令
          //    if (Bioptik_ETB04.LastPowerOff) {
          //        Bioptik_ETB04.offResending = true;           //清空全域變數
          //        Bioptik_ETB04.resendingCount = 0;            //清空全域變數

          //        Bioptik_ETB04.poweroffIng = true;
          //        setTimeout(function () {
          //            if (Bioptik_ETB04.poweroffIng) {
          //                //10秒後沒完成關機，直接勿略進到下一筆
          //                WriteLog.write("10秒等不到關機ACK回應直接改flag ", "debug");
          //                Bioptik_ETB04.poweroffIng = false;

          //            }
          //        }, 10000);

          //        //setTimeout(function () {
          //        Bioptik_ETB04.powerOff(address, serviceUuid, characteristicsUuid);
          //        //Bioptik_ETB04.reSend(address, serviceUuid, characteristicsUuid);
          //    //}, 5000);

          //            //var vR = {};
          //            //vR["address"] = address;
          //            //MSCordovaBLE.disconnectSuccess(vR);

          //    }

          //}
          //else if (returnData.indexOf("7B,5A,23,") == 0)  //收到關機ACK 封包 {06#99}回應...
          //{//2020.06.06聿新已告知，不會有關機回應
          //    Bioptik_ETB04.poweroffIng = false;
          //    //debug
          //    WriteLog.write("收到關機ACK回應資料 = " + returnData, "debug");

          //    Bioptik_ETB04.offResending = false;
          //    //-----------------------------------
          //    //解除資料訂閱
          //    MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);

          //    //根據保留天數來刪除 DeviceLog 的資料
          //    //MSCordovaBLE.delDeviceLog(MSCordovaBLE.MySetting.FilterHistoryData, MSCordovaBLE.MySetting.FilterHistoryDays);
          //}
          else if (
            !Bioptik_ETB04.poweroffIng &&
            returnData.indexOf("7B,4C,") == 0
          ) {
            //三合一血壓機
            var dataBuffer = Bionime.parseHexStringToByteArr(returnData);
            var vMD_tmp = Bionime.binArrToString(dataBuffer);
            WriteLog.write("量測值字串: " + vMD_tmp, "info");

            Bioptik_ETB04.linkResending = false;
            //-----------------------------------
            if (Bioptik_ETB04.linkResending == false) {
              //以藍芽位址取代設備序號資料
              Bioptik.getDeviceSerial(address);
              //-----------------------------------
              //以系統時間取代設備時間資料
              Bioptik.getPeripheralTime(address);
              //下指令取得最新一筆量測類別
              Bioptik_ETB04.sendLinkD(
                address,
                serviceUuid,
                characteristicsUuid,
                "S"
              );
            }
          } else if (
            !Bioptik_ETB04.poweroffIng &&
            returnData.indexOf("7B,53,") == 0
          ) {
            //三合一血壓機
            //Response:{S「m」nnnttt#<cs>}
            //1:血糖 2:膽固醇 0:血壓
            var dataBuffer = Bionime.parseHexStringToByteArr(returnData);
            var vMD_tmp = Bionime.binArrToString(dataBuffer);
            Bioptik_ETB04.ThisType = vMD_tmp.substr(2, 1);
            //下指令取得量測值
            Bioptik_ETB04.sendLinkD(
              address,
              serviceUuid,
              characteristicsUuid,
              "D"
            );
          } else if (
            !Bioptik_ETB04.poweroffIng &&
            returnData.indexOf("7B,44,") == 0
          ) {
            //三合一血壓機
            Log.write(returnData, "ETB04 Data");
            //var dataBuffer = Bionime.parseHexStringToByteArr(returnData);
            //var vMD_tmp = Bionime.binArrToString(dataBuffer);
            //WriteLog.write("量測值字串: " + vMD_tmp, "info");

            if (returnData.substr(returnData.length - 3, 2) == "7D") {
              ////從收到的資料中取出量測數據(或錯誤訊息) //資料正確會分兩部分傳輸，如果此階段結尾已有7D，才開始接收解析資料
              Bioptik_ETB04.getMeasurementData(deviceName, address, returnData);
            } else {
              sessionStorage["ReturnValue" + address] = returnData;
            }

            ////-----------------------------------

            ////發送設備關機指令
            //if (Bioptik_ETB04.LastPowerOff) {
            //    Bioptik_ETB04.offResending = true;           //清空全域變數
            //    Bioptik_ETB04.resendingCount = 0;            //清空全域變數

            //    Bioptik_ETB04.poweroffIng = true;
            //    setTimeout(function () {
            //        if (Bioptik_ETB04.poweroffIng) {
            //            //3秒後沒完成關機，直接勿略進到下一筆
            //            WriteLog.write("3秒等不到關機ACK回應直接改flag ", "debug");
            //            Bioptik_ETB04.poweroffIng = false;

            //            //再確認是否還連線著
            //            bluetoothle.isConnected(
            //                function () {
            //                    //已連接
            //                    WriteLog.write("改flag後，連接還存在，立即斷開！", "status");
            //                    MSCordovaBLE.disconnectSuccess({ address: address });

            //                }
            //                , function () {
            //                    //已斷開連接

            //                }, { address: address });
            //        }
            //    }, 3000);

            //    //解除資料訂閱
            //    MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);

            //    Bioptik_ETB04.powerOff(address, serviceUuid, characteristicsUuid);

            // }
          } else if (
            !Bioptik_ETB04.poweroffIng &&
            sessionStorage["ReturnValue" + address].toString() != "" &&
            returnData.substr(returnData.length - 3, 2) == "7D"
          ) {
            //三合一血壓機
            Log.write(returnData, "ETB04 Data");
            returnData =
              sessionStorage["ReturnValue" + address].toString() + returnData;
            sessionStorage["ReturnValue" + address] = returnData;

            //===========驗證checksum start =============================
            //先把傳入的Hex文字串轉成byte陣列
            var dataBuffer = Bionime.parseHexStringToByteArr(returnData);
            var vChkSum = Bioptik_ETB04.ETB_CheckSum(dataBuffer);
            if (
              Bioptik_ETB04.TestFlag ||
              vChkSum != dataBuffer[dataBuffer.length - 2]
            ) {
              //alert("CheckSum Error");
              Bioptik_ETB04.TestFlag = false;

              //MSCordovaBLE.MySetting.ResultCallBackFn(""); //呼叫外部的 ResultCallBackFn
              MSCordovaBLE.MySetting.ErrorCallBackFn("CheckSum Error");

              ////斷開藍牙再重新連接一次
              //var vResult = {
              //    address: address
              //    , MEMO: "ETB04不關機直接斷開藍牙!"
              //};
              //MSCordovaBLE.disconnectSuccess(vResult);

              Bioptik_ETB04.sendLinkD(
                address,
                serviceUuid,
                characteristicsUuid,
                "D"
              );

              return;
            }
            //===========驗證checksum end =============================

            //從收到的資料中取出量測數據(或錯誤訊息)
            Bioptik_ETB04.getMeasurementData(deviceName, address, returnData);
            //-----------------------------------

            //發送設備關機指令
            if (Bioptik_ETB04.LastPowerOff) {
              Bioptik_ETB04.offResending = true; //清空全域變數
              Bioptik_ETB04.resendingCount = 0; //清空全域變數

              Bioptik_ETB04.poweroffIng = true;
              setTimeout(function () {
                if (Bioptik_ETB04.poweroffIng) {
                  //3秒後沒完成關機，直接勿略進到下一筆
                  WriteLog.write("3秒等不到關機ACK回應直接改flag ", "debug");
                  Bioptik_ETB04.poweroffIng = false;

                  //再確認是否還連線著
                  bluetoothle.isConnected(
                    function () {
                      //已連接
                      WriteLog.write(
                        "改flag後，連接還存在，立即斷開！",
                        "status"
                      );
                      MSCordovaBLE.disconnectSuccess({ address: address });
                    },
                    function () {
                      //已斷開連接
                    },
                    { address: address }
                  );
                }
              }, 3000);

              //解除資料訂閱
              MSCordovaBLE.unReceiveData(
                address,
                serviceUuid,
                characteristicsUuid
              );

              Bioptik_ETB04.powerOff(address, serviceUuid, characteristicsUuid);
            }
          } //收到 ... 資料...
          else {
            //debug
            WriteLog.write(deviceName + " Data 封包 = " + returnData, "debug");
            WriteLog.write(
              deviceName + " Data 封包長度 = " + returnData.length,
              "debug"
            );
          }

          break;
      }
    }, //從收到的資料中取出量測數據

    getMeasurementData: function (deviceName, address, returnData) {
      //傳進來的資料如:7B,30,33,55,30,31,31,2E,39,23,34,45,7D
      //其中:                   55,               <-- 這1個byte是量測數據的種類 47:血糖/55:尿酸/43:膽固醇
      //其中:                      30,31,31,2E,39 <-- 這5個byte是量測數據的值

      var measurementKind = "";
      var measurementValueStr = "";
      var measurementValue = 0.0;

      //先把傳入的Hex文字串轉成byte陣列
      var dataBuffer = Bionime.parseHexStringToByteArr(returnData);

      var vMD_tmp = Bionime.binArrToString(dataBuffer);
      WriteLog.write("量測值字串: " + vMD_tmp, "info");
      if (vMD_tmp.split("#")[0].length == 4) {
        measurementKind = "Err";
        //回傳結果字串(血糖機發出來的錯誤訊息)
        MSCordovaBLE.MySetting.ResultCallBackFn(
          //呼叫外部的 ResultCallBackFn
          deviceName +
            "," +
            sessionStorage["DeviceSerial_" + address] +
            "," +
            sessionStorage["DeviceTime" + address] +
            "," +
            vMD_tmp.substr(2, 2) +
            ",0," +
            measurementKind
        );
      } else {
        //量測數據的值
        measurementValue = "";

        //量測數據的種類
        if (Bioptik_ETB04.ThisType == "0") {
          measurementKind = "P"; //0:血壓
          measurementValue =
            parseInt(vMD_tmp.substr(2, 3)) +
            "," +
            parseInt(vMD_tmp.substr(6, 3)) +
            "," +
            parseInt(vMD_tmp.substr(10, 3));
        } else if (Bioptik_ETB04.ThisType == "1") {
          measurementKind = "G"; //1:血糖
          measurementValue = parseInt(vMD_tmp.substr(2, 4));
        } else if (Bioptik_ETB04.ThisType == "2") {
          measurementKind = "C"; //2:膽固醇
          measurementValue = parseInt(vMD_tmp.substr(2, 4));
        }

        //血糖種類才有用到
        var BloodGlucoseType = 0;

        WriteLog.write(
          "量測值: " +
            deviceName +
            " " +
            measurementKind +
            ":" +
            measurementValue +
            "/Type:" +
            BloodGlucoseType,
          "info"
        );

        //出現不正常數值時，捨棄
        if (measurementValue == "") {
          MSCordovaBLE.MySetting.ResultCallBackFn(""); //呼叫外部的 ResultCallBackFn
          MSCordovaBLE.MySetting.ErrorCallBackFn("Err007");
        } else {
          //是否需要過慮歷史資料
          if (MSCordovaBLE.MySetting.FilterHistoryData) {
            //以  時間+address+全部量測值  這3項來查詢 DeviceLog 資料表 是否已有紀錄存在
            MSCordovaBLE.checkHistoryLog(
              sessionStorage["DeviceTime" + address],
              address,
              measurementValue,
              function (flag) {
                if (flag) {
                  //checkHistoryLog()是判斷量測值有沒有重覆：true 沒重覆，false 重覆
                  //回傳結果字串
                  MSCordovaBLE.MySetting.ResultCallBackFn(
                    //呼叫外部的 ResultCallBackFn
                    deviceName +
                      "," +
                      sessionStorage["DeviceSerial_" + address] +
                      "," +
                      sessionStorage["DeviceTime" + address] +
                      "," +
                      measurementValue +
                      "," +
                      BloodGlucoseType +
                      "," +
                      measurementKind
                  );
                } else {
                  MSCordovaBLE.MySetting.ErrorCallBackFn("Err006");
                  //此數值已量測過
                }
              }
            );
          } else {
            //回傳結果字串
            MSCordovaBLE.MySetting.ResultCallBackFn(
              //呼叫外部的 ResultCallBackFn
              deviceName +
                "," +
                sessionStorage["DeviceSerial_" + address] +
                "," +
                sessionStorage["DeviceTime" + address] +
                "," +
                measurementValue +
                "," +
                BloodGlucoseType +
                "," +
                measurementKind
            );
          }
        }
      }

      //如果不給關機指令，就直接斷開藍牙
      if (!Bioptik_ETB04.LastPowerOff) {
        var vResult = {
          address: address,
          MEMO: "ETB04不關機直接斷開藍牙!",
        };

        MSCordovaBLE.disconnectSuccess(vResult);
      }
    }, //藍芽連結後App會送出 LINK packet,並等待回復(LinkAck),若無回復,則定時重傳(每秒傳一次),再等待 LINK

    sendLink: function (address, serviceUuid, characteristicsUuid) {
      //var LinkCmd = '01' + WiseScripts.Format.Date_yyyyMMddHHmmss(new Date(), true).substr(2, 14);
      var LinkCmd = "01" + DateTimeFun.getNow().substr(2, 14);

      //var CkNo = Bioptik_ETB04.checksumByte(LinkCmd);
      //LinkCmd = "{" + LinkCmd + "#" + CkNo + "}";  //LinkCmd: {01170331145030#42}

      //WriteLog.write("Link指令：" + LinkCmd, "status");
      //-----------------------------------------------------------
      var buffer = Bioptik.StrToUint8Arr(LinkCmd);
      buffer = new Uint8Array([0x7b, 0x4c, 0x23, 0xef, 0x7d]);
      var encodedString = bluetoothle.bytesToEncodedString(buffer);

      new Promise(function (resolve, reject) {
        bluetoothle.write(resolve, reject, {
          //type: "noResponse",
          address: address,
          service: serviceUuid,
          characteristic: characteristicsUuid,
          value: encodedString,
        });
      }).then(function (result) {
        WriteLog.write("已成功發送Link Pack.", "status");
        //2019.9.11 added by sinclair,line發送一次就好
        //Bioptik_ETB04.linkResending = false;
      }, MSCordovaBLE.handleErrorAndToClose);
      //-----------------------------------------------------------

      var maxResendTimes = 20; //重送 Link Pack

      setTimeout(function () {
        if (
          Bioptik_ETB04.linkResending == true &&
          Bioptik_ETB04.poweroffIng == false
        ) {
          if (Bioptik_ETB04.resendingCount < maxResendTimes) {
            WriteLog.write("重新發送Link Pack...", "status");
            Bioptik_ETB04.resendingCount++;

            Bioptik_ETB04.sendLink(address, serviceUuid, characteristicsUuid);
          } else if (Bioptik_ETB04.resendingCount >= maxResendTimes) {
            //如果重送 Link Pack 5次以上還無法跟設備進行溝通,就自動斷開藍牙,讓設備重新連線...
            new Promise(function (resolve, reject) {
              bluetoothle.close(resolve, reject, {
                address: address,
              });
            }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);
          }
        }
      }, 2000); //1000
    }, //藍芽連結後App會送出 LINK packet,並等待回復(LinkAck),若無回復,則定時重傳(每秒傳一次),再等待 LINK
    sendLinkD: function (
      address,
      serviceUuid,
      characteristicsUuid,
      inputLinkCmd
    ) {
      //var LinkCmd = '01' + WiseScripts.Format.Date_yyyyMMddHHmmss(new Date(), true).substr(2, 14);
      var LinkCmd = inputLinkCmd;

      //var CkNo = Bioptik_ETB04.checksumByte(LinkCmd);
      //LinkCmd = "{" + LinkCmd + "#" + CkNo + "}";  //LinkCmd: {01170331145030#42}

      //WriteLog.write("Link指令：" + LinkCmd, "status");
      //-----------------------------------------------------------
      var buffer = null; //Bioptik.StrToUint8Arr(LinkCmd);
      if (inputLinkCmd == "S") {
        buffer = new Uint8Array([0x7b, 0x53, 0x23, 0xf0, 0x7d]);
      } else if (inputLinkCmd == "D") {
        buffer = new Uint8Array([0x7b, 0x44, 0x23, 0xe7, 0x7d]);
      }

      var encodedString = bluetoothle.bytesToEncodedString(buffer);

      new Promise(function (resolve, reject) {
        bluetoothle.write(resolve, reject, {
          //type: "noResponse",
          address: address,
          service: serviceUuid,
          characteristic: characteristicsUuid,
          value: encodedString,
        });
      }).then(function (result) {
        WriteLog.write("已成功發送Link Pack.[" + inputLinkCmd + "]", "status");
      }, MSCordovaBLE.handleErrorAndToClose);
    }, //計算checksum

    checksumByte: function (cmd) {
      //WriteLog.write("Package content：" + cmd, "debug");

      var hexAll = Bioptik.a2hex(cmd, true);
      //WriteLog.write("轉Hex後：" + hexAll, "debug");

      var tmp = hexAll.split(",");

      var Sum = 0;
      for (var i = 0; i < tmp.length; i++) {
        Sum += parseInt(tmp[i]) + 18;
        //Sum += parseInt(tmp.charAt(i));
      }
      //WriteLog.write("總合" + Sum + "(16進位：" + Sum.toString(16) + ")", "debug");

      var TheSum = WiseScripts.IO.padLeft(Sum.toString(16), 2, "0");

      //取最低兩位數
      var D2L =
        TheSum.toString(16).charAt(TheSum.length - 2) +
        TheSum.charAt(TheSum.length - 1);

      //WriteLog.write('最低兩位數：' + D2L + " (二進位：" + WiseScripts.IO.padLeft(parseInt(D2L, 16).toString(2), 8, '0') + ")", "debug");
      D2L = WiseScripts.IO.padLeft(parseInt(D2L, 16).toString(2), 8, "0");

      //算補數
      var tmp = D2L;

      D2L = "";
      for (var i = 0; i < tmp.length; i++) {
        D2L += parseInt(tmp.charAt(i)) == 0 ? "1" : "0";
      }
      //WriteLog.write("2的補數：" + D2L, "debug");

      var CkNo = parseInt(D2L, 2).toString(16).toUpperCase();
      //WriteLog.write('轉16進位後，驗證碼為' + CkNo, "debug");

      return CkNo;
    }, //發送ReSend  (目前已無使用)
    reSend: function (address, serviceUuid, characteristicsUuid) {
      var LinkCmd = "04";

      var CkNo = Bioptik_ETB04.checksumByte(LinkCmd);

      var buffer = Bioptik.StrToUint8Arr("{" + LinkCmd + "#" + CkNo + "}");

      var encodedString = bluetoothle.bytesToEncodedString(buffer);

      new Promise(function (resolve, reject) {
        bluetoothle.write(resolve, reject, {
          type: "noResponse",
          address: address,
          service: serviceUuid,
          characteristic: characteristicsUuid,
          value: encodedString,
        });
      }).then(function () {
        //resend OK
        WriteLog.write("發送Resend...OK", "status");
        Bioptik_ETB04.powerOff(address, serviceUuid, characteristicsUuid);
      }, MSCordovaBLE.handleErrorAndToClose);
    }, //發送設備關機指令
    powerOff: function (address, serviceUuid, characteristicsUuid) {
      //var buffer = Bioptik.StrToUint8Arr("{05#9A}");
      var buffer = new Uint8Array([0x7b, 0x5a, 0x23, 0xf9, 0x7d]);
      var encodedString = bluetoothle.bytesToEncodedString(buffer);
      WriteLog.write("發送關機指令...", "status");
      new Promise(function (resolve, reject) {
        bluetoothle.write(resolve, reject, {
          //type: "noResponse",
          address: address,
          service: serviceUuid,
          characteristic: characteristicsUuid,
          value: encodedString,
        });
      }).then(
        Bioptik_ETB04.writePowerOffSuccess,
        MSCordovaBLE.handleErrorAndToClose
      );
      //-----------------------------------------------------------
      //2019.09.11 marked by sicnlair
      //setTimeout(function () {
      //    if (Bioptik_ETB04.offResending == true) {
      //        if (Bioptik_ETB04.resendingCount < 2)//重送 Off Pack 2次
      //        {
      //            WriteLog.write("重新發送關機指令..." + Bioptik_ETB04.resendingCount, "status");
      //            Bioptik_ETB04.resendingCount++;

      //            Bioptik_ETB04.powerOff(address, serviceUuid, characteristicsUuid);
      //        }
      //        else if (Bioptik_ETB04.resendingCount >= 2) {
      //            //如果重送 Off Pack 2次以上還無法跟設備進行溝通,就自動斷開藍牙,讓設備重新連線...
      //            new Promise(function (resolve, reject) {

      //                bluetoothle.close(resolve, reject,
      //                {
      //                    address: address
      //                });
      //            }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);
      //        }
      //    }
      //}, 2000);
    },

    writePowerOffSuccess: function (result) {
      //WriteLog.write("writePowerOffSuccess() " + result.name + "/" + result.address, "status");
      WriteLog.write("發送關機指令成功...", "status");
      setTimeout(function () {
        MSCordovaBLE.disconnectSuccess(result);
      }, 2000);
    },
    /*
    Bioptik_ETB04.deviceNameSearching('')
//命名規則來判斷是否為聿新科的機器! 
    */
    deviceNameSearching: function (deviceName) {
      var rv = false;
      var index = 0;
      //-------------------------------------------------------------------------------
      if (deviceName == undefined) {
        return false;
      } //如果deviceName是空,就一律回傳 false!

      //上面這個判斷很重要!! 因為有很大比例 scan 機制掃到的藍牙裝置是不帶 deviceName 的,如果沒上面這個判斷式擋著
      //則大部份的時間都會出錯,因為 startScanSuccess() 裡面大量呼叫 MSCordovaBLE.inDeviceList() 這個函式
      //而 inDeviceList() 裡面就會用到 deviceNameSearching(deviceName),此時如果 deviceName == null 沒擋住
      //則整個程式一定必死無疑 !!!
      //-------------------------------------------------------------------------------
      index = deviceName.toString().search("ETB*"); //比對規則
      //例如 "2282RAA0429" , "2282RAD0003" 這個字串就符合上述的規則
      //找不到:回傳-1, 否則:回傳0或以上的整數
      //-----------------------------------
      if (index == 0) {
        //要從最左邊開始match到才算
        rv = true; //有比對到~
      } else if (index > 0) {
        //即便在中間以後match到也不算!
        rv = false; //沒有比對到!
      } else {
        rv = false; //沒有比對到!
      }
      //-----------------------------------

      return rv;
    },
    /*
    var buffer = new Uint8Array([0x7B, 0x4C, 0x23, 0xEF, 0x7D]);
    ETB04.ETB_CheckSum(buffer);
   傳回16進制checksum
    */
    ETB_CheckSum: function (mBuffer) {
      var xLeft = 0x7b; //{
      var xRight = 0x23; //#
      var vXOR_Result = null;
      for (var i = 0; i < mBuffer.length; i++) {
        if (mBuffer[i] == xLeft) {
          i++;
          vXOR_Result = mBuffer[i];
        } else if (mBuffer[i] == xRight) {
          vXOR_Result = vXOR_Result ^ mBuffer[i]; //XOR
          vXOR_Result = vXOR_Result | 0x80; //OR
          break;
        } else if (vXOR_Result != null) {
          vXOR_Result = vXOR_Result ^ mBuffer[i]; //XOR
        }
      }
      return vXOR_Result;
      //return vXOR_Result.toString(16).toUpperCase();
    },
  };
