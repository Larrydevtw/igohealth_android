//==================== Portal_BP ===============================
//此程式支援的設備型號:
// 'PORTAL-BP-xxxxxx' 血壓


var Portal_BP = Portal_BP || {}, Portal_BP = {
    canReceiveFlag: false,//此旗標作為判斷血壓機是否已開始進行量測

    procReturn: function (deviceName, address)
    {

        //-----------------------------------------
        Portal_BP.getDeviceSerial(address);//設備序號
        Portal_BP.getPeripheralTime(address);//設備時間
        //-----------------------------------------
        setTimeout(function () {//訂閱 "1810", "2A52" 的資料

            var sUUID = "1810";
            var cUUID = "00002A52-0000-1000-8000-00805F9B34FB";

            if (window.cordova.platformId === "android") {
                Portal_BP.receiveBPData(address, sUUID, cUUID);
            }
            else if (window.cordova.platformId === "ios") {
                new Promise(function (resolve, reject) {

                    bluetoothle.services(resolve, reject,//做ios Discover Device Services
                        {
                            address: address,
                            services: []
                        });
                }).then(
                    function (result) {
                        //WriteLog.write("Services 回傳狀態: " + result.status, "status");

                        if (result.status === "services") {
                            for (var key in result.services)//foreach 的等價寫法
                            {
                                //for (var key in objs) ... 其中宣告一個key變數,然後走訪services陣列,key顯示出來會是陣列索引
                                var sItem = result.services[key];
                                //WriteLog.write("sItem: " + sItem, "status");

                                if (sItem === sUUID) {
                                    //WriteLog.write("sItem: " + sItem + "符合!", "status");
                                    new Promise(function (resolve, reject) {

                                        bluetoothle.characteristics(resolve, reject,
                                            {
                                                address: result.address,
                                                service: sItem,
                                                characteristics: []
                                            });

                                    }).then(
                                        function (result) {
                                            //WriteLog.write("Characteristics 回傳狀態: " + result.status, "status");

                                            if (result.status === "characteristics") {
                                                for (var key in result.characteristics)//foreach 的等價寫法
                                                {
                                                    //for (var key in objs) ... 其中宣告一個key變數,然後走訪characteristics物件,key顯示出來會是物件的屬性名稱
                                                    var cItem = result.characteristics[key];
                                                    //WriteLog.write("cItem.uuid: " + cItem.uuid, "status");

                                                    if (cItem.uuid === cUUID) {
                                                        //WriteLog.write("result.service: " + result.service + "符合!", "status");
                                                        //WriteLog.write("cItem.uuid: " + cItem.uuid + "符合!", "status");
                                                        Portal_BP.receiveBPData(result.address, sUUID, cUUID);

                                                        break;
                                                    }
                                                }
                                            }
                                        },
                                        MSCordovaBLE.handleErrorAndToClose);

                                    break;
                                }
                            }
                        }
                    },
                    MSCordovaBLE.handleErrorAndToClose);

            }
        }, 100);
    }

    ,//開始接收藍牙設備 1810/2A52 傳過來的資料(真正開發建立訂閱)
    receiveBPData: function (address, serviceUuid, characteristicsUuid) {
         //debug:
        WriteLog.write("address: " + address, "status");
        WriteLog.write("serviceUuid: " + serviceUuid, "status");
        WriteLog.write("characteristicsUuid: " + characteristicsUuid, "status");

        var returnData = "";
        bluetoothle.subscribe(function (result) {
            //debug:
            WriteLog.write("subscribe: " + result, "status");

            if (result.status == "subscribed") {
                WriteLog.write(serviceUuid + "/" + characteristicsUuid + " 訂閱成功！", "status");
            }
            else if (result.status == "subscribedResult") {

                if (window.cordova.platformId === "android") {
                    //解除資料訂閱及斷線
                    new Promise(function (resolve, reject) {
                        bluetoothle.unsubscribe(resolve, reject,
                            {
                                address: address,
                                service: serviceUuid,
                                characteristic: characteristicsUuid
                            });
                    }).then(MSCordovaBLE.disconnectSuccess, MSCordovaBLE.disconnectSuccess);
                }
                else if (window.cordova.platformId === "ios") {
                    MSCordovaBLE.disconnectSuccess(result);
                }

                //歐瑟若體脂機只要藍牙接收完資料,機器會自己關機,不需要我們去下指令
                //所以當藍牙接收完資料,我們只要處理到斷開藍牙連線就好了!!
                //-----------------------------------------
                var gyroscopeValueBytes = bluetoothle.encodedStringToBytes(result.value);

                returnData = WiseScripts.IO.toHexString(gyroscopeValueBytes);//把收到的資料轉成16進位的字串(以逗號隔開)                

                WriteLog.write("從" + serviceUuid + "/" + characteristicsUuid + "收到資料: " + returnData, "receive");

                //-----------------------------------------
                ////var Arr = returnData.split(',');

                ////var Bin = WiseScripts.IO.padLeft(parseInt(Arr[3] + Arr[2], 16).toString(2), 16, "0");

                ////VAT = parseInt((Arr[2]), 16);
                ////WriteLog.write("內臟脂肪指數：" + VAT, "info");

                ////BMass = parseInt((Arr[4] + Arr[3]), 16) * 0.1;
                ////WriteLog.write("骨質密度：" + BMass.toFixed(2) + " %", "info");
                //////-----------------------------------------
                //////回傳結果字串
                //////Weight(體重),BMI, Fat(體脂),BM(基代),身高,性別,年齡, MMass(肌肉量), BWM(含水量), VAT(內臟脂肪指數), BMass(骨質密度)
                ////MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                ////    result.name + "," +
                ////    sessionStorage["DeviceSerial_" + address] + "," +
                ////    sessionStorage["DeviceTime" + address] + "," +
                ////    Weight.toFixed(1) + "," +
                ////    BMI.toFixed(1) + "," +
                ////    Fat.toFixed(2) + "," +
                ////    BM + "," +
                ////    MSCordovaBLE.MySetting.UserHeight + "," +
                ////    MSCordovaBLE.MySetting.UserGender + "," +
                ////    MSCordovaBLE.MySetting.UserAge + "," +
                ////    MMass.toFixed(2) + "," +
                ////    BWM.toFixed(2) + "," +
                ////    VAT + "," +
                ////    BMass.toFixed(2));
                //-----------------------------------------                
            }
        },
            MSCordovaBLE.handleErrorAndToClose,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid
            });
    }

    
    ,//計算checksum
    checksumByte: function (buffer) {
        var z = 0x00;
        for (var i = 0; i < buffer.length - 1; i++) {
            z += buffer[i];
        }
        return z;
    },//比對裝置藍牙名是否符合藍牙名的命名規則 
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
        index = (deviceName.toString()).search("Portal-BP-+[0-9]*");//比對規則
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
    ,
    connectSuccess: function (result) {
        WriteLog.write(result);

        if (result.status === "connected") {
            WriteLog.write("藍牙連接成功Portal_BP！", "status");

            MSCordovaBLE.MySetting.ConnectCallBackFn(result);//呼叫外部的 ConnectCallBackFn

            if (window.cordova.platformId === "android") {
                new Promise(function (resolve, reject) {

                    //發現設備的 服務/特徵/描述項 這3種資訊。
                    bluetoothle.discover(resolve, reject,
                        {
                            address: result.address
                        });
                }).then(
                    function (result) {
                        //WriteLog.write("Discover 回傳狀態: " + result.status, "status");

                        if (result.status === "discovered") {
                            Portal_BP.procReturn(result.name, result.address);
                        }
                    },
                    MSCordovaBLE.handleErrorAndToClose);
            }
            else if (window.cordova.platformId === "ios") {
                Portal_BP.procReturn(result.name, result.address);
            }
        }
        else if (result.status === "disconnected") {
            MSCordovaBLE.disconnectSuccess(result);
        }
    },
    //以藍芽位址取代設備序號資料
    getDeviceSerial: function (address) {
        sessionStorage["DeviceSerial_" + address] = address;
        WriteLog.write("設備序號：" + address + "/" + sessionStorage["DeviceSerial_" + address], "info");
    }

    ,//以系統時間取代設備時間資料
    getPeripheralTime: function (address) {
        sessionStorage["DeviceTime" + address] = WiseScripts.Format.Date_yyyyMMddHHmm(new Date());
        WriteLog.write("設備時間：" + address + "/" + sessionStorage["DeviceTime" + address], "info");
    }
    //,//發送設備測試指令    
    //testCommand: function (address, serviceUuid, characteristicsUuid) {
    //    //var buffer = new Uint8Array([0x04, 0x55, 0xAA, 0x03]);    //“廠商碼”讀取---不OK
    //    //var buffer = new Uint8Array([0x04, 0x00, 0xAD, 0xB1]);    //應用層通知斷開藍牙連接---不OK
    //    var buffer = new Uint8Array([0x04, 0x00, 0xA6, 0xAA]);      //應用層要求血壓計關機---OK
    //    
    //    var encodedString = bluetoothle.bytesToEncodedString(buffer);
    //
    //    new Promise(function (resolve, reject) {
    //
    //        bluetoothle.write(resolve, reject,
    //        {
    //            //type: "noResponse",
    //            address: address,
    //            service: serviceUuid,
    //            characteristic: characteristicsUuid,
    //            value: encodedString
    //        });
    //    }).then(Portal_BP.writeTestCommandSuccess, MSCordovaBLE.handleErrorAndToClose);
    //}
    //
    //,
    //writeTestCommandSuccess: function (result) {
    //    WriteLog.write("writeTestCommandSuccess() " + result.name + "/" + result.address);        
    //}


}