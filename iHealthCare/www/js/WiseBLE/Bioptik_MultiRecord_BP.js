//==================== Bioptik_MultiRecord ===============================
//此程式定義了中山瑞福(大陸)機型回傳多筆紀錄的功能,目前支援的設備型號:
// 'ETB04' 聿新易立測/中山瑞福(大陸)血糖/尿酸/膽固醇三合一 
 
var Bioptik_MultiRecord = Bioptik_MultiRecord || {}, Bioptik_MultiRecord = {
 
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
    
    //控制重送命令的全域變數
    linkResending: true,                        //true:重送 / false:不重送    
    offResending: true,                         //true:重送 / false:不重送
    readStorageNumberOfDataResending: true,     //true:重送 / false:不重送
    readRecordAtCurrentPositionResending: true, //true:重送 / false:不重送
    moveRecordPointerToPreResending: true,      //true:重送 / false:不重送
    resendingCount: 0,                          //重送次數    
    ThisType: "",    //此筆記錄類別//1:血糖 2:膽固醇 0:血壓

    poweroffIng: false,     //true:目前正處於關機階段 / false:
    LastPowerOff: true,    //收到量測後是否關閉ETB04  

    //完整的量測紀錄字串
    measurementDataFrontStr: "",      

    //處理從量測設備收到多筆的資料紀錄    
    procReturn: function (deviceName, address, serviceUuid, characteristicsUuid, returnData)
    {
        //-----------------------------------        
        if (!Bioptik_MultiRecord.poweroffIng
            && returnData == "")
        {
            sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
            sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值            
            sessionStorage["MType"] = "";                   //宣告出存放量測類型 P/G 的全域變數,並給空字串為初值

            Bioptik_MultiRecord.currentRecordIndex = 0;        //清空全域變數
            Bioptik_MultiRecord.storageNumberOfData = 0;       //清空全域變數
            Bioptik_MultiRecord.multiDataContainer.length = 0; //把這個 Array 容器的內容一次清空。            
            //-----------------------------------
            //送出 LINK packet   
            //Bioptik_MultiRecord.linkResending = true;          //清空全域變數
            Bioptik_MultiRecord.resendingCount = 0;            //清空全域變數               

           

            Bioptik_MultiRecord.linkResending = false;
            //-----------------------------------   
            //以藍芽位址取代設備序號資料
            Bioptik.getDeviceSerial(address);
            //-----------------------------------  
            //以系統時間取代設備時間資料
            Bioptik.getPeripheralTime(address);
            //-----------------------------------                         
            //發送讀取總紀錄筆數指令
            Bioptik_MultiRecord.readStorageNumberOfDataResending = true;    //清空全域變數
            Bioptik_MultiRecord.resendingCount = 0;                         //清空全域變數            

            setTimeout(function ()
            {
                //取得總筆數並比指標移到最新一筆(觸動7B,4C,)
                Bioptik_MultiRecord.readStorageNumberOfData(address, serviceUuid, characteristicsUuid);     
            }, 500);
        }
        else if (!Bioptik_MultiRecord.poweroffIng
            && returnData.indexOf("7B,4C,") == 0) //三合一血壓機
        {

            //傳進來的資料如:
            // 7B,4C,30,35,30,23,DA,7D,
            //其中   -- -- --    <- 這3個byte 就是總紀錄筆數

            //-----------------------------------
            //從收到的資料中取出總紀錄筆數數值
            Bioptik_MultiRecord.storageNumberOfData = Bioptik_MultiRecord.getStorageNumberOfData(returnData);

            if (Bioptik_MultiRecord.storageNumberOfData <= 0)//如果總筆數 = 0 --> 就直接結束 !!
            {
                //發送設備關機指令
                Bioptik_MultiRecord.offResending = true;                        //清空全域變數  
                Bioptik_MultiRecord.resendingCount = 0;                         //清空全域變數

                Bioptik_MultiRecord.powerOff(address, serviceUuid, characteristicsUuid);

                MSCordovaBLE.MySetting.GetMultiDataCallBackFn(Bioptik_MultiRecord.multiDataContainer);
            }
            else                                            //如果總筆數 != 0 --> 就接著讀取後續的資料...
            {
                Bioptik_MultiRecord.currentRecordIndex = 0;
                //-----------------------------------
                Bioptik_MultiRecord.readStorageNumberOfDataResending = false;

                Bioptik_MultiRecord.measurementDataFrontStr = "";               //清空全域變數
                //-----------------------------------   


                //-----------------------------------  
                //發送讀取目前指標位置上的紀錄的指令
                Bioptik_MultiRecord.readRecordAtCurrentPositionResending = true;//清空全域變數
                Bioptik_MultiRecord.resendingCount = 0;                         //清空全域變數

                setTimeout(function () {
                    //Bioptik_MultiRecord.readRecordAtCurrentPosition(address, serviceUuid, characteristicsUuid);
                    //發送讀取目前指標位置上的量測類別的指令(觸動7B,53,)
                    Bioptik_MultiRecord.sendLinkD(address, serviceUuid, characteristicsUuid, "S");           

                }, 500);
            }

           
        }   
        else if (!Bioptik_MultiRecord.poweroffIng
            && returnData.indexOf("7B,53,") == 0)                         //收到總紀錄筆數資料...
        {
            Bioptik_MultiRecord.measurementDataFrontStr = "";
             //Response:{S「m」nnnttt#<cs>}
            //1:血糖 2:膽固醇 0:血壓
            var dataBuffer = Bionime.parseHexStringToByteArr(returnData);
            var vMD_tmp = Bionime.binArrToString(dataBuffer);
            Bioptik_MultiRecord.ThisType = vMD_tmp.substr(2, 1);
            setTimeout(function () {
                //發送讀取目前指標位置上的量測資料的指令(觸動7B,44,)
                Bioptik_MultiRecord.readRecordAtCurrentPosition(address, serviceUuid, characteristicsUuid);
            }, 500);    
        }
        else if (!Bioptik_MultiRecord.poweroffIng
            && returnData.indexOf("7B,44,") == 0)                         //收到目前指標位置上的紀錄資料...
        {
              //傳進來的資料如:7B,44,55,30,31,31,39,2C,30,30,30,2C,31,38,30,36,32,36,31,35,
            //*** 注意: 傳進來的資料只是一筆量測紀錄的前20個byte而已 !!! ***

            ////debug
            //WriteLog.write("收到目前指標位置上的紀錄資料 = " + returnData, "debug");
            
            Bioptik_MultiRecord.readRecordAtCurrentPositionResending = false;

            //取得量測紀錄
            Bioptik_MultiRecord.measurementDataFrontStr = returnData;

            //Bioptik_MultiRecord.getMeasurementData(
            //    deviceName,
            //    address,
            //    returnData,
            //    Bioptik_MultiRecord.multiDataContainer);
            //-----------------------------------   
            //發送移動記錄指標到上一個記錄的指令
            Bioptik_MultiRecord.moveRecordPointerToPreResending = true;     //清空全域變數
            Bioptik_MultiRecord.resendingCount = 0;                         //清空全域變數

            setTimeout(function () {
                Bioptik_MultiRecord.moveRecordPointerToPre(address, serviceUuid, characteristicsUuid);
            }, 700);                        
        }
        else if (!Bioptik_MultiRecord.poweroffIng
            && returnData.indexOf("7B,41,43,4B,23,EA,7D,") == 0)          //收到移動記錄指標ACK回應...
        {//有下一筆
            //debug
            WriteLog.write("收到移動記錄指標ACK回應資料 = " + returnData, "debug");

            Bioptik_MultiRecord.moveRecordPointerToPreResending = false;

            Bioptik_MultiRecord.currentRecordIndex++;
            //----------------------------------- 
            if (Bioptik_MultiRecord.currentRecordIndex < Bioptik_MultiRecord.storageNumberOfData && //不超過實際紀錄筆數
                Bioptik_MultiRecord.currentRecordIndex < MSCordovaBLE.MySetting.MultiRecordMaxNo    //不超過最大回傳限制數
            )   //繼續讀取設備內的下一筆紀錄...
            {
                //接下來會讀取每一筆紀錄的 時間,數值 / 時間,數值 / 時間,數值... 一直讀到最後一筆!                                 

                //debug
                WriteLog.write("讀下一筆紀錄... ", "debug");


                //發送讀取下一筆紀錄值的指令                
                Bioptik_MultiRecord.readRecordAtCurrentPositionResending = true;//清空全域變數
                Bioptik_MultiRecord.resendingCount = 0;                         //清空全域變數

                setTimeout(function () {
                    //Bioptik_MultiRecord.readRecordAtCurrentPosition(address, serviceUuid, characteristicsUuid);
                    //發送讀取目前指標位置上的量測類別的指令(觸動7B,53,)
                    Bioptik_MultiRecord.sendLinkD(address, serviceUuid, characteristicsUuid, "S");          
                }, 500);                
            }
            else//讓設備關機...
            {
                //debug
                WriteLog.write("走 PATH A 結束. ", "debug");

                //if (MSCordovaBLE.MySetting.ClearData == true) {
                //    //發送清除設備所有記憶資料指令
                //    TAIDOC.clearData(address, serviceUuid, characteristicsUuid);
                //}
                

                //發送設備關機指令
                Bioptik_MultiRecord.offResending = true;                        //清空全域變數  
                Bioptik_MultiRecord.resendingCount = 0;                         //清空全域變數

               

                //呼叫外部的 GetMultiDataCallBackFn
                if (Bioptik_MultiRecord.storageNumberOfData > 0) {
                    Bioptik_MultiRecord.storageNumberOfData = 0;
                    MSCordovaBLE.MySetting.GetMultiDataCallBackFn(Bioptik_MultiRecord.multiDataContainer);
                }

                //發送設備關機指令
                Bioptik_MultiRecord.powerOff(address, serviceUuid, characteristicsUuid);
                if (Bioptik_MultiRecord.LastPowerOff) {
                    Bioptik_MultiRecord.offResending = true;           //清空全域變數  
                    Bioptik_MultiRecord.resendingCount = 0;            //清空全域變數

                    Bioptik_MultiRecord.poweroffIng = true;
                    setTimeout(function () {
                        if (Bioptik_MultiRecord.poweroffIng) {
                            //10秒後沒完成關機，直接勿略進到下一筆
                            WriteLog.write("10秒等不到關機ACK回應直接改flag ", "debug");
                            Bioptik_MultiRecord.poweroffIng = false;

                        }
                    }, 10000);

                    //Bioptik_ETB04.powerOff(address, serviceUuid, characteristicsUuid);

                }
                
            }
        }
        else if (returnData.indexOf("7B,4E,41,4B,23,E7,7D,") == 0)          //收到移動記錄指標NAK回應...
        {//無下一筆
            //debug
            WriteLog.write("收到移動記錄指標NAK回應資料 = " + returnData, "debug");

            Bioptik_MultiRecord.moveRecordPointerToPreResending = false;

            WriteLog.write("走 PATH B 結束. ", "debug");

            //if (MSCordovaBLE.MySetting.ClearData == true) {
            //    //發送清除設備所有記憶資料指令
            //    TAIDOC.clearData(address, serviceUuid, characteristicsUuid);
            //}


            //發送設備關機指令
            Bioptik_MultiRecord.offResending = true;                        //清空全域變數  
            Bioptik_MultiRecord.resendingCount = 0;                         //清空全域變數

           

            //呼叫外部的 GetMultiDataCallBackFn
            if (Bioptik_MultiRecord.storageNumberOfData > 0) {
                Bioptik_MultiRecord.storageNumberOfData = 0;
                MSCordovaBLE.MySetting.GetMultiDataCallBackFn(Bioptik_MultiRecord.multiDataContainer);
            }

            //發送設備關機指令
            Bioptik_MultiRecord.powerOff(address, serviceUuid, characteristicsUuid);
            if (Bioptik_MultiRecord.LastPowerOff) {
                Bioptik_MultiRecord.offResending = true;           //清空全域變數  
                Bioptik_MultiRecord.resendingCount = 0;            //清空全域變數

                Bioptik_MultiRecord.poweroffIng = true;
                setTimeout(function () {
                    if (Bioptik_MultiRecord.poweroffIng) {
                        //10秒後沒完成關機，直接勿略進到下一筆
                        WriteLog.write("10秒等不到關機ACK回應直接改flag ", "debug");
                        Bioptik_MultiRecord.poweroffIng = false;

                    }
                }, 10000);

                //Bioptik_ETB04.powerOff(address, serviceUuid, characteristicsUuid);

            }
            
        }
        else if (returnData.indexOf("7B,30,36,23,39,39,7D,") == 0)          //收到關機ACK回應{06#99}回應...
        {
            //debug
            WriteLog.write("收到關機ACK回應資料 = " + returnData, "debug");

            Bioptik_MultiRecord.offResending = false;            
            //-----------------------------------
            //根據保留天數來刪除 DeviceLog 的資料
            //MSCordovaBLE.delDeviceLog(MSCordovaBLE.MySetting.FilterHistoryData, MSCordovaBLE.MySetting.FilterHistoryDays);
        }
        else                                                                //收到一筆量測紀錄的後5個byte資料...
        {
            if (!Bioptik_MultiRecord.poweroffIng
                && 
                Bioptik_MultiRecord.measurementDataFrontStr != ""
                &&
                returnData.indexOf("7B,") != 0
                && returnData.indexOf("7D,") >=0 )    
            { //字串的第一個字不能是 '{'  且  字串數不能多於6個字 <-- 符合這個條件的資料就一定是 "一筆量測紀錄的後5個byte"

                //傳進來的資料如:32,33,23,85,7D,
                //*** 注意: 傳進來的資料只是一筆量測紀錄的後5個byte !!! ***

                //從收到的資料中取出量測數據
                Bioptik_MultiRecord.getMeasurementData(
                    deviceName,
                    address,
                    (Bioptik_MultiRecord.measurementDataFrontStr + returnData),
                    Bioptik_MultiRecord.multiDataContainer);

                //debug
                WriteLog.write("else ETB04 Data 封包 = " + returnData, "debug");
                WriteLog.write("else ETB04 Data 封包長度 = " + returnData.length, "debug");
            }
            else
            {
                //debug
                WriteLog.write("ETB04 Data 封包 = " + returnData, "debug");
                WriteLog.write("ETB04 Data 封包長度 = " + returnData.length, "debug");
            }
        }
    }

    ,//從收到的資料中取出量測數據
    getMeasurementData: function (deviceName, address, returnData, multiDataContainer)
    {
    
        ////debug
        //WriteLog.write("量測數據字串 = " + returnData, "debug");
        //WriteLog.write("量測數據字串長度 = " + returnData.length, "debug");

        var measurementKind = "";
        var measurementValueStr = "";
        var measurementValue = "";

        //先把傳入的Hex文字串轉成byte陣列
        var dataBuffer = Bionime.parseHexStringToByteArr(returnData);

        var vMD_tmp = Bionime.binArrToString(dataBuffer);
        WriteLog.write("量測值字串: " + vMD_tmp, "info");


        //量測數據的種類
        if (Bioptik_MultiRecord.ThisType == "0") {
            measurementKind = "P"; //0:血壓
            if (vMD_tmp.length < 25) {
                  //異常 return
                return;
            }
            var vSBP = parseInt(vMD_tmp.substr(2, 3));
            var vDBP = parseInt(vMD_tmp.substr(6, 3));
            var vHR = parseInt(vMD_tmp.substr(10, 3));
            if (isNaN(vDBP) || vDBP == 0) {
                //異常 return
                return;
            }
            if (isNaN(vHR) || vHR == 0) {
                //異常 return
                return;
            }
            measurementValue = vSBP
                + "," + vDBP
                + "," + vHR;
            sessionStorage["DeviceTime" + address] =
                "20"
                + vMD_tmp.substr(14, 2) + "/"
                + vMD_tmp.substr(16, 2) + "/"
                + vMD_tmp.substr(18, 2) + " "
                + vMD_tmp.substr(20, 2) + ":"
                + vMD_tmp.substr(22, 2) + ":00";
        }
        else if (Bioptik_MultiRecord.ThisType == "1") {
            measurementKind = "G"; //1:血糖
            measurementValue = parseInt(vMD_tmp.substr(2, 4));
            if (isNaN(measurementValue) || measurementValue == 0) {
                //異常 return
                return;
            }
            sessionStorage["DeviceTime" + address] =
                "20"
                + vMD_tmp.substr(11, 2) + "/"
                + vMD_tmp.substr(13, 2) + "/"
                + vMD_tmp.substr(15, 2) + " "
                + vMD_tmp.substr(17, 2) + ":"
                + vMD_tmp.substr(19, 2) + ":00";
        }
        else if (Bioptik_MultiRecord.ThisType == "2") {
            measurementKind = "C";//2:膽固醇
            measurementValue = parseInt(vMD_tmp.substr(2, 4));
            if (isNaN(measurementValue) || measurementValue == 0) {
                //異常 return
                return;
            }
            sessionStorage["DeviceTime" + address] =
                "20"
                + vMD_tmp.substr(11, 2) + "/"
                + vMD_tmp.substr(13, 2) + "/"
                + vMD_tmp.substr(15, 2) + " "
                + vMD_tmp.substr(17, 2) + ":"
                + vMD_tmp.substr(19, 2) + ":00";
        }  

        //血糖種類才有用到
        var BloodGlucoseType = 0;

        WriteLog.write("量測值: " + deviceName + " " + measurementKind + ":" + measurementValue + "/Type:" + BloodGlucoseType, "info");


        if (Object.prototype.toString.apply(multiDataContainer) === "[object Undefined]")
        {
            //如果傳進來的參數 multiDataContainer 沒有定義
            //就是走 ResultCallBackFn 這一條路 !!


            //出現不正常數值時，捨棄
            if (measurementValue == "") 
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
        else
        {
            //如果傳進來的參數 multiDataContainer 是一個陣列就把結果塞給它
            //這是為了未來的 GetMultiDataCallBackFn 而做的 !!


            if (Object.prototype.toString.apply(multiDataContainer) === "[object Array]")
            {
                multiDataContainer.push(
                    deviceName + "," +
                    sessionStorage["DeviceSerial_" + address] + "," +
                    sessionStorage["DeviceTime" + address] + "," +
                    measurementValue + "," + BloodGlucoseType + "," + measurementKind);
            }
        }



    }

    ,//從收到的資料中取出總紀錄筆數
    getStorageNumberOfData: function (returnData)
    {
        //傳進來的資料如:
        // 7B,4C,30,35,30,23,DA,7D,
        //其中   -- -- --    <- 這3個byte 就是總紀錄筆數   

        var numberOfData = 0;
        var numberOfDataStr = "";       

        //先把傳入的Hex文字串轉成byte陣列
        var dataBuffer = Bionime.parseHexStringToByteArr(returnData);

        var numberValueBuffer = new Uint8Array([0x00, 0x00, 0x00])
        numberValueBuffer[0] = dataBuffer[2];//取出 30
        numberValueBuffer[1] = dataBuffer[3];//取出 35
        numberValueBuffer[2] = dataBuffer[4];//取出 30        

        //byte陣列轉成ASCII文字字串
        numberOfDataStr = Bionime.binArrToString(numberValueBuffer);
        //經過一系列的轉換把 "30,35,30,"字串  轉成  "050"字串

        //量測數據的值
        numberOfData = parseInt(numberOfDataStr);

        WriteLog.write("紀錄筆數：" + numberOfData.toString(10), "info");


        return numberOfData;//回傳整數 50
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
        var buffer = null;//Bioptik.StrToUint8Arr(LinkCmd);
        buffer = new Uint8Array([0x7B, 0x4C, 0x23, 0xEF, 0x7D]);
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
            if (Bioptik_MultiRecord.linkResending == true && Bioptik_MultiRecord.poweroffIng == false) {
                if (Bioptik_MultiRecord.resendingCount < 12)//重送 Link Pack 5次
                {
                    WriteLog.write("重新發送Link Pack...", "status");
                    Bioptik_MultiRecord.resendingCount++;

                    Bioptik_MultiRecord.sendLink(address, serviceUuid, characteristicsUuid);
                }
                else if (Bioptik_MultiRecord.resendingCount >= 12)
                {
                    //如果重送 Link Pack 12次以上還無法跟設備進行溝通,就自動斷開藍牙,讓設備重新連線...
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
    ,
    sendLinkD: function (address, serviceUuid, characteristicsUuid, inputLinkCmd) {
        //var LinkCmd = '01' + WiseScripts.Format.Date_yyyyMMddHHmmss(new Date(), true).substr(2, 14);
        var LinkCmd = inputLinkCmd;

        var CkNo = Bioptik_ETB04.checksumByte(LinkCmd);
        LinkCmd = "{" + LinkCmd + "#" + CkNo + "}";  //LinkCmd: {01170331145030#42}        

        WriteLog.write("Link指令：" + LinkCmd, "status");
        //-----------------------------------------------------------
        var buffer = null;//Bioptik.StrToUint8Arr(LinkCmd);
        if (inputLinkCmd == "S") {
            buffer = new Uint8Array([0x7B, 0x53, 0x23, 0xF0, 0x7D]);
        } else if (inputLinkCmd == "D") {
            buffer = new Uint8Array([0x7B, 0x44, 0x23, 0xE7, 0x7D]);

        }

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
            WriteLog.write("已成功發送Link Pack.[" + inputLinkCmd + "]", "status");

        }, MSCordovaBLE.handleErrorAndToClose
            );

    }
    
    ,//發送讀取總紀錄筆數指令
    readStorageNumberOfData: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0x7B, 0x4C, 0x23, 0xEF, 0x7D]);//7b 4C 23 ef 7d = {L#<cs>}

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
        }).then(function (result) {
            WriteLog.write("已成功發送讀取紀錄筆數的指令.", "status");
        }, MSCordovaBLE.handleErrorAndToClose
        );
        //-----------------------------------------------------------
        setTimeout(function ()
        {
            if (Bioptik_MultiRecord.readStorageNumberOfDataResending == true)
            {
                if (Bioptik_MultiRecord.resendingCount < 5)//重送讀取總紀錄筆數指令 5次
                {
                    WriteLog.write("重新發送讀取總紀錄筆數指令...", "status");
                    Bioptik_MultiRecord.resendingCount++;

                    Bioptik_MultiRecord.readStorageNumberOfData(address, serviceUuid, characteristicsUuid);
                }
                else if (Bioptik_MultiRecord.resendingCount >= 5)
                {
                    //如果重送讀取總紀錄筆數指令 5次以上還無法跟設備進行溝通,就自動斷開藍牙,讓設備重新連線...
                    new Promise(function (resolve, reject) {

                        bluetoothle.close(resolve, reject,
                        {
                            address: address
                        });
                    }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);
                }
            }
        }, 800);
    }

    ,//發送讀取目前指標位置上的紀錄的指令
    readRecordAtCurrentPosition: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0x7B, 0x44, 0x23, 0xE7, 0x7D]);//7b 44 23 e7 7d = {D#<cs>}

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
        }).then(function (result) {
            WriteLog.write("已成功發送讀取目前指標位置上的紀錄的指令.", "status");
        }, MSCordovaBLE.handleErrorAndToClose
        );
        //-----------------------------------------------------------
        setTimeout(function ()
        {
            if (Bioptik_MultiRecord.readRecordAtCurrentPositionResending == true)
            {
                if (Bioptik_MultiRecord.resendingCount < 5)//重送讀取目前指標位置上的紀錄的指令 5次
                {
                    WriteLog.write("重新發送讀取目前指標位置上的紀錄的指令...", "status");
                    Bioptik_MultiRecord.resendingCount++;

                    Bioptik_MultiRecord.readRecordAtCurrentPosition(address, serviceUuid, characteristicsUuid);
                }
                else if (Bioptik_MultiRecord.resendingCount >= 5)
                {
                    //如果重送讀取目前指標位置上的紀錄的指令 5次以上還無法跟設備進行溝通,就自動斷開藍牙,讓設備重新連線...
                    new Promise(function (resolve, reject) {

                        bluetoothle.close(resolve, reject,
                        {
                            address: address
                        });
                    }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);
                }
            }
        }, 800);
    }

    ,//發送移動記錄指標到上一個記錄的指令
    moveRecordPointerToPre: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0x7B, 0x50, 0x23, 0xF3, 0x7D]);//7b 50 23 f3 7d = {P#<cs>}

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
        }).then(function (result) {
            WriteLog.write("已成功發送移動記錄指標到上一個記錄的指令.", "status");
        }, MSCordovaBLE.handleErrorAndToClose
        );
        //-----------------------------------------------------------
        setTimeout(function ()
        {
            if (Bioptik_MultiRecord.moveRecordPointerToPreResending == true)
            {
                if (Bioptik_MultiRecord.resendingCount < 5)//重送移動記錄指標到上一個記錄的指令 5次
                {
                    WriteLog.write("重新發送移動記錄指標到上一個記錄的指令...", "status");
                    Bioptik_MultiRecord.resendingCount++;

                    Bioptik_MultiRecord.moveRecordPointerToPre(address, serviceUuid, characteristicsUuid);
                }
                else if (Bioptik_MultiRecord.resendingCount >= 5)
                {
                    //如果重送移動記錄指標到上一個記錄的指令 5次以上還無法跟設備進行溝通,就自動斷開藍牙,讓設備重新連線...
                    new Promise(function (resolve, reject) {

                        bluetoothle.close(resolve, reject,
                        {
                            address: address
                        });
                    }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);
                }
            }
        }, 800);
    }

    ,//刪除全部記錄的指令
    deleteAllRecord: function (address, serviceUuid, characteristicsUuid)
    {
        var buffer = new Uint8Array([0x7B, 0x4B, 0x41, 0x23, 0xA9, 0x7D]);// 7b 4b 41 23 a9 7d = {KA#<cs>} delete all records.

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
        }).then(function (result) {
            WriteLog.write("已成功發送刪除全部記錄的指令.", "status");
        }, MSCordovaBLE.handleErrorAndToClose
        );
    }

    ,//發送設備關機指令    
    powerOff: function (address, serviceUuid, characteristicsUuid)
    {
        //三高機目前無關機指令
        //var buffer = Bioptik.StrToUint8Arr("{05#9A}");
        var buffer = new Uint8Array([0x7B, 0x5A, 0x23, 0xF9, 0x7D]);
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
        }).then(Bioptik_MultiRecord.writePowerOffSuccess, MSCordovaBLE.handleErrorAndToClose);
        //-----------------------------------------------------------
        setTimeout(function () {
            if (Bioptik_MultiRecord.offResending == true) {
                if (Bioptik_MultiRecord.resendingCount < 2)//重送 Off Pack 2次
                {
                    WriteLog.write("重新發送關機指令...", "status");
                    Bioptik_MultiRecord.resendingCount++;

                    Bioptik_MultiRecord.powerOff(address, serviceUuid, characteristicsUuid);
                }
                else if (Bioptik_MultiRecord.resendingCount >= 2) {
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
    writePowerOffSuccess: function (result) {
        
        WriteLog.write("writePowerOffSuccess() " + result.name + "/" + result.address, "status");
        setTimeout(function () {
            MSCordovaBLE.disconnectSuccess(result);
        }, 2000);
    }

}