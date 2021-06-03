//==================== HealForce_60F ===============================
//此程式支援的設備型號:
// 'PC-60F_SN001996' 力康血氧

var HealForce_60F = HealForce_60F || {}, HealForce_60F = {

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
        if (returnData == "") {
            sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
            sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值

            HealForce_60F.currentRecordIndex = 0;          //清空全域變數
            HealForce_60F.storageNumberOfData = 0;         //清空全域變數                    
            //-----------------------------------
            HealForce_60F.processMData = true;
            //送出 LINK packet        
            HealForce_60F.linkResending = true;            //清空全域變數
            HealForce_60F.resendingCount = 0;              //清空全域變數

            //HealForce_60F.sendLink(address, serviceUuid, characteristicsUuid);                    
        }else if (returnData.indexOf("AA,55,0F,08,01,") == 0) {
            WriteLog.write("Data 封包 = " + returnData, "debug");
            WriteLog.write("Data 封包長度 = " + returnData.length, "debug");
            var vTemp = returnData.split(',');
            WriteLog.write("血氧: " + parseInt(vTemp[5], 16) + ",心率: " + parseInt(vTemp[6], 16)  , "info");
        } else if (returnData.indexOf("82,AA,55,0F,06,21,01,03,") >= 0) {
            WriteLog.write("結果Data 封包 = " + returnData, "debug");
            WriteLog.write("結果Data 封包長度 = " + returnData.length, "debug");
            

            //因為血氧機沒有記錄時間…  
            //以藍芽位址取代設備序號資料
            Bioptik.getDeviceSerial(address);
            //-----------------------------------  
            //以系統時間取代設備時間資料
            Bioptik.getPeripheralTime(address);
            //從收到的資料中取出量測數據
            HealForce_60F.getMeasurementData(deviceName, address, returnData);
        }
        
    }

    ,//從收到的資料中取出量測數據
    getMeasurementData: function (deviceName, address, returnData)
    {
      
       
        var vArray = returnData.substr(
            returnData.indexOf("82,AA,55,0F,06,21,01,03,") + 24
            , 5).split(',');

        if (vArray.length != 2) {
            WriteLog.write("Error Length: " + returnData, "info");
            return;
        } 

        WriteLog.write("血氧: " + parseInt(vArray[0], 16) + ",心率: " + parseInt(vArray[1], 16), "info");

      
        //WriteLog.write("量測值: " + deviceName + " " + measurementKind + ":" + measurementValue + "/Type:" + BloodGlucoseType, "info");

        //血氧                      
        var BO = parseInt(vArray[0], 16).toString(10);
        //心率                        
        var BR = parseInt(vArray[1], 16).toString(10);
      

        WriteLog.write("量測值： " + deviceName + " " + BO + "/" + BR, "info");

        //出現不正常數值時，捨棄                    
        if (parseInt(BO) < 1 || parseInt(BR) < 1 
            ||
            parseInt(BO) > 100 || parseInt(BR) >= 255
        ) {
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
                                BO + "," + BR );
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
                    BO + "," + BR );
            }
        }
                
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
  
    ,//比對裝置藍牙名是否符合華廣藍牙名的命名規則 --> 也就是由裝置藍牙名來判斷是否為華廣血糖機! 
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
        index = (deviceName.toString()).search("PC-60F_SN+[0-9]*");//比對規則
        //例如 "PC-60F_SN001996" , "PC-60F_SN001998" 這個字串就符合上述的規則
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