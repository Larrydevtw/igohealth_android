//==================== Loson_DS3 ===============================
//此程式支援的設備型號:
// 'DS3' 聿新易立測/中山瑞福(大陸)血糖/尿酸/膽固醇三合一 

var Loson_DS3 = Loson_DS3 || {}, Loson_DS3 = {

    //放目前紀錄index的全域變數
    currentRecordIndex: 0,

    //放總紀錄筆數的全域變數
    storageNumberOfData: 0,

    //控制重送 Link 封包的全域變數
    linkResending: true,    //true:重送 / false:不重送    
    offResending: true,     //true:重送 / false:不重送
    processMData: true,     //true:處理傳回的量測資料 / false:不處理
    resendingCount: 0,      //重送次數    

    procReturn: function (deviceName, address, serviceUuid, characteristicsUuid, returnData)
    {
        switch (deviceName) {
            case "DS3":                

                if (returnData == "")
                {
                    sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
                    sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值

                    Loson_DS3.currentRecordIndex = 0;          //清空全域變數
                    Loson_DS3.storageNumberOfData = 0;         //清空全域變數                    
                    //-----------------------------------
                    //送出 LINK packet        
                    Loson_DS3.linkResending = true;            //清空全域變數
                    Loson_DS3.resendingCount = 0;              //清空全域變數

                    //樂生不用先送send
                    //Loson_DS3.sendLink(address, serviceUuid, characteristicsUuid);                    
                    //-----------------------------------   
                    //以藍芽位址取代設備序號資料
                    Bioptik.getDeviceSerial(address);
                    //-----------------------------------  
                    //以系統時間取代設備時間資料
                    Bioptik.getPeripheralTime(address);     
                }
                else if (
                    Loson_DS3.linkResending 
                    &&
                    returnData.indexOf("F5,A0,50,") == 0
                )  //收到 LinkAck{02#9D} 回應...
                {                    
                    Loson_DS3.linkResending = false;
                    //-----------------------------------  
                    //因為樂生在量測模式下無法接收設定時間與關機
                    Loson_DS3.processMData = true;
                    //-----------------------------------   
                    //以藍芽位址取代設備序號資料
                    Bioptik.getDeviceSerial(address);
                    //-----------------------------------  
                    //以系統時間取代設備時間資料
                    Bioptik.getPeripheralTime(address);                    
                }
                else if (
                    Loson_DS3.processMData == false
                    &&
                    returnData.indexOf("F5,A0,50,08,B5,") == 0
                ) //讀秒倒數
                {
                    //因為樂生在量測模式下無法接收設定時間與關機
                    Loson_DS3.processMData = true;
                }
                else if (
                    Loson_DS3.processMData
                    &&
                    returnData.indexOf("F5,A0,50,0F,B6,") == 0
                ) //收到 Data 封包資料...
                {                    
                    //從收到的資料中取出量測數據
                    Loson_DS3.getMeasurementData(deviceName, address, returnData);
                    //-----------------------------------
                    //因為樂生會一直送量測結果資料出來，用個flag擋掉
                    Loson_DS3.processMData = false;
                    //-----------------------------------
                    //發送設備關機指令
                    Loson_DS3.offResending = true;           //清空全域變數  
                    Loson_DS3.resendingCount = 0;            //清空全域變數

                    //量測狀態下沒有關機指令
                    //2019.03.26開放量測狀態下寫入指令
                    Loson_DS3.powerOff(address, serviceUuid, characteristicsUuid);                    
                }
                else if (returnData.indexOf("F5,A0,50,08,BA,") == 0)  //收到關機ACK 封包 {06#99}回應...
                {
                    //debug
                    WriteLog.write("收到關機ACK回應資料 = " + returnData, "debug");

                    Loson_DS3.offResending = false;
                    Loson_DS3.processMData = true;
                    //-----------------------------------
                    //根據保留天數來刪除 DeviceLog 的資料
                    MSCordovaBLE.delDeviceLog(MSCordovaBLE.MySetting.FilterHistoryData, MSCordovaBLE.MySetting.FilterHistoryDays);
                }
                else                                                        //收到 ... 資料...
                {
                    //debug
                    WriteLog.write("DS3 Data 封包 = " + returnData, "debug");
                    WriteLog.write("DS3 Data 封包長度 = " + returnData.length, "debug");
                }

                break;
        }
    }

    ,//從收到的資料中取出量測數據
    getMeasurementData: function (deviceName, address, returnData)
    {
        //傳進來的資料如:7B,30,33,55,30,31,31,2E,39,23,34,45,7D
        //其中:                   55,               <-- 這1個byte是量測數據的種類 47:血糖/55:尿酸/43:膽固醇
        //其中:                      30,31,31,2E,39 <-- 這5個byte是量測數據的值
                
        var measurementKind = "G";//G:血糖
        var measurementValueStr = "";
        var measurementValue = 0.0;
        //血糖種類才有用到
        var BloodGlucoseType = 0;

        var vArray = returnData.split(',');
        if (vArray.length < 13) {
            WriteLog.write("Error Length: " + returnData, "info");
            return;
        }

        try {
            //量測數據的值
            measurementValue = parseInt(vArray[11], 16) * 256 + parseInt(vArray[12], 16);
            BloodGlucoseType = parseInt(vArray[13], 16);//3:質控(與FORA一樣)
        } catch (err) {
            WriteLog.write("Error MValue: " + err.message, "info");
        }
        

        WriteLog.write("量測值: " + deviceName + " " + measurementKind + ":" + measurementValue + "/Type:" + BloodGlucoseType, "info");

        //出現不正常數值時，捨棄
        if (measurementValue <= 0) 
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
                MSCordovaBLE.checkHistoryLog(sessionStorage["DeviceTime" + address], address, measurementValue,
                    function (flag) {
                        if (flag) {//checkHistoryLog()是判斷量測值有沒有重覆：true 沒重覆，false 重覆
                            //回傳結果字串                                    
                            MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                        deviceName + "," +
                                        sessionStorage["DeviceSerial_" + address] + "," +
                                        sessionStorage["DeviceTime" + address] + "," +
                                        measurementValue + "," + BloodGlucoseType + "," + measurementKind);
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
                                    measurementValue + "," + BloodGlucoseType + "," + measurementKind);
            }
        }
                
    }

    ,//藍芽連結後App會送出 LINK packet,並等待回復(LinkAck),若無回復,則定時重傳(每秒傳一次),再等待 LINK 
    sendLink: function (address, serviceUuid, characteristicsUuid)
    {
        //var LinkCmd = '01' + WiseScripts.Format.Date_yyyyMMddHHmmss(new Date(), true).substr(2, 14);
        var LinkCmd = '01' + DateTimeFun.getNow().substr(2, 14);

        var CkNo = Loson_DS3.checksumByte(LinkCmd);
        LinkCmd = "{" + LinkCmd + "#" + CkNo + "}";  //LinkCmd: {01170331145030#42}        
        alert(LinkCmd);
        WriteLog.write("Link指令：" + LinkCmd, "status");
        //-----------------------------------------------------------
        var buffer = Bioptik.StrToUint8Arr(LinkCmd);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {
            bluetoothle.write(resolve, reject,
            {
                type: "noResponse",
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(function (result) {
            WriteLog.write("已成功發送Link Pack.", "status");
        }, MSCordovaBLE.handleErrorAndToClose
        );
        //-----------------------------------------------------------
        setTimeout(function ()
        {
            if (Loson_DS3.linkResending == true)
            {
                if (Loson_DS3.resendingCount < 5)//重送 Link Pack 5次
                {
                    WriteLog.write("重新發送Link Pack...", "status");
                    Loson_DS3.resendingCount++;

                    Loson_DS3.sendLink(address, serviceUuid, characteristicsUuid);
                }
                else if (Loson_DS3.resendingCount >= 5)
                {
                    //如果重送 Link Pack 5次以上還無法跟設備進行溝通,就自動斷開藍牙,讓設備重新連線...
                    new Promise(function (resolve, reject) {

                        bluetoothle.close(resolve, reject,
                        {
                            address: address
                        });
                    }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);
                }
            }
        }, 1000);
    }

    ,//計算checksum
    checksumByte: function (buffer)
    {
        var z = 0x00;
        for (var i = 0; i < buffer.length - 1; i++) {
            z += buffer[i];
        }
        var vR = z.toString(16).toUpperCase();
        var vLen = vR.length;
        if (vLen == 1) {
            return "0x0" + vR;
        } else if (vLen == 2) {
            return "0x" + vR;
        } else {
            return "0x" + vR.substr(vLen - 2, 2);
        }
    }
        
    ,//發送設備關機指令    
    powerOff: function (address, serviceUuid, characteristicsUuid)
    {        
        var buffer = new Uint8Array([0xF5, 0xB0, 0x50, 0x08, 0xAA, 0x00, 0x00, 0xA7]);
        
        var encodedString = bluetoothle.bytesToEncodedString(buffer);
        WriteLog.write("Send PowerOff... ", "debug");
        setTimeout(function () {//2019.03.28 樂生工程師說要隔300ms以上發送關機命令
            new Promise(function (resolve, reject) {


                bluetoothle.write(resolve, reject,
                    {
                        //type: "noResponse",
                        address: address,
                        service: serviceUuid,
                        characteristic: "FFF2",// characteristicsUuid,
                        value: encodedString
                    });
            }).then(Loson_DS3.writePowerOffSuccess, MSCordovaBLE.handleErrorAndToClose);
        }, 300);//原：300
        //-----------------------------------------------------------
        setTimeout(function () {
            if (Loson_DS3.offResending == true) {
                if (Loson_DS3.resendingCount < 2)//重送 Off Pack 2次
                {
                    WriteLog.write("重新發送關機指令...", "status");
                    Loson_DS3.resendingCount++;

                    Loson_DS3.powerOff(address, serviceUuid, characteristicsUuid);
                }
                else if (Loson_DS3.resendingCount >= 2) {
                    //如果重送 Off Pack 2次以上還無法跟設備進行溝通,就自動斷開藍牙,讓設備重新連線...
                    new Promise(function (resolve, reject) {

                        bluetoothle.close(resolve, reject,
                        {
                            address: address
                        });
                    }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);
                }
            }
        }, 2000);//原:2000
    }

    ,
    writePowerOffSuccess: function (result)
    {
        WriteLog.write("writePowerOffSuccess() " + result.name + "/" + result.address);

        setTimeout(function () {
            MSCordovaBLE.disconnectSuccess(result);
        }, 2000);
    }
    ,//發送設定時間指令
    //其中 sFn, fFn, powerOffFlag 這3個參數是給 MSCordovaBLE.SetTimeAlone() 傳遞使用的!
    setTime: function (address, serviceUuid, characteristicsUuid, sFn, fFn, powerOffFlag) {
        var buffer = new Uint8Array([0xF5, 0xB0, 0x50, 0x0C, 0xAB
            , 0x00
            , 0x00
            , 0x00
            , 0x00
            , 0x00
            , 0x00
            , 0x00]);

        var dt = new Date();
        var Y = dt.getFullYear().toString().substring(2);
        Y = parseInt(Y).toString(16);
        buffer[5] = WiseScripts.IO.hexToBytes(Y);

        var M = dt.getMonth() + 1;
        M = parseInt(M).toString(16);
        buffer[6] = WiseScripts.IO.hexToBytes(M);

        var D = dt.getDate();
        D = parseInt(D).toString(16);
        buffer[7] = WiseScripts.IO.hexToBytes(D);

        var H = dt.getHours();
        H = parseInt(H).toString(16);
        buffer[8] = WiseScripts.IO.hexToBytes(H);

        var MM = dt.getMinutes();
        MM = parseInt(MM).toString(16);
        buffer[9] = WiseScripts.IO.hexToBytes(MM);

        var S = dt.getSeconds();
        S = parseInt(S).toString(16);
        buffer[10] = WiseScripts.IO.hexToBytes(S);

        //驗證碼
        buffer[11] = Loson_DS3.checksumByte(buffer);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
                {
                    //type: "noResponse",
                    address: address,
                    service: serviceUuid,
                    characteristic: characteristicsUuid,//"FFF2",
                    value: encodedString
                });
        }).then(function (result) {
            WriteLog.write("已成功寫入系統時間到 " + result.name + ".", "status");

            if (sFn !== undefined) { sFn(); }

            if (powerOffFlag !== undefined) {
                if (powerOffFlag == true) Loson_DS3.powerOff(address, serviceUuid, characteristicsUuid);
            }
        },
            function (error) {
                MSCordovaBLE.handleError(error);

                if (fFn !== undefined) { fFn(); }

                if (powerOffFlag !== undefined) {
                    if (powerOffFlag == true) Loson_DS3.powerOff(address, serviceUuid, characteristicsUuid);
                }
            }
            );
    }
   
}