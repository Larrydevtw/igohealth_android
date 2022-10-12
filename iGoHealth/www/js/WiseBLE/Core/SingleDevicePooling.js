//==================== SingleDevicePooling ===============================
//此程式定義了 pooling 單一藍牙設備模式, 目前除了 FLG-756 歐瑟若體脂機外其餘的設備都可以支援,
//目前在 android 及 ios 兩種平台上都可以執行~


var SingleDevicePooling = SingleDevicePooling || {}, SingleDevicePooling = {

    //初使化藍牙
    btInitialize: function ()
    {
        WriteLog.write("目前的作業模式: pooling 單一藍牙設備模式", "status");
        WriteLog.write("目前的作業平台: " + window.cordova.platformId, "status");
        //-------------------------------------------------
        //先檢查 被Pooling 的藍牙設備 address 這個必要數據是否有從外面的app被設定進來,
        //如果這個數據沒設定好,一定要把程式踢回去不允許執行
        if (MSCordovaBLE.MySetting.SingleDevicePoolingAddress == null ||
            MSCordovaBLE.MySetting.SingleDevicePoolingAddress.trim() == "") {

            MSCordovaBLE.MySetting.ResultCallBackFn("");
            MSCordovaBLE.MySetting.ErrorCallBackFn("Err012:");
            //Err012: "沒有設備的硬體位址(address)，無法進行連接"                       

            return;
        }
        else
        {
            WriteLog.write("指定的藍牙設備 address: " + MSCordovaBLE.MySetting.SingleDevicePoolingAddress, "status");
        }
        //-------------------------------------------------
        if (window.cordova.platformId === "android") {
            //先處理Android權限
            MSCordovaBLE.checkPermission()
                .then(MSCordovaBLE.btInitialize_android, MSCordovaBLE.btInitializeError)
                .then(SingleDevicePooling.btInitializeSuccess, MSCordovaBLE.handleError);
        } else if (window.cordova.platformId === "ios") {

            MSCordovaBLE.btInitialize_iOS()
                .then(SingleDevicePooling.btInitializeSuccess, MSCordovaBLE.handleError);

        }
        else {
            WriteLog.write("目前不支援 " + window.cordova.platformId + " 這種作業平台 !", "status");
        }
    }

    ,
    btInitializeSuccess: function (result)
    {
        var vFlag = true;//控制轉換成 pooling 模式的旗標: false -> scan 模式 / true -> pooling 模式
        if (result.status === "enabled") {
            WriteLog.write("藍牙初使化成功！", "status");
            if (window.cordova.platformId === "ios") {
                SingleDevicePooling.devicePooling(); //ios 程式一開始就跑 pooling 模式,完全是ok的.
            }
            else if (window.cordova.platformId === "android") {
                //Pooling 的方式是不作 scan 直接 connect 到藍牙設備的運作模式.
                //但當每次藍牙重啟後,android就會清空系統中藍牙的所有資訊,前次 connect/discover 成功的設備這次就不能 discover了,
                //解決的方式就是事先做硬體配對,讓目標設備的資訊一直被保留下來,這樣保證每次 connect/discover 一定會成功!
                //另一種解決的方式就是使用 scan 把目標設備的資訊先掃到保留下來,然後再轉成 pooling 的方式運作,
                //     好處是; 不用事先做硬體配對! 
                //     壞處是; 程式一開始是跑 scan 模式,目標設備一旦被掃到之後就由旗標控制轉換成跑 pooling 模式,這樣第一次會比較慢!
                //
                //ps. ios系統完全沒有以上這種鳥問題.

                /* ↓↓↓↓↓↓↓↓↓↓↓↓ modified by sinclair 20180110 */
                if (vFlag) {
                    try {
                        var vStartFn = function () {

                            var vScanSucessFn = function (device) {

                                WriteLog.write("找到設備:" + device.name + "/" + device.address);

                                if (MSCordovaBLE.MySetting.SingleDevicePoolingAddress != "" && device.address == MSCordovaBLE.MySetting.SingleDevicePoolingAddress)
                                {
                                    //vFlag = false;
                                    bluetoothle.stopScan(               //停止 scan 模式
                                        function () { },
                                        function () { }
                                    );
                                    SingleDevicePooling.devicePooling();//再轉換成 pooling 模式
                                }
                            };//End vScanSucessFn

                            bluetoothle.startScan(                      //程式一開始是跑 scan 模式
                                vScanSucessFn,
                                MSCordovaBLE.handleError,
                                {
                                    services: [
                                    ],
                                    scanMode: bluetoothle.SCAN_MODE_LOW_LATENCY,
                                    matchMode: bluetoothle.MATCH_MODE_AGGRESSIVE,
                                }
                            );                            
                        };//End vStartFn

                        //先停止再開啟掃描
                        bluetoothle.stopScan(
                            function () {
                                setTimeout(function () { vStartFn() }, 2000);
                            },
                            function () {
                                setTimeout(function () { vStartFn() }, 2000);
                            }
                        );
                    }
                    catch (error) {
                        MSCordovaBLE.handleError(error);
                    }                    
                }
                else {
                    SingleDevicePooling.devicePooling();
                }
                /* ↑↑↑↑↑↑↑↑↑↑↑↑ modified by sinclair 20180110 */
            }
        }
        else {
            WriteLog.write("藍牙目前尚未開啟:" + result.status, "status");
        }
    }

    ,//不間斷的連線藍牙設備
    devicePooling: function ()
    {
        MSCordovaBLE.foundDevices = [];
        
        if (window.cordova.platformId != "windows") {
            try {

                if (!MSCordovaBLE.foundDevices.some(function (device) {
                    return device.address === MSCordovaBLE.MySetting.SingleDevicePoolingAddress;
                })) //如果 foundDevices 的陣列中比對得到的項目就返回(不作任何事),否則就繼續往下作!
                {
                    //開始嘗試著與指定的設備連線...
                    new Promise(function (resolve, reject) {

                        bluetoothle.connect(resolve, reject,
                        {
                            address: MSCordovaBLE.MySetting.SingleDevicePoolingAddress                            
                        });
                    }).then(
                        SingleDevicePooling.devicePoolingSuccess,   //如果連線成功,就開始接資料,
                        SingleDevicePooling.recallDevicePooling);   //如果連線失敗,就關畢資源,進行遞迴呼叫,再重新嘗試與設備連線!
                }
            }
            catch (error) {
                MSCordovaBLE.handleError(error);
            }
        }
    }

    ,//連線成功,就開始接資料
    devicePoolingSuccess: function (result)
    {
        if (result.status === "connected") {
            //清除裝置畫面上的輸出訊息
            WriteLog.clearDisplay();

            WriteLog.write("藍牙連接成功！", "status");
            MSCordovaBLE.foundDevices.push(result);

            MSCordovaBLE.MySetting.ConnectCallBackFn(result);//呼叫外部的 ConnectCallBackFn            
            MSCordovaBLE.discoverDeviceServices(result);
        }
        else if (result.status === "disconnected") {            
            SingleDevicePooling.recallDevicePooling();
        }
    }

    ,//關畢資源,再重新嘗試與設備連線!
    recallDevicePooling: function ()
    {                               
        //-----------------------------
        //關畢資源
        new Promise(function (resolve, reject) {

            bluetoothle.close(resolve, reject,
            {
                address: MSCordovaBLE.MySetting.SingleDevicePoolingAddress
            });
        }).then(
            function () {
                WriteLog.write("重新等待與設備連線..." + WiseScripts.Format.Date_yyyyMMddHHmmss(new Date()), "status");
            },
            MSCordovaBLE.handleError);
        //-----------------------------
        //重新嘗試與設備連線
        SingleDevicePooling.devicePooling();
    }
}