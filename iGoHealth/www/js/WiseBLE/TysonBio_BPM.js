//==================== TysonBio_BPM ===============================
//此程式支援的設備型號:
// 'Tysonbio_BPM' 台欣血壓
// 'Tyson bio_BPM' 台欣血壓

var TysonBio_BPM = TysonBio_BPM || {}, TysonBio_BPM = {
    canReceiveFlag: false,//此旗標作為判斷血壓機是否已開始進行量測

    procReturn: function (deviceName, address, serviceUuid, characteristicsUuid, returnData)
    {
        switch (deviceName) {
            case "Tysonbio_BPM":
            case "Tyson bio_BPM":
                var writeServiceUuid = "";
                var writeCharacteristicsUuid = "";

                if (window.cordova.platformId === "android") {
                    writeServiceUuid = "0000FC00-0000-1000-8000-00805F9B34FB";
                    writeCharacteristicsUuid = "0000FCA0-0000-1000-8000-00805F9B34FB";
                }
                else if (window.cordova.platformId === "ios") {
                    writeServiceUuid = "FC00";          //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
                    writeCharacteristicsUuid = "FCA0";
                }

                //台欣這一款血壓機只要藍牙連線成功就會每100ms發送一次上回量測紀錄,而且是相同資料不斷的發送,直到量測開始.
                //發送資料如下:
                //08 01 B8 00 71 4C 50 CE 07 01 BD 11 0B 0F F0 06 01 BE 0C 19 EA
                //08 01 B8 00 71 4C 50 CE 07 01 BD 11 0B 0F F0 06 01 BE 0C 19 EA
                //08 01 B8 00 71 4C 50 CE 07 01 BD 11 0B 0F F0 06 01 BE 0C 19 EA
                //08 01 B8 00 71 4C 50 CE 07 01 BD 11 0B 0F F0 06 01 BE 0C 19 EA
                // ... 相同資料不斷的發送 ...
                //
                //資料格式如下:
                //08 01 B8 00 71 4C 50 CE 07 01 BD 11 0B 0F F0 06 01 BE 0C 19 EA
                //
                //08 01 B8 <-- 血壓計發送測量結果或歷史記錄 表頭
                //            71 <-- 收縮壓
                //               4C <-- 舒張壓
                //                  50 <-- 心率
                //                     CE <-- checksum
                //                        07 01 BD <-- 血壓計上傳結果測量的日期 表頭
                //                                 11 <-- 年
                //                                    0B <-- 月
                //                                       0F <-- 日
                //                                          F0 <-- checksum
                //                                             06 01 BE <-- 血壓計上傳結果測量的時間 表頭
                //                                                      0C <-- 時
                //                                                         19 <-- 分
                //                                                            EA <-- checksum
                                

                if (returnData == "")
                {
                    sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
                    sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值            
                    
                    //-----------------------------------                    
                    // //寫入測試指令到設備上
                    //TysonBio_BPM.testCommand(
                    //    address,
                    //    //serviceUuid,
                    //    //characteristicsUuid       //台欣這組是只具有 notify 權限的 UUID,不能拿來寫入資料
                    //    writeServiceUuid,
                    //    writeCharacteristicsUuid);  //要使用台欣這組具有 write 權限的 UUID

                    //-----------------------------------                    
                    //寫入系統時間到設備上
                    TysonBio_BPM.setTime(
                        address,
                        //serviceUuid,
                        //characteristicsUuid       //台欣這組是只具有 notify 權限的 UUID,不能拿來寫入資料
                        writeServiceUuid,
                        writeCharacteristicsUuid,   //要使用台欣這組具有 write 權限的 UUID
                        function (){ },
                        function (){ },
                        false);  
                    // //-----------------------------------                            
                    //MSCordovaBLE.sleep(3000);     //這種指令在Android 5.0/5.1 --> ok, 在Android 6.0 --> 不ok!            
                    // //-----------------------------------                    
                }
                else if (returnData.indexOf("06,01,B7,10,") == 0) //血壓機量測完開始釋放壓力時會送出06,01,B7,10,xx,xx 這樣的資料
                {
                    TysonBio_BPM.canReceiveFlag = true;
                }
                else if (TysonBio_BPM.canReceiveFlag == true &&   //表示血壓機已量測完開始釋放壓力了   
                         returnData.indexOf("08,01,B8,") == 0 &&  //接下來收到的資料就是這一次量測的結果了
                         returnData.indexOf("07,01,BD,") == 24 &&
                         returnData.indexOf("06,01,BE,") == 45 &&
                         returnData.substring(33,36) != "00,")    //要排除掉年份錯誤的資料  
                {
                    TysonBio_BPM.canReceiveFlag = false;
                    //-----------------------------------
                    //從收到的資料中取出設備序號資料(設備的藍牙address)
                    TysonBio.getDeviceSerial(address, returnData);
                    //-----------------------------------                    
                    //從收到的資料中取出量測數據
                    TysonBio_BPM.getMeasurementData(deviceName, address, returnData);
                    //-----------------------------------                    
                    //解除資料訂閱
                    MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);
                    //-----------------------------------
                    if (window.cordova.platformId === "android")
                    {
                        setTimeout(function () {
                            //發送設備關機指令
                            TysonBio_BPM.powerOff(
                                address,
                                writeServiceUuid,
                                writeCharacteristicsUuid);  //要使用台欣這組具有 write 權限的 UUID       
                        }, 22000);//停22秒再關機,讓血壓機語音讀值完畢!
                    }
                    else if (window.cordova.platformId === "ios")
                    {                        
                        setTimeout(function () {
                            //發送設備關機指令
                            TysonBio_BPM.powerOff(
                                address,
                                writeServiceUuid,
                                writeCharacteristicsUuid);  //要使用台欣這組具有 write 權限的 UUID       
                        }, 12000);//停10秒再關機,讓血壓機語音讀值完畢!
                    }
                    //-----------------------------------
                    //根據保留天數來刪除 DeviceLog 的資料
                    MSCordovaBLE.delDeviceLog(MSCordovaBLE.MySetting.FilterHistoryData, MSCordovaBLE.MySetting.FilterHistoryDays);
                }
                else if (returnData.indexOf("04,01,BA,BF") == 0 ||  //表示血壓機被手動關機,因為血壓機關機時會送 04,01,BA,BF 資料出來
                         returnData.indexOf("01,BA,BF") == 0)       //有時04會接在前一次的最後,所以關機時會送 01,BA,BF 資料出來
                {
                    TysonBio_BPM.canReceiveFlag = false;
                    //-----------------------------------
                    //解除資料訂閱
                    MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);
                    //-----------------------------------
                    //發送設備關機指令
                    TysonBio_BPM.powerOff(
                        address,                        
                        writeServiceUuid,
                        writeCharacteristicsUuid);  //要使用台欣這組具有 write 權限的 UUID     
                }
                else if (returnData.indexOf("05,01,B9") == 0)       //表示血壓機發送量測錯誤訊號出來
                {
                    TysonBio_BPM.canReceiveFlag = false;
                    //-----------------------------------
                    //解除資料訂閱
                    MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);
                    //-----------------------------------
                    if (window.cordova.platformId === "android") {
                        setTimeout(function () {
                            //發送設備關機指令
                            TysonBio_BPM.powerOff(
                                address,
                                writeServiceUuid,
                                writeCharacteristicsUuid);  //要使用台欣這組具有 write 權限的 UUID       
                        }, 3000);//停3秒再關機,讓血壓機語音讀值完畢!
                    }
                    else if (window.cordova.platformId === "ios") {
                        setTimeout(function () {
                            //發送設備關機指令
                            TysonBio_BPM.powerOff(
                                address,
                                writeServiceUuid,
                                writeCharacteristicsUuid);  //要使用台欣這組具有 write 權限的 UUID       
                        }, 500);//停0.5秒再關機,讓血壓機語音讀值完畢!
                    }
                }

                break;            
        }
    }

    ,//從收到的資料中取出量測數據
    getMeasurementData: function (deviceName, address, returnData)
    {
        var ReturnString = returnData.split(",");
        switch (deviceName) {            
            case "Tysonbio_BPM":
            case "Tyson bio_BPM":
                
                //傳進來的資料如:
                //08 01 B8 00 71 4C 50 CE 07 01 BD 11 0B 0F F0 06 01 BE 0C 19 EA
                //08 01 B8 <-- 血壓計發送測量結果或歷史記錄 表頭
                //            71 <-- 收縮壓
                //               4C <-- 舒張壓
                //                  50 <-- 心率
                //                     CE <-- checksum                

                //從收到的資料中取出數據時間資料
                TysonBio_BPM.getPeripheralTime(address, returnData);

                //血壓(收縮壓)                        
                var Systolic = parseInt(ReturnString[4], 16).toString(10);
                //血壓(舒張壓)                        
                var Diastolic = parseInt(ReturnString[5], 16).toString(10);
                //脈搏                        
                var Pulse = parseInt(ReturnString[6], 16).toString(10);

                WriteLog.write("量測值： " + deviceName + " " + Systolic + "/" + Diastolic + "/" + Pulse, "info");

                //出現不正常數值時，捨棄                    
                if (parseInt(Systolic) < 1 || parseInt(Diastolic) < 1 || parseInt(Pulse) < 1
                    ||
                    parseInt(Systolic) >= 255 || parseInt(Diastolic) >= 255 || parseInt(Pulse) >= 255)
                {
                    MSCordovaBLE.MySetting.ResultCallBackFn(""); //呼叫外部的 ResultCallBackFn
                    MSCordovaBLE.MySetting.ErrorCallBackFn("Err007");
                }
                else {
                    //是否需要過慮歷史資料
                    if (MSCordovaBLE.MySetting.FilterHistoryData) {
                        //以  時間+address+全部量測值  這3項來查詢 DeviceLog 資料表 是否已有紀錄存在
                        MSCordovaBLE.checkHistoryLog(sessionStorage["DeviceTime" + address], address, Systolic + "," + Diastolic + "," + Pulse,
                            function (flag) {
                                if (flag) {//checkHistoryLog()是判斷量測值有沒有重覆：true 沒重覆，false 重覆
                                    //回傳結果字串
                                    MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                        deviceName + "," +
                                        sessionStorage["DeviceSerial_" + address] + "," +
                                        sessionStorage["DeviceTime" + address] + "," +
                                        Systolic + "," + Diastolic + "," + Pulse);
                                }
                                else {
                                    MSCordovaBLE.MySetting.ErrorCallBackFn("Err006");
                                    //此數值已量測過
                                }
                            });
                    }
                    else {
                        //回傳結果字串
                        MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                        deviceName + "," +
                                        sessionStorage["DeviceSerial_" + address] + "," +
                                        sessionStorage["DeviceTime" + address] + "," +
                                        Systolic + "," + Diastolic + "," + Pulse);
                    }
                }

                break;
        }
    }       

    ,//從收到的資料中取出數據(設備)時間資料
    getPeripheralTime: function (address, returnData)
    {              
        //傳進來的資料如:
        //08 01 B8 00 71 4C 50 CE 07 01 BD 11 0B 0F F0 06 01 BE 0C 19 EA
        //                        07 01 BD <-- 血壓計上傳結果測量的日期 表頭
        //                                 11 <-- 量測數據的 年
        //                                    0B <-- 量測數據的 月
        //                                       0F <-- 量測數據的 日
        //                                          F0 <-- checksum
        //                                             06 01 BE <-- 血壓計上傳結果測量的時間 表頭
        //                                                      0C <-- 量測數據的 時
        //                                                         19 <-- 量測數據的 分
        //                                                            EA <-- checksum


        var ReturnString = returnData.split(",");
                
        var Y = WiseScripts.IO.padLeft(parseInt(ReturnString[11], 16).toString(10), 2, "0");
        var M = WiseScripts.IO.padLeft(parseInt(ReturnString[12], 16).toString(10), 2, "0");
        var D = WiseScripts.IO.padLeft(parseInt(ReturnString[13], 16).toString(10), 2, "0");
        var h = WiseScripts.IO.padLeft(parseInt(ReturnString[18], 16).toString(10), 2, "0");
        var m = WiseScripts.IO.padLeft(parseInt(ReturnString[19], 16).toString(10), 2, "0");
        sessionStorage["DeviceTime" + address] = "20" + Y + "/" + M + "/" + D + " " + h + ":" + m;

        WriteLog.write("數據時間：" + address + "/" + sessionStorage["DeviceTime" + address], "info");        
    }
       
    ,//發送設備關機指令    
    powerOff: function (address, serviceUuid, characteristicsUuid) {
        var buffer = new Uint8Array([0x04, 0x00, 0xA6, 0xAA]);      //應用層要求血壓計關機

        var encodedString = bluetoothle.bytesToEncodedString(buffer);
                
        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                //type: "noResponse",
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(TysonBio_BPM.writePowerOffSuccess, MSCordovaBLE.handleErrorAndToClose);           
    }

    ,
    writePowerOffSuccess: function (result) {
        //WriteLog.write("writePowerOffSuccess() " + result.name + "/" + result.address);

        if (window.cordova.platformId === "ios")//20171201
        {
            MSCordovaBLE.disconnectSuccess(result);
        }
        else if (window.cordova.platformId === "android") {
            setTimeout(function () {
                MSCordovaBLE.disconnectSuccess(result);
            }, 1000);
        }
    }
    
    ,//發送設定時間指令
    //其中 sFn, fFn, powerOffFlag 這3個參數是給 MSCordovaBLE.SetTimeAlone() 傳遞使用的!
    setTime: function (address, serviceUuid, characteristicsUuid, sFn, fFn, powerOffFlag)
    {
        var setDateBuffer = new Uint8Array([0x07, 0x00, 0xA8, 0x00, 0x00, 0x00, 0x00]);
        var setTimeBuffer = new Uint8Array([0x07, 0x00, 0xA9, 0x00, 0x00, 0x00, 0x00]);
        
        var dt = new Date();
        //---------------------------------------------------------------------
        var Y = parseInt(dt.getFullYear().toString().substring(2)).toString(16);
        //WriteLog.write("Y " + Y + ".", "status");
        setDateBuffer[3] = WiseScripts.IO.hexToBytes(Y)[0];
        
        var M = (dt.getMonth() + 1).toString(16);
        //WriteLog.write("M " + M + ".", "status");
        setDateBuffer[4] = WiseScripts.IO.hexToBytes(M)[0];
       
        var D = dt.getDate().toString(16);
        //WriteLog.write("D " + D + ".", "status");
        setDateBuffer[5] = WiseScripts.IO.hexToBytes(D)[0];

        //驗證碼
        setDateBuffer[6] = TysonBio_BPM.checksumByte(setDateBuffer);

        var encodedString1 = bluetoothle.bytesToEncodedString(setDateBuffer);

        //寫入系統日期
        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString1
            });
        }).then(function (result) {                    
                    WriteLog.write("已成功寫入系統日期到 " + result.name + ".", "status");

                    //如果寫入系統日期成功接著就寫入系統日期
                    var h = dt.getHours().toString(16);
                    //WriteLog.write("h " + h + ".", "status");
                    setTimeBuffer[3] = WiseScripts.IO.hexToBytes(h)[0];

                    var m = dt.getMinutes().toString(16);
                    //WriteLog.write("m " + m + ".", "status");
                    setTimeBuffer[4] = WiseScripts.IO.hexToBytes(m)[0];

                    //驗證碼
                    setTimeBuffer[6] = TysonBio_BPM.checksumByte(setTimeBuffer);

                    var encodedString2 = bluetoothle.bytesToEncodedString(setTimeBuffer);

                    new Promise(function (resolve, reject) {

                        bluetoothle.write(resolve, reject,
                        {
                            address: address,
                            service: serviceUuid,
                            characteristic: characteristicsUuid,
                            value: encodedString2
                        });
                    }).then(function (result) {
                                WriteLog.write("已成功寫入系統時間到 " + result.name + ".", "status");

                                if (sFn !== undefined) { sFn(); }

                                if (powerOffFlag !== undefined) {
                                    if (powerOffFlag == true) TysonBio_BPM.powerOff(address, serviceUuid, characteristicsUuid);
                                }
                            },
                            function (error) {
                                MSCordovaBLE.handleError(error);

                                if (fFn !== undefined) { fFn(); }

                                if (powerOffFlag !== undefined) {
                                    if (powerOffFlag == true) TysonBio_BPM.powerOff(address, serviceUuid, characteristicsUuid);
                                }
                            }
                       );
                },
                function (error) {                    
                    MSCordovaBLE.handleError(error);

                    if (fFn !== undefined) { fFn(); }

                    if (powerOffFlag !== undefined) {
                        if (powerOffFlag == true) TysonBio_BPM.powerOff(address, serviceUuid, characteristicsUuid);
                    }
                }
           );
    }
    
    ,//計算checksum
    checksumByte: function (buffer) {
        var z = 0x00;
        for (var i = 0; i < buffer.length - 1; i++) {
            z += buffer[i];
        }
        return z;
    }

    //,//發送設備測試指令    
    //testCommand: function (address, serviceUuid, characteristicsUuid) {
    //    //var buffer = new Uint8Array([0x04, 0x55, 0xAA, 0x03]);    //“廠商碼”讀取---不OK
    //    //var buffer = new Uint8Array([0x04, 0x00, 0xAD, 0xB1]);    //應用層通知斷開藍牙連接---不OK
    //    var buffer = new Uint8Array([0x04, 0x00, 0xA6, 0xAA]);      //應用層要求血壓計關機---OK
    //    
    //    var encodedString = bluetoothle.bytesToEncodedString(buffer);
    //
    //    new Promise(function (resolve, reject) {
    //
    //        bluetoothle.write(resolve, reject,
    //        {
    //            //type: "noResponse",
    //            address: address,
    //            service: serviceUuid,
    //            characteristic: characteristicsUuid,
    //            value: encodedString
    //        });
    //    }).then(TysonBio_BPM.writeTestCommandSuccess, MSCordovaBLE.handleErrorAndToClose);
    //}
    //
    //,
    //writeTestCommandSuccess: function (result) {
    //    WriteLog.write("writeTestCommandSuccess() " + result.name + "/" + result.address);        
    //}


}