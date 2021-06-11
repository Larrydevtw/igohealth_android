//==================== Bioptik ===============================
//此程式是聿新生物科技系列機型的共用函式,目前支援的設備型號:
// 'ETB04' 中山瑞福(大陸)血糖/尿酸/膽固醇三合一 


var Bioptik = Bioptik || {}, Bioptik = {
              
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

    ,//把ASCII文字字串轉成Hex文字字串
    a2hex: function (str, JoinDot)
    {
        //輸入一串ASCII文字,如: "01180621173830"
        //會傳回一串Hex文字字串,如: "30, 31, 31, 38, 30, 36, 32, 31, 31, 37, 33, 38, 33, 30"

        var arr = [];
        for (var i = 0, l = str.length; i < l; i++) {
            var hex = Number(str.charCodeAt(i)).toString(16);
            arr.push(hex);
        }

        if (JoinDot)
            return arr.join(',');
        else
            return arr.join('');
    }

    ,//把ASCII文字字串轉成byte陣列
    StrToUint8Arr: function (str)
    {        
        //輸入一串ASCII文字,如: "{05#9A}"
        //會傳回一個byte陣列,如: [0x7B, 0x30, 0x35, 0x23, 0x39, 0x41, 0x7D]

        var arr = new Uint8Array(str.length);

        for (var i = 0; i < str.length; i++) {
            arr[i] = parseInt(Bioptik.a2hex(str.charAt(i)), 16);
        }

        return arr;
    }

}