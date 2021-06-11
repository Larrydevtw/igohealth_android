//==================== SetPeripheralTimeAlone ===============================
 
var SetPeripheralTimeAlone = SetPeripheralTimeAlone || {}, SetPeripheralTimeAlone = {

    setTimeAloneSuccessFn: function (){ },
    setTimeAloneFailFn: function () { },
    setTimeAlonePowerOffFlag: true,
    sUUIDforWrite: "",
    cUUIDforWrite: "",

    //Ver <-- 目前用不到 ! 
    //device = { name: device.name, id: device.id }, 
    //Success Callback,
    //Failed Callback,
    //是否關機的旗標
    setTimeAloneConnect: function (Ver, device, SFn, FFn, PowerOffFlag)
    {
        SetPeripheralTimeAlone.setTimeAloneSuccessFn = SFn;
        SetPeripheralTimeAlone.setTimeAloneFailFn = FFn;
        SetPeripheralTimeAlone.setTimeAlonePowerOffFlag = PowerOffFlag;
        //---------------------------------------

        new Promise(function (resolve, reject) {

            bluetoothle.connect(resolve, reject, { address: device.id });

        }).then(SetPeripheralTimeAlone.setTimeAloneConnectSuccess, MSCordovaBLE.handleErrorAndToClose);
    }

    ,
    setTimeAloneConnectSuccess: function (result)
    {
        if (result.status === "connected") {
            WriteLog.write("藍牙連接成功！", "status");

            SetPeripheralTimeAlone.setTimeAloneDiscoverDeviceServices(result);
        }
        else if (result.status === "disconnected") {
            MSCordovaBLE.disconnectSuccess(result);
        }
    }

    ,
    setTimeAloneDiscoverDeviceServices: function (result)
    {
        WriteLog.write("Discover 設備服務中...", "status");

        var platform = window.cordova.platformId;

        switch (result.name) {
            case "TAIDOC TD4231":
            case "TAIDOC TD4286":
            case "TAIDOC BG":
            case "TAIDOC TD4289":
            case "FORA GD40":
            case "FORA D40":
            case "UniTai TD3261":
            case "DIAMOND CUFF BP":
            case "FORA IR21":
            case "FORA IR20":
            case "TAIDOC TD1261":
            case "FORA P30 PLUS":
                SetPeripheralTimeAlone.sUUIDforWrite = "00001523-1212-EFDE-1523-785FEABCD123";
                SetPeripheralTimeAlone.cUUIDforWrite = "00001524-1212-EFDE-1523-785FEABCD123";
                break;
            case "Tyson bio_NCIT":
                //sUUID = "0000706D-7547-4F49-5047-676E6F6C7553";
                //cUUID = "0200706D-7547-4F49-5047-676E6F6C7553";//台欣這組是只具有 notify 權限的 UUID,不能拿來寫入資料
                SetPeripheralTimeAlone.sUUIDforWrite = "0000706D-7547-4F49-5047-676E6F6C7553";
                SetPeripheralTimeAlone.cUUIDforWrite = "0100706D-7547-4F49-5047-676E6F6C7553";  //要使用台欣這組具有 write 權限的 UUID
                break;
            case "Tysonbio_BPM":
            case "Tyson bio_BPM":
                //sUUID = "0000FC00-0000-1000-8000-00805F9B34FB";
                //cUUID = "0000FCA1-0000-1000-8000-00805F9B34FB";//台欣這組是只具有 notify 權限的 UUID,不能拿來寫入資料
                if (platform === "android") {
                    SetPeripheralTimeAlone.sUUIDforWrite = "0000FC00-0000-1000-8000-00805F9B34FB";
                    SetPeripheralTimeAlone.cUUIDforWrite = "0000FCA0-0000-1000-8000-00805F9B34FB";  //要使用台欣這組具有 write 權限的 UUID
                }
                else if (platform === "ios") {
                    SetPeripheralTimeAlone.sUUIDforWrite = "FC00";//在ios中,上面的 sUUID/cUUID 會變成4碼的形式
                    SetPeripheralTimeAlone.cUUIDforWrite = "FCA0";
                }
                break;
            case "Tysonbio_BGM":
                //sUUID = "0000FC00-0000-1000-8000-00805F9B34FB";
                //cUUID = "0000FCA1-0000-1000-8000-00805F9B34FB";//台欣這組是只具有 notify 權限的 UUID,不能拿來寫入資料
                if (platform === "android") {
                    SetPeripheralTimeAlone.sUUIDforWrite = "0000FC00-0000-1000-8000-00805F9B34FB";
                    SetPeripheralTimeAlone.cUUIDforWrite = "0000FCA0-0000-1000-8000-00805F9B34FB";  //要使用台欣這組具有 write 權限的 UUID
                }
                else if (platform === "ios") {
                    SetPeripheralTimeAlone.sUUIDforWrite = "FC00";//在ios中,上面的 sUUID/cUUID 會變成4碼的形式
                    SetPeripheralTimeAlone.cUUIDforWrite = "FCA0";
                }
                break;
            case "Tyson_NC100":
                //sUUID = "0000FC00-0000-1000-8000-00805F9B34FB";
                //cUUID = "0000FCA1-0000-1000-8000-00805F9B34FB";//台欣這組是只具有 notify 權限的 UUID,不能拿來寫入資料
                if (platform === "android") {
                    SetPeripheralTimeAlone.sUUIDforWrite = "0000FC00-0000-1000-8000-00805F9B34FB";
                    SetPeripheralTimeAlone.cUUIDforWrite = "0000FCA0-0000-1000-8000-00805F9B34FB";  //要使用台欣這組具有 write 權限的 UUID
                }
                else if (platform === "ios") {
                    SetPeripheralTimeAlone.sUUIDforWrite = "FC00";//在ios中,上面的 sUUID/cUUID 會變成4碼的形式
                    SetPeripheralTimeAlone.cUUIDforWrite = "FCA0";
                }
                break;
            case "DS3"://樂生
                
                if (platform === "android") {
                    SetPeripheralTimeAlone.sUUIDforWrite = "0000FFF0-0000-1000-8000-00805F9B34FB";
                    SetPeripheralTimeAlone.cUUIDforWrite = "0000FFF2-0000-1000-8000-00805F9B34FB";
                }
                else if (platform === "ios") {
                    SetPeripheralTimeAlone.sUUIDforWrite = "FFF0";//在ios中,上面的 sUUID/cUUID 會變成4碼的形式
                    SetPeripheralTimeAlone.cUUIDforWrite = "FFF2";
                }
                break;
            default:
                //華廣血糖機是是屬於模糊藍牙名這一類的,所以須採用模糊比對!
                if (Bionime_GM282.deviceNameSearching(result.name) == true)//華廣血糖機
                {
                    if (platform === "android") {
                        SetPeripheralTimeAlone.sUUIDforWrite = "0000FEE0-0000-1000-8000-00805F9B34FB";
                        SetPeripheralTimeAlone.cUUIDforWrite = "0000FEE3-0000-1000-8000-00805F9B34FB";
                    }
                    else if (platform === "ios") {
                        SetPeripheralTimeAlone.sUUIDforWrite = "FEE0"; //在ios中,上面的 sUUID/cUUID 會變成4碼的形式
                        SetPeripheralTimeAlone.cUUIDforWrite = "FEE3";
                    }
                }


        }        

        if (platform === "android")
        {
            new Promise(function (resolve, reject) {

                //發現設備的 服務/特徵/描述項 這3種資訊。
                bluetoothle.discover(resolve, reject,
                {
                    address: result.address
                });
            }).then(SetPeripheralTimeAlone.setTimeAloneDiscoverSuccess, MSCordovaBLE.handleErrorAndToClose);
        }
        else if (platform === "ios")
        {
            new Promise(function (resolve, reject) {

                bluetoothle.services(resolve, reject,
                {
                    address: result.address,
                    services: []
                });

            }).then(SetPeripheralTimeAlone.setTimeAloneiOSServicesSuccess, MSCordovaBLE.handleErrorAndToClose);
        }
        else
        {
            WriteLog.write("不支援的平臺: '" + window.cordova.platformId + "'", "error");
            MSCordovaBLE.disconnectSuccess(result);
        }
    }

    ,
    setTimeAloneDiscoverSuccess: function (result)
    {
        if (result.status === "discovered")
        {
            //呼叫發送設定時間的函式
            SetPeripheralTimeAlone.setTimeAloneDataDispacher(
                result.name,
                result.address,
                SetPeripheralTimeAlone.sUUIDforWrite,
                SetPeripheralTimeAlone.cUUIDforWrite);
        }
    }

    ,//For iOS 的 discover ==> 設備的 服務資訊。
    setTimeAloneiOSServicesSuccess: function (result)
    {
        //WriteLog.write("Services 回傳狀態: " + result.status, "status");

        if (result.status === "services") {
            for (var key in result.services)//foreach 的等價寫法
            {
                //for (var key in objs) ... 其中宣告一個key變數,然後走訪services陣列,key顯示出來會是陣列索引
                var sItem = result.services[key];

                if (sItem === SetPeripheralTimeAlone.sUUIDforWrite) {
                    //WriteLog.write("sItem: " + sItem + "符合!", "status");

                    new Promise(function (resolve, reject) {

                        bluetoothle.characteristics(resolve, reject,
                        {
                            address: result.address,
                            service: sItem,
                            characteristics: []
                        });

                    }).then(SetPeripheralTimeAlone.setTimeAloneiOSCharacteristicsSuccess, MSCordovaBLE.handleErrorAndToClose);

                    break;
                }
            }
        }
    }

    ,//For iOS 的 discover ==> 設備的 特徵資訊。
    setTimeAloneiOSCharacteristicsSuccess: function (result)
    {
        //WriteLog.write("Characteristics 回傳狀態: " + result.status, "status");

        if (result.status === "characteristics") {
            for (var key in result.characteristics)//foreach 的等價寫法
            {
                //for (var key in objs) ... 其中宣告一個key變數,然後走訪characteristics物件,key顯示出來會是物件的屬性名稱
                var cItem = result.characteristics[key];

                if (cItem.uuid === SetPeripheralTimeAlone.cUUIDforWrite) {
                    //WriteLog.write("result.service: " + result.service + "符合!", "status");
                    //WriteLog.write("cItem.uuid: " + cItem.uuid + "符合!", "status");

                    //呼叫發送設定時間的函式
                    SetPeripheralTimeAlone.setTimeAloneDataDispacher(
                        result.name,
                        result.address,
                        SetPeripheralTimeAlone.sUUIDforWrite,
                        SetPeripheralTimeAlone.cUUIDforWrite);                    

                    break;
                }
            }
        }
    }

    ,//發送設定時間指令
    setTimeAloneDataDispacher: function (deviceName, address, serviceUuid, characteristicsUuid)
    {
        switch (deviceName) {
            case "TAIDOC TD4231":
            case "TAIDOC TD4286":
            case "TAIDOC BG":
            case "TAIDOC TD4289":
            case "FORA GD40":
            case "FORA D40":
            case "UniTai TD3261":
            case "DIAMOND CUFF BP":
            case "FORA IR21":
            case "FORA IR20":
            case "TAIDOC TD1261":
            case "FORA P30 PLUS":
                //發送設定時間指令
                TAIDOC.setTime(
                    address,
                    serviceUuid,
                    characteristicsUuid,
                    SetPeripheralTimeAlone.setTimeAloneSuccessFn,
                    SetPeripheralTimeAlone.setTimeAloneFailFn,
                    SetPeripheralTimeAlone.setTimeAlonePowerOffFlag);
                break;
            case "Tyson bio_NCIT":
                //發送設定時間指令
                TysonBio_TP.setTime(
                    address,
                    serviceUuid,
                    characteristicsUuid,
                    SetPeripheralTimeAlone.setTimeAloneSuccessFn,
                    SetPeripheralTimeAlone.setTimeAloneFailFn,
                    SetPeripheralTimeAlone.setTimeAlonePowerOffFlag);
                break;
            case "Tysonbio_BPM":
            case "Tyson bio_BPM":
                //發送設定時間指令
                TysonBio_BPM.setTime(
                    address,
                    serviceUuid,
                    characteristicsUuid,
                    SetPeripheralTimeAlone.setTimeAloneSuccessFn,
                    SetPeripheralTimeAlone.setTimeAloneFailFn,
                    SetPeripheralTimeAlone.setTimeAlonePowerOffFlag);
                break;
            case "Tysonbio_BGM":
                //發送設定時間指令
                TysonBio_BGM.setTime(
                    address,
                    serviceUuid,
                    characteristicsUuid,
                    SetPeripheralTimeAlone.setTimeAloneSuccessFn,
                    SetPeripheralTimeAlone.setTimeAloneFailFn,
                    SetPeripheralTimeAlone.setTimeAlonePowerOffFlag);
                break;
            case "Tyson_NC100":
                //發送設定時間指令
                Tyson_NC100.setTime(
                    address,
                    serviceUuid,
                    characteristicsUuid,
                    SetPeripheralTimeAlone.setTimeAloneSuccessFn,
                    SetPeripheralTimeAlone.setTimeAloneFailFn,
                    SetPeripheralTimeAlone.setTimeAlonePowerOffFlag);
                break;
            case "DS3":
                //發送設定時間指令
                Loson_DS3.setTime(
                    address,
                    serviceUuid,
                    characteristicsUuid,
                    SetPeripheralTimeAlone.setTimeAloneSuccessFn,
                    SetPeripheralTimeAlone.setTimeAloneFailFn,
                    SetPeripheralTimeAlone.setTimeAlonePowerOffFlag);
                break;
            default:
                //華廣血糖機是是屬於模糊藍牙名這一類的,所以須採用模糊比對!
                if (Bionime_GM282.deviceNameSearching(deviceName) == true)//華廣血糖機
                {                    
                    var setPCLServiceUuid = "";
                    var setPCLCharacteristicsUuid = "";                    

                    if (window.cordova.platformId === "android") {
                        setPCLServiceUuid = "0000FEE0-0000-1000-8000-00805F9B34FB";
                        setPCLCharacteristicsUuid = "0000FEE1-0000-1000-8000-00805F9B34FB";                       
                    }
                    else if (window.cordova.platformId === "ios") {
                        setPCLServiceUuid = "FEE0";
                        setPCLCharacteristicsUuid = "FEE1";                        
                    }
                    //-----------------------------------  
                    //發送開啟 PCL Mode 的指令: 這個 PCL Mode 要設成 ON,否則接下來都會讀寫不到資料~             
                    Bionime_GM282.setPCLModeIsON(
                        address,
                        setPCLServiceUuid,
                        setPCLCharacteristicsUuid);
                    //-----------------------------------                    
                    setTimeout(function () {
                        //發送設定時間指令
                        Bionime_GM282.setTime(
                            address,
                            serviceUuid,
                            characteristicsUuid,
                            SetPeripheralTimeAlone.setTimeAloneSuccessFn,
                            SetPeripheralTimeAlone.setTimeAloneFailFn,
                            SetPeripheralTimeAlone.setTimeAlonePowerOffFlag);
                    }, 1500);
                    //-----------------------------------
                }
                break;






        }
    }

}