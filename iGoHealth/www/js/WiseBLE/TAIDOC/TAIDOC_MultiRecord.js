//==================== TAIDOC_MultiRecord ===============================
//此程式定義了泰博機型回傳多筆紀錄的功能,目前支援的設備型號:
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

 
var TAIDOC_MultiRecord = TAIDOC_MultiRecord || {}, TAIDOC_MultiRecord = {

    //定義可以通行整個程式範圍的全域變數        
    //sessionStorage["DeviceSerial_" + address]   //存放藍牙設備的序號
    //sessionStorage["DeviceTime" + address]      //存放藍牙設備的系統時間
    //sessionStorage["MType"]                     //存放量測類型 P/G --> P/G=0 means blood glucose, P/G=1 means blood pressure(參考原廠文件 TICD_TD3261_2in1Meter_V1.5_20131028.pdf(page18下及page19上) 欄位 P/G 的說明)
    //----------------------------------------------------------------------------- 

    //放目前紀錄index的全域變數
    currentRecordIndex: 0,

    //放總紀錄筆數的全域變數
    storageNumberOfData: 0,

    //放多筆紀錄的陣列容器,最後這組陣列資料會傳給 GetMultiDataCallBackFn
    multiDataContainer: [],
    
    //處理從量測設備收到多筆的資料紀錄    
    procReturn: function (deviceName, address, serviceUuid, characteristicsUuid, returnData)
    {
        //Debug:
        //TAIDOC_MultiRecord.testMain();
        
        if (returnData == "")
        {
            sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
            sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值            
            sessionStorage["MType"] = "";                   //宣告出存放量測類型 P/G 的全域變數,並給空字串為初值

            TAIDOC_MultiRecord.currentRecordIndex = 0;      //清空全域變數
            TAIDOC_MultiRecord.storageNumberOfData = 0;     //清空全域變數
            TAIDOC_MultiRecord.multiDataContainer.length = 0; //把這個 Array 容器的內容一次清空。
            //-----------------------------------
            //讀取總紀錄筆數
            TAIDOC_MultiRecord.readStorageNumberOfData(address, serviceUuid, characteristicsUuid);
        } 
        else if (returnData.indexOf("51,2B,") == 0)
        {
            //從收到的資料中取出總紀錄筆數數值
            TAIDOC_MultiRecord.storageNumberOfData = TAIDOC_MultiRecord.getStorageNumberOfData(returnData);//ok!            
            // //debug
            //WriteLog.write("storageNumberOfData= " + TAIDOC_MultiRecord.storageNumberOfData, "debug");
            //-----------------------------------
 
            //呼叫外部的 GetStorageNumberOfDataCallBackFn
            MSCordovaBLE.MySetting.GetStorageNumberOfDataCallBackFn(TAIDOC_MultiRecord.storageNumberOfData);            
            //-----------------------------------

            if (TAIDOC_MultiRecord.storageNumberOfData <= 0)//如果總筆數 = 0 --> 就直接結束 !!
            {
                //解除資料訂閱
                MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);

                //發送設備關機指令
                TAIDOC.powerOff(address, serviceUuid, characteristicsUuid);
            }
            else                                            //如果總筆數 != 0 --> 就接著讀取後續的資料...
            {
                //讀取設備序號前段
                TAIDOC.readDeviceSerialNumber_front(address, serviceUuid, characteristicsUuid);
            }
        }
        else if (returnData.indexOf("51,28,") == 0)
        {
            sessionStorage["DeviceSerial_" + address] = ""; //清空存放設備序號的全域變數

            //從收到的資料中取出設備序號資料(序號前段)
            TAIDOC.getDeviceSerial(address, returnData);            
            //-----------------------------------

            //讀取設備序號後段
            TAIDOC.readDeviceSerialNumber_Behind(address, serviceUuid, characteristicsUuid);
        }
        else if (returnData.indexOf("51,27,") == 0)
        {
            //從收到的資料中取出設備序號資料(序號後段)
            TAIDOC.getDeviceSerial(address, returnData);
            WriteLog.write("設備序號：" + address + "/" + sessionStorage["DeviceSerial_" + address], "info");
            //-----------------------------------

            //讀取設備的時間資料
            TAIDOC_MultiRecord.readStorageDataByIndex_1(
                address, serviceUuid, characteristicsUuid,
                TAIDOC_MultiRecord.currentRecordIndex);
        }
        else if (returnData.indexOf("51,25,") == 0)
        {
            //從收到的資料中取出設備時間資料
            TAIDOC.getPeripheralTime(address, returnData);
            //-----------------------------------

            //讀取設備的量測資料
            TAIDOC_MultiRecord.readStorageDataByIndex_2(
                address, serviceUuid, characteristicsUuid,
                TAIDOC_MultiRecord.currentRecordIndex);
        }
        else if (returnData.indexOf("51,26,") == 0)
        {
            // //debug
            //WriteLog.write("currentRecordIndex= " + TAIDOC_MultiRecord.currentRecordIndex, "debug");
            //WriteLog.write("storageNumberOfData= " + TAIDOC_MultiRecord.storageNumberOfData, "debug");

            //從收到的資料中取出量測數據
            TAIDOC.getMeasurementData(
                deviceName, address, returnData,
                TAIDOC_MultiRecord.multiDataContainer);//<-- 傳入這個陣列容器是為了 GetMultiDataCallBackFn 而做的 !!
            //-----------------------------------
            TAIDOC_MultiRecord.currentRecordIndex++;
            //-----------------------------------
            if (TAIDOC_MultiRecord.currentRecordIndex < TAIDOC_MultiRecord.storageNumberOfData)
            {   //繼續讀取設備內的下一筆紀錄...
                //接下來會讀取每一筆紀錄的 時間,數值 / 時間,數值 / 時間,數值... 一直讀到最後一筆!                                 


                //開始讀取下一筆紀錄的時間資料
                TAIDOC_MultiRecord.readStorageDataByIndex_1(
                    address, serviceUuid, characteristicsUuid,
                    TAIDOC_MultiRecord.currentRecordIndex);
            }
            else//讓設備關機...
            {
                if (MSCordovaBLE.MySetting.ClearData == true)
                {
                    //發送清除設備所有記憶資料指令
                    TAIDOC.clearData(address, serviceUuid, characteristicsUuid);
                }

                //解除資料訂閱
                MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);

                //發送設備關機指令
                TAIDOC.powerOff(address, serviceUuid, characteristicsUuid);

                //呼叫外部的 GetMultiDataCallBackFn
                MSCordovaBLE.MySetting.GetMultiDataCallBackFn(TAIDOC_MultiRecord.multiDataContainer);
            }
            //-----------------------------------
            //根據保留天數來刪除 DeviceLog 的資料
            MSCordovaBLE.delDeviceLog(MSCordovaBLE.MySetting.FilterHistoryData, MSCordovaBLE.MySetting.FilterHistoryDays);
        }
    }
    
    ,//從收到的資料中取出總紀錄筆數
    getStorageNumberOfData: function (returnData)
    {
        var numberOfData = 0;
        var ReturnString = returnData.split(",");
                 
        //傳入的資料 51,2B,03,00,00,00,A5,26 
        //其中             03,00  <- 這兩個byte 就是總紀錄筆數
        var numberOfDataStr = WiseScripts.IO.padLeft(parseInt(ReturnString[3] + ReturnString[2], 16).toString(2), 16, "0");
        numberOfData = parseInt(numberOfDataStr.substring(0, 16), 2).toString(10);

        return numberOfData;//回傳整數 3
    }    
        
    ,//發送讀取資料(設備的時間資料)指令
    readStorageDataByIndex_1: function (address, serviceUuid, characteristicsUuid, recordIndex)
    {
        var buffer = new Uint8Array([0x51, 0x25, 0x0, 0x0, 0x0, 0x0, 0xA3, 0x00]);
        //其中 buffer[2] 及 buffer[3] 代表index, 0x0, 0x0 <- 是量測紀錄的index,若是為 0x00 則代表讀取最新一筆紀錄!

        var wordByteArray = WiseScripts.IO.wordToByteArray(recordIndex);//把整數轉換成2個byte的陣列,並且高底位置交換,例如 378 -> [0x7A,0x01]
        buffer[2] = wordByteArray[0];
        buffer[3] = wordByteArray[1];
        buffer[7] = TAIDOC.checksumByte(buffer);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);
        // //debug
        //WriteLog.write("recordIndex= " + recordIndex, "debug");
        //WriteLog.write("buffer= " + WiseScripts.IO.toHexString(buffer), "debug");
        
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
    readStorageDataByIndex_2: function (address, serviceUuid, characteristicsUuid, recordIndex)
    {
        var buffer = new Uint8Array([0x51, 0x26, 0x0, 0x0, 0x0, 0x0, 0xA3, 0x00]);
        //其中 buffer[2] 及 buffer[3] 代表index, 0x0, 0x0 <- 是量測紀錄的index,若是為 0x00 則代表讀取最新一筆紀錄!

        var wordByteArray = WiseScripts.IO.wordToByteArray(recordIndex);//把整數轉換成2個byte的陣列,並且高底位置交換,例如 378 -> [0x7A,0x01]
        buffer[2] = wordByteArray[0];
        buffer[3] = wordByteArray[1];
        buffer[7] = TAIDOC.checksumByte(buffer);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);
        // //debug        
        //WriteLog.write("recordIndex= " + recordIndex, "debug");
        //WriteLog.write("buffer= " + WiseScripts.IO.toHexString(buffer), "debug");
        
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
        
    ,//發送讀取總紀錄筆數指令
    readStorageNumberOfData: function (address, serviceUuid, characteristicsUuid) {
        var buffer = new Uint8Array([0x51, 0x2B, 0x0, 0x0, 0x0, 0x0, 0xA3, 0x00]);
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

    //-------------------------------------------
    ,
    testFun: function (arr)
    {
        var paraType = "";

        paraType = Object.prototype.toString.apply(arr);
        

        if (paraType === "[object Array]") 
        {
            WriteLog.write("arr type: " + "陣列", "debug");
        }
        else 
        {
            WriteLog.write("arr type: " + paraType, "debug");
        }
        //WriteLog.write("arr type: " + typeof (arr), "debug");
        
    }

    ,
    testMain: function ()
    {
        var aArray = [];
        aArray.push("aaa");
        aArray.push("bbb");
        aArray.push("ccc");
        TAIDOC_MultiRecord.testFun(aArray);         //"[object Array]"        
        TAIDOC_MultiRecord.testFun();               //"[object Undefined]"
        TAIDOC_MultiRecord.testFun(function () { });//"[object Function]"
        TAIDOC_MultiRecord.testFun("abc");          //"[object String]"
        TAIDOC_MultiRecord.testFun(123);            //"[object Number]"
    }

}