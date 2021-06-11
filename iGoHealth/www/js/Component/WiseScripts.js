var InputPopup;
var RecView = [];
var WiseScripts = WiseScripts || {}, WiseScripts = {
    //驗證正確性
    Validate: {
        region:"",
        isID:function(id) {
            var region = WiseScripts.Validate.region;
            var result;
            switch (region) {
                case "zh-hans":
                    result = WiseScripts.Validate.isCnID(id);
                    break;
                default: //zh-hant
                    result = WiseScripts.Validate.isTwID(id);
                    break;
            }
            return result;
        },
        isTwID:function(id)
        {
            tab = "ABCDEFGHJKLMNPQRSTUVXYWZIO";
            A1 = new Array(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3);
            A2 = new Array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5);
            Mx = new Array(9, 8, 7, 6, 5, 4, 3, 2, 1, 1);

            if (id.length != 10) return false;
            i = tab.indexOf(id.charAt(0));
            if (i == -1) return false;
            sum = A1[i] + A2[i] * 9;

            for (i = 1; i < 10; i++) {
                v = parseInt(id.charAt(i));
                if (isNaN(v)) return false;
                sum = sum + v * Mx[i];
            }
            if (sum % 10 != 0) return false;
            return true;
        },
        isCnID: function (cardNo) {
            var reg = /^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$|^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/;
            return reg.test(cardNo);
        },
        isPhone: function (phoneNum) {
            var region = WiseScripts.Validate.region;
            var result;
            switch (region) {
                case "zh-hans":
                    result = WiseScripts.Validate.isCnPhone(phoneNum);
                    break;
                default: //zh-hant
                    result = WiseScripts.Validate.isTwPhone(phoneNum);
                    break;
            }
            return result;
        },
        isTwPhone:function(a)
        {
            if (!WiseScripts.Validate.isNumeric(a))
                return false;
            
            if (a.length != 10)
                return false;
            
            if (a.charAt(0) != '0' && a.charAt(1) != '9')
                return false;
            
                return true;
        },
        isCnPhone: function (phoneNum) {
            var reg = /^1[3|4|5|7|8|9][0-9]{9}$/; //验证规则
            return reg.test(phoneNum); //true
        },
        isNumeric: function (obj) {
            return !jQuery.isArray(obj) && (obj - parseFloat(obj) + 1) >= 0;
        },
        isEmail: function (a) { return "" == a ? !1 : !!/^[^\s]+@[^\s]+\.[^\s]{2,3}$/.test(a); },
        isDate: function (a) { try { var c, b = a.split(/\D+/); b[0] *= 1; b[1] -= 1; b[2] *= 1; c = new Date(b[0], b[1], b[2]); return c.getFullYear() == b[0] && c.getMonth() == b[1] && c.getDate() == b[2] ? !0 : !1; } catch (d) { return !1; } },
        chkAccount: function (a) { return "" == a ? !1 : /^[0-9a-zA-Z]{3,}$/.test(a); },
        chkPassword: function (a) { return "" == a ? !1 : /^[a-zA-Z0-9]{8,14}$/.test(a); }
        //chkPassword: function (a) { return "" == a ? !1 : /^(?=.*[a-zA-Z]+)(?=.*\d+)[a-zA-Z0-9@#$]{8,14}$/.test(a) }
        //(?=^.{6,12}$)(?=.*[a-zA-Z])(?=.*[0-9])(?!.*\s).*$
    },   
    Security:
    {//資安

    },
    //資料處理
    IO:
    {
        ReadFileToString: function (path,CB,FB) {
            $.ajax({
                type: 'get',
                url: path,
                dataType: 'text',
                success:
                    function (response, status) {
                        if (response != "") {
                            if (CB)
                                CB(response);
                        }
                        else {
                            if (FB)
                                FB();
                        }
                    },
                error:
                    function (response, status) {
                        if (FB)
                            FB();
                    }
            });

        },
        isEmpty: function (value) {
            if (value) {
                return value;
            }
            else {
                return "";
            }
        },
        ClrJson: function (s) {
            if (s == null) return s;

            var newstr = "";
            for (var i = 0; i < s.length; i++) {
                c = s.charAt(i);
                switch (c) {
                    case '\"':
                        newstr += "\\\"";
                        break;
                    case '\\':
                        newstr += "\\\\";
                        break;
                    case '/':
                        newstr += "\\/";
                        break;
                    case '\b':
                        newstr += "\\b";
                        break;
                    case '\f':
                        newstr += "\\f";
                        break;
                    case '\n':
                        newstr += "\\n";
                        break;
                    case '\r':
                        newstr += "\\r";
                        break;
                    case '\t':
                        newstr += "\\t";
                        break;
                    default:
                        newstr += c;
                }
            }
            return newstr;
        },
        /*左邊補0*/
        padLeft:function(str,length,sign)
        {
            str = str.toString();
            if (str.length >= length) return str;
            else return WiseScripts.IO.padLeft(sign + str, length, sign);
        },
        /*右邊補0*/
        padRight: function (str, lenght, sign) {
            if (str.length >= lenght)
                return str;
            else
                return WiseScripts.IO.padRight(str + sign, lenght, sign);
        },
        /*16進位轉Byte Array*/
        hexToBytes: function (hex)
        {
            for (var bytes = [], c = 0; c < hex.length; c += 2)

                bytes.push(parseInt(hex.substr(c, 2), 16));

            return bytes;

        },
        /*Byte Array 轉16進位*/
        toHexString: function (bytes)
        {
            var HEXES = "0123456789ABCDEF";
            for (var hex = [], i = 0; i < bytes.length; i++) {

                hex.push(HEXES.charAt((bytes[i] & 0xF0) >> 4));
                hex.push(HEXES.charAt((bytes[i] & 0x0F)));
                hex.push(',');
            }

            return hex.join("");
            
        },/*把整數(0~65535之間的int)轉換成2個byte的陣列,並且高底位置交換,例如 378 -> [0x7A,0x01] */
        wordToByteArray: function (word) {
            // we want to represent the input as a 2-bytes array
            var byteArray = [0, 0];

            for (var index = 0; index < byteArray.length; index++) {
                var byte = word & 0xff;
                byteArray[index] = byte;
                word = (word - byte) / 256;
            }

            return byteArray;
        }
    } ,
    //資料格式
    Format:
    {
        String_yyyyMMdd:function(date)
        {
            var year = date.getFullYear();
            var month = (1 + date.getMonth()).toString();
            month = month.length > 1 ? month : '0' + month;
            var day = date.getDate().toString();
            day = day.length > 1 ? day : '0' + day;
            return year+month+day;
        },
        Date_yyyyMMddHHmmss:function(date)
        {
            var year = date.getFullYear();
            var month = (1 + date.getMonth()).toString();
            month = month.length > 1 ? month : '0' + month;
            var day = date.getDate().toString();
            day = day.length > 1 ? day : '0' + day;

            var HH = date.getHours().toString();
            HH = HH.length > 1 ? HH : '0' + HH;
            var mm = date.getMinutes().toString();
            mm = mm.length > 1 ? mm : '0' + mm;
            var ss = date.getSeconds().toString();
            ss = ss.length > 1 ? ss : "0" + ss;

            return year +"/"+ month +"/"+ day+" "+HH+":"+mm+":"+ss;
        },
        Date_yyyyMMddHHmm: function (date) {
            var year = date.getFullYear();
            var month = (1 + date.getMonth()).toString();
            month = month.length > 1 ? month : '0' + month;
            var day = date.getDate().toString();
            day = day.length > 1 ? day : '0' + day;

            var HH = date.getHours().toString();
            HH = HH.length > 1 ? HH : '0' + HH;
            var mm = date.getMinutes().toString();
            mm = mm.length > 1 ? mm : '0' + mm;
            return year + "/" + month + "/" + day + " " + HH + ":" + mm;
        },
        customFormat:function(date,formatString)
        {
            var YYYY, YY, MMMM, MMM, MM, M, DDDD, DDD, DD, D, hhh, hh, h, mm, m, ss, s, ampm, AMPM, dMod, th;
            var dateObject = date;
            YY = ((YYYY = dateObject.getFullYear()) + "").slice(-2);
            MM = (M = dateObject.getMonth() + 1) < 10 ? ('0' + M) : M;
            MMM = (MMMM = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][M - 1]).substring(0, 3);
            DD = (D = dateObject.getDate()) < 10 ? ('0' + D) : D;
            DDD = (DDDD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dateObject.getDay()]).substring(0, 3);
            th = (D >= 10 && D <= 20) ? 'th' : ((dMod = D % 10) == 1) ? 'st' : (dMod == 2) ? 'nd' : (dMod == 3) ? 'rd' : 'th';
            formatString = formatString.replace("#YYYY#", YYYY).replace("#YY#", YY).replace("#MMMM#", MMMM).replace("#MMM#", MMM).replace("#MM#", MM).replace("#M#", M).replace("#DDDD#", DDDD).replace("#DDD#", DDD).replace("#DD#", DD).replace("#D#", D).replace("#th#", th);

            h = (hhh = dateObject.getHours());
            if (h == 0) h = 24;
            if (h > 12) h -= 12;
            hh = h < 10 ? ('0' + h) : h;
            AMPM = (ampm = hhh < 12 ? 'am' : 'pm').toUpperCase();
            mm = (m = dateObject.getMinutes()) < 10 ? ('0' + m) : m;
            ss = (s = dateObject.getSeconds()) < 10 ? ('0' + s) : s;
            return formatString.replace("#hhh#", hhh).replace("#hh#", hh).replace("#h#", h).replace("#mm#", mm).replace("#m#", m).replace("#ss#", ss).replace("#s#", s).replace("#ampm#", ampm).replace("#AMPM#", AMPM);
        }
    },
    //JavaScript小工具
    Tool:
        {
            NoBack:false,
            NoBackMsg: "",
            sleep:function(tm,fn)
            {
                window.setTimeout(fn, tm);
            },
            MobileType:
            {
                IsAndroid: function () {
                    return navigator.userAgent.match(/Android/i) !=null;
                },
                IsBlackBerry: function () {
                    return navigator.userAgent.match(/BlackBerry/i) != null;
                },
                IsiOS: function () {
                    return navigator.userAgent.match(/iPhone|iPad|iPod/i) != null;
                },
                IsOpera: function () {
                    return navigator.userAgent.match(/Opera Mini/i) != null;
                },
                IsWindows: function () {
                    return navigator.userAgent.match(/IEMobile/i) != null;
                },
                anyType: function () {
                    return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()) != null;
                },
                GetType:function()
                {
                    //1:Windows；2:Android；3:iOS；4:Other
                    if (WiseScripts.Tool.MobileType.IsAndroid())
                        return "2";
                    else if (WiseScripts.Tool.MobileType.IsWindows())
                        return "1";
                    else if (WiseScripts.Tool.MobileType.IsiOS())
                        return "3";
                    else return "4";
                }
            },
            MobileInput:
            {
                TextInput:function(Title,obj,type)
                {
                    obj.blur();
                    
                    if (InputPopup == null)
                    {
                        InputPopup = $.fn.speedoPopup(
                                {
                                    theme:"trap",
                                    overlayClose: true,
                                    close: false,
                                    top:0,
                                    css3Effects: "flipInVer",
                                    htmlContent: "<div style=\"padding: 10px 20px;background-color:#FFB428;\"><table style='width:100%'><tr><td style='width:1%' nowrap>" +
                                                    Title + "：</td><td><input style='width:100%' id='TxtBuff' type='" + type + "' value='" + obj.value + "'/></td></tr></table>" +
                                                 "</div>",
                                    onShow: function ()
                                    {
                                        document.getElementById("TxtBuff").value = obj.value;
                                        document.getElementById("TxtBuff").focus();
                                    },
                                    onHide: function ()
                                    {
                                        if (document.getElementById("TxtBuff").value.length > 50)
                                            navigator.notification.alert($.i18n('字元數過多，請重新輸入'), null, $.i18n('系統訊息'), $.i18n('字元數過多，請重新輸入'));
                                        else
                                            obj.value = document.getElementById("TxtBuff").value;

                                        InputPopup.setContent(null);
                                        InputPopup = null;
                                    }
                                });

                        $('#TxtBuff').click(function (e) { $(this).focus(); });
                            
                            $('body').click(function (e) {
                                $('#TxtBuff').trigger('click');
                            });
                            
                            $('#TxtBuff').keydown(function (event) {
                                if (event.keyCode == 13) {
                                    $("#TxtBuff").blur();
                                }
                            });

                            $('#TxtBuff').blur(function (e) {
                                InputPopup.hidePopup();
                            });
                    }
                    else
                    {
                        //InputPopup.showPopup();
                        //alert("showPopup");
                    }
                    /*
                    if (WiseScripts.Tool.MobileType.IsAndroid() && WiseScripts.Tool.MobileType.IsiOS())
                    {
                        
                        navigator.notification.prompt(
                            ' ',  // message
                            function (results) {
                                obj.value = results.input1;
                            },                  // callback to invoke
                            Title,              // title
                            ['OK'],             // buttonLabels
                            obj.value           // defaultText
                        );
                    }
                    */
                }
            },
            ShowLoading: function (BoolVal, showText, pgValue, successFn) {

                if (BoolVal) {
                    if (sessionStorage.NowIsLoading != showText) {
                        if (sessionStorage.NowIsLoading != "") {
                            $.isLoading("hide");
                            sessionStorage.NowIsLoading = "";
                        }

                        var divLoading = "";
                        var divLoadingText = "";

                        if (showText != null) {
                            divLoadingText += "<div id='divPGText'>" + showText + "</div>";
                        }

                        divLoading = "<progress value='0' max='100' id='pgBar' class='gress' ></progress>" + divLoadingText + "<div id='divPGRate'></div>";

                        $.isLoading({
                            text: divLoading
                        });
                    }

                    if (pgValue != null) {
                        //obj === +obj →判斷是否為數字
                        //obj === obj+'' →判斷是否為文字
                        //obj === !!obj→判斷是否為布木
                        //if (Number.isInteger(pgValue)) {
                        if (pgValue === +pgValue) {
                            $('#pgBar').attr({
                                value: pgValue
                            });
                            $('#divPGRate').html(pgValue + '%');
                        }
                    } else {
                        
                        if(sessionStorage.NowIsLoadingTimer != ""){

                            var timer = sessionStorage.NowIsLoadingTimer;

                            clearInterval(timer);
                            sessionStorage.NowIsLoadingTimer = "";
                        }

                        var showValue = 10;
                        sessionStorage.NowIsLoadingTimer = setInterval(function () {
                            if (showValue === 100) {
                                showValue = 0;
                            }
                            showValue += 10;
                            $('#pgBar').attr({
                                value: showValue
                            });
                        }, 100);

                    }

                    sessionStorage.NowIsLoading = showText;

                } else {

                    if(sessionStorage.NowIsLoadingTimer != ""){
                        clearInterval(sessionStorage.NowIsLoadingTimer);
                        sessionStorage.NowIsLoadingTimer = "";
                    }

                    if (sessionStorage.NowIsLoading != "") {
                        $.isLoading("hide");
                        sessionStorage.NowIsLoading = "";
                    }
                    if (successFn) {
                        successFn();
                    }
                }
            },
            OpenPop:function(EtID,OnOpened)
            {
                $("#" + EtID).show("puff", {}, 600, OnOpened);
            },
            ClosePop:function(EtID,OnClosed)
            {
                $("#" + EtID).hide("scale", { percent: 0 }, 600, OnClosed);
            },
            fadeOutTime: 10,
            fadeInTime: 200,
            NextPop: function (EtID, callback, closeCallback, IsRec)
            {//登入頁就需先呼叫一次此函數
                // alert(EtID);
                // alert(RecView.length);
                // alert(IsRec);
                var OutTime = WiseScripts.Tool.fadeOutTime;
                var InTime = WiseScripts.Tool.fadeInTime;
                if (RecView.length > 0) { //TODO 用途尚待釐清
                    var vTmpNow = RecView[RecView.length - 1];
                    if (vTmpNow == EtID) { 
                        //alert("相同畫面不能SHOW第二次，第二次擋掉");
                        RecView.pop(); //相同畫面則刪掉最後一筆
                        //return; 
                    }//相同畫面不能SHOW第二次，第二次擋掉
                }
                if (IsRec == "T") {

                    RecView.push(EtID);
                    // alert("sessionStorage.WhereAmI: " + sessionStorage.WhereAmI);

                    $("#" + sessionStorage.WhereAmI).fadeOut(OutTime, closeCallback);
                    $("#" + RecView[RecView.length - 1]).fadeIn(InTime, callback);
                    sessionStorage.WhereAmI = EtID;
                }
                else
                {
                    $("#" + sessionStorage.WhereAmI).fadeOut(OutTime, closeCallback);
                    sessionStorage.WhereAmI = EtID;

                    $("#" + EtID).fadeIn(InTime, callback);
                }
            },
            BackPop: function (closeCallback,callback)
            {
                var OutTime = WiseScripts.Tool.fadeOutTime;
                var InTime = WiseScripts.Tool.fadeInTime;

                Log.write(WiseScripts.Tool.NoBack,"BackPop WiseScripts.Tool.NoBack");
                if (WiseScripts.Tool.NoBack) {
                    if (WiseScripts.Tool.NoBackMsg != ""){
                        window.plugins.toast.showShortBottom(WiseScripts.Tool.NoBackMsg, function (a) { }, function (b) { });
                    }
                    
                    return;
                }

                //try
                //{
                //    if($('#iframebox').attr('src').length>0)
                //    {
                //        ColorBoxClose();
                //        return;
                //    }
                //}catch(e){}

                //if ($("#Note").is(":visible") || $("#ulSet").is(":visible"))
                //{
                //    $('#Note').hide();
                //    $('#ulSet').hide();
                //    $('#List').show();
                //    $("#" + sessionStorage["TAG"]).addClass("on");
                //    return;
                //}

                //if (RecView.length > 1) {

                // if ((sessionStorage.WhereAmI == "login"
                //     ||
                //     sessionStorage.WhereAmI == "MainHome")
                //     && RecView.length <= 1
                //     )
                // {
                //     WiseScripts.Tool.SysClose();
                // }
                // else
                // {
                    if (RecView.length > 1) {
                        //先關原本的畫面
                        // alert(sessionStorage.WhereAmI+" sessionStorage['WhereAmI']");
                        // alert(RecView[RecView.length - 1]+" RecView[RecView.length - 1]");
                        if (sessionStorage.WhereAmI == RecView[RecView.length - 1]) {
                            $("#" + RecView[RecView.length - 1]).fadeOut(OutTime, closeCallback);
                            RecView.pop();
                        }
                        else {
                            $("#" + sessionStorage.WhereAmI).fadeOut(OutTime, closeCallback);
                        }

                        //再開上一頁
                        sessionStorage.WhereAmI = RecView[RecView.length - 1];
                        $("#" + sessionStorage.WhereAmI).fadeIn(InTime, callback);
                    }else if(RecView.length === 1){
                        Log.write(sessionStorage.WhereAmI,'BackPop sessionStorage.WhereAmI');
                        $("#" + sessionStorage.WhereAmI).fadeOut(OutTime, closeCallback);
                        $("#MainHome").fadeIn(InTime, callback);
                        sessionStorage.WhereAmI = "MainHome";
                        RecView.push("MainHome");
                    }
                //}
                                     
                //} else {
                //    WiseScripts.Tool.SysClose();
                //}
            }, 
            SysClose: function (cancelFn)
            {
                if (WiseScripts.Tool.MobileType.IsAndroid()) {
                    //離開系統
                    navigator.notification.confirm(
                        $.i18n('是否關閉系統？'),
                        function (button) {
                            if (button == 1) {
                                navigator.app.exitApp();
                                return;
                            }

                            if (button == 2) {
                                if (cancelFn) {
                                    cancelFn();
                                }
                            }
                        },
                        $.i18n('系統訊息'),
                        $.i18n('是') + ',' + $.i18n('否')
                    );
                }
            }
        }

};

Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

//等待特定條件成立後才執行某段程式
function delayExecute(check, proc, chkInterval) {
    //default interval = 500ms
    var x = chkInterval || 500;
    var hnd = window.setInterval(function () {
        //if check() return true, 
        //stop timer and execute proc()
        if (check()) {
            window.clearInterval(hnd);
            proc();
        }
    }, x);
}

function parseDate(str) {
    if (str.match(/^\d{4}[\-\/\s+]\d{1,2}[\-\/\s+]\d{1,2}$/)) {
        Log.write("A: " + str.replace(/[\-\/\s+]/g, '/'), "parseDate");
        return new Date(str.replace(/[\-\/\s+]/g, '/'));
    }
    else if (str.match(/^\d{8}$/)) {
        Log.write("B: " + str.substring(0, 4) + '/' + str.substring(4, 6) + '/' + str.substring(6), "parseDate");
        return new Date(str.substring(0, 4) + '/' + str.substring(4, 6) + '/' + str.substring(6));
    }
    else {
        return ('ERR');
    }
}

String.prototype.insert = function (index, string) {
    if (index > 0)
        return this.substring(0, index) + string + this.substring(index, this.length);
    else
        return string + this;
};

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};