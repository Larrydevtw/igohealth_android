var Display = {
    txtMaxLength: 20, //一行文字長度，超過會用</br>來換行
    getTimeType: function (TimeType) {
        var result = '';
        switch (TimeType) {
            case "1":
                result = $.i18n("早餐前");
                break;
            case "2":
                result = $.i18n("早餐後");
                break;
            case "3":
                result = $.i18n("午餐前");
                break;
            case "4":
                result = $.i18n("午餐後");
                break;
            case "5":
                result = $.i18n("晚餐前");
                break;
            case "6":
                result = $.i18n("晚餐後");
                break;
            case "7":
                result = $.i18n("睡前");
                break;
            case "8": //AC (飯前)
                result = $.i18n("飯前");
                break;
            case "9": //PC (飯後)
                result = $.i18n("飯後");
                break;
            default: //case 0:
                result = $.i18n("隨機");
                break;
        }

        //Log.write(result, "Display.getTimeType");
        return result;
    },
    showTimeType: function (MType) {
        var timeGroup = $("#MPM_TimeGroup_" + MType).val();
        var ddlTimeType = $("#MPM_TimeType_" + MType);
        //Log.write(hour, "取得目前時間的小時");
        if (timeGroup == "AC" || timeGroup == "PC") {
            var optBreakfast;
            var optLunch;
            var optDinner;

            var nowHour = new Date().getHours();
            var dailyRoutine = MeasureInfo.dailyRoutine;
            var wakeUp = +dailyRoutine.wakeUp;
            var breakfast = +dailyRoutine.breakfast;
            var lunch = +dailyRoutine.lunch;
            var dinner = +dailyRoutine.dinner;
            var bedTime = +dailyRoutine.bedTime;

            if (timeGroup == "AC") {
                optBreakfast = "<option value='1'>" + $.i18n("早餐") + "</option>";
                optLunch = "<option value='3'>" + $.i18n("午餐") + "</option>";
                optDinner = "<option value='5'>" + $.i18n("晚餐") + "</option>";

                if (nowHour >= wakeUp && nowHour < breakfast) {
                    optBreakfast = "<option value='1' selected='selected'>" + $.i18n("早餐") + "</option>";
                } else if (nowHour >= breakfast && nowHour < lunch) {
                    optLunch = "<option value='3' selected='selected'>" + $.i18n("午餐") + "</option>";
                } else if (nowHour >= lunch && nowHour < dinner) {
                    optDinner = "<option value='5' selected='selected'>" + $.i18n("晚餐") + "</option>";
                }
            } else {
                optBreakfast = "<option value='2'>" + $.i18n("早餐") + "</option>";
                optLunch = "<option value='4'>" + $.i18n("午餐") + "</option>";
                optDinner = "<option value='6'>" + $.i18n("晚餐") + "</option>";

                if (nowHour >= breakfast && nowHour < lunch) {
                    optBreakfast = "<option value='2' selected='selected'>" + $.i18n("早餐") + "</option>";
                } else if (nowHour >= lunch && nowHour < dinner) {
                    optLunch = "<option value='4' selected='selected'>" + $.i18n("午餐") + "</option>";
                } else if (nowHour >= dinner && nowHour < bedTime) {
                    optDinner = "<option value='6' selected='selected'>" + $.i18n("晚餐") + "</option>";
                }
            }
            ddlTimeType.html(optBreakfast + optLunch + optDinner);
            ddlTimeType.show();
        } else {
            ddlTimeType.hide();
        }

        // BGTimeType.
        // <option value="B">早餐</option>
        // <option value="L">午餐</option>
        // <option value="D">晚餐</option>

    },
    isRed: function (MType, MValue, timeType) {
        Log.write("MType: " + MType + " ,MValue: " + MValue + " ,timeType: " + timeType, "isRed");

        return new Promise(function (resolve, reject) {
            // resolve({
            //     Warnings: "TEST",
            //     IsRed: "1"
            // });
            
            if (!timeType) {
                timeType = "";
            }
            if (timeType === "7" || timeType === "0") {
                //目前 7睡前、0隨機還沒有標準值可以比較，所以飯後的標準來做比較
                timeType = "9";
            }

            var HSV_Gender = localStorage["Gender_" + localStorage.UserID];
            var HSV_HMIItem = MType;
            var Age = localStorage["Age_" + localStorage.UserID];
            var strSql = "With tmpTable as ( ";
            strSql += "SELECT HSV_HMIItem,HSV_Gender,HSV_Condition,Cast(HSV_CValueL as real) HSV_CValueL,Cast(HSV_CValueG as real) HSV_CValueG,HSV_CValueE";
            strSql += ",Cast(HSV_Min as real) HSV_Min,Cast(HSV_Max as real) HSV_Max,HSL_HSESNo,HSL_Name,HSL_Level,HSL_IsNormal,HSL_IsRed,HSL_Warnings ";
            strSql += "FROM StandardJSON ";
            strSql += "WHERE HSV_HMIItem='" + HSV_HMIItem + "' ";
            strSql += ") ";
            // strSql += "--Age: bodyrate、Grip、SitStand、LiftLeg";
            // strSql += "--Weight: BoneMass";
            strSql += "Select * From tmpTable ";
            strSql += "Where (HSV_Condition='Age' or  HSV_Condition='Weight') and HSV_Gender='" + HSV_Gender + "' ";
            strSql += "and HSV_CValueL<=" + Age + " ";
            strSql += "and (IFNULL(HSV_CValueG,'')='' or HSV_CValueG>=" + Age + ") ";
            strSql += "and HSV_Min<=" + MValue + " ";
            strSql += "and (IFNULL(HSV_Max,'')='' or HSV_Max>=" + MValue + ") ";
            //strSql += "--BMI、DBP、SBP、SPO2、TBWPercentage、VisceralRate";
            strSql += "union ";
            strSql += "Select * From tmpTable ";
            strSql += "Where HSV_Condition='X' ";
            strSql += "and HSV_Min<=" + MValue + " ";
            strSql += "and (IFNULL(HSV_Max,'')='' or HSV_Max>=" + MValue + ") ";
            // strSql += "--BS";
            strSql += "union ";
            strSql += "Select * From tmpTable ";
            strSql += "Where HSV_Condition='BGType' and HSV_CValueE='" + timeType + "' ";
            strSql += "and HSV_Min<=" + MValue + " ";
            strSql += "and (IFNULL(HSV_Max,'')='' or HSV_Max>=" + MValue + ") ";

            strSql += "ORDER BY HSL_Level; ";

            //Log.write(strSql, "DAOFn isRed");
            DAOFn.Query("", strSql, function (strResult) {
                var objList = JSON.parse(strResult);
                var result = {
                    Warnings: "",
                    IsRed: ""
                };
                if (objList.length == 0) {
                    Log.write("查無資料", "DAOFn Display.isRed");
                    resolve(result);
                } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                    Log.write("查詢錯誤", "DAOFn isRed");
                    resolve(result);
                } else {
                    var Warnings = $.i18n(objList[0].HSL_Name); //objList[0].HSL_Name;//
                    if (AppConfig.StandardDisplay === "N") {
                        Log.write("AppConfig.StandardDisplay: " + AppConfig.StandardDisplay, 'isRed');
                        Warnings = "";
                    }

                    var IsRed = objList[0].HSL_IsRed;
                    result = {
                        Warnings: Warnings,
                        IsRed: IsRed
                    };
                    Log.write(result);
                    resolve(result);
                }
            });
        });
    },
    showText: function (str) {
        if (str.replace(/;/g, '') === "") {
            return "";
        }

        var MaxLength = Display.txtMaxLength;
        var strLength = Math.ceil((str.length / MaxLength));
        var _str = str;

        if (str.length > MaxLength) {
            str = "";
            for (var i = 0; i < strLength - 1; i++) {
                str += _str.substr(i * MaxLength, MaxLength) + "</br>";
                if (i == strLength - 2) {
                    str += _str.substr((i + 1) * MaxLength);
                }
            }
        } else {
            str = _str;
        }
        return str;
    },
    dateFormat: function (MTimeStamp) {
        var output = "";
        output = MTimeStamp.substr(5, 11).replace(/\-/g, "/");
        // var d = new Date();
        // if (nd != "") {
        //     nd = nd.replace(/\-/g, '/');

        //     var ptr = nd.indexOf('.');
        //     if (ptr > 0) {
        //         nd = nd.substr(0, ptr);
        //     }
        //     d = new Date(nd);
        // }
        // var output = "";
        // var month = d.getMonth() + 1;
        // var day = d.getDate();
        // //d .getFullYear() + '.' +
        // var output = (month < 10 ? '0' : '') + month + '-' +
        //     (day < 10 ? '0' : '') + day;
        // var hours = d.getHours();
        // var minutes = d.getMinutes();
        // output += "  ";
        // output += (hours < 10 ? '0' : '') + hours + ':' +
        //     (minutes < 10 ? '0' : '') + minutes;

        return output;
    },
    // isRed_Fn: function (_StandardXML, val, i) {
    //     //Log.write(_StandardXML+":"+val+":"+i,"Display isRed_Fn");

    //     //最小值有東西，最大值沒有
    //     if (_StandardXML.StandardInfo.StandardLevel[i].Min && !_StandardXML.StandardInfo.StandardLevel[i].Max) {
    //         if (parseFloat(val) >= parseFloat(_StandardXML.StandardInfo.StandardLevel[i].Min)) {

    //             sessionStorage["Level"] = _StandardXML.StandardInfo.StandardLevel[i].Warnings;

    //             if (_StandardXML.StandardInfo.StandardLevel[i].IsRed == "1")
    //                 return 1;
    //             else
    //                 return 0;
    //         }
    //     }
    //     //最大值有東西，最小值沒有
    //     else if (!_StandardXML.StandardInfo.StandardLevel[i].Min && _StandardXML.StandardInfo.StandardLevel[i].Max) {
    //         if (parseFloat(val) <= parseFloat(_StandardXML.StandardInfo.StandardLevel[i].Max)) {

    //             sessionStorage["Level"] = _StandardXML.StandardInfo.StandardLevel[i].Warnings;

    //             if (_StandardXML.StandardInfo.StandardLevel[i].IsRed == "1")
    //                 return 1;
    //             else
    //                 return 0;
    //         }
    //     } else {
    //         if (parseFloat(val) >= parseFloat(_StandardXML.StandardInfo.StandardLevel[i].Min) &&
    //             parseFloat(val) <= parseFloat(_StandardXML.StandardInfo.StandardLevel[i].Max)) {

    //             sessionStorage["Level"] = _StandardXML.StandardInfo.StandardLevel[i].Warnings;

    //             if (_StandardXML.StandardInfo.StandardLevel[i].IsRed == "1")
    //                 return 1;
    //             else
    //                 return 0;
    //         }
    //     }

    //     return -1;
    // },
    // isRed_Fn2: function (_StandardXML, val, i) {
    //     //最小值有東西，最大值沒有
    //     if (_StandardXML.StandardInfo.StandardLevel[i].CValueL && !_StandardXML.StandardInfo.StandardLevel[i].CValueG) {
    //         if (parseFloat(val) >= parseFloat(_StandardXML.StandardInfo.StandardLevel[i].CValueL)) {
    //             return 0;
    //         }
    //     }
    //     //最大值有東西，最小值沒有
    //     else if (!_StandardXML.StandardInfo.StandardLevel[i].CValueL && _StandardXML.StandardInfo.StandardLevel[i].CValueG) {
    //         if (parseFloat(val) <= parseFloat(_StandardXML.StandardInfo.StandardLevel[i].CValueG)) {
    //             return 0;
    //         }
    //     }
    //     else {
    //         if (parseFloat(val) >= parseFloat(_StandardXML.StandardInfo.StandardLevel[i].CValueL)
    //             && parseFloat(val) <= parseFloat(_StandardXML.StandardInfo.StandardLevel[i].CValueG)) {
    //             return 0;
    //         }
    //     }

    //     return -1;
    // },
};