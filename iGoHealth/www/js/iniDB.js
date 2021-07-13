//★初始化sqlite DB★
// 若要針對在 Ripple 或 Android 裝置/模擬器上載入的頁面，偵錯程式碼: 請啟動您的應用程式，設定中斷點，
// 然後在 JavaScript 主控台中執行 "window.location.reload()"。

var iniDB = iniDB || {},
    iniDB = {
        createTable: function (successFn, errFn) {
            //***
            //iniDB.js就下面這一句要檢查 db 的名字,一定要跟DAOFn.js所指的 db 名字一致 !!  
            var db = null;
            document.addEventListener('deviceready', function () {
                db = window.sqlitePlugin.openDatabase({
                    name: AppConfig.DbName,
                    location: 'default',
                });
            });
            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS mCustom_Params ( " +
                    "CP_No integer primary key," + //流水號
                    "UserID TEXT default 'mSys'," + //帳號, (初值「mSys」為系統用,ref UserInfo UserID)
                    "CP_ParaName TEXT," + //參數名稱 ex:量測類型
                    "CP_ParaValue TEXT," + //參數值
                    "CP_ACTIVE integer default 1 ," + //狀態(初值:1) 1：正常、0：停用*/
                    "CP_UP_Date TEXT" + //最後一次修改時間(yyyyMMddHHmmss)14碼
                    ");");
                /*APP 版本號*/
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS APP_Version ( " +
                    "V_ID integer primary key," + //App流水號
                    "V_APKName TEXT," + //APK名稱，含副檔名
                    "V_DESP TEXT," + //版本更新說明
                    "V_Version1 TEXT," + //大版號
                    "V_Version2 TEXT," + //中版號
                    "V_Version3 TEXT" + //小版號
                    " );"
                );
                //2018/10/08 新增 聊天相關Table
                // tx.executeSql("CREATE TABLE IF NOT EXISTS ChatUserInfo( " +
                //     "T_No integer primary key," + //App流水號
                //     "U_Key TEXT," + //聊天會員Key值
                //     "UD_Key TEXT," + //聊天會員Key值
                //     "U_ID TEXT," + //聊天ID 使用者自訂義 不可重複
                //     "U_Name TEXT, " + //聊天顯示名稱    
                //     "U_Image TEXT," + //聊天團像
                //     "U_Memo TEXT, " + //備註

                //     "CR_DATE TEXT DEFAULT (datetime('now','localtime')), " + //建立時間
                //     "UP_DATE TEXT " + //更新時間
                //     ");");
                // tx.executeSql("CREATE TABLE IF NOT EXISTS ChatFriendList( " +
                //     "T_No integer primary key," + //App流水號
                //     "U_ID TEXT," + //使用者聊天ID ref ChatUserProfile.U_ID
                //     "F_Key TEXT," + //聊天朋友Key值
                //     "F_Name TEXT, " + //聊天朋友顯示名稱    
                //     "F_Image TEXT," + //聊天朋友團像
                //     "F_Sort TEXT, " + //聊天朋友排序    
                //     "F_Actived TEXT," + //是否啟用 Y/N
                //     "F_Memo TEXT, " + //備註

                //     "CR_DATE TEXT DEFAULT (datetime('now','localtime')), " + //建立時間
                //     "UP_DATE TEXT " + //更新時間
                //     ");");
                // tx.executeSql("CREATE TABLE IF NOT EXISTS ChatList( " +
                //     "T_No integer primary key," + //App流水號
                //     "G_ID TEXT," + //ID值
                //     "G_Key TEXT," + //Key值
                //     "G_Name TEXT," + //
                //     "G_Image TEXT,"+
                //     "GType_No TEXT, " + //群組類別 預設1: 推播 2:單人聊天 3:兩人以上群組    
                //     "G_LastMsg TEXT,"+
                //     "G_LastMsgTime TEXT,"+
                //     "G_Count TEXT,"+
                //     "G_Memo TEXT,"+
                //     "CR_DATE TEXT DEFAULT (datetime('now','localtime')), " + //建立時間
                //     "UP_DATE TEXT " + //更新時間
                //     ");");
                // tx.executeSql("CREATE TABLE IF NOT EXISTS ChatGroupRoom( " +
                //     "T_No integer primary key," + //App流水號
                //     "G_Name TEXT," + //使用者聊天ID ref ChatUserProfile.U_ID
                //     "G_Key TEXT," + //Key值
                //     "GroupType_No TEXT, " + //群組類別 預設1: 推播 2:單人聊天 3:兩人以上群組    
                //     "F_Image TEXT," + //聊天朋友團像
                //     "F_Sort TEXT, " + //聊天朋友排序    
                //     "F_Actived TEXT," + //是否啟用 Y/N
                //     "F_Memo TEXT, " + //備註

                //     "CR_DATE TEXT DEFAULT (datetime('now','localtime')), " + //建立時間
                //     "UP_DATE TEXT " + //更新時間
                //     ");");

                tx.executeSql("CREATE TABLE IF NOT EXISTS AppInfo( " +
                    "_id INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID 
                    "AI_Name TEXT," + //App名稱
                    "AI_Version TEXT," + //App版號
                    "AI_DBVersion TEXT, " + //DB版號
                    "AI_CR_DATE TEXT, " + //App安裝時間
                    "AI_UP_DATE TEXT " + //App更新時間
                    ");");
                //帳號密碼、登入時間 //2018/04/17新增FTime
                tx.executeSql("CREATE TABLE IF NOT EXISTS UserInfo( " +
                    "_id INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID 
                    "UserID TEXT," + //使用者帳號 ref UserInfo UserID
                    "_Psd TEXT," + //密碼
                    "FTime TEXT " + //帳號登入時間
                    ");");
                //紀錄提醒事項 20180830新增
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS SetAlarm ( " +
                    "SA_NO integer primary key," + //流水號
                    "UserID TEXT," + //ref UserData UserID 用戶帳號
                    "SA_Title TEXT," + //提醒標題
                    "SA_Time TEXT," + //提醒時間
                    "SA_Text TEXT," + //提醒文字
                    "SA_Freq TEXT," + //頻率
                    "SA_Active TEXT," + //是否啟用

                    "SA_Sound TEXT," + //聲音
                    "SA_Icon TEXT," + //圖示

                    "SA_Start TEXT," + //開始日期
                    "SA_End TEXT," + //結束日期
                    "SA_Memo TEXT," + //備註

                    "SA_CR_Date TEXT," + //新增日期
                    "SA_UP_Date TEXT" + //更新日期
                    " );"
                );
                //使用者基本資訊
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS UserData ( " +
                    "UserID TEXT PRIMARY KEY," + //使用者帳號 ref UserInfo UserID
                    "UserKind TEXT," + //帳號類型 M:會員, C:卡片
                    "Height TEXT," + //身高
                    "T_Weight TEXT," + //目標體重
                    "Gender TEXT," + //性別
                    "Bir TEXT" + //生日
                    " );"
                );
                //卡號、帳號對應表 //TODO
                tx.executeSql("CREATE TABLE IF NOT EXISTS MemRef( " +
                    "_id INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID 
                    "UserID TEXT, " + //帳號
                    "CardID TEXT" + //卡號
                    ");");

                //量測資料更新時間 //2018/04/17新增
                tx.executeSql("CREATE TABLE IF NOT EXISTS MDataInfo( " +
                    "MI_NO INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID 
                    "UserID TEXT," + //使用者帳號 ref UserInfo UserID
                    "MI_Type TEXT," + //量測類別
                    "MI_DTime TEXT," + //從雲端下載時間
                    "MI_Memo TEXT," + //
                    "MI_Status TEXT," + //狀態
                    "MI_CR_Date TEXT," + //
                    "MI_UP_Date TEXT" +
                    ");");

                //量測數值資料表(待上傳)
                tx.executeSql("CREATE TABLE IF NOT EXISTS UpDataList( " +
                    "_id INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID
                    "UserType TEXT, " + //量測身份別
                    "User TEXT, " + //量測者
                    "MTime TEXT," + //量測時間
                    "MType TEXT," + //量測類型
                    "MValue TEXT," + //量測數值 (以','為分割)
                    "MDeviceID TEXT," + //量測設備ID
                    "DeviceModel TEXT" + //量測設備型號
                    ");");

                //2020.10.31 Management_XX 增加M_UP_Date一個欄位
                //2020.10.28 Management_XX 增加MRowSId一個欄位
                //2020.10.25 Management_XX 增加UploadStatus(A:新增；U:修改；Q:上傳中；S:上傳完成)、MRowKey兩個欄位
                //2019.08.05 Management_XX 增加DeviceModel、DeviceId兩個欄位
                //BG、BP、BT、BW、CHOL、UA、EC、WL
                //血壓資料
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_BP ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +

                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "SBP TEXT," + //收縮壓
                    "DBP TEXT," + //舒張壓
                    "HR TEXT," + //脈博

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );
                //血糖資料
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_BG ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +

                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "TimeType TEXT," + //檢測時段(7:睡前/8:飯前/9:飯後)
                    "BS TEXT," + //血糖值(mg/dL)

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );
                //尿酸資料 20181204新增
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_UA ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +
                    
                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "UA TEXT," + //血糖值(mg/dL)

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );
                //膽固醇資料 20181212新增
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_CHOL ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +
                    
                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "CHOL TEXT," + //膽固醇(mg/dL)
                    "HDL TEXT," +
                    "LDL TEXT," +
                    "TG TEXT," +

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );
                //體溫資料
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_BT ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +
                    
                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "BT TEXT," + //體溫(℃)

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );
                //血氧資料
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_BO ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +
                    
                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "SPO2 TEXT," +
                    "HR TEXT," +

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );
                //步數 20190730新增
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_STEP ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +
                    
                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "STEP TEXT," + //步數
                    "Distance TEXT," + //距離(km)
                    "CAL TEXT," + //卡路里(kcal)

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );
                //心率資料 20191021新增
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_HR ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +
                    
                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "HR TEXT," + //心率 次/分
                    "HRGroup TEXT," + //心率分群
                    "HRType TEXT," + //心率量測類別

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );
                //體組成資料
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_BW ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +
                    
                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "Gender TEXT," + //性別
                    "Age TEXT," + //年齡
                    "Height TEXT," + //身高
                    "Weight TEXT," + //體重
                    "BMI TEXT," + //BMI
                    "Waistline TEXT," + //腰圍
                    "BaseRate TEXT," + //基礎代謝率
                    "BodyRate TEXT," + //體脂肪率
                    "VisceralRate TEXT," + //內臟脂肪率
                    "FatMass TEXT," + //Fat Mass脂肪量
                    "FFM TEXT," + //除脂肪量
                    "MuscleMass TEXT," + //肌肉量
                    "TBW TEXT," + //身體總含水量
                    "TBWPercentage TEXT," + //身體總含水量百分比
                    "BoneMass TEXT," + //預測骨量
                    "MetabolicAge TEXT," + //代謝年齡
                    "BodyGrade TEXT," + //體型評分
                    "BodyType TEXT," + //體型判定
                    "MuscleScore TEXT," + //肌肉

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );
                //腰圍資料
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_WL ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +
                    
                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "Waistline TEXT," + //腰圍

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );
                //心電圖資料
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS Management_EC ( " +
                    "MRowID INTEGER PRIMARY KEY AUTOINCREMENT," + //流水號
                    "Account TEXT, " + //帳號
                    "MTimeStamp TEXT," + //檢測時間 yyyy/mm/dd                  
                    "DeviceModel TEXT," +
                    "DeviceId TEXT," +
                    
                    "UploadStatus TEXT," +
                    "MRowKey TEXT," +
                    "MRowSId TEXT," +

                    "ECGData TEXT," + //

                    "StandardLevel TEXT," +
                    "Warnings TEXT," +
                    "MFlag TEXT," +
                    "RedItem TEXT," +
                    "M_UP_Date TEXT," +
                    "Memo TEXT" + //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                    " );"
                );

                //站點資料資料表
                tx.executeSql("CREATE TABLE IF NOT EXISTS StationInfo( " +
                    "_id INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID
                    "ESynTime TEXT," + //參數同步時間
                    "StationAccount TEXT," + //授權帳號
                    "StationLicense TEXT," + //站點註冊碼
                    "StationNo TEXT, " + //站點編號
                    "StationCode TEXT, " + //站點代號
                    "StationName TEXT," + //站點名稱
                    "StationDeadline TEXT," + //站點(展示)有效期限
                    "IsAutoUpdate TEXT," + //自動更新(1:啟用；0:停用)
                    "ShuntDays TEXT," + //(更新)分流時段(1:星期日,2:星期一,3:星期二,4:星期三,5:星期四,6:星期五,7:星期六)
                    "ShuntTime TEXT," + //(更新)分流時段(起 ~ 迄)
                    "IsShowPowerOff TEXT," + //是否顯示關機鈕(1:顯示；0:隱藏)
                    "IsShowUID TEXT," + //是否顯示使用者識別碼(1:顯示；0:隱藏)
                    "IsPrint TEXT," + //是否啟用列印當次量測(1:啟用；0:停用)
                    "PtCompany_CH TEXT," + //列印頁尾-單位名稱(中)
                    "PtCompany_EN TEXT," + //列印頁尾-單位名稱(英)
                    "PtAddress_CH TEXT," + //列印頁尾-單位地址(中)
                    "PtAddress_EN TEXT," + //列印頁尾-單位地址(英)
                    "PtTEL TEXT," + //列印頁尾-單位電話
                    "PtWeb TEXT," + //列印頁尾-單位網址
                    "VideoLink TEXT," + //衛教宣導影片連結
                    "BackgroundA_F TEXT," + //自訂量測頁底圖A_F
                    "BackgroundB_F TEXT," + //自訂量測頁底圖B_F
                    "BackgroundC_F TEXT," + //自訂量測頁底圖C_F
                    "BackgroundA_S TEXT," + //自訂量測頁底圖A_S
                    "BackgroundB_S TEXT," + //自訂量測頁底圖B_S
                    "BackgroundC_S TEXT," + //自訂量測頁底圖C_S
                    "LogoA TEXT," + //自訂首頁Logo
                    "LogoB TEXT," + //自訂說明與量測頁Logo
                    "UpID TEXT," + //單位帳號
                    "UpCode TEXT," + //量測資料介接系統註冊編號
                    "UpKey1 TEXT," + //上傳量測數據時的密鑰Key1
                    "UpKey2 TEXT" + //上傳量測數據時的密鑰Key2
                    ");");

                //設備資料表
                tx.executeSql("CREATE TABLE IF NOT EXISTS DevicesInfo( " +
                    "_id INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID
                    "DeviceReceiveItem TEXT, " + //設備接收項目
                    "DeviceBrand TEXT, " + //設備廠牌代碼
                    "DeviceBName TEXT," + //設備廠牌名稱
                    "DeviceModel TEXT," + //設備型號
                    "DeviceName TEXT," + //設備名稱
                    "DeviceReceiveType TEXT, " + //接收方式(1:RS232；2:Bluetooth；4:HID；5:USB)
                    "DeviceParameter TEXT, " + //參數(ex:讀卡機名稱、Baudrate...)
                    "DeviceID TEXT " + //設備編號
                    ");");
                //設備詳細資料表
                tx.executeSql("CREATE TABLE IF NOT EXISTS DevicesINS( " +
                    "_id INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID
                    "DI_Model TEXT," + //設備型號 ref DevicesInfo.DeviceModel
                    "DI_Title TEXT," + //設備名稱
                    "DI_Name TEXT," + //設備名稱
                    "DI_ImagePath TEXT," + //設備圖像路徑
                    "DI_ImageDetailPath TEXT," + //設備詳細資料圖像路徑
                    "DI_Image TEXT," + //設備圖像
                    "DI_ImageDetail TEXT," + //設備詳細資料圖像
                    "DI_Text TEXT, " + //設備說明文字
                    "DI_Url TEXT, " + //設備購買連結
                    "DI_Active TEXT, " + //是否啟用
                    "DI_Memo TEXT " + //Memo
                    ");");
                //網路服務
                tx.executeSql("CREATE TABLE IF NOT EXISTS ServicesInfo( " +
                    "_id INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID
                    "ServicesName TEXT, " + //服務名稱
                    "ServicesURL TEXT " + //服務網址
                    ");");

                //標準值Json //2018/07/05新增 
                tx.executeSql("CREATE TABLE IF NOT EXISTS StandardJSON( " +
                    "_id INTEGER PRIMARY KEY, " + //流水號ID
                    "Account TEXT, " + //帳號

                    "HSV_HMIItem TEXT, " + //量測項目代號(SBP,DBP,BMI,...)
                    "HSV_Gender TEXT, " + //性別(X:不限,M:男,F:女)
                    "HSV_Condition TEXT, " + //條件代碼(X:不限,Age:年齡,BGType:血糖檢測時段,...)

                    "HSV_CValueL TEXT, " + //條件範圍(小於等於)
                    "HSV_CValueL2 TEXT, " + //條件範圍(小於等於)
                    "HSV_CValueG TEXT, " + //條件範圍(大於等於)
                    "HSV_CValueG2 TEXT, " + //條件範圍(大於等於)
                    "HSV_CValueE TEXT, " + //條件範圍(等於)

                    "HSV_Min TEXT, " + //下限值
                    "HSV_Min2 TEXT, " + //下限值
                    "HSV_Max TEXT, " + //上限值
                    "HSV_Max2 TEXT, " + //上限值

                    "HSL_HSESNo TEXT, " + //級別版號
                    "HSL_Name TEXT, " + //級別名稱
                    "HSL_Level TEXT, " + //優先順序
                    "HSL_IsNormal TEXT, " + //是否在正常範圍(0:否,1:是)

                    "HSL_ColorM TEXT, " + //級別顏色(漸層上)
                    "HSL_ColorS TEXT, " + //級別顏色(漸層下)
                    "HSL_IsRed TEXT, " + //數據是否呈現紅色(0:否,1:是)
                    "HSL_Warnings TEXT " + //警語
                    ");");

                //自訂身份與頭象
                tx.executeSql("CREATE TABLE IF NOT EXISTS UserRoles( " +
                    "HSV_HMIItem , " + //流水號ID 
                    "RoleNo TEXT, " + //編碼 (機碼 + 創建時間)
                    "RoleName TEXT, " + //身份名稱
                    "RolePic TEXT" + //身份頭像
                    ");");

                //E-mail或簡訊功能是否啟用
                tx.executeSql("CREATE TABLE IF NOT EXISTS SvEnabled( " +
                    "_id INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID 
                    "EmailEnabled TEXT, " + //E-mail功能啟用
                    "SmsEnabled TEXT" + //簡訊功能啟用
                    ");");

                //藍牙4.0配對清單
                tx.executeSql("CREATE TABLE IF NOT EXISTS BT40_DList( " +
                    "_id INTEGER PRIMARY KEY AUTOINCREMENT, " + //流水號ID 
                    "Name TEXT, " + //設備名稱
                    "Address TEXT" + //設備Mac
                    ");");

                //歷史量測資料表
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS DeviceLog ( " +
                    "T_No integer primary key," + //App流水號
                    "DL_Date TEXT," + //設備量測日期
                    "DL_Mac TEXT," + //量測設備Mac
                    "DL_Value TEXT," + //量測值
                    "DL_WriteTime datetime  default (datetime(current_timestamp))" + //資料寫入時間
                    " );"
                );
                //錯誤Log紀錄  //2018/04/17新增
                tx.executeSql(
                    "CREATE TABLE IF NOT EXISTS errLog ( " +
                    "ER_No integer primary key," + //流水號
                    "ER_Type TEXT," + //錯誤類別
                    "ER_Name TEXT," + //錯誤名稱
                    "ER_Text TEXT," + //錯誤訊息
                    "ER_CR_EID TEXT," + //ref UserInfo.UserID               
                    "ER_CR_Date TEXT," + //新增日期
                    "ER_UP_Date TEXT" + //修改日期
                    " );"
                );
            }, function (error) {
                console.log('Transaction ERROR: ' + error.message);
                if (errFn) {
                    errFn();
                }
            }, function () {
                console.log('Populated database OK');
                if (successFn) {
                    successFn();
                }
            });

            //藍牙配對使用
            if (!localStorage.BT40P) {
                localStorage.setItem("BT40P", "[]"); //已配對的藍牙4.0裝置, JSON
            }
            if (!localStorage.BT40P_Band) {
                localStorage.setItem("BT40P_Band", "[]"); //已配對的手環, JSON
            }
            if (!localStorage.DBVersion) {
                Log.write("Null", 'localStorage.DBVersion');
                localStorage.setItem("DBVersion", AppConfig.DBVersion); //目前DB版本號
            }

            sessionStorage.alertMessage = "";//目前跳出的alert訊息

            sessionStorage.NowIsLoading = "";//目前是否顯示loading中
            sessionStorage.NowIsLoadingTimer = "";
            
            //依據不同DB版本號進行Schema修改
            iniDB.AddByDBVer(db);
        },
        AddByDBVer: function (db) {
            var newDBVer = AppConfig.DBVersion;
            var DBVersion = localStorage.DBVersion;
            Log.write("AddByDBVer newDBVer: " + newDBVer + " ,DBVersion: " + DBVersion, 'iniDB');

            if (newDBVer <= DBVersion) {
                Log.write("The same DB Version", 'iniDB');
                return;
            } else {
                localStorage.DBVersion = newDBVer;
                Log.write("Need to Update DB Version", 'iniDB');
            }
            db.transaction(function (tx) {//1.4
                tx.executeSql("ALTER TABLE DevicesINS ADD DI_Active TEXT;"); 
            });
            db.transaction(function (tx) {//1.3
                tx.executeSql("ALTER TABLE Management_BP ADD MRowSId TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BG ADD MRowSId TEXT;"); 
                tx.executeSql("ALTER TABLE Management_UA ADD MRowSId TEXT;"); 
                tx.executeSql("ALTER TABLE Management_CHOL ADD MRowSId TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BT ADD MRowSId TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BO ADD MRowSId TEXT;"); 
                tx.executeSql("ALTER TABLE Management_STEP ADD MRowSId TEXT;"); 
                tx.executeSql("ALTER TABLE Management_HR ADD MRowSId TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BW ADD MRowSId TEXT;"); 
                tx.executeSql("ALTER TABLE Management_WL ADD MRowSId TEXT;"); 
                tx.executeSql("ALTER TABLE Management_EC ADD MRowSId TEXT;");  

                tx.executeSql("ALTER TABLE Management_BP ADD M_UP_Date TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BG ADD M_UP_Date TEXT;"); 
                tx.executeSql("ALTER TABLE Management_UA ADD M_UP_Date TEXT;"); 
                tx.executeSql("ALTER TABLE Management_CHOL ADD M_UP_Date TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BT ADD M_UP_Date TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BO ADD M_UP_Date TEXT;"); 
                tx.executeSql("ALTER TABLE Management_STEP ADD M_UP_Date TEXT;"); 
                tx.executeSql("ALTER TABLE Management_HR ADD M_UP_Date TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BW ADD M_UP_Date TEXT;"); 
                tx.executeSql("ALTER TABLE Management_WL ADD M_UP_Date TEXT;"); 
                tx.executeSql("ALTER TABLE Management_EC ADD M_UP_Date TEXT;");  
            }, function (error) {
                console.log('Its OK in Transaction ERROR AddColumn DevicesINS: ' + error.message);
            }, function () {
                console.log('Populated database AddColumn DevicesINS OK');
            });

            db.transaction(function (tx) {//1.2
                tx.executeSql("ALTER TABLE Management_BP ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BP ADD MRowKey TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BG ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BG ADD MRowKey TEXT;"); 
                tx.executeSql("ALTER TABLE Management_UA ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_UA ADD MRowKey TEXT;"); 
                tx.executeSql("ALTER TABLE Management_CHOL ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_CHOL ADD MRowKey TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BT ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BT ADD MRowKey TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BO ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BO ADD MRowKey TEXT;"); 
                tx.executeSql("ALTER TABLE Management_STEP ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_STEP ADD MRowKey TEXT;"); 
                tx.executeSql("ALTER TABLE Management_HR ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_HR ADD MRowKey TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BW ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_BW ADD MRowKey TEXT;"); 
                tx.executeSql("ALTER TABLE Management_WL ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_WL ADD MRowKey TEXT;"); 
                tx.executeSql("ALTER TABLE Management_EC ADD UploadStatus TEXT;"); 
                tx.executeSql("ALTER TABLE Management_EC ADD MRowKey TEXT;");
                //1.1
                // tx.executeSql("ALTER TABLE DevicesINS ADD DI_ImageDetailPath TEXT;"); 
                // tx.executeSql("ALTER TABLE DevicesINS ADD DI_ImageDetail TEXT;"); 
            }, function (error) {
                console.log('Its OK in Transaction ERROR AddColumn DevicesINS: ' + error.message);
            }, function () {
                console.log('Populated database AddColumn DevicesINS OK');
            });
        }
    };
