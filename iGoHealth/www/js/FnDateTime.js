var FnDateTime = FnDateTime || {}, FnDateTime = {
    //取得特定日期格式 //TODO 改為直接丟入日期及時間
    //2017-09-28 11:00.000
    getMTimeStamp: function (DateVal, TimeVal) {
        var TheDay = new Date();
        var seconds = DateTimeFun.addZC(TheDay.getSeconds());
        var milliseconds = WiseScripts.IO.padLeft(TheDay.getMilliseconds(), 3, '0');
        var result = DateVal.replace(/\//g, "-") + " " + TimeVal.replace("時", ":").replace("分", "") + ":" + seconds + "." + milliseconds;
        return result;
    },
    checkMTime: function (_MTimeStamp, successFn) {
        //TODO 確認var MTime = new Date(_MTimeStamp).getTime(); 是否正確
        //不使用getTime，改為使用日期八碼來判斷

        var result="N"; //回傳日期判斷是否正確．Ｙ：時間正確，Ｎ：時間錯誤
        var minDate =DateTimeFun.getDateWithAddDay(-180);  //yyyyMMdd 不可為半年前量測
        var maxDate =DateTimeFun.getDateWithAddDay(1); //yyyyMMdd 不可為未來一天量測     
        var MTime = _MTimeStamp.replace(/\//g,"").replace(/\-/g,"").replace(/\./g,"").substring(0,8); //yyyyMMdd
        // alert(minDate);
        // alert(maxDate);
        // alert(MTime);
        if (!MTime || MTime < minDate || MTime >= maxDate) {
            Log.write(MTime, "FnBT CheckMTime 時間錯誤");
            result="N";
            // MTimeStamp = DateTimeFun.getFullInputDateNow();//.getInputDateNow() + " " + DateTimeFun.getInputTimeNow(); //取得固定日期格式 2017-09-28 11:00:10.123
            // alert(MTimeStamp);
            //TODO 目前藍牙流程為量測接收，無法在流程中加入重新設定時間的指令
            // var device = {
            //     name: _lMData[0],
            //     id: _lMData[1]
            // };
            // Log.write(device,"FnBT CheckMTime SetDeviceTime success");
            // FnBT.SetDeviceTime(device, function () {
            //     //success
            //     Log.write(device,"FnBT CheckMTime SetDeviceTime success");
            // });
        } else {
            Log.write(MTime, "FnBT CheckMTime 時間正確");
            result="Y";
        }

        if (successFn) {
            successFn(result);
        }

    },
};