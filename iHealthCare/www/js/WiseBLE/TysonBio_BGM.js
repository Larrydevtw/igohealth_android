//==================== TysonBio_BGM ===============================
//此程式支援的設備型號:
// 'Tysonbio_BGM' 台欣血糖


var TysonBio_BGM = TysonBio_BGM || {}, TysonBio_BGM = {

    procReturn: function (deviceName, address, serviceUuid, characteristicsUuid, returnData)
    {
        switch (deviceName) {
            case "Tysonbio_BGM":
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

                if (returnData == "")
                {
                    sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
                    sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值            

                    //-----------------------------------                    
                    ////寫入系統時間到設備上(寫在這個位置不行,將來量測資料會收不完整)
                    //TysonBio_BGM.setTime(
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
                    ////發送清除設備所有記憶資料指令(寫在這個位置不行,將來量測資料收到會斷斷續續)
                    //TysonBio_BGM.clearData(
                    //    address,
                    //    //serviceUuid,
                    //    //characteristicsUuid       //台欣這組是只具有 notify 權限的 UUID,不能拿來寫入資料
                    //    writeServiceUuid,
                    //    writeCharacteristicsUuid);  //要使用台欣這組具有 write 權限的 UUID
                    //-----------------------------------                    
                }                
                else if (returnData.indexOf("55,") == 0)
                {                    
                    //-----------------------------------
                    //從收到的資料中取出設備序號資料(設備的藍牙address)
                    TysonBio.getDeviceSerial(address, returnData);
                    //-----------------------------------                    
                    //從收到的資料中取出量測數據
                    TysonBio_BGM.getMeasurementData(deviceName, address, returnData);
                    //-----------------------------------    
                    ////寫入系統時間到設備上(寫在這個位置 ok!)
                    //TysonBio_BGM.setTime(address, writeServiceUuid, writeCharacteristicsUuid, function (){ }, function (){ }, false);
                    //----------------------------------- 
                    ////發送清除設備所有記憶資料指令(寫在這個位置 ok!)
                    //TysonBio_BGM.clearData(address, writeServiceUuid, writeCharacteristicsUuid);
                    //-----------------------------------   
                    //解除資料訂閱
                    MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);

                    //發送設備關機指令
                    TysonBio_BGM.powerOff(
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
            case "Tysonbio_BGM":
                
                //傳進來的資料如:55,11,09,1C,0F,05,20,02,21,00,06
                //其中:                               02,21 <-- 這2個byte是量測數據的血糖值

                //從收到的資料中取出數據時間資料
                TysonBio_BGM.getPeripheralTime(address, returnData);

                //血糖
                var BloodGlucoseStr = WiseScripts.IO.padLeft(parseInt(ReturnString[7] + ReturnString[8], 16).toString(2), 16, "0");
                BloodGlucoseStr = parseInt(BloodGlucoseStr.substring(0, 16), 2).toString(10);
                var BloodGlucose = parseInt(BloodGlucoseStr);

                var BloodGlucoseType = 0;
                                
                WriteLog.write("量測值: " + deviceName + " " + BloodGlucose + "/Type:" + BloodGlucoseType, "info");

                //出現不正常數值時，捨棄
                if (BloodGlucose <= 0) {
                    MSCordovaBLE.MySetting.ResultCallBackFn(""); //呼叫外部的 ResultCallBackFn
                    MSCordovaBLE.MySetting.ErrorCallBackFn("Err007");
                }
                else {
                    //是否需要過慮歷史資料
                    if (MSCordovaBLE.MySetting.FilterHistoryData) {

                        //以  時間+address+全部量測值  這3項來查詢 DeviceLog 資料表 是否已有紀錄存在
                        MSCordovaBLE.checkHistoryLog(sessionStorage["DeviceTime" + address], address, BloodGlucose,
                            function (flag) {
                                if (flag) {//checkHistoryLog()是判斷量測值有沒有重覆：true 沒重覆，false 重覆
                                    //回傳結果字串                                    
                                    MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                               deviceName + "," +
                                               sessionStorage["DeviceSerial_" + address] + "," +
                                               sessionStorage["DeviceTime" + address] + "," +
                                               BloodGlucose + "," + BloodGlucoseType);
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
                                           BloodGlucose + "," + BloodGlucoseType);
                    }
                }

                break;
        }
    }       

    ,//從收到的資料中取出數據(設備)時間資料
    getPeripheralTime: function (address, returnData) {

        //傳進來的資料如:55,11,09,1C,0F,05,20,02,21,00,06
        //其中:             11,09,1C,0F,05,20 <-- 這幾個byte是量測數據的 年,月,日,時,分,秒
        
        var ReturnString = returnData.split(",");
                
        var Y = WiseScripts.IO.padLeft(parseInt(ReturnString[1], 16).toString(10), 2, "0");
        var M = WiseScripts.IO.padLeft(parseInt(ReturnString[2], 16).toString(10), 2, "0");
        var D = WiseScripts.IO.padLeft(parseInt(ReturnString[3], 16).toString(10), 2, "0");
        var h = WiseScripts.IO.padLeft(parseInt(ReturnString[4], 16).toString(10), 2, "0");
        var m = WiseScripts.IO.padLeft(parseInt(ReturnString[5], 16).toString(10), 2, "0");
        sessionStorage["DeviceTime" + address] = "20" + Y + "/" + M + "/" + D + " " + h + ":" + m;

        WriteLog.write("數據時間：" + address + "/" + sessionStorage["DeviceTime" + address], "info");        
    }
       
    ,//發送設備關機指令    
    powerOff: function (address, serviceUuid, characteristicsUuid) {
        var buffer = new Uint8Array([0xC0, 0x0D]);
        //這個指令目前測試都只會在以 M鍵 開機的模式(非試片開機)會收到 0x06 這個值,但血糖機不會真的關機
        //在以 試片 開機的模式下不會收到 0x06 值,血糖機也不會真的關機
        //2017/12 台欣修改後的新版硬體已經可以在試片模式下正常執行關機了 !

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
        }).then(TysonBio_BGM.writePowerOffSuccess, MSCordovaBLE.handleErrorAndToClose);
    }

    ,
    writePowerOffSuccess: function (result) {
        //WriteLog.write("writePowerOffSuccess() " + result.name + "/" + result.address);

        setTimeout(function () {
            MSCordovaBLE.disconnectSuccess(result);
        }, 1000);
    }
    
    ,//發送設定時間指令
    //其中 sFn, fFn, powerOffFlag 這3個參數是給 MSCordovaBLE.SetTimeAlone() 傳遞使用的!
    setTime: function (address, serviceUuid, characteristicsUuid, sFn, fFn, powerOffFlag)
    {
        var buffer = new Uint8Array([0xAA, 0xA5, 0x00, 0x00, 0x00, 0x00, 0x00, 0x06]);
        //這個指令目前測試都只會在以 M鍵 開機的模式(非試片開機)會收到 0x06 這個值,並且真的會變更血糖機上的時間
        //在以 試片 開機的模式下不會收到 0x06 值,血糖機上的時間也不會變更
        //2017/12 台欣修改後的新版硬體已經可以在試片模式下正常執行變更時間,但是還有一些問題存在
        //如果setTime在採血之前執行,將來量測資料會收不完整

        var dt = new Date();

        var Y = parseInt(dt.getFullYear().toString().substring(2)).toString(16);
        //WriteLog.write("Y " + Y + ".", "status");
        buffer[2] = WiseScripts.IO.hexToBytes(Y)[0];        
        
        var M = (dt.getMonth() + 1).toString(16);
        //WriteLog.write("M " + M + ".", "status");
        buffer[3] = WiseScripts.IO.hexToBytes(M)[0];
       
        var D = dt.getDate().toString(16);
        //WriteLog.write("D " + D + ".", "status");
        buffer[4] = WiseScripts.IO.hexToBytes(D)[0];

        var h = dt.getHours().toString(16);
        //WriteLog.write("h " + h + ".", "status");
        buffer[5] = WiseScripts.IO.hexToBytes(h)[0];

        var m = dt.getMinutes().toString(16);
        //WriteLog.write("m " + m + ".", "status");
        buffer[6] = WiseScripts.IO.hexToBytes(m)[0];     

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
                        if (powerOffFlag == true) TysonBio_BGM.powerOff(address, serviceUuid, characteristicsUuid);
                    }
                },
                function (error) {
                    MSCordovaBLE.handleError(error);

                    if (fFn !== undefined) { fFn(); }

                    if (powerOffFlag !== undefined) {
                        if (powerOffFlag == true) TysonBio_BGM.powerOff(address, serviceUuid, characteristicsUuid);
                    }
                }
           );
    }

    //,
    //writeSetTimeSuccess: function (result) {
    //    WriteLog.write("已成功寫入系統時間到 " + result.name + ".", "status");
    //}
    
    ,//發送清除設備所有記憶資料指令
    clearData: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0xAA, 0xCC, 0x06]);
        //這個指令目前測試都只會在以 M鍵 開機的模式(非試片開機)會收到 0x06 這個值,並且真的會清除血糖機上的資料        
        //在以 試片 開機的模式下不會收到 0x06 值,血糖機上的資料也不會清除
        //2017/12 台欣修改後的新版硬體已經可以在試片模式下正常執行資料清除,但是還有一些問題存在
        //如果clearData在採血之前執行,將來量測資料收到會斷斷續續!

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

    //,//發送讀取歷史資料指令
    //readFiveBytes: function (address, serviceUuid, characteristicsUuid) {
    //    var buffer = new Uint8Array([0x5C, 0x00, 0x00, 0x0D]);//這個指令目前測試都只會收到 0x06 這個值
    //
    //    var encodedString = bluetoothle.bytesToEncodedString(buffer);
    //
    //    new Promise(function (resolve, reject) {
    //
    //        bluetoothle.write(resolve, reject,
    //        {
    //            address: address,
    //            service: serviceUuid,
    //            characteristic: characteristicsUuid,
    //            value: encodedString
    //        });
    //    }).then(function (result) {
    //                WriteLog.write("已成功讀取歷史資料.", "status");
    //            },
    //            MSCordovaBLE.handleErrorAndToClose);
    //}

    
}