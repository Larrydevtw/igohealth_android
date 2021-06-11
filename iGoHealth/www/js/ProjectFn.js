var ProjectFn = ProjectFn || {},
    ProjectFn = {
        dateS_ID: "History_DateS",
        dateE_ID: "History_DateE",
        Wait: function (fn, cb) {
            var count = fn.length;
            var result = [];
            fn.forEach(function (f) {
                f(next);
            });

            function next(r) {
                result.push(r);
                count--;
                if (count === 0) cb(result);
            }
        },
        /*
        設定系統參數(「mSys」為系統用,參數名稱,參數值,callback)
        回傳值：
        使用方式：
        projectFn.setSysParams("mSys", "RecMe", vID, function (msg) { });
        */
        setSysParams: function (UserID, ParaName, ParaValue, callback) {
            var Params = {
                'UserID': UserID,
                'CP_ParaName': ParaName,
                'CP_ParaValue': ParaValue,
                'CP_UP_Date': DateTimeFun.getNow()
            };

            DAOFn.SimpleMerge('', 'mCustom_Params', Params, 'CP_ParaName', ParaName, " and UserID='" + UserID + "' ", callback);
        },
        /*
        取得系統參數(使用者名稱,參數名稱,callback函數)
         回傳值：callback參數值
        使用方式：
        projectFn.getSysParams("mSys", "RecMe", function (msg) { });
        */
        getSysParams: function (UserId, getName, callback) {
            var strSQL = "select CP_ParaValue from mCustom_Params where UserID='" + UserId + "' and CP_ParaName='" + getName + "'  ";
            DAOFn.Query("", strSQL,
                function ResultFun(result) {
                    var objList = $.parseJSON(result);
                    if (objList.length == 0) {
                        //尚未設定參數
                        callback("");
                    } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                        //查詢錯誤
                        callback("");
                    } else {
                        callback(objList[0].CP_ParaValue);
                    }
                }
            );
        },
        toggleMenu: function () {
            Log.write("toggleMenu", 'ProjectFn');
            FnBT.StopScan();
            SidebarCustom.toggleMenu();
        },
        gestureInit:function(){
            // use hammer.js
            var myElement = document.getElementById('MainHomeDiv');

            // create a simple instance
            // by default, it only adds horizontal recognizers
            var mc = new Hammer(myElement);

            // listen to events...
            mc.on("swiperight", function (ev) { //tap press
                ev.preventDefault();
                Log.write(ev.type + " gesture detected.", "Hammer");
                SidebarCustom.openMenu();
            });
            mc.on("panleft", function (ev) { //tap press
                ev.preventDefault();
                Log.write(ev.type + " gesture detected.", "Hammer");
                SidebarCustom.closeMenu();
            });

            var mcHistiry = new Hammer(document.getElementById('tabHistory'));

            mcHistiry.on("swiperight", function (ev) { //tap press
                ev.preventDefault();
                Log.write(ev.type + " gesture detected. tabHistory app.onBack", "Hammer");
                app.onBack();
            });

            var mcAdd = new Hammer(document.getElementById('tabMeasurePage_Manual'));

            mcAdd.on("swiperight", function (ev) { //tap press
                ev.preventDefault();
                Log.write(ev.type + " gesture detected. tabMeasurePage_Manual app.onBack", "Hammer");
                Measure.backToHistory();
            });
        },
        ballAddInit:function(){
            FnBall.init(function(){
                Log.write("add",'ballAdd');
                MeasureManual.show();
            });
        },
        // SerialToString: function (Serial) { //TODO
        //     if ($.isNumeric(Serial)) {
        //         return Serial + "_WiseFix";
        //     } else {
        //         return Serial;
        //     }
        // },
        //日期格式,nd:日期(空白為系統日),set:設定模式(M月/D日),days:天數,YN:是否呈現時分(Y/N),isBR:在時間部分是否換行
        //ex:currentDate('','D',0,'Y') --> 2016-03-01 02:25;
        //ex:currentDate('2016/03/01','M',3,'N') --> 2016-06-01;
        currentDate: function (nd, set, days, YN, isBR) {
            var d = new Date();
            if (nd != "") {
                nd = nd.replace(/\-/g, '/');
                //nd = nd.replace('.000', '');

                var ptr = nd.indexOf('.');
                if (ptr > 0) {
                    nd = nd.substr(0, ptr);
                }

                d = new Date(nd);
            }

            if (days != 0) {
                if (set == "M") {
                    d = d.setMonth(d.getMonth() + days);
                } else {
                    d = d.setDate(d.getDate() + days);
                }
            }

            var ndate = new Date(d);
            var month = ndate.getMonth() + 1;
            var day = ndate.getDate();

            var output = ndate.getFullYear() + '/' +
                (month < 10 ? '0' : '') + month + '/' +
                (day < 10 ? '0' : '') + day;

            if (YN == "Y") {
                var hours = ndate.getHours();
                var minutes = ndate.getMinutes();
                if (isBR == 'Y') {
                    output += "</br>";
                } else {
                    output += "  ";
                }
                output += (hours < 10 ? '0' : '') + hours + ':' +
                    (minutes < 10 ? '0' : '') + minutes;
            }
            return output;
        },
        //===========QRCode掃描==================
        startCameraScan: function () { //開啟相機掃碼
            Log.write("開始", "ProjecFn.startCameraScan");
            FnBT.StopScan();
            cordova.plugins.barcodeScanner.scan(
                function (result) {
                    //alert("We got a barcode\n" +
                    //      "Result: " + result.text + "\n" +
                    //      "Format: " + result.format + "\n" +
                    //      "Cancelled: " + result.cancelled);
                    var BCV = result.text;
                    ProjectFn.BarCodeScan_Action(BCV);
                },
                function (error) {
                    alert("Scanning failed: " + error);
                }, {
                    preferFrontCamera: false, // iOS and Android
                    showFlipCameraButton: false, // iOS and Android
                    showTorchButton: true, // iOS and Android
                    torchOn: false, // Android, launch with the torch switched on (if available)
                    prompt: $.i18n("請將條碼或QRCode置于取景框內"), // Android
                    resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
                    //formats: "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
                    orientation: "portrait" // Android only (portrait|landscape), default unset so it rotates with the device
                    //,disableAnimations: true, // iOS
                    //disableSuccessBeep: false // iOS
                }
            );
        },
        BarCodeScan_Action: function (BCV) {
            /* 掃碼後要做的動作*/
            Log.write("BCV" + BCV, "ProjecFn.BarCodeScan_Action");
            // $("#btnQRCamera").show();
            LoginQR.CheckQR(BCV);
        },
        //==========開啟內嵌網頁==================
        OpenWebUrl: function (url, successFn) {
            if (!NetStatusFn.getNetFlag()) {
                FnCtrl.alert($.i18n("請於有網路狀態下連線"));
                return;
            }
            WiseScripts.Tool.ShowLoading(true, $.i18n("資料載入中.."));

            $("#IfWebView_div").height(screen.height - 40);

            $("#IfWebView").height(screen.height - 40); //$(".main").height()
            $("#IfWebView").attr("onload", "ProjectFn.OpenWebPageFinish(" + successFn + ");");
            $("#IfWebView").hide();

            $("#IfWebView").prop('src', url);
            //cordova.InAppBrowser.open(url, '_system', 'location=no');
            Log.write("url" + url, "ProjecFn.OpenWebUrl");

            WiseScripts.Tool.NextPop('WebPage', function () {
                Log.write("開啟Web成功", "ProjecFn.OpenWebUrl");
            }, null, 'T');
        },
        OpenWebPageFinish: function (successFn) {
            $("#IfWebView").show();
            Log.write("successFn", "ProjecFn.OpenWebPageFinish");
            if (successFn) {
                successFn();
            }
            WiseScripts.Tool.ShowLoading(false, '', '', function () {
                Log.write("OpenWebPageFinish", "ProjecFn.OpenWebPageFinish");
            });
        },
    };