/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    onBackFlag: "Y",
    // Application Constructor
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function () {
        //保持螢幕恆亮
        if (window.plugins.insomnia) {
            window.plugins.insomnia.keepAwake();
        } else {
            Log.write("window.plugins.insomnia is undefined", 'onDeviceReady');
        }

        var OS = DeviceInfo.GetOS();
        //IOS頂部狀態列設定
        CustomStyle.adjustStatus_H();

        try { //抓取設備機碼  
            Log.write(OS, 'deviceid');
            if (OS == "Android") {
                Log.write(device.serial.toString(), 'deviceid');
                AppConfig.EquipmentID = device.serial.toString();
            } else {
                window.plugins.uniqueDeviceID.get(
                    function (serialID) {
                        AppConfig.EquipmentID = serialID;
                    });
            }
        } catch (err) {
            Log.write(err, 'deviceid');
            AppConfig.EquipmentID = "errEquipmentID";
        }

        ProjectFn.Wait([function (next) {
            CustomUI.init(function () {
                next();
            });
        }, function (next) {
            Custom.init(function () {
                next();
            });
        }, function (next) {
            app.NetStatusIni(function () {
                //alert("net Success");
                next();
            });
        }, function (next) {
            cordova.getAppVersion.getVersionNumber(function (VersionNo) {
                Domain.Version = Domain.Version + "_" + VersionNo;
                Domain.VersionNo = VersionNo;
                //alert("Domain.Version"+Domain.Version+"Domain.VersionNo"+Domain.VersionNo);
                next();
            });
        }, function (next) {
            //使用$.i18n初始化
            Log.write(Lang.locale, 'Lang.locale');
            if (localStorage.Lang) {
                Log.write(localStorage.Lang, 'localStorage.Lang');
            }
            Lang.init(function () {
                //alert("SetLanguage Success");
                WiseScripts.Tool.ShowLoading(true, $.i18n('同步雲端設定...'));
                next();
            });
        }, function (next) {
            iniDB.createTable(function () {
                //alert("成功");
                next();
            });
        }, function (next) {
            FnGeo.arrTargets = ["signup_twzipcode", "profile_twzipcode"];
            FnGeo.init(function () { //successFn
                //alert("FnGeo Success");
                next();
            });
        }, function (next) {
            FnBT.DeviceInfo(function () { //successFn
                //alert("DeviceInfo Success");
                next();
            });
        }, function (next) {
            FnDeviceINS.init(function () { //successFn
                //alert("FnDeviceINS Success");
                next();
            });
        }, function (next) {
            //載入標準值 TODO: 改為直接存入Table
            MeasureInfo.iniStandardJSON(function () {
                next();
            }, function () {
                next();
            });
        }, function (next) {
            //同步App訊息
            FnSystem.SyncAppInfo(function () {
                next();
            }, function () { //同步有錯
                next();
            });
        }], function () {
            //alert("PJ Success");

            //TODO:
            //ProjectFn.ballAddInit();

            WiseScripts.Tool.ShowLoading(false, '', '', function () {
                //20180316 拿掉站點註冊
                //alert("RegisterSite");    
                Log.write("檢查註冊資料");
                HATMService.RegisterSite(function () { //successFn
                    Log.write(" HATMService.RegisterSite Success", "index.js onDeviceReady");
                    try {

                        Project.AppInit(); //App初始化 確認網路>啟動上傳>登入流程

                    } catch (error) {
                        Log.write(error, 'index.js onDeviceReady');
                    }
                }, function () { //errFn
                    alert("檢查註冊資料 errFn");
                });

                // setTimeout(function () { //初始化檔案上傳下載模組
                //     FnDT.init(function () {
                //         //alert("FnDT.init end");
                //     });
                // }, 100);
            });
        });

        //// 處理 Cordova 暫停與繼續事件
        document.addEventListener('pause', app.onPause.bind(this), false);
        document.addEventListener('resume', app.onResume.bind(this), false);

        if (OS == "Android") { //android才有返回按鈕
            document.addEventListener("backbutton", app.onBack, false);
        }

        // var testSql = "Pragma table_info(Management_BG);";//select (V_APKName || V_Version1 || V_Version2 || V_Version3) as appVersion from APP_Version
        // $("#divDevelop").html('<div id="test" style=""><div class="Statusbar"></div><div class="header"><a onclick="app.onBack();" class="left"><i class="wise_close"></i></a><div class="center" data-i18n="SQL測試">SQL測試</div><a class="right"></a><div class="nowifi" style="display:none;" data-i18n="！未連線至網路"></div></div><div class="popup-body"><div class="frombox"><div class="form-group col-xs-12"><textarea rows="6" type="text" id="testSql" value="select (V_APKName || V_Version1 || V_Version2 || V_Version3) as appVersion from APP_Version" class="form-control">'+testSql+'</textarea></div><div class="form-group col-xs-12"><table id="dynamicTable" class="table table-responsive"></table></div></div><div class="btnbox"><input type="button" id="btnTest" onclick="FnBT.testSql();" value="測試" class="btn btn-primary" /></div></div></div>');
    },
    onPause: function () {
        Log.write("---程式暫停---");
        FnBT.StopScan();
        BandMate.disConn();
    },
    onResume: function () {
        Log.write("---程式重啟---");
        var currentPage = RecView[RecView.length - 1];
        switch (currentPage) { //判斷是否為首頁
            case "MainHome":
                FnBT.StartScan("Y");
                break;
        }
        BandMate.init();
        //TODO
        // if (localStorage.UserID)
        // {
        //     ble.isEnabled(function () {
        //             WiseBT.StartScan();
        //         }
        //         , function () {
        //             Log.write("藍牙還沒開");
        //             alert("程式重啟 準備開BT");
        //             Measure.PlzOpenBT();
        //         }
        //     );
        // }

        //if (localStorage.UserID && sessionStorage["UserType"])
        //WSCall.StationService.GetPushMessage(localStorage.UserID, sessionStorage["UserType"]);
    },
    onBack: function () {
        Log.write("---按下返回鍵---" + JSON.stringify(RecView), "onBack");

        Log.write(app.onBackFlag, 'app onBack');
        if (app.onBackFlag === "N") {
            Log.write("app.onBackFlag為N", 'app onBack');
            return;
        }

        if (sessionStorage.mainHomeLocation === 'MemberPage') {
            var h = document.getElementById("MemWebView").contentWindow.history;
            if (h.length === 2) {
                MainHome.fadeOutPage('Home');
            } else {
                h.back();
            }
            return;
        }

        // if (!$("#menu2").is(":hidden")) { //判斷Menu2是否有開啟
        //     ChatRoom.toggleMenu2();
        //     return;
        // }

        if ((sessionStorage.WhereAmI === "divMeasureScanMode")) {
            if (!$("#aMeasureScan_Back").is(":visible")) {
                Log.write("divMeasureScanMode暫停返回功能", "back");
                return;
            }
        }

        if ((sessionStorage.WhereAmI === "login" || sessionStorage.WhereAmI === "MainHome") && RecView.length <= 1) {
            WiseScripts.Tool.SysClose(function () {
                //cancelFn
                FnBT.StartScan("Y");
            });
            return;
        }

        Log.write(LoginQR.Proccess, "onBack LoginQR.Proccess");
        if (LoginQR.Proccess === "Y") {
            $('#IfWebView').contents().find('#divCancel').click();
            $("#btnQRLogin").hide();
            LoginQR.Proccess = "N";
        }

        WiseScripts.Tool.BackPop(null, function () {
            var backPage = RecView[RecView.length - 2];
            var currentPage = RecView[RecView.length - 1];

            FnBT.GetBTMode(function (BTMode) {
                Log.write("BTMode: " + BTMode + " ,backPage: " + backPage + ",currentPage: " + currentPage, "index BTMode");
                switch (currentPage) { //判斷是否為首頁
                    case "userHistory":
                        Measure.showHistory(MeasureInfo.MType, "N");
                        break;
                    case "MainHome":
                        FnBT.StartScan("Y");
                        FnBT.AppMode = "People";
                        MeasureScan.CheckUserID = "";
                        break;
                    case "Points":
                        FnPoint.showPointList();
                        break;
                    default:
                        FnBT.StopScan();
                        break;
                }
            });

        });
    },
    // Update DOM on a Received Event
    NetStatusIni: function (successFn) {
        NetStatusFn.initFun(
            function onlineEvent() { //有網路
                $("#aOffline").hide();
                $("#aReload").show();

                //TODO
                $(".nowifi").fadeOut();
                window.plugins.toast.showShortBottom($.i18n('已重新連上網路！'), function (a) {}, function (b) {});

                if (!sessionStorage.NowURL) {
                    sessionStorage.NowURL = 'blank.html';

                    if (sessionStorage.mainHomeLocation === 'MemberPage') {
                        MainHome.fadeOutPage("Home");
                    } else {
                        $("#MemWebView").prop('src', sessionStorage.NowURL);
                    }
                } else {
                    $("#MemWebView").prop('src', sessionStorage.NowURL);
                }

                //啟用上傳
                WaitQueue.UploadStatus = "";
                WaitQueue.StartUpload();

                //同步點數資料
                FnPoint.showPointTotal();
            },
            function offlineEvent() { //沒網路
                var msg = $.i18n("網路連線不可用，請稍後在試。");
                FnCtrl.toast(msg, 'short', 'center');
                $("#aOffline").show();
                $("#aReload").hide();

                $(".nowifi").html($.i18n("！未連線至網路，採用離線登入。"));
                $(".nowifi").fadeIn();

                setTimeout(function () {
                    $(".nowifi").animateCss("flash");
                    setTimeout(function () {
                        $(".nowifi").animateCss("flash");
                        setTimeout(function () {
                            $(".nowifi").fadeOut();
                        }, 1000);
                    }, 2000);
                }, 4000);
                //記住現在的網址
                sessionStorage.NowURL = document.getElementById("MemWebView").contentWindow.location.href;
                $("#MemWebView").prop('src', 'offLine.html');

                WiseScripts.Tool.ShowLoading(false, '', '', function () {
                    FnCtrl.toast($.i18n("目前無網路連線!!!"), "long", 'center');
                });
            },
            function () {
                if (successFn) {
                    successFn();
                }
            }
        );
    }
};

app.initialize();
// app.onDeviceReady();
