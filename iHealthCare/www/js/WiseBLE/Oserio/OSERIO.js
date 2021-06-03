//==================== OSERIO ===============================
//此程式是歐瑟若系列機型的共用函式,目前支援的設備型號:
// 'FLG-756' 歐瑟若體脂 


var OSERIO = OSERIO || {}, OSERIO = {
              
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






};