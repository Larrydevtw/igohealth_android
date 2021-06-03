//==================== Oserio_FLG_756 ===============================
//此程式支援的設備型號:
// 'FLG-756' 歐瑟若體脂


var Oserio_FLG_756 = Oserio_FLG_756 || {}, Oserio_FLG_756 = {

    Weight: 0,
    BMI: 0,
    Fat: 0,
    BM: 0,
    MMass: 0,
    BWM: 0,
    VAT: 0,
    BMass: 0,
    WScale: 0,

    procReturn: function (deviceName, address) {

        //先檢查 年齡/性別/身高 這3個必要數據是否有從外面的app被設定進來,
        //如果這3個數據沒設定好,一定要把程式踢回去不允許執行
        if (MSCordovaBLE.MySetting.UserAge == null ||     //年齡
            MSCordovaBLE.MySetting.UserGender == null ||  //性別
            MSCordovaBLE.MySetting.UserHeight == null     //身高
            )
        {            
            MSCordovaBLE.MySetting.ResultCallBackFn("");
            MSCordovaBLE.MySetting.ErrorCallBackFn("Err010:" + deviceName);
            //Err010: "設備缺少量測資料，無法進行分析"

            //斷開藍芽
            new Promise(function (resolve, reject) {

                bluetoothle.close(resolve, reject,
                {
                    address: address
                });
            }).then(MSCordovaBLE.closeSuccess, MSCordovaBLE.handleError);

            return;
        }

        switch (deviceName) {
            case "FLG-756":
                //-----------------------------------------
                OSERIO.getDeviceSerial(address);//設備序號
                OSERIO.getPeripheralTime(address);//設備時間
                //-----------------------------------------
                setTimeout(function () {//訂閱 "181D", "2A9D" 的資料                    
                    if (window.cordova.platformId === "android") {
                        Oserio_FLG_756.receiveWeightScaleData(address, "181D", "2A9D");
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

                                        if (sItem === "181D") {
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

                                                            if (cItem.uuid === "2A9D") {
                                                                //WriteLog.write("result.service: " + result.service + "符合!", "status");
                                                                //WriteLog.write("cItem.uuid: " + cItem.uuid + "符合!", "status");
                                                                Oserio_FLG_756.receiveWeightScaleData(result.address, "181D", "2A9D");
                                                                
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
                }, 10);
                setTimeout(function () {//訂閱 "181B", "2A9C" 的資料                    
                    if (window.cordova.platformId === "android") {
                        Oserio_FLG_756.receiveBodyCompositionData(address, "181B", "2A9C");
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

                                            if (sItem === "181B") {
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

                                                                if (cItem.uuid === "2A9C") {
                                                                    //WriteLog.write("result.service: " + result.service + "符合!", "status");
                                                                    //WriteLog.write("cItem.uuid: " + cItem.uuid + "符合!", "status");
                                                                    Oserio_FLG_756.receiveBodyCompositionData(address, "181B", "2A9C");

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
                setTimeout(function () {//訂閱 "181B", "CF1E9802-B7CD-4FC0-BA70-A9ECDAF76853" 的資料
                    if (window.cordova.platformId === "android") {
                        Oserio_FLG_756.receiveExbodyCompositionData(address, "181B", "CF1E9802-B7CD-4FC0-BA70-A9ECDAF76853");
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

                                            if (sItem === "181B") {
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

                                                                if (cItem.uuid === "CF1E9802-B7CD-4FC0-BA70-A9ECDAF76853") {
                                                                    //WriteLog.write("result.service: " + result.service + "符合!", "status");
                                                                    //WriteLog.write("cItem.uuid: " + cItem.uuid + "符合!", "status");
                                                                    Oserio_FLG_756.receiveExbodyCompositionData(address, "181B", "CF1E9802-B7CD-4FC0-BA70-A9ECDAF76853");

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
                }, 200);
                setTimeout(function () {//讀取 "181D", "2A9E" 的資料                    
                    if (window.cordova.platformId === "android") {
                        Oserio_FLG_756.readWeightScaleFeatureData(address, "181D", "2A9E");
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

                                        if (sItem === "181D") {
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

                                                            if (cItem.uuid === "2A9E") {
                                                                //WriteLog.write("result.service: " + result.service + "符合!", "status");
                                                                //WriteLog.write("cItem.uuid: " + cItem.uuid + "符合!", "status");
                                                                Oserio_FLG_756.readWeightScaleFeatureData(address, "181D", "2A9E");

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
                }, 300);
                setTimeout(function () {//寫入資料到 "181C", "2A80"                    
                    if (window.cordova.platformId === "android") {
                        Oserio_FLG_756.sendAgeParaToPeripheral(address, "181C", "2A80");
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

                                        if (sItem === "181C") {
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

                                                            if (cItem.uuid === "2A80") {
                                                                //WriteLog.write("result.service: " + result.service + "符合!", "status");
                                                                //WriteLog.write("cItem.uuid: " + cItem.uuid + "符合!", "status");
                                                                Oserio_FLG_756.sendAgeParaToPeripheral(address, "181C", "2A80");

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
                }, 400);
                setTimeout(function () {//寫入資料到 "181C", "2A8C"                    
                    if (window.cordova.platformId === "android") {
                        Oserio_FLG_756.sendGenderParaToPeripheral(address, "181C", "2A8C");
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

                                        if (sItem === "181C") {
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

                                                            if (cItem.uuid === "2A8C") {
                                                                //WriteLog.write("result.service: " + result.service + "符合!", "status");
                                                                //WriteLog.write("cItem.uuid: " + cItem.uuid + "符合!", "status");
                                                                Oserio_FLG_756.sendGenderParaToPeripheral(address, "181C", "2A8C");

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
                }, 500);
                setTimeout(function () {//寫入資料到 "181C", "2A8E"                    
                    if (window.cordova.platformId === "android") {
                        Oserio_FLG_756.sendHeightParaToPeripheral(address, "181C", "2A8E");
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

                                        if (sItem === "181C") {
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

                                                            if (cItem.uuid === "2A8E") {
                                                                //WriteLog.write("result.service: " + result.service + "符合!", "status");
                                                                //WriteLog.write("cItem.uuid: " + cItem.uuid + "符合!", "status");
                                                                Oserio_FLG_756.sendHeightParaToPeripheral(address, "181C", "2A8E");

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
                }, 600);

                break;
        }
    }

    //-----------------------------------------------------
    ,//開始接收藍牙設備 181d/2a9d 傳過來的資料(真正開發建立訂閱)
    receiveWeightScaleData: function (address, serviceUuid, characteristicsUuid)
    {
        // //debug:
        //WriteLog.write("address: " + address, "status");
        //WriteLog.write("serviceUuid: " + serviceUuid, "status");
        //WriteLog.write("characteristicsUuid: " + characteristicsUuid, "status");

        var returnData = "";
        bluetoothle.subscribe(function (result)
        {
            if (result.status == "subscribed") {
                WriteLog.write(serviceUuid + "/" + characteristicsUuid + " 訂閱成功！", "status");
            }
            else if (result.status == "subscribedResult") {
                //解除資料訂閱
                MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);
                //-----------------------------------------
                var gyroscopeValueBytes = bluetoothle.encodedStringToBytes(result.value);

                returnData = WiseScripts.IO.toHexString(gyroscopeValueBytes);//把收到的資料轉成16進位的字串(以逗號隔開)                

                WriteLog.write("從" + serviceUuid + "/" + characteristicsUuid + "收到資料: " + returnData, "receive");

                //-----------------------------------------
                var Arr = returnData.split(',');

                var Bin = WiseScripts.IO.padLeft(parseInt(Arr[0], 16).toString(2), 8, "0");
                //WriteLog.write("Flags系數：" + Bin);

                var MUnits = Bin[7];
                //WriteLog.write("秤子單位：" + MUnits, "info");

                /*
                1 Resolution of 0.5 kg or 1 lb 
                2 Resolution of 0.2 kg or 0.5 lb 
                3 Resolution of 0.1 kg or 0.2 lb 
                4 Resolution of 0.05 kg or 0.1 lb 
                5 Resolution of 0.02 kg or 0.05 lb 
                6 Resolution of 0.01 kg or 0.02 lb 
                7 Resolution of 0.005 kg or 0.01 lb 
                */
                switch (WScale) {
                    case "1":
                        if (MUnits == "0")
                        { WScale = 0.5; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        else
                        { WScale = 1; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        break;
                    case "2":
                        if (MUnits == "0")
                        { WScale = 0.2; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        else
                        { WScale = 0.5; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        break;
                    case "3":
                        if (MUnits == "0")
                        { WScale = 0.1; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        else
                        { WScale = 0.2; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        break;
                    case "4":
                        if (MUnits == "0")
                        { WScale = 0.05; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        else
                        { WScale = 0.1; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        break;
                    case "5":
                        if (MUnits == "0")
                        { WScale = 0.02; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        else
                        { WScale = 0.05; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        break;
                    case "6":
                        if (MUnits == "0")
                        { WScale = 0.01; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        else
                        { WScale = 0.02; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        break;
                    case "7":
                        if (MUnits == "0")
                        { WScale = 0.005; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        else
                        { WScale = 0.01; WriteLog.write("WScale：" + WScale.toString(), "info"); }
                        break;
                }
                //WriteLog.write("體重轉換系數：" + WScale);
                Weight = parseInt((Arr[2] + Arr[1]), 16) * WScale;
                WriteLog.write("體重：" + Weight.toFixed(2) + "kg", "info");

                var tmp = MSCordovaBLE.MySetting.UserHeight / 100;
                BMI = Weight / (tmp * tmp);
                WriteLog.write("BMI：" + BMI.toFixed(2), "info");
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
    
    ,//開始接收藍牙設備 181b/2a9c 傳過來的資料(真正開發建立訂閱)
    receiveBodyCompositionData: function (address, serviceUuid, characteristicsUuid)
    {
        // //debug:
        //WriteLog.write("address: " + address, "status");
        //WriteLog.write("serviceUuid: " + serviceUuid, "status");
        //WriteLog.write("characteristicsUuid: " + characteristicsUuid, "status");

        var returnData = "";
        bluetoothle.subscribe(function (result)
        {
            if (result.status == "subscribed") {
                WriteLog.write(serviceUuid + "/" + characteristicsUuid + " 訂閱成功！", "status");
            }
            else if (result.status == "subscribedResult") {
                //解除資料訂閱
                MSCordovaBLE.unReceiveData(address, serviceUuid, characteristicsUuid);
                //-----------------------------------------
                var gyroscopeValueBytes = bluetoothle.encodedStringToBytes(result.value);

                returnData = WiseScripts.IO.toHexString(gyroscopeValueBytes);//把收到的資料轉成16進位的字串(以逗號隔開)                

                WriteLog.write("從" + serviceUuid + "/" + characteristicsUuid + "收到資料: " + returnData, "receive");

                //-----------------------------------------
                var Arr = returnData.split(',');

                var Bin = WiseScripts.IO.padLeft(parseInt(Arr[3] + Arr[2], 16).toString(2), 16, "0");

                Fat = parseInt((Arr[3] + Arr[2]), 16) * 0.1;
                if (Fat > 6553) Fat = 0;
                WriteLog.write("體脂：" + Fat.toFixed(2) + " %", "info");

                BM = parseInt((Arr[5] + Arr[4]), 16);
                WriteLog.write("基代：" + BM + " kcal", "info");

                MMass = parseInt((Arr[7] + Arr[6]), 16) * 0.005;
                WriteLog.write("肌肉量：" + MMass.toFixed(2) + " kg", "info");

                BWM = parseInt((Arr[9] + Arr[8]), 16) * 0.005;
                WriteLog.write("含水量：" + BWM.toFixed(2) + " kg", "info");
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
    
    ,//開始接收藍牙設備 181b/cf1e9802-b7cd-4fc0-ba70-a9ecdaf76853 傳過來的資料(真正開發建立訂閱)
    receiveExbodyCompositionData: function (address, serviceUuid, characteristicsUuid)
    {
        // //debug:
        //WriteLog.write("address: " + address, "status");
        //WriteLog.write("serviceUuid: " + serviceUuid, "status");
        //WriteLog.write("characteristicsUuid: " + characteristicsUuid, "status");

        var returnData = "";
        bluetoothle.subscribe(function (result)
        {
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
                var Arr = returnData.split(',');

                var Bin = WiseScripts.IO.padLeft(parseInt(Arr[3] + Arr[2], 16).toString(2), 16, "0");

                VAT = parseInt((Arr[2]), 16);
                WriteLog.write("內臟脂肪指數：" + VAT, "info");

                BMass = parseInt((Arr[4] + Arr[3]), 16) * 0.1;
                WriteLog.write("骨質密度：" + BMass.toFixed(2) + " %", "info");
                //-----------------------------------------
                //回傳結果字串
                //Weight(體重),BMI, Fat(體脂),BM(基代),身高,性別,年齡, MMass(肌肉量), BWM(含水量), VAT(內臟脂肪指數), BMass(骨質密度)
                MSCordovaBLE.MySetting.ResultCallBackFn( //呼叫外部的 ResultCallBackFn
                    result.name + "," +
                    sessionStorage["DeviceSerial_" + address] + "," +
                    sessionStorage["DeviceTime" + address] + "," +
                    Weight.toFixed(1) + "," +
                    BMI.toFixed(1) + "," +
                    Fat.toFixed(2) + "," +
                    BM + "," +
                    MSCordovaBLE.MySetting.UserHeight + "," +
                    MSCordovaBLE.MySetting.UserGender + "," +
                    MSCordovaBLE.MySetting.UserAge + "," +
                    MMass.toFixed(2) + "," +
                    BWM.toFixed(2) + "," +
                    VAT + "," +
                    BMass.toFixed(2));
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
    
    ,//讀取藍牙設備 181d/2a9e 的資料
    readWeightScaleFeatureData: function (address, serviceUuid, characteristicsUuid)
    {
        // //debug:
        //WriteLog.write("address: " + address, "status");
        //WriteLog.write("serviceUuid: " + serviceUuid, "status");
        //WriteLog.write("characteristicsUuid: " + characteristicsUuid, "status");

        var returnData = "";
        bluetoothle.read(function (result) {

            if (result.status == "read") {
                var gyroscopeValueBytes = bluetoothle.encodedStringToBytes(result.value);
                         
                returnData = WiseScripts.IO.toHexString(gyroscopeValueBytes);//把收到的資料轉成16進位的字串(以逗號隔開)                

                WriteLog.write("從" + serviceUuid + "/" + characteristicsUuid + "讀到資料: " + returnData, "receive");

                //-----------------------------------------
                var Arr = returnData.split(',');

                //計算體重的解析度
                var Bin = WiseScripts.IO.padLeft(parseInt(Arr[0], 16).toString(2), 8, "0");
                //WriteLog.write("Flags系數：" + Bin);

                WScale = (Bin[1] + Bin[2] + Bin[3] + Bin[4]).toString(10);
                //WriteLog.write("體重系數(Bin)：" + WScale);
                WScale = parseInt(WScale, 2).toString(10);
                WriteLog.write("體重系數：" + WScale, "info");
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
    
    ,//發送使用者年齡數據給歐瑟若體脂機 181c/2a80
    sendAgeParaToPeripheral: function (address, serviceUuid, characteristicsUuid)
    {
        //把使用者年齡數據從 181c/2a80 傳送給歐瑟若體脂機        
        //WriteLog.write("準備送出年齡..", "status");

        var buffer = new Uint8Array(["0x" + parseInt(MSCordovaBLE.MySetting.UserAge, 10).toString(16)]);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(
            function () { WriteLog.write("已送出年齡參數到體脂機：" + MSCordovaBLE.MySetting.UserAge, "status"); },
            function () { WriteLog.write("年齡參數送出失敗", "status"); });
    }
    
    ,//發送使用者性別數據給歐瑟若體脂機 181c/2a8c
    sendGenderParaToPeripheral: function (address, serviceUuid, characteristicsUuid)
    {
        //把使用者性別數據從 181c/2a8c 傳送給歐瑟若體脂機
        //WriteLog.write("準備送出性別..", "status");

        var buffer = new Uint8Array(["0x" + parseInt(MSCordovaBLE.MySetting.UserGender, 10).toString(16)]);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(
            function () { WriteLog.write("已送出性別參數到體脂機：" + MSCordovaBLE.MySetting.UserGender, "status"); },
            function () { WriteLog.write("性別參數送出失敗", "status"); });
    }

    ,//發送使用者身高數據給歐瑟若體脂機 181c/2a8e
    sendHeightParaToPeripheral: function (address, serviceUuid, characteristicsUuid)
    {
        //把使用者身高數據從 181c/2a8e 傳送給歐瑟若體脂機
        //WriteLog.write("準備送出身高..", "status");

        var buffer = new Uint8Array(["0x" + parseInt(MSCordovaBLE.MySetting.UserHeight, 10).toString(16), 0x00]);

        var encodedString = bluetoothle.bytesToEncodedString(buffer);

        new Promise(function (resolve, reject) {

            bluetoothle.write(resolve, reject,
            {
                address: address,
                service: serviceUuid,
                characteristic: characteristicsUuid,
                value: encodedString
            });
        }).then(
            function () { WriteLog.write("已送出身高參數到體脂機：" + MSCordovaBLE.MySetting.UserHeight, "status"); },
            function () { WriteLog.write("身高參數送出失敗", "status"); });
    }

    //-----------------------------------------------------
    ,
    connectSuccess: function (result)
    {
        WriteLog.write(result);

        if (result.status === "connected") {
            WriteLog.write("藍牙連接成功！", "status");

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
                            Oserio_FLG_756.procReturn(result.name, result.address);
                        }
                    },
                    MSCordovaBLE.handleErrorAndToClose);                
            }
            else if (window.cordova.platformId === "ios") {
                Oserio_FLG_756.procReturn(result.name, result.address);
            }
        }
        else if (result.status === "disconnected") {
            MSCordovaBLE.disconnectSuccess(result);
        }
    }









};