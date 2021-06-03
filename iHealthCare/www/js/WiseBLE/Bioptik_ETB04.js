//==================== Bioptik_ETB04 ===============================
//此程式支援的設備型號:
// 'ETB04' 聿新易立測/中山瑞福(大陸)血糖/尿酸/膽固醇三合一 

var Bioptik_ETB04 = Bioptik_ETB04 || {}, Bioptik_ETB04 = {

    //放目前紀錄index的全域變數
    currentRecordIndex: 0,

    //放總紀錄筆數的全域變數
    storageNumberOfData: 0,

    //控制重送 Link 封包的全域變數
    linkResending: true,    //true:重送 / false:不重送    
    offResending: true,     //true:重送 / false:不重送
    resendingCount: 0,      //重送次數    

    procReturn: function (deviceName, address, serviceUuid, characteristicsUuid, returnData)
    {
        switch (deviceName) {
            case "ETB04":                

                if (returnData == "")
                {
                    sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
                    sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值

                    Bioptik_ETB04.currentRecordIndex = 0;          //清空全域變數
                    Bioptik_ETB04.storageNumberOfData = 0;         //清空全域變數                    
                    //-----------------------------------
                    //送出 LINK packet        
                    Bioptik_ETB04.linkResending = true;            //清空全域變數
                    Bioptik_ETB04.resendingCount = 0;              //清空全域變數

                    Bioptik_ETB04.sendLink(address, serviceUuid, characteristicsUuid);                    
                }
                else if (returnData.indexOf("7B,30,32,23,39,44,7D,") == 0)  //收到 LinkAck{02#9D} 回應...
                {                    
                    Bioptik_ETB04.linkResending = false;
                    //-----------------------------------   
                    //以藍芽位址取代設備序號資料
                    Bioptik.getDeviceSerial(address);
                    //-----------------------------------  
                    //以系統時間取代設備時間資料
                    Bioptik.getPeripheralTime(address);                    
                }
                else if (returnData.indexOf("7B,30,33,") == 0)              //收到 Data 封包資料...
                {                    
                    //從收到的資料中取出量測數據
                    Bioptik_ETB04.getMeasurementData(deviceName, address, returnData);
                    //-----------------------------------
                    //發送設備關機指令
                    Bioptik_ETB04.offResending = true;           //清空全域變數  
                    Bioptik_ETB04.resendingCount = 0;            //清空全域變數

                    Bioptik_ETB04.powerOff(address, serviceUuid, characteristicsUuid);                    
                }
                else if (returnData.indexOf("7B,30,36,23,39,39,7D,") == 0)  //收到關機ACK 封包 {06#99}回應...
                {
                    //debug
                    WriteLog.write("收到關機ACK回應資料 = " + returnData, "debug");

                    Bioptik_ETB04.offResending = false;
                    //-----------------------------------
                    //根據保留天數來刪除 DeviceLog 的資料
                    MSCordovaBLE.delDeviceLog(MSCordovaBLE.MySetting.FilterHistoryData, MSCordovaBLE.MySetting.FilterHistoryDays);
                }
                else                                                        //收到 ... 資料...
                {
                    //debug
                    WriteLog.write(deviceName+" Data 封包 = " + returnData, "debug");
                    WriteLog.write(deviceName+ " Data 封包長度 = " + returnData.length, "debug");
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
                
        var measurementKind = "";
        var measurementValueStr = "";
        var measurementValue = 0.0;

        //先把傳入的Hex文字串轉成byte陣列
        var dataBuffer = Bionime.parseHexStringToByteArr(returnData);

        var measurementValueBuffer = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00])
        measurementValueBuffer[0] = dataBuffer[4];//取出 30
        measurementValueBuffer[1] = dataBuffer[5];//取出 31
        measurementValueBuffer[2] = dataBuffer[6];//取出 31
        measurementValueBuffer[3] = dataBuffer[7];//取出 2E
        measurementValueBuffer[4] = dataBuffer[8];//取出 39

        //byte陣列轉成ASCII文字字串
        measurementValueStr = Bionime.binArrToString(measurementValueBuffer); 
        //經過一系列的轉換把 "30,31,31,2E,39"字串  轉成  "011.9"字串
        
        //量測數據的值
        measurementValue = parseFloat(measurementValueStr);       

        //量測數據的種類
        if (dataBuffer[3] == 0x47) { measurementKind = "G"; }       //47:血糖
        else if (dataBuffer[3] == 0x55) { measurementKind = "U"; }  //55:尿酸
        else if (dataBuffer[3] == 0x43) { measurementKind = "C"; }  //43:膽固醇
        else{ measurementKind = "P"; }  //:血壓

        //血糖種類才有用到
        var BloodGlucoseType = 0;

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

        var CkNo = Bioptik_ETB04.checksumByte(LinkCmd);
        LinkCmd = "{" + LinkCmd + "#" + CkNo + "}";  //LinkCmd: {01170331145030#42}        
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
            if (Bioptik_ETB04.linkResending == true)
            {
                if (Bioptik_ETB04.resendingCount < 5)//重送 Link Pack 5次
                {
                    WriteLog.write("重新發送Link Pack...", "status");
                    Bioptik_ETB04.resendingCount++;

                    Bioptik_ETB04.sendLink(address, serviceUuid, characteristicsUuid);
                }
                else if (Bioptik_ETB04.resendingCount >= 5)
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
    checksumByte: function (cmd)
    {
        //WriteLog.write("Package content：" + cmd, "debug");
                
        var hexAll = Bioptik.a2hex(cmd, true);
        //WriteLog.write("轉Hex後：" + hexAll, "debug");

        var tmp = hexAll.split(',');
        
        var Sum = 0;
        for (var i = 0; i < tmp.length; i++) {
            Sum += parseInt(tmp[i]) + 18;
            //Sum += parseInt(tmp.charAt(i));
        }
        //WriteLog.write("總合" + Sum + "(16進位：" + Sum.toString(16) + ")", "debug");

        var TheSum = WiseScripts.IO.padLeft(Sum.toString(16), 2, '0');

        //取最低兩位數
        var D2L = TheSum.toString(16).charAt(TheSum.length - 2) + TheSum.charAt(TheSum.length - 1);
           
        //WriteLog.write('最低兩位數：' + D2L + " (二進位：" + WiseScripts.IO.padLeft(parseInt(D2L, 16).toString(2), 8, '0') + ")", "debug");
        D2L = WiseScripts.IO.padLeft(parseInt(D2L, 16).toString(2), 8, '0');

        //算補數
        var tmp = D2L;

        D2L = "";
        for (var i = 0; i < tmp.length ; i++) {
            D2L += (parseInt(tmp.charAt(i)) == 0 ? '1' : '0');
        }
        //WriteLog.write("2的補數：" + D2L, "debug");

        var CkNo = parseInt(D2L, 2).toString(16).toUpperCase();
        //WriteLog.write('轉16進位後，驗證碼為' + CkNo, "debug");

        return CkNo;
    }
        
    ,//發送設備關機指令    
    powerOff: function (address, serviceUuid, characteristicsUuid)
    {        
        var buffer = Bioptik.StrToUint8Arr("{05#9A}");

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
        }).then(Bioptik_ETB04.writePowerOffSuccess, MSCordovaBLE.handleErrorAndToClose);
        //-----------------------------------------------------------
        setTimeout(function () {
            if (Bioptik_ETB04.offResending == true) {
                if (Bioptik_ETB04.resendingCount < 2)//重送 Off Pack 2次
                {
                    WriteLog.write("重新發送關機指令...", "status");
                    Bioptik_ETB04.resendingCount++;

                    Bioptik_ETB04.powerOff(address, serviceUuid, characteristicsUuid);
                }
                else if (Bioptik_ETB04.resendingCount >= 2) {
                    //如果重送 Off Pack 2次以上還無法跟設備進行溝通,就自動斷開藍牙,讓設備重新連線...
                    new Promise(function (resolve, reject) {

                        bluetoothle.close(resolve, reject,
                        {
                            address: address
                        });
                    }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);
                }
            }
        }, 2000);
    }

    ,
    writePowerOffSuccess: function (result)
    {
        //WriteLog.write("writePowerOffSuccess() " + result.name + "/" + result.address);

        setTimeout(function () {
            MSCordovaBLE.disconnectSuccess(result);
        }, 2000);
    }
    ,
    /*
    Bioptik_ETB04.deviceNameSearching('')
//命名規則來判斷是否為聿新科的機器! 
    */
    deviceNameSearching: function (deviceName) {
        var rv = false;
        var index = 0;
        //-------------------------------------------------------------------------------
        if (deviceName == undefined) { return false; }//如果deviceName是空,就一律回傳 false!

        //上面這個判斷很重要!! 因為有很大比例 scan 機制掃到的藍牙裝置是不帶 deviceName 的,如果沒上面這個判斷式擋著
        //則大部份的時間都會出錯,因為 startScanSuccess() 裡面大量呼叫 MSCordovaBLE.inDeviceList() 這個函式
        //而 inDeviceList() 裡面就會用到 deviceNameSearching(deviceName),此時如果 deviceName == null 沒擋住
        //則整個程式一定必死無疑 !!!
        //-------------------------------------------------------------------------------
        index = (deviceName.toString()).search("ETB*");//比對規則
        //例如 "2282RAA0429" , "2282RAD0003" 這個字串就符合上述的規則
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