//var BTWinHasOpen = false; //todo 目前不知道功用為何
var MsgHasShowen = false;
var Measure = {
    backToHistory: function () {
        Measure.showHistory(MeasureInfo.MType);
    },
    showHistory: function (MType, isSwitchPage) {
        if (!isSwitchPage) { //是否要轉頁；預設為轉頁
            isSwitchPage = "Y";
        }
        FnBT.StopScan();
        MeasureInfo.MType = MType;

        try {
            Measure.showHistoryMain(MType, isSwitchPage);
        } catch (error) {
            Log.write(error, 'Measure showHistoryMain');
        }

    },
    showHistoryMain: function (MType, isSwitchPage) {

        MeasureInfo.MType = MType;
        $("#History_Title").html($.i18n("量測記錄"));

        // //上方tab按鈕樣式切換
        var lMType = AppConfig.lMType; //抓取AppConfig中目前有設定的量測項目
        for (var i = 0; i < lMType.length; i++) {
            document.getElementById("tabHistory_btn" + lMType[i]).classList.remove("active");

            if (i == lMType.length - 1) {
                document.getElementById("tabHistory_btn" + MType).classList.add("active");
            }
        }

        if (isSwitchPage == "Y") {
            $("#History_Time div .btnSearchDate").removeClass("active"); //初始化歷史資料查詢畫面
            $("#flot_placeholder").html(""); //一開始就將繪圖區塊清除
            $("#History_DataGridView").hide();
            WiseScripts.Tool.ShowLoading(true, $.i18n('查詢歷史資料..'));
            WiseScripts.Tool.NextPop('userHistory', function () {
                Measure.searchByInterval(MeasureInfo.Interval);
                //document.getElementById("tabHistory_btn" + MType).scrollIntoView();
            }, null, 'T');
        } else {
            Measure.bindPersonalData();
        }

    },
    hideHistoryTimeCustom: function () {
        $('#divHistory_Time_Custom').hide();
    },
    showHistoryTimeCustom: function () {
        $('#divHistory_Time_Custom').show();
        $("#History_Time .btnSearchDate").removeClass("active");
        $("#History_Time_Custom").addClass("active");
    },
    //查詢歷次量測資料
    searchByInterval: function (_day) { // 7: 周、14: 雙周、30:月
        Measure.hideHistoryTimeCustom();
        MeasureInfo.Interval = _day;

        var day = _day ? _day : -6;
        var setMode = "D"; //M月/D日
        day = (day - 1) * (-1);

        $("#History_Time .btnSearchDate").removeClass("active");
        $("#History_Time_" + _day + setMode).addClass("active");
        //set:設定模式(M月/D日),days:天數,YN:是否呈現時分(Y/N),isBR:在時間部分是否換行
        var dateS = ProjectFn.currentDate('', setMode, day, 'N').replace(/\//g, "-");
        var dateE = ProjectFn.currentDate('', 'D', 0, 'N').replace(/\//g, "-");
        $('#' + ProjectFn.dateS_ID).val(dateS);
        $('#' + ProjectFn.dateE_ID).val(dateE);

        WiseScripts.Tool.ShowLoading(false, '', '', function () {
            Measure.bindPersonalData(dateS, dateE);
        });
    },
    bindPersonalData: function (dateS, dateE) {
        WiseScripts.Tool.ShowLoading(true, $.i18n('資料載入中..'));

        //$("#History_Chart").hide(); 
        $("#flot_placeholder").html(""); //一開始就將繪圖區塊清除
        $("#History_DataGridView").hide();
        var DS = "";
        var DE = "";
        var MType = MeasureInfo.MType; //$("#btnSearch").attr("MType"); //量測類別 
        Log.alert("BindPersonaalData" + MType);
        if (dateS && dateE) { //
            DS = dateS;
            DE = dateE;
        } else {
            DS = $('#History_DateS').val();
            DE = $('#History_DateE').val();
            //$("#History_Time .btnSearchDate").removeClass("active");
        }

        DS = DS.replaceAll('/', '-') + " 00:00:00";
        DE = DE.replaceAll('/', '-') + " 23:59:59";
        //alert("Measure.getPersonalData");
        var HtmlStr = "";
        var chartType;
        var chartData;
        var chartDataKey = [];
        var xyAxisName = [];
        var chartStyle;

        Measure.getPersonalData(DS, DE, MType, function (objList) {
            if (objList.length === 0) {
                $("#History_DataGridView").show(400, function () {
                    $("#History_DataGridView").html("<div id='History_NoData' style='text-align:center;font-size:20px;color:red;'>" + $.i18n("查無量測資料") + "</div>");
                    $("#flot_placeholder").height(0);
                    WiseScripts.Tool.ShowLoading(false);
                });
                // navigator.notification.alert($.i18n('查無量測資料'), function(){  
                // }, $.i18n('系統訊息'), $.i18n('確定'));        
                return;
            }

            Log.write(objList.length, "objList.length getPersonalData");
            //Log.write(JSON.stringify(objList), " getPersonalData");

            HtmlStr += '<h3>' + $.i18n('備註_Info_IGH') + '</h3>';
            HtmlStr += Measure.getPersonalTitle(MType);
            Measure.getPersonalBody(MType, objList).then(function (result) {

                HtmlStr += result.HtmlStr;
                chartType = result.chartType;
                chartData = result.chartData;
                chartDataKey = result.chartDataKey;
                chartStyle = result.chartStyle;
                xyAxisName = result.xyAxisName;

                Log.write("success", 'getPersonalBodys');
                $("#flot_placeholder").height(screen.height * 0.5);

                morrisChart.init(chartType, "flot_placeholder", "", chartData, chartDataKey, xyAxisName, chartStyle);

                Log.write(HtmlStr, "HtmlStr");

                $("#History_DataGridView").html(HtmlStr);
                Log.write("show", 'getPersonalBodys');
                $("#History_DataGridView").show(200, function () {
                    WiseScripts.Tool.ShowLoading(false);
                });
            });
        });
    },
    getPersonalData: function (DS, DE, MType, successFn) {
        var UserID = localStorage.UserID;

        var strSQL = "";
        if (MType === "STEP") {
            strSQL += "select Account,MAX(Cast(STEP as Integer)) as STEP,Distance,CAL,strftime('%Y-%m-%d %H:%M', MTimeStamp) as MTimeStamp ";
            strSQL += " from Management_STEP as STEP";
            strSQL += " where Account='" + UserID + "'";
            strSQL += " and substr(MTimeStamp,0,5) || '-' || substr(MTimeStamp,6,2) || '-' || substr(MTimeStamp,9,9)>='" + DS + "'";
            strSQL += " and substr(MTimeStamp,0,5) || '-' || substr(MTimeStamp,6,2) || '-' || substr(MTimeStamp,9,9)<='" + DE + "'";
            strSQL += " group by strftime('%Y-%m-%d', MTimeStamp) ";
            strSQL += " order by MTimeStamp desc";
        } else {
            strSQL += "select * from Management_" + MType;
            strSQL += " where Account='" + UserID + "'";
            strSQL += MType == "BW" ? " and Weight<>''" : "";
            strSQL += " and substr(MTimeStamp,0,5) || '-' || substr(MTimeStamp,6,2) || '-' || substr(MTimeStamp,9,9)>='" + DS + "'";
            strSQL += " and substr(MTimeStamp,0,5) || '-' || substr(MTimeStamp,6,2) || '-' || substr(MTimeStamp,9,9)<='" + DE + "'";
            strSQL += " order by  MTimeStamp desc limit 100";
        }

        Log.write(strSQL, "bindPersonalData S");

        DAOFn.Query('', strSQL, function (result) {
            Log.write(result, "bindPersonalData S");
            var objList = $.parseJSON(result);
            if (objList.length == 0) {
                if (successFn) {
                    successFn(objList);
                }
            } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                alert("錯誤:" + result);
            } else {
                if (objList.length == 100) {
                    window.plugins.toast.showShortBottom("最多顯示100筆量測資料", null, null);
                }
                if (successFn) {
                    successFn(objList);
                }
            }
        });

    },
    getPersonalTitle: function (MType) {
        var tbClass = "class=\"stateTable h-center-center text-center\"";
        var HtmlStr = '<div id="tb_' + MType + '" ' + tbClass + '>';
        HtmlStr += '<div class=\"header\">';
        HtmlStr += '<div>' + $.i18n('量測時間') + '</div>';
        switch (MType) {
            case "BP":
                HtmlStr += '<div>' + $.i18n('收縮壓') + '</div>';
                HtmlStr += '<div>' + $.i18n('舒張壓') + '</div>';
                HtmlStr += '<div>' + $.i18n('脈搏') + '</div>';
                break;
            case "STEP":
                HtmlStr += '<div>' + $.i18n('步數') + '</div>';
                HtmlStr += '<div>' + $.i18n('距離') + "(km)" + '</div>';
                HtmlStr += '<div>' + $.i18n('卡路里') + "(kcal)" + '</div>';
                break;
            case "BG":
                HtmlStr += '<div>' + $.i18n('量測時段') + '</div>';
                HtmlStr += '<div>' + $.i18n('血糖') + '</div>';
                break;
            case "UA":
                HtmlStr += '<div>' + $.i18n('尿酸') + '</div>';
                break;
            case "CHOL":
                HtmlStr += '<div>' + $.i18n('膽固醇') + '</div>';
                break;
            case "BT":
                HtmlStr += '<div>' + $.i18n('體溫') + '</div>';
                break;
            case "BO":
                HtmlStr += '<div>' + $.i18n('血氧') + '</div>';
                break;
            case "HR":
                HtmlStr += '<div>' + $.i18n('心率') + '</div>';
                break;
            case "BW":
                HtmlStr += '<div>' + $.i18n('體重') + '</div>';
                HtmlStr += '<div>BMI</div>';
                HtmlStr += '<div>' + $.i18n('體脂') + '</div>'; //%
                // HtmlStr += '<div>' + $.i18n('基礎代謝') + '</div>'; //kcal
                //HtmlStr += '<div>' + parent.$.i18n('檢測結果') + '</div>';
                break;
            default:
                break;
        }
        // HtmlStr += '<th>' + $.i18n('備註') + '</th>';
        HtmlStr += '</div>';
        return HtmlStr;
    },
    getPersonalBody: function (MType, objList) {
        Log.write("getPersonalBody S " + MType, 'getPersonalBody');
        //alert(objList);
        return new Promise(function (resolve, reject) {
            var result = {
                chartType: "line",
                chartData: [],
                chartDataKey: [],
                xyAxisName: [],
                chartStyle: {
                    isYScaleAuto: false
                },
                HtmlStr: ""
            };

            switch (MType) {
                case "BP":
                    Log.write("success", 'getPersonalBody success');
                    result.xyAxisName = ["MTimeStamp", $.i18n('收縮壓'), $.i18n('舒張壓'), $.i18n('脈搏')];
                    result.chartDataKey = ["SBP", "DBP", "HR"];
                    break;
                case "STEP":
                    result.xyAxisName = ["MTimeStamp", $.i18n('步數')]; //,$.i18n('距離'), $.i18n('卡路里')];
                    result.chartDataKey = ["STEP"]; //,"Distance","CAL"];                
                    result.chartType = "bar";
                    break;
                case "BG":
                    result.xyAxisName = ["MTimeStamp", $.i18n('血糖')];
                    result.chartDataKey = ["BS"];
                    break;
                case "BW":
                    result.xyAxisName = ["MTimeStamp", $.i18n('體重'), $.i18n('BMI')];
                    result.chartDataKey = ["Weight", "BMI"];
                    break;
                default: //BT, UA, CHOL, HR, BO
                    switch (MType) {
                        case "BO":
                            MType = "SPO2";
                            break;
                    }
                    result.xyAxisName = ["MTimeStamp", $.i18n(MType)];
                    result.chartDataKey = [MType];
                    break;
            }

            var row = 0;
            for (var i = 0; i < objList.length; i++) {
                Measure.getPersonalBodyRow(MType, objList[i]).then(function (obj) {
                    
                    Log.write(obj.HtmlStr,'getPersonalBodyRowobj.HtmlStr');

                    result.HtmlStr += obj.HtmlStr;
                    result.chartData.push(obj.objRow);
                    if (row === objList.length - 1) {
                        result.HtmlStr += "</div>";
                        resolve(result);
                    }
                    row++;
                });
            }
        });
    },
    getPersonalBodyRow: function (MType, objRow) {
        Log.write("getPersonalBodyRow start", "getPersonalBodyRow");
        return new Promise(function (resolve, reject) {
            var HtmlStr = "";

            var DeviceModel = objRow.DeviceModel;
            var MTimeStamp = objRow.MTimeStamp;
            var DisplayMTimeStamp = Display.dateFormat(MTimeStamp);
            
            //確認是否為非手動量測，是的話在日期後加上*
            var checkDeviceModel = DeviceModel.indexOf('(Manual)');
            if (checkDeviceModel < 0) {
                DisplayMTimeStamp = DisplayMTimeStamp + '*';
            }

            var MRowKey = objRow.MRowKey;
            var UploadStatus = objRow.UploadStatus;
            var Memo = objRow.Memo == null ? "" : objRow.Memo;
            var M_UP_Date = objRow.M_UP_Date;
            var MRowSId = objRow.MRowSId;
            var arrWar = []; //

            var startTr = "<div class='row'>";
            // var endTr = '</tr>' + '<tr><div colspan="10">MRowSId: ' + MRowSId + '/Memo: ' + Memo + '/MRowKey: ' + MRowKey + "/UploadStatus: " + UploadStatus+ "/M_UP_Date: " + M_UP_Date + '</div></tr>';
            var endTr = '</div>';

            var isMemo = true;
            var HtmlMemo = "<div class='row seperate' onclick='MeasureManual.show(" + objRow.MRowID + ",\"" + UploadStatus + "\"," + isMemo + ")'>";
            HtmlMemo += '<div class="left gotoPage" data-pagename="#MeasurePage_Manual_Memo">';
            HtmlMemo += '<img src="./images/plus.svg" class="mark" />';
            HtmlMemo += ' ' + $.i18n('備註') + '： ' + Memo;
            HtmlMemo += "</div>";

            HtmlStr += startTr;

            var TheWar = "";

            switch (MType) {
                case "BP":
                    var SBP = objRow.SBP;
                    var DBP = objRow.DBP;
                    var HR = objRow.HR;

                    Display.isRed("SBP", SBP, "").then(function (obj) {
                        if (obj.IsRed == "1") {
                            SBP = "<font color=#BC272D>" + SBP + "</font>";
                        }
                        arrWar.push(obj.Warnings);
                        return Display.isRed("DBP", DBP, "");
                    }).then(function (obj) {
                        if (obj.IsRed == "1") {
                            DBP = "<font color=#BC272D>" + DBP + "</font>";
                        }
                        arrWar.push(obj.Warnings);
                        return Display.isRed("HR", HR, "");
                    }).then(function (obj) {
                        if (obj.IsRed == "1") {
                            HR = "<font color=#BC272D>" + HR + "</font>";
                        }
                        arrWar.push(obj.Warnings);

                        TheWar = Display.showText(arrWar.join(';'));

                        HtmlStr += '<div>' + DisplayMTimeStamp + '</div>';
                        HtmlStr += '<div>' + SBP + '</div>';
                        HtmlStr += '<div>' + DBP + '</div>';
                        HtmlStr += '<div>' + HR + '</div>';


                        if (TheWar !== '') {
                            Memo += "</br>" + TheWar;
                        }

                        endTr += HtmlMemo;
                        endTr += '</div>';

                        HtmlStr += endTr;

                        resolve({
                            HtmlStr: HtmlStr,
                            objRow: objRow
                        });
                    });
                    break;
                case "STEP":
                    var STEP = objList[i].STEP;
                    var Distance = objList[i].Distance;
                    var CAL = objList[i].CAL;

                    HtmlStr += '<div>' + DisplayMTimeStamp + '</div>';
                    HtmlStr += '<div>' + STEP + '</div>';
                    HtmlStr += '<div>' + Distance + '</div>';
                    HtmlStr += '<div>' + CAL + '</div>';
                    HtmlStr += endTr;

                    if (TheWar !== '') {
                        Memo += "</br>" + TheWar;
                    }

                    endTr += HtmlMemo;
                    endTr += '</div>';

                    HtmlStr += endTr;

                    resolve({
                        HtmlStr: HtmlStr,
                        objRow: objRow
                    });
                    break;
                case "BG":
                    var BS = objRow.BS;
                    var TimeType = objRow.TimeType;
                    var DeviceModel = objRow.DeviceModel;

                    objRow.BS = MeasureInfo.convertMValue(MType, BS, DeviceModel);

                    Display.isRed("BS", BS, TimeType).then(function (obj) {
                        BS = MeasureInfo.convertMValue(MType, BS, DeviceModel);
                        var TheWar = obj.Warnings;
                        TheWar = Display.showText(TheWar);
                        if (obj.IsRed == "1") {
                            BS = "<font color=#BC272D>" + BS + "</font>";
                        }

                        HtmlStr += '<div>' + DisplayMTimeStamp + '</div>';
                        HtmlStr += '<div>' + Display.getTimeType(TimeType) + '</div>';
                        HtmlStr += '<div>' + BS + '</div>';

                        if (TheWar !== '') {
                            Memo += "</br>" + TheWar;
                        }

                        endTr += HtmlMemo;
                        endTr += '</div>';

                        HtmlStr += endTr;

                        resolve({
                            HtmlStr: HtmlStr,
                            objRow: objRow
                        });
                    });
                    break;
                case "BW":
                    var Weight = objRow.Weight;
                    var BMI = objRow.BMI;
                    var BodyRate = objRow.BodyRate;

                    Display.isRed("BMI", BMI, "").then(function (obj) {
                        if (obj.IsRed == "1") {
                            BMI = "<font color=#BC272D>" + BMI + "</font>";
                        }
                        arrWar.push(obj.Warnings);
                        return Display.isRed("BodyRate", BodyRate, "");
                    }).then(function (obj) {
                        if (obj.IsRed == "1") {
                            BodyRate = "<font color=#BC272D>" + BodyRate + "</font>";
                        }
                        if (BodyRate == "" || !BodyRate) {
                            BodyRate = "<font color=gray> -- </font>";
                        }
                        arrWar.push(obj.Warnings);

                        TheWar = Display.showText(arrWar.join(';'));

                        HtmlStr += '<div>' + DisplayMTimeStamp + '</div>';
                        HtmlStr += '<div>' + Weight + '</div>';
                        HtmlStr += '<div>' + BMI + '</div>';
                        HtmlStr += '<div>' + BodyRate + '</div>';
                        // HtmlStr += '<div>' + baseRate + '</div>';

                        if (TheWar !== '') {
                            Memo += "</br>" + TheWar;
                        }

                        endTr += HtmlMemo;
                        endTr += '</div>';

                        HtmlStr += endTr;

                        resolve({
                            HtmlStr: HtmlStr,
                            objRow: objRow
                        });
                    });
                    break;
                default: //BT, UA, CHOL, HR, BO
                    var MValue = objRow[MType];

                    objRow[MType] = MeasureInfo.convertMValue(MType, MValue);

                    Display.isRed(MType, MValue, "").then(function (result) {
                        MValue = MeasureInfo.convertMValue(MType, MValue);
                        var TheWar = result.Warnings;
                        TheWar = Display.showText(TheWar);
                        if (result.IsRed == "1") {
                            MValue = "<font color=#BC272D>" + MValue + "</font>";
                        }

                        HtmlStr += '<div>' + DisplayMTimeStamp + '</div>';
                        HtmlStr += '<div>' + MValue + '</div>';

                        if (TheWar !== '') {
                            Memo += "</br>" + TheWar;
                        }

                        endTr += HtmlMemo;
                        endTr += '</div>';

                        HtmlStr += endTr;

                        resolve({
                            HtmlStr: HtmlStr,
                            objRow: objRow
                        });
                    });
                    break;
            }
        });
    },
    //讀資料
    readAll: function () {
        var lMType = [].concat(AppConfig.lMType);
        lMType.reverse();
        for (var i = 0; i < lMType.length; i++) {
            Measure.readByMType(lMType[i]);
        }
    },
    readByMType: function (MType) {
        var UserID = localStorage.UserID;
        var isAnimate = false;
        switch (MType) {
            case "BP":
                //血壓
                DAOFn.Query('', "select SBP,DBP,HR,MTimeStamp from Management_BP  where Account='" + UserID + "' and substr(MTimeStamp,0,5)||'-'||substr(MTimeStamp,6,2)||'-'||substr(MTimeStamp,9,9)<datetime('now','localtime') order by MTimeStamp desc limit 1", function (result) {
                    var objList = $.parseJSON(result);
                    if (objList.length > 0) {
                        var Arr = [];
                        Arr.push(objList[0].SBP);
                        Arr.push(objList[0].DBP);
                        Arr.push(objList[0].HR);

                        Measure.showValue('BP', Arr, isAnimate, objList[0].MTimeStamp);
                    } else {
                        Measure.showValue('BP', [], isAnimate, ""); //2018/04/18 新增功能: 如果沒有任何量測值 回到最初始狀況
                    }
                });
                break;
            case "STEP":
                DAOFn.Query('', "select STEP,Distance,CAL,MTimeStamp from Management_STEP  where Account='" + UserID + "' and substr(MTimeStamp,0,5)||'-'||substr(MTimeStamp,6,2)||'-'||substr(MTimeStamp,9,9)<datetime('now','localtime') order by MTimeStamp desc limit 1", function (result) {

                    var objList = $.parseJSON(result);
                    if (objList.length > 0) {
                        var Arr = [];
                        Arr.push(objList[0].STEP);
                        Arr.push(objList[0].Distance);
                        Arr.push(objList[0].CAL);
                        Measure.showValue(MType, Arr, isAnimate, objList[0].MTimeStamp);
                    } else {
                        Measure.showValue(MType, [], isAnimate, ""); //2018/04/18 新增功能: 如果沒有任何量測值 回到最初始狀況
                    }
                });
                break;
            case "BG":
                //血糖
                DAOFn.Query('', "select BS,TimeType,MTimeStamp from Management_BG  where Account='" + UserID + "' and substr(MTimeStamp,0,5)||'-'||substr(MTimeStamp,6,2)||'-'||substr(MTimeStamp,9,9)<datetime('now','localtime') order by MTimeStamp desc limit 1", function (result) {
                    var objList = $.parseJSON(result);
                    if (objList.length > 0) {
                        objList = $.parseJSON(result);
                        if (objList.length > 0) {
                            var Arr = [];
                            Arr.push(objList[0].BS);
                            Arr.push(objList[0].TimeType);

                            Measure.showValue('BG', Arr, isAnimate, objList[0].MTimeStamp);
                        }
                    } else {
                        Measure.showValue('BG', [], isAnimate, ""); //2018/04/18 新增功能: 如果沒有任何量測值 回到最初始狀況
                    }
                });
                break;
            case "BO":
                DAOFn.Query('', "select SPO2 as BO,MTimeStamp from Management_BO  where Account='" + UserID + "' and substr(MTimeStamp,0,5)||'-'||substr(MTimeStamp,6,2)||'-'||substr(MTimeStamp,9,9)<datetime('now','localtime') order by MTimeStamp desc limit 1", function (result) {

                    var objList = $.parseJSON(result);
                    if (objList.length > 0) {
                        var Arr = [];
                        Arr.push(objList[0].BO);
                        Measure.showValue('BO', Arr, isAnimate, objList[0].MTimeStamp);
                    } else {
                        Measure.showValue('BO', [], isAnimate, ""); //2018/04/18 新增功能: 如果沒有任何量測值 回到最初始狀況
                    }
                });
                break;
            case "BW":
                //體重 //身高和體重存同一個Table，要做分類；BW體重 Weight不可為空
                DAOFn.Query('', "select Weight,BMI,MTimeStamp from Management_BW where Weight<>'' and Account='" + UserID + "' and substr(MTimeStamp,0,5)||'-'||substr(MTimeStamp,6,2)||'-'||substr(MTimeStamp,9,9)<datetime('now','localtime') order by MTimeStamp desc limit 1", function (result) {
                    var objList = $.parseJSON(result);
                    if (objList.length > 0) {
                        var Arr = [];
                        var Weight = objList[0].Weight;
                        if (Weight != '') {
                            Arr.push(objList[0].Weight);
                            Arr.push(objList[0].BMI);
                        }
                        localStorage["Weight_" + UserID] = Weight;
                        Measure.showValue("BW", Arr, isAnimate, objList[0].MTimeStamp);
                    } else {
                        Measure.showValue('BW', [], isAnimate, ""); //2018/04/18 新增功能: 如果沒有任何量測值 回到最初始狀況
                    }
                });
                break;
            case "BF":
                //體脂肪
                DAOFn.Query('', "select BodyRate,MTimeStamp from Management_BW where CAST(BodyRate as decimal)<>0 and Account='" + UserID + "' and substr(MTimeStamp,0,5)||'-'||substr(MTimeStamp,6,2)||'-'||substr(MTimeStamp,9,9)<datetime('now','localtime') order by MTimeStamp desc limit 1", function (result) {
                    var objList = $.parseJSON(result);
                    if (objList.length > 0) {
                        var Arr = [];
                        Arr.push("");
                        Arr.push("");
                        Arr.push(objList[0].BodyRate);

                        Measure.showValue("BF", Arr, isAnimate, objList[0].MTimeStamp);
                    } else {
                        Measure.showValue('BF', [], isAnimate, ""); //2018/04/18 新增功能: 如果沒有任何量測值 回到最初始狀況
                    }
                });
                break;
            default: //BT, UA, CHOL, HR
                var strSql = "select " + MType + ",MTimeStamp from Management_" + MType + " ";
                strSql += " where Account='" + UserID + "' and substr(MTimeStamp,0,5)||'-'||substr(MTimeStamp,6,2)||'-'||substr(MTimeStamp,9,9)<datetime('now','localtime') order by MTimeStamp desc limit 1;";
                DAOFn.Query('', strSql, function (result) {
                    var objList = $.parseJSON(result);
                    if (objList.length > 0) {
                        var Arr = [];
                        Arr.push(objList[0][MType]);
                        Measure.showValue(MType, Arr, isAnimate, objList[0].MTimeStamp);
                    } else {
                        Measure.showValue(MType, [], isAnimate, ""); //2018/04/18 新增功能: 如果沒有任何量測值 回到最初始狀況
                    }
                });
                break;
        }
    },
    //更新雲端資料 TODO
    refresh: function (Type, successFn, errFn) {
        var UserID = localStorage.UserID;
        var userKind = AppConfig.UserKind;

        var DateS = ProjectFn.currentDate('', 'D', AppConfig.day, 'N') + " 00:00:00";
        var DateE = ProjectFn.currentDate('', 'D', 0, 'N') + " 23:59:59";

        //TODO
        $("#MBG_bg").height(0);
        $("#MBT_bg").height(0);
        $("#MUA_bg").height(0);
        $("#MCHOL_bg").height(0);

        setTimeout(function () {
            if (Type == "All") {
                var lMType = [].concat(AppConfig.lMType);
                lMType.reverse();
                //第一次進來，一次重新全部資料都載入
                for (var i = 0; i < lMType.length; i++) {
                    if (i == lMType.length - 1) {
                        Measure.getDataByType(UserID, userKind, lMType[i], DateS, DateE, successFn, errFn);
                    } else {
                        Measure.getDataByType(UserID, userKind, lMType[i], DateS, DateE);
                    }
                }
            } else { //TODO
                DateS = $("#History_DateS").val() + " 00:00:00";
                DateE = $("#History_DateE").val() + " 23:59:59";
                Measure.getDataByType(UserID, userKind, Type, DateS, DateE, successFn, errFn);
            }
        }, 500);

    },
    getDataByType: function (UserID, userKind, Type, DateS, DateE, successFn, errFn) {
        WSCall.Measurement.GET(UserID, userKind, Type, DateS, DateE, "", function (Type, data) {
            if (Type == "BF") Type = "BW";
            //Log.write(Type + "收到：" + data);
            //先刪除預塞入資料表格中的所有資料，再把資料塞入。
            DAOFn.Query("", "delete from Management_" + Type + " where Account = '" + UserID + "'",
                function () {
                    //Log.write("資料刪除成功");
                    //alert("資料刪除成功" + Type);
                    switch (data) {
                        case "QueryFN0001_01": //服務發生錯誤
                        case "QueryFN0001_02": //查詢條件空白
                        case "QueryFN0002_01": //程式發生錯誤
                        case "QueryFN0002_02": //查詢條件解密失敗
                        case "QueryFN0002_03": //查詢條件不足
                        case "QueryFN0002_04": //無法辨識量測類別
                        case "QueryFN0003_01": //程式發生錯誤
                            Log.write("data: " + data + ", Type: " + Type, "getDataByType");
                            var isAnimate = false;
                            Measure.showValue(Type, [], isAnimate, "");
                            if (errFn) {
                                errFn(data);
                            }
                            break;
                        case "QueryFN0003_02": //查無歷史記錄
                            setTimeout(function () {
                                Measure.readByMType(Type);
                            }, 500);
                            if (successFn) {
                                successFn();
                            }
                            break;
                        default:
                            data = data.replace(/\"MRowID\"/g, "\"Account\":\"" + UserID + "\",\"MRowSId\""); //雲端Service的流水號，未來Service會去掉流水號，目前先暫存至Memo欄位 20180306新增
                            //Log.write(data,'measure data');
                            var InsertArray = $.parseJSON(data); //JSON解析
                            Log.write(data, 'Measure WSCall Query');
                            DAOFn.MutiInsertData('', 'Management_' + Type, InsertArray, function ResultFun(result) {
                                //Log.write("resultFun_Insert:" + result);
                                Log.write(Type, "Measure Read");
                                setTimeout(function () {
                                    Measure.readByMType(Type);
                                }, 500);

                                if (successFn) {
                                    successFn();
                                }
                            });
                            break;
                    }

                });
        });
    },
    showValue: function (MType, ValueArr, isAnimate, MTimeStamp, DeviceModel) {
        Log.write("Measure showValue: " + ValueArr + ", MType: " + MType + " ,isAnimate: " + isAnimate, "Measure.showValue");

        var bot, top;
        var pL, pH;
        var toFixedNum = 0;
        var UserID = localStorage.UserID;
        var MValueFixed = ValueArr[0];
        if (ValueArr.length > 0 && ValueArr[0] === '') {
            return;
        } else if (ValueArr.length === 0) {
            $("#MP_NDate_" + MType).html($.i18n('無資料'));
            switch (MType) { //秀值前先將數值清空
                case "BP":
                case "STEP":
                    $("#M" + MType + "_Value1").html("--").css('color', 'rgba(0, 0, 0,1)'); //秀值前先將數值清空
                    $("#M" + MType + "_Value2").html("--").css('color', 'rgba(0, 0, 0,1)'); //秀值前先將數值清空
                    $("#M" + MType + "_Value3").html("--").css('color', 'rgba(0, 0, 0,1)'); //秀值前先將數值清空
                    break;
                default:
                    $("#M" + MType + "_Value1").html("--").css('color', 'rgba(0, 0, 0,1)'); //秀值前先將數值清空
                    break;
            }
            return;
        }

        //TODO 20180416 新增顯示量測時間
        $("#MP_NDate_" + MType).css("text-align", "center").css("padding-top", "2px");
        $("#MP_NDate_" + MType).html(MTimeStamp.substr(0, 16).replace(/\-/g, "/"));
        // var type="BG";
        // var a = MeasureInfo.Range[type]["Max"];
        switch (MType) {
            case "BG": //1    
            case "UA": //1  
            case "CHOL": //TODO 
                var MRange = MeasureInfo.DisplayRange[MType];
                toFixedNum = MeasureInfo[MType + "_Display_Num"];
                bot = MRange.Min;
                top = MRange.Max;

                if (MType === "BG") {
                    pL = 30;
                    pH = 74; // - localStorage.MeasureImageSizeAdjust;
                } else {
                    pL = 0;
                    pH = 115; //- localStorage.MeasureImageSizeAdjust; //115;
                }

                WiseFlot.DrawPic(MType, ValueArr[0], top, bot, pL, pH, null, isAnimate);
                break;
            case "BP":
                bot = 0;
                top = 360;

                pL = 0;
                pH = 360;

                WiseFlot.DrawPic(MType, ValueArr[0], top, bot, pL, pH, 1, isAnimate);
                WiseFlot.DrawPic(MType, ValueArr[1], top, bot, pL, pH, 2, isAnimate);
                WiseFlot.DrawPic(MType, ValueArr[2], top, bot, pL, pH, 3, isAnimate);
                break;
            case "BW":
                toFixedNum = 1;

                var Tgw; //TODO 目標體重 
                if (!localStorage["TargetW_" + UserID]) {
                    Tgw = Math.round((ValueArr[0] - 2) * 10) / 10;
                    localStorage["TargetW_" + UserID] = Tgw; //TODO            
                } else {
                    Tgw = localStorage["TargetW_" + UserID];
                }

                var WMax = +Tgw + 5;
                var WMin = +Tgw - 5;

                $("#MBW_txt1").html(Math.round(WMin));
                $("#MBW_txt2").html(Math.round(WMax));
                WiseFlot.DrawCirVal(WMin, WMax, ValueArr[0], 94, 94, 80, 140, 220, MType, 1);
                break;
            case "BF": //8
                bot = 1;
                top = 50;

                pL = 0;
                pH = 100;

                toFixedNum = 1;

                if (parseInt(ValueArr[2]) == 0) {
                    var tmp = $("#M" + MType + "_Value1").html();
                    $("#M" + MType + "_Value1").html("<font color='red'>未正確量測</font>");
                    $("#M" + MType + "_Value1").parent().animateCss("flash");

                    setTimeout(function () {
                        $("#M" + MType + "_Value1").html(tmp);
                    }, 8000);

                    return;
                }

                WiseFlot.DrawPic(MType, ValueArr[2], top, bot, pL, pH, null, isAnimate);
                break;
            case "BT": //4
                bot = 30;
                top = 40;

                pL = 0;
                pH = 100;

                toFixedNum = 1;

                WiseFlot.DrawPic(MType, ValueArr, top, bot, pL, pH, null, isAnimate);
                break;
            case "BO": //5
                bot = 90;
                top = 100;

                pL = 0;
                pH = 100;

                toFixedNum = 1;

                WiseFlot.DrawPic(MType, ValueArr[0], top, bot, pL, pH, null, isAnimate);
                break;
            default: //EC, STEP 
                if (ValueArr[0] === '') {
                    return;
                }
                break;
        }

        if (MType === "BG" || MType === "UA" || MType === "CHOL") {
            ValueArr[0] = MeasureInfo.convertMValue(MType, ValueArr[0], DeviceModel);
        }
        //alert(ValueArr+"Measure showValue " + MType+isAnimate+MTimeStamp);

        //移至量測項目
        if (CustomInfo.MainHome_scrollIntoView === "Y") {
            document.getElementById("M" + MType).scrollIntoView();
        }

        var Start_i = 0;
        var End_i = ValueArr.length;

        if (End_i != 0) {
            switch (MType) {
                case "BG":
                case "UA":
                case "CHOL":
                    Start_i = 0;
                    End_i = 1;
                    break;
                case "BP":
                    Start_i = 0;
                    End_i = 3;
                    break;
                case "BF":
                    Start_i = 2;
                    End_i = 3;
                    break;
                case "BW":
                    Start_i = 0;
                    End_i = 1;
                    break;
            }
        }

        for (var i = Start_i; i < End_i; i++) {
            Measure.bindValue(MType, ValueArr, i + 1, isAnimate, toFixedNum, MValueFixed);
        } //end for
    },
    bindValue: function (MType, ValueArr, Times, isAnimate, toFixedNum, MValueFixed) {
        //Log.write(MType+","+ValueArr+","+Times+","+isAnimate+","+toFixedNum,'bindValue');
        var i = Times - 1;
        var MyVal = parseFloat(ValueArr[i]);
        var timeType = ""; //量測時段 BG 
        var displayTimeType = "";

        if (MType === "BG") {
            timeType = ValueArr[1];
            displayTimeType = "(" + Display.getTimeType(timeType) + ")";
            $("#M" + MType + "_Value" + "2").html(displayTimeType);
        }

        if (isAnimate && MType !== "BW") {
            Measure.showValueAnimate(Times, MType, MyVal, toFixedNum, function () {});
        } else {
            $("#M" + MType + "_Value" + Times).html(MyVal.toFixed(toFixedNum));
        }

        var MTypeSection = MType;
        var MValue = MyVal;

        switch (MType) {
            case "BP":
                if (i == 0) {
                    MTypeSection = "SBP";
                } else if (i == 1) {
                    MTypeSection = "DBP";
                } else if (i == 2) {
                    MTypeSection = "HR";
                }
                break;
            case "STEP":
                if (i == 0) {
                    MTypeSection = "STEP";
                } else if (i == 1) {
                    MTypeSection = "Distance";
                } else if (i == 2) {
                    MTypeSection = "CAL";
                }
                break;
            case "BW":
                MTypeSection = "Weight";
                MValue = ValueArr[1];
                break;
            case "BF":
                MTypeSection = "BodyRate";
                MValue = ValueArr[2];
                break;
            case "BG":
                MTypeSection = "BS";
                MValue = MValueFixed;
                break;
            default: //BT, UA, CHOL, BO, HR
                MValue = MValueFixed;
                MTypeSection = MType;
                break;
        }

        var _Times = Times;
        Log.write(MType + " , " + MTypeSection, 'Display.isRed S');
        Display.isRed(MTypeSection, MValue, timeType).then(function (result) {
            Log.write("_Times" + _Times + " /isRed(1): " + result.IsRed + " /" + MTypeSection + " /" + MValue, "Display.isRed Result");
            if (result.IsRed == "1") {
                $("#M" + MType + "_Value" + _Times).css('color', 'rgba(255, 0, 0,1)');
            } else {
                //顏色
                $("#M" + MType + "_Value" + _Times).css('color', 'rgba(0, 0, 0,1)');
            }
        });
    },
    showValueAnimate: function (ptr, MType, MValue, toFixedNum, successFn) {
        var counter = {
            'value': 0
        }; //Start
        TweenMax.to(counter,
            2, {
                'value': MValue, //End
                'onUpdate': function () {
                    $("#M" + MType + "_Value" + ptr).html(counter.value.toFixed(toFixedNum));
                },
                'onComplete': function () {

                    $("#M" + MType + "_Value" + ptr).html(counter.value.toFixed(toFixedNum));
                    $("#M" + MType + "_Value" + ptr).animateCss("flash");
                    if (successFn) {
                        successFn();
                    }
                },
                'ease': Expo.easeOut
            });
    },
    checkMValue: function (lMdata, MType, successFn) {
        var result = "";

        try {
            switch (MType) {
                case "BP":
                case "STEP":
                    if (isNaN(parseFloat(lMdata[3])) || isNaN(parseFloat(lMdata[4])) || isNaN(parseFloat(lMdata[5]))) {
                        result = $.i18n('設備傳送資料有誤，請重新上傳');
                    }
                    break;
                case "BO":
                    if (isNaN(parseFloat(lMdata[3])) || isNaN(parseFloat(lMdata[4]))) {
                        result = $.i18n('設備傳送資料有誤，請重新上傳');
                    }
                    break;
                    // case "BW":
                    // case "BF":
                    //     //alert(lMData.length);
                    //     Log.write(lMData, 'FnBT SaveData');
                    //     //[3]體重,BMI,[5]體脂,基代,[7]身高,性別,[9]年齡
                    //     Params.Weight = mainMeasureData;
                    //     Params.Gender = lMData[8];
                    //     Params.Age = lMData[9];
                    //     Params.Height = lMData[7];
                    //     Params.BMI = lMData[4];
                    //     Params.BaseRate = lMData[6];
                    //     Params.BodyRate = lMData[5];
                    //     MType = "BW";
                    //     break;
                default: //BT, UA, CHOL, HR, BG, BW
                    if (isNaN(parseFloat(lMdata[3]))) {
                        result = $.i18n('設備傳送資料有誤，請重新上傳');
                    }
                    break;
            }
        } catch (error) {
            result = $.i18n('設備傳送資料有誤，請重新上傳');
            Log.write(error, 'Measure checkMValue');
        }

        if (successFn) {
            successFn(result);
        }
    }
};
