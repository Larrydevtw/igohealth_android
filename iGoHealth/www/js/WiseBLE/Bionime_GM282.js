//==================== Bionime_GM282 ===============================
//此程式支援的設備型號:
// '2282RAA0429' 華廣血糖(GM282) 
// '2282RAA0426' 華廣血糖(GM282) 
// ...

var Bionime_GM282 = Bionime_GM282 || {}, Bionime_GM282 = {

    //放目前紀錄index的全域變數
    currentRecordIndex: 0,

    //放總紀錄筆數的全域變數
    storageNumberOfData: 0,

    procReturn: function (deviceName, address, serviceUuid, characteristicsUuid, returnData)
    {
        var setPCLServiceUuid = "";
        var setPCLCharacteristicsUuid = "";
        var writeServiceUuid = "";
        var writeCharacteristicsUuid = "";

        if (window.cordova.platformId === "android") {
            setPCLServiceUuid = "0000FEE0-0000-1000-8000-00805F9B34FB";
            setPCLCharacteristicsUuid = "0000FEE1-0000-1000-8000-00805F9B34FB";
            writeServiceUuid = "0000FEE0-0000-1000-8000-00805F9B34FB";
            writeCharacteristicsUuid = "0000FEE3-0000-1000-8000-00805F9B34FB";                    
        }
        else if (window.cordova.platformId === "ios") {
            setPCLServiceUuid = "FEE0";
            setPCLCharacteristicsUuid = "FEE1";
            writeServiceUuid = "FEE0";
            writeCharacteristicsUuid = "FEE3";
        }                
        //-----------------------------------
        if (returnData == "") {
            sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
            sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值            

            Bionime_GM282.currentRecordIndex = 0;         //清空全域變數
            Bionime_GM282.storageNumberOfData = 0;        //清空全域變數
            //-----------------------------------                    
            //發送開啟 PCL Mode 的指令: 這個 PCL Mode 要設成 ON,否則接下來都會讀寫不到資料~             
            Bionime_GM282.setPCLModeIsON(address, setPCLServiceUuid, setPCLCharacteristicsUuid);
            //-----------------------------------                    
            setTimeout(function () {
                //取得Model資料                    
                Bionime_GM282.readModelName(address, writeServiceUuid, writeCharacteristicsUuid);
            }, 1500);
            //-----------------------------------
        }
        else if (returnData.indexOf("01,01,4F,FF,") == 0)       //收到Model資料...
        {
            //傳入的資料字串如下:
            //01,01,4F,FF,47,4D,32,38,32,7E,        
            //其中:       -- -- -- -- --   <--這5個byte可以解譯出 Model資料

            //-----------------------------------
            //從收到的資料中取出Model資料
            Bionime_GM282.getModelName(returnData);
                                                  
            //從收到的資料中取出設備序號資料(設備的藍牙address)
            Bionime.getDeviceSerial(address);

            //寫入系統時間到設備上
            Bionime_GM282.setTime(address, writeServiceUuid, writeCharacteristicsUuid, function () { }, function () { }, false);
        }
        else if (returnData.indexOf("01,01,4F,F9,") == 0)       //收到設備時間資料...
        {
            //傳入的資料字串如下:
            //01,01,4F,F9,08,12,05,06,0B,02,7A,        
            //其中:          --               <--這1個byte可以解譯出年
            //其中:             --            <--這1個byte可以解譯出月
            //其中:                --         <--這1個byte可以解譯出日
            //其中:                   --      <--這1個byte可以解譯出時
            //其中:                      --   <--這1個byte可以解譯出分
                    
            //-----------------------------------
            //從收到的資料中取出目前設備時間資料
            Bionime_GM282.getDeviceTime(returnData);

            //發送啟用存取內部記憶體的指令
            Bionime_GM282.enAccessingMemory(address, writeServiceUuid, writeCharacteristicsUuid);
        }
        else if (returnData.indexOf("01,01,4F,FD,") == 0)       //收到啟用存取內部記憶體回應...
        {
            //取得總紀錄筆數               
            Bionime_GM282.readStorageNumberOfData(address, writeServiceUuid, writeCharacteristicsUuid);
        }
        else if (returnData.indexOf("02,01,4F,9E,00,00,") == 0) //收到總紀錄筆數資料...
        {
            //傳入的資料:
            //02,01,4F,9E,00,00,17,00,F4,01,01,00,34,32,39,71,55,9C,00,00, 
            //其中              -- --    <- 這兩個byte 就是總紀錄筆數

            //-----------------------------------
            //從收到的資料中取出總紀錄筆數數值
            Bionime_GM282.storageNumberOfData = Bionime_GM282.getStorageNumberOfData(returnData);
                    
            //取得最新紀錄                        
            Bionime_GM282.readNewlyRecord(address, writeServiceUuid, writeCharacteristicsUuid);
        }
        else if (returnData.indexOf("02,01,4F,9E,01,00,") == 0) //收到最新紀錄資料...
        {
            //傳入的資料字串如下:
            //02,01,4F,9E,01,00,44,4D,A8,12,11,66,00,00,00,13,55,9C,00,00,
            //其中                          -- --   <--這2個byte可以解譯出血糖值
            //其中              -- --               <--這2個byte可以解譯出月
            //其中              --                  <--這1個byte可以解譯出日
            //其中                 --               <--這1個byte可以解譯出時
            //其中                    --            <--這1個byte可以解譯出分
            //其中                       --         <--這1個byte可以解譯出年                    

            //-----------------------------------
            //從收到的資料中取出最新的量測數據
            Bionime_GM282.getMeasurementData(deviceName, address, returnData);

            ////發送讀取第N筆紀錄值的指令
            //Bionime_GM282.readIndexNRecord(address, writeServiceUuid, writeCharacteristicsUuid,
            //    (Bionime_GM282.storageNumberOfData - 4)); 
            //-----------------------------------
            ////解除資料訂閱
            //MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);                         
            //-----------------------------------
            //根據保留天數來刪除 DeviceLog 的資料
            MSCordovaBLE.delDeviceLog(MSCordovaBLE.MySetting.FilterHistoryData, MSCordovaBLE.MySetting.FilterHistoryDays);
        }
        else
        {
            ////debug
            //WriteLog.write("### returnData = " + returnData, "debug");                   
            //-----------------------------------
            //if (Bionime_GM282.deviceNameSearching(deviceName) == true)
            //{ WriteLog.write("### 藍牙名符合規則. ", "debug"); }
            //else
            //{ WriteLog.write("### 藍牙名不符合規則! ", "debug"); }
            //
            //if (Bionime_GM282.deviceNameSearching("2282RAA") == true)
            //{ WriteLog.write("### 2282RAA符合規則. ", "debug"); }
            //else
            //{ WriteLog.write("### 2282RAA不符合規則! ", "debug"); }
            //
            //if (Bionime_GM282.deviceNameSearching("2282RAAc1") == true)
            //{ WriteLog.write("### 2282RAAc1符合規則. ", "debug"); }
            //else
            //{ WriteLog.write("### 2282RAAc1不符合規則! ", "debug"); }
            //
            //if (Bionime_GM282.deviceNameSearching("2282RAAc") == true)
            //{ WriteLog.write("### 2282RAAc符合規則. ", "debug"); }
            //else
            //{ WriteLog.write("### 2282RAAc不符合規則! ", "debug"); }
            //
            //if (Bionime_GM282.deviceNameSearching("2282dRAAc") == true)
            //{ WriteLog.write("### 2282dRAAc符合規則. ", "debug"); }
            //else
            //{ WriteLog.write("### 2282dRAAc不符合規則! ", "debug"); }
            //
            //if (Bionime_GM282.deviceNameSearching("42282RAAc") == true)
            //{ WriteLog.write("### 42282RAAc符合規則. ", "debug"); }
            //else
            //{ WriteLog.write("### 42282RAAc不符合規則! ", "debug"); }
            //-----------------------------------
        }               
                
        
    }
    
    ,//從收到的資料中取出Model資料
    getModelName: function (returnData)
    {
        var modelName = "";

        //傳入的資料字串如下:
        //01,01,4F,FF,47,4D,32,38,32,7E,        
        //其中:       -- -- -- -- --   <--這5個byte可以解譯出 Model資料

        //先把傳入的Hex文字串轉成byte陣列
        var dataBuffer = Bionime.parseHexStringToByteArr(returnData);

        var modelNameBuffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00])
        modelNameBuffer[0] = dataBuffer[4];
        modelNameBuffer[1] = dataBuffer[5];
        modelNameBuffer[2] = dataBuffer[6];
        modelNameBuffer[3] = dataBuffer[7];
        modelNameBuffer[4] = dataBuffer[8];

        //byte陣列轉成ASCII文字字串
        modelName = Bionime.binArrToString(modelNameBuffer);

        WriteLog.write("Model 名稱：" + modelName, "info");
    }

    ,//從收到的資料中取出總紀錄筆數
    getStorageNumberOfData: function (returnData)
    {
        //傳入的資料:
        //02,01,4F,9E,00,00,17,00,F4,01,01,00,34,32,39,71,55,9C,00,00, 
        //其中              -- --    <- 這兩個byte 就是總紀錄筆數
        
        var numberOfData = 0;

        //先把傳入的Hex文字串轉成byte陣列
        var dataBuffer = Bionime.parseHexStringToByteArr(returnData);

        var numberOfDataStr = ((dataBuffer[7] << 8) + dataBuffer[6]).toString(10);
        numberOfData = parseInt(numberOfDataStr);

        WriteLog.write("紀錄筆數：" + numberOfData.toString(10), "info");


        return numberOfData;//回傳整數 23
    }
    
    ,//從收到的資料中取出量測數據
    //getMeasurementData()目前允許2種型式的呼叫:
    //getMeasurementData: function (deviceName, address, returnData) <-- 標準型式
    //getMeasurementData: function (deviceName, address, returnData, multiDataContainer) <-- 回傳多筆紀錄型式
    getMeasurementData: function (deviceName, address, returnData, multiDataContainer)
    {
        //傳入的資料字串如下:
        //02,01,4F,9E,01,00,44,4D,A8,12,11,66,00,00,00,13,55,9C,00,00,
        //其中:                         -- --    <--這2個byte可以解譯出血糖值
                
        //從收到的資料中取出數據量測時間資料
        Bionime_GM282.getPeripheralTime(address, returnData);

        //先把傳入的Hex文字串轉成byte陣列
        var dataBuffer = Bionime.parseHexStringToByteArr(returnData);                             

        //血糖
        var BloodGlucoseStr = ( ((dataBuffer[10] & 0x03) << 8) + dataBuffer[11] ).toString(10);
        var BloodGlucose = parseInt(BloodGlucoseStr);

        var BloodGlucoseType = 0;

        WriteLog.write("量測值: " + deviceName + " " + BloodGlucose + "/Type:" + BloodGlucoseType, "info");

        if (Object.prototype.toString.apply(multiDataContainer) === "[object Undefined]")
        {
            //如果傳進來的參數 multiDataContainer 沒有定義
            //就是走 ResultCallBackFn 這一條路 !!
            

            //出現不正常數值時，捨棄
            if (BloodGlucose <= 0)
            {
                MSCordovaBLE.MySetting.ResultCallBackFn(""); //呼叫外部的 ResultCallBackFn
                MSCordovaBLE.MySetting.ErrorCallBackFn("Err007");
            }
            else
            {
                //是否需要過慮歷史資料
                if (MSCordovaBLE.MySetting.FilterHistoryData)
                {
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
                else
                {
                    //回傳結果字串
                    MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                        deviceName + "," +
                                        sessionStorage["DeviceSerial_" + address] + "," +
                                        sessionStorage["DeviceTime" + address] + "," +
                                        BloodGlucose + "," + BloodGlucoseType);
                }
            }
        }
        else
        {
            //如果傳進來的參數 multiDataContainer 是一個陣列就把結果塞給它
            //這是為了未來的 GetMultiDataCallBackFn 而做的 !!


            if (Object.prototype.toString.apply(multiDataContainer) === "[object Array]") {
                multiDataContainer.push(
                    deviceName + "," +
                    sessionStorage["DeviceSerial_" + address] + "," +
                    sessionStorage["DeviceTime" + address] + "," +
                    BloodGlucose + "," + BloodGlucoseType);
            }
        }
    }
    
    ,//從收到的資料中取出設備時間資料
    getDeviceTime: function (returnData)
    {
        //傳入的資料字串如下:
        //01,01,4F,F9,08,12,05,06,0B,02,7A,        
        //其中:          --               <--這1個byte可以解譯出年
        //其中:             --            <--這1個byte可以解譯出月
        //其中:                --         <--這1個byte可以解譯出日
        //其中:                   --      <--這1個byte可以解譯出時
        //其中:                      --   <--這1個byte可以解譯出分


        //先把傳入的Hex文字串轉成byte陣列
        var dataBuffer = Bionime.parseHexStringToByteArr(returnData);

        var Y = dataBuffer[5] + 0x07D0;
        //WriteLog.write("### 年 = " + Y.toString(10), "debug");

        var M = dataBuffer[6] + 0x01;
        //WriteLog.write("### 月 = " + M.toString(10), "debug");

        var D = dataBuffer[7] + 0x01;
        //WriteLog.write("### 日 = " + D.toString(10), "debug");

        var H = dataBuffer[8];
        //WriteLog.write("### 時 = " + H.toString(10), "debug");

        var mm = dataBuffer[9];
        //WriteLog.write("### 分 = " + mm.toString(10), "debug");

        WriteLog.write("目前的設備時間：" + Y.toString(10) + "/" + M.toString(10) + "/" + D.toString(10) + " " + H.toString(10) + ":" + mm.toString(10), "status");
    }
    
    ,//從收到的資料中取出紀錄量測時間資料
    getPeripheralTime: function (address, returnData)
    {
        //傳入的資料字串如下:        
        //02,01,4F,9E,01,00,44,4D,A8,12,11,66,00,00,00,13,55,9C,00,00,
        //其中:             -- --          <--這2個byte可以解譯出月
        //其中:             --             <--這1個byte可以解譯出日
        //其中:                --          <--這1個byte可以解譯出時
        //其中:                   --       <--這1個byte可以解譯出分
        //其中:                      --    <--這1個byte可以解譯出年


        //先把傳入的Hex文字串轉成byte陣列
        var dataBuffer = Bionime.parseHexStringToByteArr(returnData);

        var Y = (dataBuffer[9] & 0x7F) + 0x07D0;
        //WriteLog.write("### 年 = " + Y.toString(10), "debug");

        var M = ((dataBuffer[7] & 0xC0) >> 4) + ((dataBuffer[6] & 0xC0) >> 6) + 0x01;
        //WriteLog.write("### 月 = " + M.toString(10), "debug");

        var D = (dataBuffer[6] & 0x1F) + 0x01;
        //WriteLog.write("### 日 = " + D.toString(10), "debug");

        var H = dataBuffer[7] & 0x1F;
        //WriteLog.write("### 時 = " + H.toString(10), "debug");

        var mm = dataBuffer[8] & 0x3F;
        //WriteLog.write("### 分 = " + mm.toString(10), "debug");
                
        sessionStorage["DeviceTime" + address] = Y.toString(10) + "/" + M.toString(10) + "/" + D.toString(10) + " " + H.toString(10) + ":" + mm.toString(10);
        WriteLog.write("紀錄時間：" + address + "/" + sessionStorage["DeviceTime" + address], "info");
    }

    ,//發送開啟PCL Mode的指令
    setPCLModeIsON: function (address, serviceUuid, characteristicsUuid)
    {
        //PCL ON:   0X00 
        //PCL OFF:  0X01 (default)
        var buffer = new Uint8Array([0x00]);//Set PCL Mode = ON        
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
                WriteLog.write("已成功發送開啟 PCL Mode 的指令.", "status");
            },  MSCordovaBLE.handleErrorAndToClose
        );
    }    

    ,//發送啟用存取內部記憶體的指令
    enAccessingMemory: function (address, serviceUuid, characteristicsUuid)
    {        
        var buffer = new Uint8Array([0xB0, 0x02, 0x42, 0x6E, 0x30, 0x00]);//Enable Accessing Memory  
        buffer[(buffer.length - 1)] = Bionime.checksumByte(buffer);
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
                WriteLog.write("已成功發送啟用存取內部記憶體的指令.", "status");
                }, MSCordovaBLE.handleErrorAndToClose
        );
    }

    ,//發送取得Model資料的指令
    readModelName: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0xB0, 0x00, 0x00]);//Query Model Name ->            
        buffer[(buffer.length - 1)] = Bionime.checksumByte(buffer);
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
            WriteLog.write("已成功寫入讀取Model資料指令.", "status");
            },  MSCordovaBLE.handleErrorAndToClose
        );
    }
        
    ,//發送讀取設備時間的指令
    readPeripheralTime: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0xB0, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);//Get Date Time & Unit         
        buffer[(buffer.length - 1)] = Bionime.checksumByte(buffer);
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
                WriteLog.write("已成功發送讀取設備時間的指令.", "status");
            },  MSCordovaBLE.handleErrorAndToClose
        );
    }

    ,//發送讀取總紀錄筆數指令
    readStorageNumberOfData: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0xB0, 0x61, 0x00, 0x00, 0x00]);//read total amount of blood glucose data -> 
        buffer[(buffer.length - 1)] = Bionime.checksumByte(buffer);
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
                WriteLog.write("已成功發送讀取紀錄筆數的指令.", "status");
            },  MSCordovaBLE.handleErrorAndToClose
        );
    }

    ,//發送讀取最新紀錄值的指令
    readNewlyRecord: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0xB0, 0x61, 0x01, 0x00, 0x00]);//The command of read last index (Newly) blood glucose data -> 

        buffer[(buffer.length - 1)] = Bionime.checksumByte(buffer);
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
            WriteLog.write("已成功發送讀取最新紀錄值的指令.", "status");
        }, MSCordovaBLE.handleErrorAndToClose
        );
    }
    
    ,//發送設定時間指令
    //其中 sFn, fFn, powerOffFlag 這3個參數是給 MSCordovaBLE.SetTimeAlone() 傳遞使用的!
    setTime: function (address, serviceUuid, characteristicsUuid, sFn, fFn, powerOffFlag)
    {       
        var buffer = new Uint8Array([0xB0, 0x06, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);//Set Date Time & Unit         
        //var buffer = new Uint8Array([0xB0, 0x06, 0x08, 0x10, 0x09, 0x19, 0x17, 0x1E, 0x00]);
        //是2016/10/26 23:30 而非2016/9/25 23:30

        var dt = new Date();

        var Y = parseInt(dt.getFullYear().toString().substring(2)).toString(16);
        //WriteLog.write("Y " + Y + ".", "debug");
        buffer[3] = WiseScripts.IO.hexToBytes(Y)[0];

        var M = (dt.getMonth()).toString(16);
        //WriteLog.write("M " + M + ".", "debug");
        buffer[4] = WiseScripts.IO.hexToBytes(M)[0];

        var D = (dt.getDate()-1).toString(16);
        //WriteLog.write("D " + D + ".", "debug");
        buffer[5] = WiseScripts.IO.hexToBytes(D)[0];

        var h = dt.getHours().toString(16);
        //WriteLog.write("h " + h + ".", "debug");
        buffer[6] = WiseScripts.IO.hexToBytes(h)[0];

        var m = dt.getMinutes().toString(16);
        //WriteLog.write("m " + m + ".", "debug");
        buffer[7] = WiseScripts.IO.hexToBytes(m)[0];        

        //驗證碼
        buffer[(buffer.length - 1)] = Bionime.checksumByte(buffer);
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
                        //不作任何事! 因為華廣血糖機並沒有提供關機指令~
                    }
                },
                function (error) {
                    MSCordovaBLE.handleError(error);

                    if (fFn !== undefined) { fFn(); }

                    if (powerOffFlag !== undefined) {
                        //不作任何事! 因為華廣血糖機並沒有提供關機指令~
                    }
                }
           );
    }

    ,//比對裝置藍牙名是否符合華廣藍牙名的命名規則 --> 也就是由裝置藍牙名來判斷是否為華廣血糖機! 
    deviceNameSearching: function (deviceName)
    {
        var rv = false;
        var index = 0;
        //-------------------------------------------------------------------------------
        if (deviceName == undefined) { return false; }//如果deviceName是空,就一律回傳 false!

        //上面這個判斷很重要!! 因為有很大比例 scan 機制掃到的藍牙裝置是不帶 deviceName 的,如果沒上面這個判斷式擋著
        //則大部份的時間都會出錯,因為 startScanSuccess() 裡面大量呼叫 MSCordovaBLE.inDeviceList() 這個函式
        //而 inDeviceList() 裡面就會用到 deviceNameSearching(deviceName),此時如果 deviceName == null 沒擋住
        //則整個程式一定必死無疑 !!!
        //-------------------------------------------------------------------------------
        index = (deviceName.toString()).search("2282[AR]+[0-9]*");//比對規則
        //例如 "2282RAA0429" 這個字串就符合上述的規則
        //找不到:回傳-1, 否則:回傳0或以上的整數
        //-----------------------------------
        if (index == 0)//要從最左邊開始match到才算
        {
            rv = true;//有比對到~
        }
        else if (index > 0)//即便在中間以後match到也不算!
        {
            rv = false;//沒有比對到!
        }
        else {
            rv = false;//沒有比對到!
        }
        //-----------------------------------

        return rv;
    }


}