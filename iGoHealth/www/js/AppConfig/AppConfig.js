var Domain = {
    //Address如為http需調整AndroidMainfest中 <application android:usesCleartextTraffic = "true"
    Address: "", //"ocics.tw",ethink.ocics.tw,ocics.cn/Beta 192.168.0.112
    ServiceRoot: "/Wise_Cloud_Service/AppCloudServices",
    ServiceApi: "/HATM_Services/api/HATMApp",
    Version: "IGH_eThink", //6 版本號: tw:IGH_x.x.x cn:HCCN_x.x.x IGH_TEST_ IGH_eThink_
    VersionNo: "", //版本號(只有號碼部分)
    AppName: "i顧健康",

    //App功能
    lFunction: ["Point", "Product", "MeasureScan", "SyncAppInfo"],
    //App開發中功能，陣列中有的功能項目不會啟用
    lDevFunction: [],

    AddressLocal: "",
    AddressLocal_A: "",
    AddressTest: "",
    AddressNT: "",
    AddressCN: "",

    Chk_AddressLocal: "NDJOTWtsWUVGK2UzbEZib0xvTEpPc044RDFTVFRoSzV6clcxK0hFcUdEaz0=",
    Chk_AddressLocal_A: "SDI3Z1Zzd09RdmZJV1FFamtSWFh3bXFNL3pSV3FPMkVCSk1Ma2gzREJFWT0=",
    Chk_AddressTest: "ZlY3L2wzME1uMlRVbjgxN2NyOUZoWmx5VDlsLytxUDVldnVGbk1xaXRMND0=",
    Chk_AddressNT: "RXFvd3FxQ2Q0UUk1RXc3S1MxdzZLRG9JWjQydjlrNGt3ZUFqaE9Nd2Uzdz0=",
    Chk_AddressCN: "Z0pHekFXRWRZZTRHMWZ0T01hRlRwSlhNUU1JQ3R5ZE5SSm1PK2lHbklyTT0=",

    CheckDomain:function(){
        switch (Domain.Version) {
            case "IGH":
                Domain.Address = "https://igohealth.com.tw";
                Domain.ServiceRoot = "/Wise_Cloud_Service/AppCloudServices";
                Domain.ServiceApi = "/HATM_Services/api/HATMApp";

                Domain.lDevFunction = ["Point", "Product"];
                break;
            case "IGH_eThink":
                Domain.Address = "https://demosite.ethink.com.tw";
                Domain.ServiceRoot = "/iGoHealth";
                Domain.ServiceApi = "/HATM_Services/api/HATMApp";

                Domain.lDevFunction = [];
                break;
            case "IGH_137":
                Domain.Address = "http://192.168.137.1";
                Domain.ServiceRoot = "/Wise_Cloud_Service/AppCloudServices";
                Domain.ServiceApi = "/HATM_Services/api/HATMApp";

                Domain.lDevFunction = [];
                break;
            case "IGH_127":
                Domain.Address = "http://127.0.0.1";
                Domain.ServiceRoot = "/Wise_Cloud_Service/AppCloudServices";
                Domain.ServiceApi = "/HATM_Services/api/HATMApp";

                Domain.lDevFunction = [];
                break;
            case "IGH_112":
                Domain.Address = "http://192.168.1.112";
                Domain.ServiceRoot = "/Wise_Cloud_Service/AppCloudServices";
                Domain.ServiceApi = "/HATM_Services/api/HATMApp";

                Domain.lDevFunction = [];
                break;
            case "IGH_133":
                Domain.Address = "http://192.168.0.133";
                Domain.ServiceRoot = "/Wise_Cloud_Service/AppCloudServices";
                Domain.ServiceApi = "/HATM_Services/api/HATMApp";

                Domain.lDevFunction = [];
                break;
            case "IGH_Wifi":
                Domain.Address = "http://192.168.0.180";//"http://172.27.80.1";
                Domain.ServiceRoot = "/Wise_Cloud_Service/AppCloudServices";
                Domain.ServiceApi = "/HATM_Services/api/HATMApp";

                Domain.lDevFunction = [];
                break;

            case "IGH_150":
                Domain.Address = "http://10.168.199.150";
                Domain.ServiceRoot = "/Wise_Cloud_Service/AppCloudServices";
                Domain.ServiceApi = "/HATM_Services/api/HATMApp";

                Domain.lDevFunction = [];
                break;
        }
    }
};
Domain.CheckDomain();

var AppConfig = {
    //行動版每日上傳筆數
    MobileUpCount: 1000,
    //資料庫名稱
    DbName: "iGoHealth.db",
    //資料庫版本
    DBVersion: 1.0,
    //語言包版本
    LangVersion: 1,
    //標準值版本
    StandardVersion: 1.0,
    StandardDisplay: "N",
    //血糖接收量測資料是否強制選擇時段
    BGTimeTypeConfirm:"Y",
    //儲存設備號碼
    EquipmentID:"",   
    //藍牙模組使用開關
    isAutoConnect: true, //是否自動連線
    //站點類別
    SystemModel: "IGH", //5050 App
    HRSSNo: "1000",         //量測資料介接系統註冊編號
    StationNo: "1000",      //站點編號

    //會員帳號類別
    UserKind: "7",
    //有使用的量測功能
    lMType: ["BG", "BP", "CHOL"], //, "BO","HR","STEP", "BT", "BW", "UA", 
    //第一次載入資料的起始日期(為確保載入所有量測資料)
    //DateS: "2018-01-01",
    //第一次載入資料的距今天數(載入雲端所有端點一個月的量測資料) //未來會有頁面給使用者選擇下載的區間
    day: -180,
    //藍牙詢問次數
    askBTTimes:0,
    //只開放藍牙配對模式:Y
    BTPairMode: "N",
    //上傳金鑰 //TODO
    MKey1: "KYc4mZvm+HbTRm0nYCxIwTxTfOk4hE2AqK1MjjJN7ac=",
    MKey2: "6AUSp0kQBe9qaMlBlILCyQ==",
    
    //會員QRCode
    MAesKey: "ethink",
    MAesIV: "health",

    //APP服務私用金鑰
    ASKey1: "6D0A1324B695428CB7410C5D4D2AEE3F",
    ASKey2: "93C474F29BDB4E138081DFFE7F524573",
    //聊天服務
    ASKeyChat:"cN9aOdaM4YbRGwhc12cvYne+hqsgWtVS",

    //會員專區
    MAesKey1: "我是參數加密文字",
    MAesKey2: "wisedata",

    //行動版註冊資訊
    //公司雲資訊
    App_LA: "CNWiseApp",
    App_SL: "KY3E5TAT",
    App_SC: "CNWise_M01",

    //逾時返回首頁時間
    TimeOutSec: 180,
    DownloadPath: "file:///sdcard/Download",

    //聊天服務
    ChatServices:Domain.AddressLocal_A+Domain.ServiceRoot+"/HATM_Services/api/ChatRoom",
    //APP私用服務
    AppServices: Domain.Address + Domain.ServiceRoot + Domain.ServiceApi, //"http://ocics.tw/WISE_Cloud_Service/AppServices/index.aspx",
    MemberServices: Domain.Address+Domain.ServiceRoot + Domain.ServiceApi,
    //使用服務名稱、Url設定 
    serviceFromLocal: true, //站點服務資訊是本機或雲端下載；App端預設為本機設定。 //Table: ServicesInfo
    serviceVer:"20002",  //站點服務資訊版本號
    lServiceUrl: [ //TODO 準備廢掉此流程
        { "ServicesName": "WSID_001"+Domain.AddressLocal_A, "ServicesURL": Domain.AddressLocal_A+Domain.ServiceRoot+"/rfHatmMReceive/WiseMeasurementReceive.svc" },
        { "ServicesName": "WSID_002"+Domain.AddressLocal_A, "ServicesURL": Domain.AddressLocal_A+Domain.ServiceRoot+"/rfHatmMQuery/WiseMeasurementQuery.svc" },
        { "ServicesName": "WSID_003"+Domain.AddressLocal_A, "ServicesURL": Domain.AddressLocal_A+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },
        { "ServicesName": "WSID_004"+Domain.AddressLocal_A, "ServicesURL": Domain.AddressLocal_A+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },
        { "ServicesName": "WSID_005"+Domain.AddressLocal_A, "ServicesURL": Domain.AddressLocal_A+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },

        { "ServicesName": "WSID_001"+Domain.AddressLocal, "ServicesURL": Domain.AddressLocal+Domain.ServiceRoot+"/rfHatmMReceive/WiseMeasurementReceive.svc" },
        { "ServicesName": "WSID_002"+Domain.AddressLocal, "ServicesURL": Domain.AddressLocal+Domain.ServiceRoot+"/rfHatmMQuery/WiseMeasurementQuery.svc" },
        { "ServicesName": "WSID_003"+Domain.AddressLocal, "ServicesURL": Domain.AddressLocal+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },
        { "ServicesName": "WSID_004"+Domain.AddressLocal, "ServicesURL": Domain.AddressLocal+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },
        { "ServicesName": "WSID_005"+Domain.AddressLocal, "ServicesURL": Domain.AddressLocal+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },

        { "ServicesName": "WSID_001"+Domain.AddressTest, "ServicesURL": Domain.AddressTest+Domain.ServiceRoot+"/rfHatmMReceive/WiseMeasurementReceive.svc" },
        { "ServicesName": "WSID_002"+Domain.AddressTest, "ServicesURL": Domain.AddressTest+Domain.ServiceRoot+"/rfHatmMQuery/WiseMeasurementQuery.svc" },
        { "ServicesName": "WSID_003"+Domain.AddressTest, "ServicesURL": Domain.AddressTest+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },
        { "ServicesName": "WSID_004"+Domain.AddressTest, "ServicesURL": Domain.AddressTest+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },
        { "ServicesName": "WSID_005"+Domain.AddressTest, "ServicesURL": Domain.AddressTest+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },

        { "ServicesName": "WSID_001"+Domain.AddressNT, "ServicesURL": Domain.AddressNT+Domain.ServiceRoot+"/rfHatmMReceive/WiseMeasurementReceive.svc" },
        { "ServicesName": "WSID_002"+Domain.AddressNT, "ServicesURL": Domain.AddressNT+Domain.ServiceRoot+"/rfHatmMQuery/WiseMeasurementQuery.svc" },
        { "ServicesName": "WSID_003"+Domain.AddressNT, "ServicesURL": Domain.AddressNT+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },
        { "ServicesName": "WSID_004"+Domain.AddressNT, "ServicesURL": Domain.AddressNT+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },
        { "ServicesName": "WSID_005"+Domain.AddressNT, "ServicesURL": Domain.AddressNT+Domain.ServiceRoot+"/rfHatmMMember/WiseMeasurementMember.svc" },
    ],
};