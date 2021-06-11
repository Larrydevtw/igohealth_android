//==================== TysonBio ===============================
//此程式是台欣系列機型的共用函式,目前支援的設備型號:
// 'Tysonbio_BGM' 台欣血糖
// 'Tysonbio_BPM' 台欣血壓
// 'Tyson bio_BPM' 台欣血壓
// 'Tyson bio_NCIT' 台欣體溫


var TysonBio = TysonBio || {}, TysonBio = {
    
    //以藍芽位址取代設備序號資料
    getDeviceSerial: function (address, returnData) {
        sessionStorage["DeviceSerial_" + address] = address;
        WriteLog.write("設備序號：" + address + "/" + sessionStorage["DeviceSerial_" + address], "info");
    }

    ,//以系統時間取代設備時間資料
    getPeripheralTime: function (address, returnData) {
        sessionStorage["DeviceTime" + address] = WiseScripts.Format.Date_yyyyMMddHHmm(new Date());
        WriteLog.write("設備時間：" + address + "/" + sessionStorage["DeviceTime" + address], "info");
    }
    
    

}