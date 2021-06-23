//增加Date函數
Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}
Date.isLeapYear = function (year) {
    //是否為閏年
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
};

Date.getDaysInMonth = function (year, month) {
    //取得該月份天數
    return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};

Date.prototype.isLeapYear = function () {
    //是否為閏年
    return Date.isLeapYear(this.getFullYear());
};

Date.prototype.getDaysInMonth = function () {
    //取得該月份天數
    return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
};

Date.prototype.addMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() + value);
    this.setDate(Math.min(n, this.getDaysInMonth()));
    return this;
};

/*回傳長度為17的時間格式yyyyMMddHHmmssfff EX: 20160503112724469*/
Date.prototype.getFullDateL17 = (function () {
    function addZ(n) {
        return (n < 10 ? '0' : '') + n;
    }
    return function () {
        return this.getFullYear() +
            addZ(this.getMonth() + 1) +
            addZ(this.getDate()) +
            addZ(this.getHours()) +
            addZ(this.getMinutes()) +
            addZ(this.getSeconds()) +
            WiseScripts.IO.padLeft(this.getMilliseconds(), 3, '0');
    };
}())

var DateTimeFun = DateTimeFun || {}, DateTimeFun =
    {
        isDate: function (obj) {
            Log.write((typeof obj), "isDate");
            Log.write(obj.constructor, "isDate");
            return (typeof obj === 'object') && (obj.constructor == Date);
        },
        /** 
        * 对日期进行格式化， 
        * @param date 要格式化的日期 
        * @param format 进行格式化的模式字符串
        *     支持的模式字母有： 
        *     y:年, 
        *     M:年中的月份(1-12), 
        *     d:月份中的天(1-31), 
        *     h:小时(0-23), 
        *     m:分(0-59), 
        *     s:秒(0-59), 
        *     S:毫秒(0-999),
        *     q:季度(1-4)
        * @return String
        * @author yanis.wang@gmail.com
        */
        dateFormat: function (date, format) {
            if (format === undefined) {
                format = date;
                date = new Date();
            }
            
            if (!DateTimeFun.isDate(date)) {
                date = new Date(date);
            }

            var map = {
                "M": date.getMonth() + 1, //月份 
                "d": date.getDate(), //日 
                "h": date.getHours(), //小时 
                "m": date.getMinutes(), //分 
                "s": date.getSeconds(), //秒 
                "q": Math.floor((date.getMonth() + 3) / 3), //季度 
                "S": date.getMilliseconds() //毫秒 
            };
            format = format.replace(/([yMdhmsqS])+/g, function (all, t) {
                var v = map[t];
                if (v !== undefined) {
                    if (all.length > 1) {
                        v = '0' + v;
                        v = v.substr(v.length - 2);
                    }
                    return v;
                }
                else if (t === 'y') {
                    return (date.getFullYear() + '').substr(4 - all.length);
                }
                return all;
            });
            return format;
        }
        ,
        /*
        取得目前時間()
        回傳值：(yyyyMMddHHmmss)14碼
        使用方式：
        DateTimeFun.getNow();
        */
        getNow: function () {
            //var s=s.replace(/\你要置換的字串/g,'AA');
            return DateTimeFun.dateFormat(new Date(), "yyyy.MM.dd.hh.mm.ss").replace(/\./g, "");
        }
        ,
        /*
        取得符合input date格式的目前時間()
        回傳值：(yyyy-MM-dd)
        使用方式：
        DateTimeFun.getInputDateNow();
        */
        getInputDateNow: function () {
            //var s=s.replace(/\你要置換的字串/g,'AA');
            return DateTimeFun.dateFormat(new Date(), "yyyy-MM-dd");//.replace(/\./g, "-");
        }
        ,
        /*
        取得符合input time格式的目前時間()
        回傳值：(HH:mm:ss.fff)
        使用方式：
        DateTimeFun.getFullInputTimeNow();
        */
        getInputTimeNow: function () {
            //var s=s.replace(/\你要置換的字串/g,'AA');

            var TheDay = new Date();

            return DateTimeFun.addZC(TheDay.getHours()) + ":" +
                DateTimeFun.addZC(TheDay.getMinutes()).replace(".000","");
        },
        addZC: function (n) {
            return (n < 10 ? '0' : '') + n;
        },
        /*
        取得符合input date格式的目前時間()
        回傳值：(yyyy-MM-dd HH:mm:ss.fff)
        使用方式：
        DateTimeFun.getFullInputDateNow();
        */
        getFullInputDateNow: function () {
            //var s=s.replace(/\你要置換的字串/g,'AA');

            var TheDay = new Date();

            return TheDay.getFullYear() + "-" +
                DateTimeFun.addZC(TheDay.getMonth() + 1) + "-" +
                DateTimeFun.addZC(TheDay.getDate()) + " " +
                DateTimeFun.addZC(TheDay.getHours()) + ":" +
                DateTimeFun.addZC(TheDay.getMinutes()) + ":" +
                DateTimeFun.addZC(TheDay.getSeconds()) + "." +
                WiseScripts.IO.padLeft(TheDay.getMilliseconds(), 3, '0');

        }
        ,
        /*
        取得目前時間()
        回傳值：(yyyyMMdd)8碼
        使用方式：
        DateTimeFun.getNowDate();
        */
        getNowDate: function () {
            //var s=s.replace(/\你要置換的字串/g,'AA');
            return DateTimeFun.dateFormat(new Date(), "yyyy.MM.dd").replace(/\./g, "");
        }
        ,
        /*
        取得日期()
        回傳值：(yyyyMMdd)8碼
        使用方式：
        DateTimeFun.getDateWithAddDay(-1);
        */
        getDateWithAddDay: function (days) {
            //var s=s.replace(/\你要置換的字串/g,'AA');
            var TheDay = new Date();
            return DateTimeFun.dateFormat(TheDay.addDays(days), "yyyy.MM.dd").replace(/\./g, "");
        }
        ,
        /*
       格式化日期字串(日期字串,分隔字元)
       回傳值：(2014/12/01)
       使用方式：
       DateTimeFun.DateTimeStringT(20141201,'/');
       */
        DateTimeStringT: function (sDateTime, sSplitStr) {
            try {
                var iDateTimeLength = sDateTime.length;
                if (iDateTimeLength == 0) { return ""; }
                if (iDateTimeLength == 8) {
                    return sDateTime.substring(0, 4) + sSplitStr + sDateTime.substring(4, 6) + sSplitStr + sDateTime.substring(6, 8);
                }
                else {
                    return int.Parse(sDateTime.substring(0, iDateTimeLength - 4)) + sSplitStr + sDateTime.substring(iDateTimeLength - 4, iDateTimeLength - 2) + sSplitStr + sDateTime.substring(iDateTimeLength - 2, iDateTimeLength);
                }
            } catch (err) { }
            return sDateTime;
        }
        ,
        /*
       正規化日期字串(日期字串,分隔字元)
       回傳值：(2014-12-01 12:11:22.333) 17碼
       使用方式：
       DateTimeFun.String17toDateTime(20141201121122333);
       */
        String17toDateTime: function (str17) {
            try {
                var iDateTimeLength = str17.length;
                if (iDateTimeLength < 15) { return ""; }
                return str17.substring(0, 4) + '-' + str17.substring(4, 6) + '-' + str17.substring(6, 8) + ' ' + str17.substring(8, 10) + ':' + str17.substring(10, 12) + ':' + str17.substring(12, 14) + '.' + WiseScripts.IO.padLeft(str17.substring(14), 3, '0');
            } catch (err) { }
            return str17;
        }
        ,
        /*
       取得年齡(生日日期字串)
       回傳值：(37)
       使用方式：
       DateTimeFun.getAge("1978-07-20");
       */
        getAge: function (dateString) {
            try {
                if (dateString.length == 8) {
                    dateString = DateTimeFun.DateTimeStringT(dateString, '-');
                }
                var today = new Date();
                var birthDate = new Date(dateString);
                var age = today.getFullYear() - birthDate.getFullYear();
                var m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                if (isNaN(age)) { age = ""; }
                else {
                    //2015.12.09 年齡後面增加顯示民國出生年月日
                    var tColValue = dateString.replace(/\-/g, "");//去除中間的「-」
                    var TempYear = parseInt(tColValue) - 19110000;
                    var str = TempYear.toString();
                    var res = str.substring(0, str.length - 4) + '/' + str.substring(str.length - 4, str.length - 2) + '/' + str.substring(str.length - 2, str.length);
                    age += " (民國" + res + ")";
                }
                return age;
            } catch (err) { }
            return "";
        }
        ,
        /*
       取得兩日期時間差( 17碼日期時間,17碼日期時間)
      回傳值：5662936(毫秒)
      使用方式：
      DateTimeFun.getDateTimeGap('20161123150501936','20161123144839000');
       */
        getDateTimeGap: function (vDay1, vDay2) {

            if (vDay1.length != 17 || vDay2.length != 17) {
                alert("getDateTimeGap:input format error!");
                return 0;
            }

            var dDay1 = Date.parse(DateTimeFun.String17toDateTime(vDay1));
            var dDay2 = Date.parse(DateTimeFun.String17toDateTime(vDay2));

            var vDif = dDay1 - dDay2;
            return vDif;
        }
        ,
        //===================以下函數為依據不同平台(IOS、Android)產生日期的函數=========================
        //可選擇日期、時間(使用在新增量測資料畫面)
        //IOS才會使用此Function,Android使用input Date
        //使用platForm
        //datePicker.show();

        //初始化日期控件時間為現在時間(使用在新增量測資料畫面)
        iniDate: function (id_Date, id_Time, date) {
            var d = new Date();
            //alert(d);
            var OS = DeviceInfo.getOS();

            if (date !== undefined) {
                if(OS === "iOS"){
                    date = date.substring(0,19).replace(/-/g,'/');
                }
                d = new Date(date);
            }
            //alert(d);
            var month = d.getMonth() + 1;
            var day = d.getDate();

            var hours = DateTimeFun.dateFormat(d, "hh");
            var minutes = DateTimeFun.dateFormat(d, "mm");

            var outputDate = d.getFullYear() + ',' +
                (month < 10 ? '0' : '') + month + ',' +
                (day < 10 ? '0' : '') + day;

            $("#" + id_Date).attr("type", "date");
            // $("#" + id_Date).css("height", "35px");
            outputDate = outputDate.replace(/,/g, "-");
            $("#" + id_Date).val(outputDate);

            if(id_Time){ 
                $("#" + id_Time).attr("type", "time");
                $("#" + id_Time).val(hours + ":" + minutes);
            }
            //alert(hours +":"+ minutes);
        },
        iniTime: function (id_Time, time,successFn) {
            $("#" + id_Time).attr("type", "time");
            $("#" + id_Time).val(time);
        },
        ShowDataPick_HM: function (ObjID, TheMode, HourID,successFn) {
            //關閉軟鍵盤的方法
            Keyboard.hide();
            var platForm = window.cordova.platformId;
            Log.write(platForm, "DateTimeFun ShowDataPick");

            var TheDate = new Date();

            TheMode = 'datetime';

            if (ObjID !== '') {
                if ($("#" + ObjID).val().length > 0) {
                    var tmp = $("#" + ObjID).val().split('/');
                    TheDate.setFullYear(tmp[0]);
                    TheDate.setMonth(parseInt(tmp[1]) - 1);
                    TheDate.setDate(tmp[2]);
                }
            }

            if ($("#" + HourID).val().length > 0) {
                var timeVal=$("#" + HourID).val().toString().replace(":", "");
                TheDate.setHours(timeVal.substr(0, 2));
                TheDate.setMinutes(timeVal.substr(2));
            }
            Log.write(TheDate, "ShowDataPick_HM");
            var options = {
                date: TheDate,
                mode: TheMode,
                locale: 'zh_tw'
            };

            function onSuccess(date) {

                switch (TheMode) {
                    case 'datetime':
                        if(ObjID !== ''){
                            $("#" + ObjID).val(date.getFullYear() + '/' + WiseScripts.IO.padLeft((date.getMonth() + 1), 2, '0') + '/' + WiseScripts.IO.padLeft(date.getDate(), 2, '0'));
                        }
                        $("#" + HourID).val(WiseScripts.IO.padLeft((date.getHours()), 2, '0') + ":" + WiseScripts.IO.padLeft((date.getMinutes()), 2, '0'));
                        break;
                }
                if(successFn){
                    successFn();
                }
            }

            function onError(error) { // Android only
                //alert('Error: ' + error);
            }

            datePicker.show(options, onSuccess, onError);
        },
        //=========================================================================
    }