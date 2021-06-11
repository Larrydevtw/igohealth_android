//==================== TAIDOC ===============================
//此程式定義了泰博機型的標準功能,目前支援的設備型號:
// 'FORA D40' 泰博血壓/血糖二合一  
// 'UniTai TD3261' 阿泰貼牌血壓/血糖二合一
// 'DIAMOND CUFF BP' 泰博血壓(綁臂式一體機)
// 'FORA IR20' 泰博體溫(TAIDOC TD1261)
// 'FORA IR21' 泰博體溫(TAIDOC TD1261) 
// 'TAIDOC TD1261' 泰博體溫 
// 'TAIDOC TD4286' 泰博血糖
// 'TAIDOC TD4231' 泰博血糖
// 'TAIDOC TD4289' 泰博血糖
// 'TAIDOC BG' 泰博血糖(TAIDOC TD4231的前身樣品機)
// 'FORA GD40' 泰博血糖
// 'FORA P30 PLUS' 泰博血壓

 
var TAIDOC = TAIDOC || {}, TAIDOC = {

    //定義可以通行整個程式範圍的全域變數        
    //sessionStorage["DeviceSerial_" + address]   //存放藍牙設備的序號
    //sessionStorage["DeviceTime" + address]      //存放藍牙設備的系統時間
    //sessionStorage["MType"]                     //存放量測類型 P/G --> P/G=0 means blood glucose, P/G=1 means blood pressure(參考原廠文件 TICD_TD3261_2in1Meter_V1.5_20131028.pdf(page18下及page19上) 欄位 P/G 的說明)
    //----------------------------------------------------------------------------- 
    
    //處理從量測設備收到的資料
    procReturn: function (deviceName, address, serviceUuid, characteristicsUuid, returnData)
    {
        if (returnData == "")
        {
            sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
            sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值            
            sessionStorage["MType"] = "";                   //宣告出存放量測類型 P/G 的全域變數,並給空字串為初值
            //-----------------------------------            
            //寫入系統時間到設備上            
            TAIDOC.setTime(
                        address,
                        serviceUuid,
                        characteristicsUuid,   
                        function () { },
                        function () { },
                        false);
            //-----------------------------------
            //讀取設備序號前段
            TAIDOC.readDeviceSerialNumber_front(address, serviceUuid, characteristicsUuid);
        }        
        else if (returnData.indexOf("51,28,") == 0)
        {
            //從收到的資料中取出設備序號資料(序號前段)
            TAIDOC.getDeviceSerial(address, returnData);            

            //讀取設備序號後段
            TAIDOC.readDeviceSerialNumber_Behind(address, serviceUuid, characteristicsUuid);
        }
        else if (returnData.indexOf("51,27,") == 0)
        {
            //從收到的資料中取出設備序號資料(序號後段)
            TAIDOC.getDeviceSerial(address, returnData);
            WriteLog.write("設備序號：" + address + "/" + sessionStorage["DeviceSerial_" + address], "info");
            
            //讀取設備的時間資料
            TAIDOC.readStorageData_1(address, serviceUuid, characteristicsUuid);
        }
        else if (returnData.indexOf("51,25,") == 0)
        {
            //從收到的資料中取出設備時間資料
            TAIDOC.getPeripheralTime(address, returnData);
            //-----------------------------------
            //讀取設備的量測資料
            TAIDOC.readStorageData_2(address, serviceUuid, characteristicsUuid);
        }
        else if (returnData.indexOf("51,26,") == 0)
        {
            //從收到的資料中取出量測數據
            TAIDOC.getMeasurementData(deviceName, address, returnData);
            //-----------------------------------
            ////發送清除設備所有記憶資料指令
            //TAIDOC.clearData(address, serviceUuid, characteristicsUuid);//暫時mark起來,為了要開發多筆回傳的功能
            //-----------------------------------
            //解除資料訂閱
            MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);

            //發送設備關機指令
            TAIDOC.powerOff(address, serviceUuid, characteristicsUuid);
            //-----------------------------------
            //根據保留天數來刪除 DeviceLog 的資料
            MSCordovaBLE.delDeviceLog(MSCordovaBLE.MySetting.FilterHistoryData, MSCordovaBLE.MySetting.FilterHistoryDays);
        }
    }

    ,//從收到的資料中取出設備序號資料
    getDeviceSerial: function (address, returnData)
    {
        var ReturnString = returnData.split(",");
        sessionStorage["DeviceSerial_" + address] += (ReturnString[5]) ? ReturnString[5] : "0";
        sessionStorage["DeviceSerial_" + address] += (ReturnString[4]) ? ReturnString[4] : "0";
        sessionStorage["DeviceSerial_" + address] += (ReturnString[3]) ? ReturnString[3] : "0";
        sessionStorage["DeviceSerial_" + address] += (ReturnString[2]) ? ReturnString[2] : "0";
    }

    ,//從收到的資料中取出設備時間資料
    getPeripheralTime: function (address, returnData)
    {        
        var ReturnString = returnData.split(",");

        //取得YMD
        var YMD = WiseScripts.IO.padLeft(parseInt(ReturnString[3] + ReturnString[2], 16).toString(2), 16, "0");

        var Y = parseInt(YMD.substring(0, 7), 2).toString(10);
        var M = parseInt(YMD.substring(7, 11), 2).toString(10);
        var D = parseInt(YMD.substring(11, 16), 2).toString(10);

        //取得小時
        var H = WiseScripts.IO.padLeft(parseInt(ReturnString[5], 16).toString(2), 8, "0");
        H = parseInt(H.substring(3, 8), 2).toString(10);

        var Bin_mm = WiseScripts.IO.padLeft(parseInt(ReturnString[4], 16).toString(2), 8, "0");
        var mm = parseInt(Bin_mm.substring(2, 8), 2).toString(10);

        sessionStorage["DeviceTime" + address] = "20" + WiseScripts.IO.padLeft(Y, 2, '0') + "/" + WiseScripts.IO.padLeft(M, 2, '0') + "/" + WiseScripts.IO.padLeft(D, 2, '0') + " " + WiseScripts.IO.padLeft(H, 2, '0') + ":" + WiseScripts.IO.padLeft(mm, 2, '0');
                       
        WriteLog.write("裝置時間：" + address + "/" + sessionStorage["DeviceTime" + address], "info");
        
        //取得量測類型
        //參考原廠文件 TICD_TD3261_2in1Meter_V1.5_20131028.pdf(page18下及page19上) 欄位 P/G 的說明:
        //P/G=0 means blood glucose 
        //P/G=1 means blood pressure
        sessionStorage["MType"] = parseInt(Bin_mm.substring(0, 1), 2).toString(10);    

        WriteLog.write("量測類型：" + address + "/" + sessionStorage["MType"], "info");
    }

    ,//從收到的資料中取出量測數據
    //getMeasurementData()目前允許2種型式的呼叫:
    //getMeasurementData: function (deviceName, address, returnData) <-- 標準型式
    //getMeasurementData: function (deviceName, address, returnData, multiDataContainer) <-- 回傳多筆紀錄型式
    getMeasurementData: function (deviceName, address, returnData, multiDataContainer)
    {
        var ReturnString = returnData.split(",");
        switch (deviceName)
        {            
            case "FORA D40":
            case "UniTai TD3261":
                if (ReturnString[2] == "00" && ReturnString[3] == "00" && ReturnString[4] == "00" && ReturnString[5] == "00") {
                    //先排除掉 51,26,00,00,00,00,A5,1C 這種資料狀況 !!
                    //這種資料狀況出現時連帶 MType 會為 0,所以下面的程式段不會被執行,也不會報錯

                    MSCordovaBLE.MySetting.ResultCallBackFn(""); //呼叫外部的 ResultCallBackFn
                    MSCordovaBLE.MySetting.ErrorCallBackFn("Err013");
                }
                //---------------------------------------------------
                //血壓/血糖 二合一，不確定是血壓還是血糖
                //MType = 1 血壓
                if (sessionStorage["MType"] == "1")//sessionStorage["MType"]就定義在getPeripheralTime()中
                {
                    //收縮壓                    
                    var Systolic = WiseScripts.IO.padLeft(parseInt(ReturnString[2], 16).toString(2), 8, "0");                    
                    Systolic = parseInt(Systolic.substring(0, 8), 2).toString(10);
                    
                    //舒張壓
                    var Diastolic = WiseScripts.IO.padLeft(parseInt(ReturnString[4], 16).toString(2), 8, "0");                    
                    Diastolic = parseInt(Diastolic.substring(0, 8), 2).toString(10);
                    
                    var Pulse = WiseScripts.IO.padLeft(parseInt(ReturnString[5], 16).toString(2), 8, "0");                    
                    Pulse = parseInt(Pulse.substring(0, 8), 2).toString(10);

                    WriteLog.write("量測值: " + deviceName + " " + Systolic + "/" + Diastolic + "/" + Pulse, "info");
                                        
                    if (Object.prototype.toString.apply(multiDataContainer) === "[object Undefined]")
                    {
                        //如果傳進來的參數 multiDataContainer 沒有定義
                        //就是走 ResultCallBackFn 這一條路 !!


                        //出現不正常數值時，捨棄                    
                        if (parseInt(Systolic) < 1 || parseInt(Diastolic) < 1 || parseInt(Pulse) < 1
                            ||
                            parseInt(Systolic) >= 255 || parseInt(Diastolic) >= 255 || parseInt(Pulse) >= 255) {
                            MSCordovaBLE.MySetting.ResultCallBackFn(""); //呼叫外部的 ResultCallBackFn
                            MSCordovaBLE.MySetting.ErrorCallBackFn("Err007");
                        }
                        else {
                            //是否需要過慮歷史資料
                            if (MSCordovaBLE.MySetting.FilterHistoryData)
                            {
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
                            else
                            {
                                //回傳結果字串
                                MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                                deviceName + "," +
                                                sessionStorage["DeviceSerial_" + address] + "," +
                                                sessionStorage["DeviceTime" + address] + "," +
                                                Systolic + "," + Diastolic + "," + Pulse);
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
                                Systolic + "," + Diastolic + "," + Pulse);
                        }
                    }
                }
                //MType = 0 血糖
                else if (sessionStorage["MType"] == "0") 
                {
                    //血糖 (這一段關於血糖的處理程式與下面多數泰博血糖的處理程式完全一樣沒有任何特異)
                    var bgValue = WiseScripts.IO.padLeft(parseInt(ReturnString[3] + ReturnString[2], 16).toString(2), 16, "0");
                    bgValue = parseInt(bgValue.substring(0, 16), 2).toString(10);

                    var bgType = WiseScripts.IO.padLeft(parseInt(ReturnString[5] + ReturnString[4], 16).toString(2), 16, "0");
                    bgType = parseInt(bgType.substring(0, 2), 2).toString(10);

                    WriteLog.write("量測值: " + deviceName + " " + bgValue + "/Type:" + bgType, "info");
                                        

                    if (Object.prototype.toString.apply(multiDataContainer) === "[object Undefined]")
                    {
                        //如果傳進來的參數 multiDataContainer 沒有定義
                        //就是走 ResultCallBackFn 這一條路 !!


                        //出現不正常數值時，捨棄
                        if (bgValue <= 0)
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
                                MSCordovaBLE.checkHistoryLog(sessionStorage["DeviceTime" + address], address, bgValue,
                                    function (flag) {
                                        if (flag) {//checkHistoryLog()是判斷量測值有沒有重覆：true 沒重覆，false 重覆
                                            //回傳結果字串                                    
                                            MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                                       deviceName + "," +
                                                       sessionStorage["DeviceSerial_" + address] + "," +
                                                       sessionStorage["DeviceTime" + address] + "," +
                                                       bgValue + "," + bgType);
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
                                                   bgValue + "," + bgType);
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
                                bgValue + "," + bgType);
                        }
                    }
                }
                break;
            case "DIAMOND CUFF BP":
            case "FORA P30 PLUS":
                //收縮壓                    
                var Systolic = WiseScripts.IO.padLeft(parseInt(ReturnString[2], 16).toString(2), 8, "0");
                Systolic = parseInt(Systolic.substring(0, 8), 2).toString(10);

                //舒張壓
                var Diastolic = WiseScripts.IO.padLeft(parseInt(ReturnString[4], 16).toString(2), 8, "0");
                Diastolic = parseInt(Diastolic.substring(0, 8), 2).toString(10);

                var Pulse = WiseScripts.IO.padLeft(parseInt(ReturnString[5], 16).toString(2), 8, "0");
                Pulse = parseInt(Pulse.substring(0, 8), 2).toString(10);

                WriteLog.write("量測值: " + deviceName + " " + Systolic + "/" + Diastolic + "/" + Pulse, "info");

                if (Object.prototype.toString.apply(multiDataContainer) === "[object Undefined]") {
                    //如果傳進來的參數 multiDataContainer 沒有定義
                    //就是走 ResultCallBackFn 這一條路 !!


                    //出現不正常數值時，捨棄                    
                    if (parseInt(Systolic) < 1 || parseInt(Diastolic) < 1 || parseInt(Pulse) < 1
                        ||
                        parseInt(Systolic) >= 255 || parseInt(Diastolic) >= 255 || parseInt(Pulse) >= 255) {
                        MSCordovaBLE.MySetting.ResultCallBackFn(""); //呼叫外部的 ResultCallBackFn
                        MSCordovaBLE.MySetting.ErrorCallBackFn("Err007");
                    }
                    else {
                        //是否需要過慮歷史資料
                        if (MSCordovaBLE.MySetting.FilterHistoryData)
                        {
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
                        else
                        {
                            //回傳結果字串
                            MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                            deviceName + "," +
                                            sessionStorage["DeviceSerial_" + address] + "," +
                                            sessionStorage["DeviceTime" + address] + "," +
                                            Systolic + "," + Diastolic + "," + Pulse);
                        }
                    }
                }
                else {
                    //如果傳進來的參數 multiDataContainer 是一個陣列就把結果塞給它
                    //這是為了未來的 GetMultiDataCallBackFn 而做的 !!


                    if (Object.prototype.toString.apply(multiDataContainer) === "[object Array]") {
                        multiDataContainer.push(
                            deviceName + "," +
                            sessionStorage["DeviceSerial_" + address] + "," +
                            sessionStorage["DeviceTime" + address] + "," +
                            Systolic + "," + Diastolic + "," + Pulse);
                    }
                }
                break;
            case "TAIDOC TD4231":
            case "TAIDOC TD4286":
            case "TAIDOC BG":
            case "TAIDOC TD4289":
            case "FORA GD40":
                //血糖
                var bgValue = WiseScripts.IO.padLeft(parseInt(ReturnString[3] + ReturnString[2], 16).toString(2), 16, "0");
                bgValue = parseInt(bgValue.substring(0, 16), 2).toString(10);

                var bgType = WiseScripts.IO.padLeft(parseInt(ReturnString[5] + ReturnString[4], 16).toString(2), 16, "0");
                bgType = parseInt(bgType.substring(0, 2), 2).toString(10);

                WriteLog.write("量測值: " + deviceName + " " + bgValue + "/Type:" + bgType, "info");

                if (Object.prototype.toString.apply(multiDataContainer) === "[object Undefined]")
                {
                    //如果傳進來的參數 multiDataContainer 沒有定義
                    //就是走 ResultCallBackFn 這一條路 !!


                    //出現不正常數值時，捨棄
                    if (bgValue <= 0)
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
                            MSCordovaBLE.checkHistoryLog(sessionStorage["DeviceTime" + address], address, bgValue,
                                function (flag) {
                                    if (flag) {//checkHistoryLog()是判斷量測值有沒有重覆：true 沒重覆，false 重覆
                                        //回傳結果字串                                    
                                        MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                                   deviceName + "," +
                                                   sessionStorage["DeviceSerial_" + address] + "," +
                                                   sessionStorage["DeviceTime" + address] + "," +
                                                   bgValue + "," + bgType);
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
                                               bgValue + "," + bgType);
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
                            bgValue + "," + bgType);
                    }
                }
                break;
            case "FORA IR20":
            case "FORA IR21":
            case "TAIDOC TD1261":
                //溫度
                var TemperatureStr = WiseScripts.IO.padLeft(parseInt(ReturnString[3] + ReturnString[2], 16).toString(2), 16, "0");
                TemperatureStr = parseInt(TemperatureStr.substring(0, 16), 2).toString(10);

                var Temperature = (parseFloat(TemperatureStr) * 0.1).toFixed(1);
                WriteLog.write("量測溫度: " + deviceName + " " + Temperature, "info");

                if (Object.prototype.toString.apply(multiDataContainer) === "[object Undefined]")
                {
                    //如果傳進來的參數 multiDataContainer 沒有定義
                    //就是走 ResultCallBackFn 這一條路 !!


                    //出現不正常數值時，捨棄
                    if (Temperature <= 0) {
                        MSCordovaBLE.MySetting.ResultCallBackFn(""); //呼叫外部的 ResultCallBackFn
                        MSCordovaBLE.MySetting.ErrorCallBackFn("Err007");
                    }
                    else
                    {
                        //是否需要過慮歷史資料
                        if (MSCordovaBLE.MySetting.FilterHistoryData)
                        {
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
                        else
                        {
                            //回傳結果字串
                            MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                                               deviceName + "," +
                                               sessionStorage["DeviceSerial_" + address] + "," +
                                               sessionStorage["DeviceTime" + address] + "," +
                                               Temperature);
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
                            Temperature);
                    }
                }
                break;
        }
    }    
    
    ,//發送讀取資料(設備的時間資料)指令
    readStorageData_1: function (address, serviceUuid, characteristicsUuid) {
        var buffer = new Uint8Array([0x51, 0x25, 0x0, 0x0, 0x0, 0x0, 0xA3, 0x00]);
        //其中 buffer[2] 及 buffer[3] 代表index, 0x0, 0x0 <- 是量測紀錄的index,若是為 0x00 則代表讀取最新一筆紀錄!
        //var buffer = new Uint8Array([0x51, 0x25, 0x02, 0x00, 0x00, 0x00, 0xA3, 0x00]);
        
        buffer[7] = TAIDOC.checksumByte(buffer);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(TAIDOC.writeSuccess, MSCordovaBLE.handleErrorAndToClose);
    }

    ,//發送讀取資料(設備的量測資料)指令
    readStorageData_2: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0x51, 0x26, 0x0, 0x0, 0x0, 0x0, 0xA3, 0x00]);
        ////其中 buffer[2] 及 buffer[3] 代表index, 0x0, 0x0 <- 是量測紀錄的index,若是為 0x00 則代表讀取最新一筆紀錄!
        //var buffer = new Uint8Array([0x51, 0x26, 0x02, 0x00, 0x00, 0x00, 0xA3, 0x00]);
        
        buffer[7] = TAIDOC.checksumByte(buffer);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(TAIDOC.writeSuccess, MSCordovaBLE.handleErrorAndToClose);
    }

    ,//發送讀取前段設備序號指令
    readDeviceSerialNumber_front: function (address, serviceUuid, characteristicsUuid) {
        var buffer = new Uint8Array([0x51, 0x28, 0x0, 0x0, 0x0, 0x0, 0xA3, 0x00]);
        buffer[7] = TAIDOC.checksumByte(buffer);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(TAIDOC.writeSuccess, MSCordovaBLE.handleErrorAndToClose);
    }
    
    ,//發送讀取後段設備序號指令
    readDeviceSerialNumber_Behind: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0x51, 0x27, 0x0, 0x0, 0x0, 0x0, 0xA3, 0x00]);
        buffer[7] = TAIDOC.checksumByte(buffer);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(TAIDOC.writeSuccess, MSCordovaBLE.handleErrorAndToClose);
    }
        
    ,//發送設備關機指令    
    powerOff: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0x51, 0x50, 0x0, 0x0, 0x0, 0x0, 0xA3, 0x00]);
        buffer[7] = TAIDOC.checksumByte(buffer);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        if (window.cordova.platformId === "android") 
        {
            new Promise(function (resolve, reject) {

                bluetoothle.write(resolve, reject,
                {
                    type: "noResponse",
                    address: address,
                    service: serviceUuid,
                    characteristic: characteristicsUuid,
                    value: encodedString
                });
            }).then(TAIDOC.writePowerOffSuccess, MSCordovaBLE.handleErrorAndToClose);
        } else if (window.cordova.platformId === "ios")
        {
            new Promise(function (resolve, reject) {

                bluetoothle.write(resolve, reject,
                {
                    //type: "noResponse",
                    address: address,
                    service: serviceUuid,
                    characteristic: characteristicsUuid,
                    value: encodedString
                });
            }).then(TAIDOC.writePowerOffSuccess, MSCordovaBLE.handleErrorAndToClose);
        }
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
            if (result.name === "FORA GD40") {
                setTimeout(function () {
                    MSCordovaBLE.disconnectSuccess(result);
                }, 3500);
            }
            else {
                setTimeout(function () {
                    MSCordovaBLE.disconnectSuccess(result);
                }, 1000);
            }
        }
    }

    ,//發送設定時間指令
    //其中 sFn, fFn, powerOffFlag 這3個參數是給 MSCordovaBLE.SetTimeAlone() 傳遞使用的!
    setTime: function (address, serviceUuid, characteristicsUuid, sFn, fFn, powerOffFlag)
    {        
        var buffer = new Uint8Array([0x51, 0x33, 0x0, 0x0, 0x0, 0x0, 0xA3, 0x00]);

        var dt = new Date();
        var Y = dt.getFullYear().toString().substring(2);
        Y = WiseScripts.IO.padLeft(parseInt(Y).toString(2), 7, '0');

        var M = WiseScripts.IO.padLeft(dt.getMonth() + 1, 2, '0');
        M = WiseScripts.IO.padLeft(parseInt(M).toString(2), 4, '0');

        var D = WiseScripts.IO.padLeft(dt.getDate(), 2, '0');
        D = WiseScripts.IO.padLeft(parseInt(D).toString(2), 5, '0');

        var YMD = Y + M + D;

        buffer[3] = WiseScripts.IO.hexToBytes(parseInt(YMD.substring(0, 8), 2).toString(16))[0];
        buffer[2] = WiseScripts.IO.hexToBytes(parseInt(YMD.substring(8, 16), 2).toString(16))[0];
        buffer[4] = WiseScripts.IO.padLeft(dt.getMinutes(), 2, '0').toString(16);
        buffer[5] = WiseScripts.IO.padLeft(dt.getHours(), 2, '0').toString(16);

        //驗證碼
        buffer[7] = TAIDOC.checksumByte(buffer);

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
                    WriteLog.write("已成功寫入系統時間到 " + result.name + ".", "status");

                    if (sFn !== undefined){ sFn(); }

                    if (powerOffFlag !== undefined) {
                        if (powerOffFlag == true) TAIDOC.powerOff(address, serviceUuid, characteristicsUuid);
                    }
                },
                function (error) {                    
                    MSCordovaBLE.handleError(error);

                    if (fFn !== undefined) { fFn(); }

                    if (powerOffFlag !== undefined) {
                        if (powerOffFlag == true) TAIDOC.powerOff(address, serviceUuid, characteristicsUuid);
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
        var buffer = new Uint8Array([0x51, 0x52, 0x0, 0x0, 0x0, 0x0, 0xA3, 0x00]);
        buffer[7] = TAIDOC.checksumByte(buffer);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {                
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(TAIDOC.writeClearDataSuccess, MSCordovaBLE.handleErrorAndToClose);
    }

    ,
    writeClearDataSuccess: function (result) {
        WriteLog.write("已成功清除設備所有記憶資料.", "status");
    }

    ,
    writeSuccess: function (result) {
        //WriteLog.write(result);        
    }

    ,//計算checksum
    checksumByte: function (buffer) {
        var z = 0x00;
        for (var i = 0; i < buffer.length - 1; i++) {
            z += buffer[i];
        }
        return z;
    }

}