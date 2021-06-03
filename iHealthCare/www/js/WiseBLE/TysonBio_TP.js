//==================== TysonBio_TP ===============================
//此程式支援的設備型號:
// 'Tyson bio_NCIT' 台欣體溫

var TysonBio_TP = TysonBio_TP || {}, TysonBio_TP = {

    procReturn: function (deviceName, address, serviceUuid, characteristicsUuid, returnData)
    {
        switch (deviceName) {
            case "Tyson bio_NCIT":
                var writeServiceUuid = "0000706D-7547-4F49-5047-676E6F6C7553";
                var writeCharacteristicsUuid = "0100706D-7547-4F49-5047-676E6F6C7553";                               

                if (returnData == "") {
                    sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
                    sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值            

                    //-----------------------------------                    
                    // //寫入系統時間到設備上
                    //TysonBio_TP.setTime(
                    //    address,
                    //    //serviceUuid,
                    //    //characteristicsUuid       //台欣這組是只具有 notify 權限的 UUID,不能拿來寫入資料
                    //    writeServiceUuid,
                    //    writeCharacteristicsUuid,   //要使用台欣這組具有 write 權限的 UUID
                    //    function (){ },
                    //    function (){ },
                    //    false);  
                    // //-----------------------------------                            
                    //MSCordovaBLE.sleep(3000);                    
                    // //-----------------------------------                    
                    // //發送清除設備所有記憶資料指令
                    //TysonBio_TP.clearData(
                    //    address,
                    //    //serviceUuid,
                    //    //characteristicsUuid       //台欣這組是只具有 notify 權限的 UUID,不能拿來寫入資料
                    //    writeServiceUuid,
                    //    writeCharacteristicsUuid);  //要使用台欣這組具有 write 權限的 UUID
                    //-----------------------------------                    
                }
                else if (returnData.indexOf("FE,FD,1A,") == 0 || returnData.indexOf("FE,FD,15,") == 0) {
                    //-----------------------------------
                    //從收到的資料中取出設備序號資料(設備的藍牙address)
                    TysonBio.getDeviceSerial(address, returnData);                    
                    //-----------------------------------                    
                    //從收到的資料中取出量測數據
                    TysonBio_TP.getMeasurementData(deviceName, address, returnData);                    
                    //-----------------------------------                    
                    //解除資料訂閱
                    MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);                    

                    //發送設備關機指令
                    TysonBio_TP.powerOff(
                        address,
                        //serviceUuid,
                        //characteristicsUuid       //台欣這組是只具有 notify 權限的 UUID,不能拿來寫入資料
                        writeServiceUuid,
                        writeCharacteristicsUuid);  //要使用台欣這組具有 write 權限的 UUID                    
                    //-----------------------------------
                    //根據保留天數來刪除 DeviceLog 的資料
                    MSCordovaBLE.delDeviceLog(MSCordovaBLE.MySetting.FilterHistoryData, MSCordovaBLE.MySetting.FilterHistoryDays);                    
                }

                break;
        }
    }

    ,//從收到的資料中取出量測數據
    getMeasurementData: function (deviceName, address, returnData)
    {
        var ReturnString = returnData.split(",");
        switch (deviceName) {
            case "Tyson bio_NCIT":

                //傳進來的資料如:FE,FD,1A,00,01,01,6F,11,01,0A,12,09,0D,0A
                //其中:          FE,FD                                     <-- 這幾個byte是Head
                //其中:                         01,6F                      <-- 這幾個byte是溫度值
                //其中:                               11,01,0A,12,09       <-- 這幾個byte是量測數據的 年,月,日,時,分
                //其中:                                              0D,0A <-- 這幾個byte是End

                //從收到的資料中取出數據時間資料
                TysonBio_TP.getPeripheralTime(address, returnData);
                                
                //溫度
                var TemperatureStr = WiseScripts.IO.padLeft(parseInt(ReturnString[5] + ReturnString[6], 16).toString(2), 16, "0");
                TemperatureStr = parseInt(TemperatureStr.substring(0, 16), 2).toString(10);

                var Temperature = (parseFloat(TemperatureStr) * 0.1).toFixed(1);
                WriteLog.write("量測溫度: " + deviceName + " " + Temperature, "info");

                //出現不正常數值時，捨棄
                if (Temperature <= 0)
                {
                    MSCordovaBLE.MySetting.ResultCallBackFn(""); //呼叫外部的 ResultCallBackFn
                    MSCordovaBLE.MySetting.ErrorCallBackFn("Err007");
                }
                else
                {
                    //是否需要過慮歷史資料
                    if (MSCordovaBLE.MySetting.FilterHistoryData) {

                        //以  時間+address+全部量測值  這3項來查詢 DeviceLog 資料表 是否已有紀錄存在
                        MSCordovaBLE.checkHistoryLog(sessionStorage["DeviceTime" + address], address, Temperature,
                            function (flag) {
                                if (flag) {//checkHistoryLog()是判斷量測值有沒有重覆：true 沒重覆，false 重覆
                                    //回傳結果字串                                    
                                    MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                               deviceName + "," +
                                               sessionStorage["DeviceSerial_" + address] + "," +
                                               sessionStorage["DeviceTime" + address] + "," +
                                               Temperature);
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
                                           Temperature);
                    }
                }

                break;
        }
    }

    ,//從收到的資料中取出數據(設備)時間資料
    getPeripheralTime: function (address, returnData)
    {

        //傳進來的資料如:FE,FD,1A,00,01,01,6F,11,01,0A,12,09,0D,0A        
        //其中:                               11,01,0A,12,09       <-- 這幾個byte是量測數據的 年,月,日,時,分
        

        var ReturnString = returnData.split(",");

        var Y = WiseScripts.IO.padLeft(parseInt(ReturnString[7], 16).toString(10), 2, "0");
        var M = WiseScripts.IO.padLeft(parseInt(ReturnString[8], 16).toString(10), 2, "0");
        var D = WiseScripts.IO.padLeft(parseInt(ReturnString[9], 16).toString(10), 2, "0");
        var h = WiseScripts.IO.padLeft(parseInt(ReturnString[10], 16).toString(10), 2, "0");
        var m = WiseScripts.IO.padLeft(parseInt(ReturnString[11], 16).toString(10), 2, "0");
        sessionStorage["DeviceTime" + address] = "20" + Y + "/" + M + "/" + D + " " + h + ":" + m;

        WriteLog.write("數據時間：" + address + "/" + sessionStorage["DeviceTime" + address], "info");
    }
    
    ,//發送設備關機指令    
    powerOff: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0xFE, 0xFD, 0xCD, 0x5A, 0x01, 0x0D, 0x0A]);
        
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
        }).then(TysonBio_TP.writePowerOffSuccess, MSCordovaBLE.handleErrorAndToClose);
    }

    ,
    writePowerOffSuccess: function (result) {
        //WriteLog.write("writePowerOffSuccess() " + result.name + "/" + result.address);

        if (window.cordova.platformId === "ios")//20171201
        {
            MSCordovaBLE.disconnectSuccess(result);
        }
        else if (window.cordova.platformId === "android")
        {
            setTimeout(function () {
                MSCordovaBLE.disconnectSuccess(result);
            }, 4500);//台欣這款額溫槍的硬體關機速度較慢,所以這裡不能太快斷線,否則會很快又被藍牙連線上,造成錯誤 !!!
        }
    }

    ,//發送設定時間指令
    //其中 sFn, fFn, powerOffFlag 這3個參數是給 MSCordovaBLE.SetTimeAlone() 傳遞使用的!
    setTime: function (address, serviceUuid, characteristicsUuid, sFn, fFn, powerOffFlag)
    {
        var buffer = new Uint8Array([0xFE, 0xFD, 0xCD, 0x5A, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0D, 0x0A]);
        
        var dt = new Date();

        var Y = parseInt(dt.getFullYear().toString().substring(2)).toString(16);
        //WriteLog.write("Y " + Y + ".", "status");
        buffer[5] = WiseScripts.IO.hexToBytes(Y)[0];

        var M = (dt.getMonth() + 1).toString(16);
        //WriteLog.write("M " + M + ".", "status");
        buffer[6] = WiseScripts.IO.hexToBytes(M)[0];

        var D = dt.getDate().toString(16);
        //WriteLog.write("D " + D + ".", "status");
        buffer[7] = WiseScripts.IO.hexToBytes(D)[0];

        var h = dt.getHours().toString(16);
        //WriteLog.write("h " + h + ".", "status");
        buffer[8] = WiseScripts.IO.hexToBytes(h)[0];

        var m = dt.getMinutes().toString(16);
        //WriteLog.write("m " + m + ".", "status");
        buffer[9] = WiseScripts.IO.hexToBytes(m)[0];

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(function (result) {
                    WriteLog.write("已成功寫入系統時間到 " + result.name + ".", "status");

                    if (sFn !== undefined) { sFn(); }

                    if (powerOffFlag !== undefined) {
                        if (powerOffFlag == true) TysonBio_TP.powerOff(address, serviceUuid, characteristicsUuid);
                    }
                },
                function (error) {
                    MSCordovaBLE.handleError(error);

                    if (fFn !== undefined) { fFn(); }

                    if (powerOffFlag !== undefined) {
                        if (powerOffFlag == true) TysonBio_TP.powerOff(address, serviceUuid, characteristicsUuid);
                    }
                }
           );
    }

    ,//發送清除設備所有記憶資料指令
    clearData: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0xFE, 0xFD, 0xCD, 0x5A, 0x02, 0x0D, 0x0A]);
        
        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(function (result) {
                    WriteLog.write("已成功清除設備所有記憶資料.", "status");
                },
                MSCordovaBLE.handleErrorAndToClose
        );
    }

}