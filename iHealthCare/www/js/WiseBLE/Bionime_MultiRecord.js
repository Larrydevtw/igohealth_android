//==================== Bionime_MultiRecord ===============================
//此程式定義了華廣機型回傳多筆紀錄的功能,目前支援的設備型號:
// '2282RAA0429' 華廣血糖(GM282)  

 
var Bionime_MultiRecord = Bionime_MultiRecord || {}, Bionime_MultiRecord = {

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
        if (returnData == "")
        {
            sessionStorage["DeviceSerial_" + address] = ""; //宣告出存放設備序號的全域變數,並給空字串為初值
            sessionStorage["DeviceTime" + address] = "";    //宣告出存放設備系統時間的全域變數,並給空字串為初值            
            sessionStorage["MType"] = "";                   //宣告出存放量測類型 P/G 的全域變數,並給空字串為初值

            Bionime_MultiRecord.currentRecordIndex = 0;      //清空全域變數
            Bionime_MultiRecord.storageNumberOfData = 0;     //清空全域變數
            Bionime_MultiRecord.multiDataContainer.length = 0; //把這個 Array 容器的內容一次清空。
            //-----------------------------------

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
            Bionime_MultiRecord.storageNumberOfData = Bionime_GM282.getStorageNumberOfData(returnData);            

            if (Bionime_MultiRecord.storageNumberOfData <= 0)//如果總筆數 = 0 --> 就直接結束 !!
            {
                ////解除資料訂閱
                //MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);
            }
            else                                            //如果總筆數 != 0 --> 就接著讀取後續的資料...
            {
                Bionime_MultiRecord.currentRecordIndex = 1;
                //-----------------------------------
                //取得最新紀錄                        
                Bionime_GM282.readNewlyRecord(address, writeServiceUuid, writeCharacteristicsUuid);
            }
        }
        else if (returnData.indexOf("02,01,4F,9E,") == 0 &&       //收到紀錄資料 1~N 筆...
                 returnData.indexOf("02,01,4F,9E,00,00,") == -1 ) //但要排除掉總紀錄筆數資料
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
            Bionime_GM282.getMeasurementData(
                deviceName, address, returnData,
                Bionime_MultiRecord.multiDataContainer);//<-- 傳入這個陣列容器是為了 GetMultiDataCallBackFn 而做的 !!
            //-----------------------------------
            Bionime_MultiRecord.currentRecordIndex++;
            //-----------------------------------
            if (Bionime_MultiRecord.currentRecordIndex <= Bionime_MultiRecord.storageNumberOfData && //不超過實際紀錄筆數
                Bionime_MultiRecord.currentRecordIndex <= MSCordovaBLE.MySetting.MultiRecordMaxNo    //不超過最大回傳限制數
            )   //繼續讀取設備內的下一筆紀錄...
            {
                //接下來會讀取每一筆紀錄的 時間,數值 / 時間,數值 / 時間,數值... 一直讀到最後一筆!                                 

                //發送讀取下一筆紀錄值的指令
                Bionime_MultiRecord.readIndexNRecord(address, writeServiceUuid, writeCharacteristicsUuid,
                    (Bionime_MultiRecord.currentRecordIndex));
            }
            else//讓設備關機...
            {
                ////解除資料訂閱
                //MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);                

                //呼叫外部的 GetMultiDataCallBackFn
                MSCordovaBLE.MySetting.GetMultiDataCallBackFn(Bionime_MultiRecord.multiDataContainer);
            }
            //-----------------------------------
            //根據保留天數來刪除 DeviceLog 的資料
            MSCordovaBLE.delDeviceLog(MSCordovaBLE.MySetting.FilterHistoryData, MSCordovaBLE.MySetting.FilterHistoryDays);
        }       
    }

    ,//發送讀取第N筆紀錄值的指令
    readIndexNRecord: function (address, serviceUuid, characteristicsUuid, recordIndex)
    {
        //Example  -->  血糖機內目前的紀錄總數是23筆,實際讀取出來的結構如下: 
        //
        //讀取第1筆(最新)紀錄值:
        //    從2282RAA0429收到資料: 02,01,4F,9E,01,00,45,4B,8B,12,11,64,00,00,00,16,55,9C,00,00,
        //
        //    ...
        //
        //
        //讀取第19筆紀錄值:
        //    從2282RAA0429收到資料: 02,01,4F,9E,13,00,0F,2C,FA,12,D1,94,00,00,00,04,55,9C,00,00,
        //
        //讀取第20筆紀錄值:
        //    從2282RAA0429收到資料: 02,01,4F,9E,14,00,0F,2C,E1,12,D1,26,00,00,00,03,55,9C,00,00,
        //
        //讀取第21筆紀錄值:
        //    從2282RAA0429收到資料: 02,01,4F,9E,15,00,0F,2C,CC,12,D1,5F,00,00,00,02,55,9C,00,00,
        //
        //讀取第22筆紀錄值:
        //    從2282RAA0429收到資料: 02,01,4F,9E,16,00,0F,2B,F9,12,D1,58,00,00,00,01,55,9C,00,00,
        //
        //讀取第23筆紀錄值:
        //    從2282RAA0429收到資料: 02,01,4F,9E,17,00,0F,2B,F6,12,D3,E7,00,00,00,00,55,9C,00,00,
        //
        //讀取第24筆紀錄值: <-- 23筆以後就讀不到紀錄值了!
        //    無資料傳回
        //
        //讀取第25筆紀錄值: <-- 23筆以後就讀不到紀錄值了!
        //    無資料傳回
        //
        //    再往下讀取仍然無資料傳回...

        var buffer = new Uint8Array([0xB0, 0x61, 0x00, 0x00, 0x00]);//The command of read index N blood glucose data -> 
        buffer[2] = recordIndex;//第N筆
        buffer[(buffer.length - 1)] = Bionime.checksumByte(buffer);
        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject)
        {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(function (result) {
            WriteLog.write("已成功發送讀取第" + recordIndex.toString(10) + "筆紀錄值的指令.", "status");
        }, MSCordovaBLE.handleErrorAndToClose
        );
    }







}