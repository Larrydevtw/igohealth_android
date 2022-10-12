//==================== BTSetting ===============================
//系統的全域變數及對外的 Call Back Function


var BTSetting = BTSetting || {}, BTSetting = {

  //-----------------------------------------------------
  //對外的 Call Back Function:

    initCallBackFn: function (BT_Init_OK) {} //藍牙初始化成功會呼叫的函數
  , ScanCallBackFn: function (Device) { }                     //搜尋設備時會呼叫的函數
  , ConnectCallBackFn: function (Device) { }                  //連接設備時會呼叫的函數
  , DiscoverCallBackFn: function (Device) { }                 //Discover 時會呼叫
  , ResultCallBackFn: function (ResultStr) { }                //接收量測時會呼叫的函數
  , ErrorCallBackFn: function (Ex) { }                        //發生錯誤時會呼叫的函數
  , GetMultiDataCallBackFn: function (RecordsArr) { }         //接收回傳多筆量測資料時會呼叫的函數           
  , GetStorageNumberOfDataCallBackFn: function (Number) { }   //接收回傳多筆量測資料總筆數時會呼叫的函數
  //-----------------------------------------------------
  //系統的全域變數:

  , ForcePair: false                      //強置4.0設備一定要配對才可連線
  , AutoConnect: true                     //自動偵測；正常的狀況下是true -> 會自動抓取量測資料,但在信任呼叫SetTimeAlone的時候信任會把這個值設為false

  //, SetTime: false                      //連線後是否設定設備時間
  //, GetDeviceSerial: false              //連線是否傳回設備序號，false回傳Mac
  //, PowerOff: true                      //連線後是否關閉設備
  , ClearData: true                       //取得資料後是否清除設備所有紀錄資料: true -> 清除設備所有紀錄 / false -> 不清除紀錄 

  , FilterHistoryData: false              //過濾歷史量測資料
  , FilterHistoryDays: 7                  //歷史量測資料保留天數

  , UserAge: null                         //使用者年齡             (Oserio FLG-756 體脂機專用參數)
  , UserGender: null                      //使用者性別 0:男；1:女  (Oserio FLG-756 體脂機專用參數)
  , UserHeight: null                      //使用者身高             (Oserio FLG-756 體脂機專用參數)

  , SingleDevicePoolingMode: false        //Pooling 單一藍牙設備模式: false -> 正常的scan模式 / true -> Pooling 單一藍牙設備模式 
  , SingleDevicePoolingAddress: null      //被Pooling 的藍牙設備 address
  
  , OnlyLastestData: true                 //量測資料回傳最新一筆模式或多筆模式: true -> 只回傳最新一筆 / false -> 回傳多筆
  , MultiRecordMaxNo: 50                  //量測資料回傳的最大筆數 -> 預設最多回傳50筆紀錄
  //-----------------------------------------------------
}


