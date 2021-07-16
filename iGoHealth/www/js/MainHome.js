var SortOnce = false;
var IsSorting = false;

var IsLoadingShow = false;

//推播訊息相關參數
var UnReadIDs = [];
var ReadIDs = [];
var Count = 0;
var TheOpenIndex = -1;
var ScrollPosition = 0;

var push;

var MainHome = MainHome || {}, MainHome =
    {
        onLoad: function () {
            //初始化 主頁面顯示
            $("#MBG_bg").height(0);
            $("#MBT_bg").height(0);
            $("#MUA_bg").height(0);
            $("#MCHOL_bg").height(0);
            $("#MBO_bg").height(0);

            $("#MBG_Value1").html("--");
            $("#MBG_Value2").html("&nbsp;");
            $("#MBP_Value1").html("--");
            $("#MBP_Value2").html("--");
            $("#MBP_Value3").html("--");
            $("#MBW_Value1").html("--");
            $("#MBT_Value1").html("--");

            $("#MUA_Value1").html("--");
            $("#MCHOL_Value1").html("--");
            $("#MBO_Value1").html("--");
            $("#MSTEP_Value1").html("--");
            $("#MSTEP_Value2").html("--");
            $("#MSTEP_Value3").html("--");
            $("#MHR_Value1").html("--");
            // $("#MWL_Value1").html("--");
            // $("#MBF_Value1").html("--");
            // $("#MEC_Value1").html("--");
            // $("#MEC_Value2").html("--");
            $("#MBP_val1").removeAttr('d');
            $("#MBP_val2").removeAttr('d');
            $("#MBP_val3").removeAttr('d');
            $("#MBP_arc1").attr('d', WiseFlot.describeArc(94, 90, 55, 0, 359.9));
            $("#MBP_arc2").attr('d', WiseFlot.describeArc(94, 90, 70, 0, 359.9));
            $("#MBP_arc3").attr('d', WiseFlot.describeArc(94, 90, 85, 0, 359.9));
            var MBP_Ans1 = WiseFlot.CalcAns(200, 0, 360, 0, 140);
            var MBP_Ans2 = WiseFlot.CalcAns(200, 0, 360, 0, 90);
            var MBP_Ans3 = WiseFlot.CalcAns(200, 0, 360, 0, 90);
            $("#MBP_std1").attr('d', WiseFlot.describeArc(94, 90, 85, MBP_Ans1 - 1, MBP_Ans1 + 1));
            $("#MBP_std2").attr('d', WiseFlot.describeArc(94, 90, 70, MBP_Ans2 - 1, MBP_Ans2 + 1));
            $("#MBP_std3").attr('d', WiseFlot.describeArc(94, 90, 55, MBP_Ans3 - 1.5, MBP_Ans3 + 1.5));

            $("#MBW_arc1").attr('d', WiseFlot.describeArc(94, 90, 80, 0, 150));
            $("#MBW_arc2").attr('d', WiseFlot.describeArc(94, 90, 80, 210, 359.9));
            $("#MBW_value1").hide();
            $("#MBW_txt1").text("");
            $("#MBW_txt2").text("");
  
            // $("#MCHOL_txt1").html(0);
            // $("#MCHOL_txt2").html(300);

            // $("#MCHOL_arc1").attr('d', WiseFlot.describeArc(94, 90, 80, 0, 150));
            // $("#MCHOL_arc2").attr('d', WiseFlot.describeArc(94, 90, 80, 210, 359.9));

            //存入預設量測時間(如有使用者有修改過，以使用者設定時間為主)
            LocalNotify.get().then(function(objResult){
                if(objResult.lResults.length<1){
                    LocalNotify.getDefaultTime().then(function (InsertArray) {
                        LocalNotify.save(InsertArray);
                    });
                }
            });

            Login.getUserFTime().then(function (FTime) {
                Log.write(FTime, "MainHome.onLoad 判斷是否為第一次；第一次登入會從雲端撈取資料．");
                var UserID=localStorage.UserID;
                if (FTime == "") { //第一次登入
                    Log.write("FTime 第一次登入",'mainHome');
                    FnBT.SetBTMode();

                    //TODO://更新雲端資料到DB>畫面上綁定最新一筆資料     
                    ProjectFn.Wait([function (next) {
                        Login.saveUserInfo(UserID, "", DateTimeFun.getNowDate(), function () {
                            next();
                        });
                    }, function (next) {
                        Member.GetUserData(UserID, function () {
                            Log.write("GetUserData", 'mainHome');
                            next();
                        });
                    }, function(next){
                        //同步App權限
                        FnSystem.SyncAuthority(function () {
                            next();
                        }, function () { //同步有錯
                            next();
                        });
                    }], function () {
                        //更新雲端資料
                        Login.refreshAllMData("Y", function () {});
                        //第一次登入，前往使用者資料輸入畫面
                        Log.write("localStorage[UserDataSet]" + localStorage["UserDataSet_" + UserID], 'mainHome');
                        MainHome.goToProfile(true, function () {
                            Log.write("goToProfile", 'mainHome');
                            Member.showDisplayName();
                            FnBT.iniBT(function () {
                                Log.write("更新使用者資料 FnBT success", 'mainHome');
                                BandMate.init();
                            });
                        });
                    });
                } else {
                    ProjectFn.Wait([function (next) { //TODO   
                        FnBT.iniBT(function () {
                            Log.write("not first FnBT success", 'mainHome');
                            next();
                        });
                    }, function (next) {
                        Member.GetUserData(UserID, function () {
                            Log.write("GetUserData", 'mainHome 更新UserData');
                            next();
                        });
                    }, function(next){
                        //同步App權限
                        FnSystem.SyncAuthority(function () {
                            next();
                        }, function () { //同步有錯
                            next();
                        });
                    }], function () {
                        //更新雲端資料
                        Login.refreshAllMData(FnSystem.isAutoSyncData, function () {});
                        Member.UpdateUserData(UserID, function () { //successFn
                            Member.showDisplayName();
                            Measure.readAll(); //綁定最新一筆量測資料至初始畫面中     
                            //FnBT.StartScan("Y");
                            BandMate.init();
                            FnPoint.showPointTotal();
                            Log.write("not first", 'mainHome');
                        });
                    });
                }
            });

            //首頁手勢滑動
            ProjectFn.gestureInit('MainHomeDiv');
        },
        CheckNet:function(){
            var netFlag = NetStatusFn.getNetFlag();
            Log.write(netFlag,'MainHome CheckNet');
            if(!netFlag){
                FnCtrl.alert($.i18n('請檢查手機網路，該功能需有網路連線狀態下才可開放使用'));
                return false;
            }else{
                return true;
            }
        },
        goToMember: function () {
            if (sessionStorage.mainHomeLocation == 'MemberPage') {
                return;
            }

            $("#MemWebView_div").height(screen.height - 40);
            $("#MemWebView").height($(".main").height());

            var handler = function () {
                WiseScripts.Tool.ShowLoading(false);

                MainHome.fadeOutPage('MemberPage');
                $("#MemWebView").unbind('load', handler);
                sessionStorage.NowURL = document.getElementById("MemWebView").contentWindow.location.href;
                //Start Event
                var hnd = window.setInterval(function () {

                    //Log.write(document.getElementById("MemWebView").contentWindow.location.href);

                    if (sessionStorage.mainHomeLocation != 'MemberPage') {
                        window.clearInterval(hnd);
                    }
                    else {
                        if (document.getElementById("MemWebView").contentWindow.location.href !=
                            sessionStorage.NowURL
                        ) {
                            //Log.write("Loading..");
                            if (!IsLoadingShow) {
                                IsLoadingShow = true;
                                $("#PopWin_Loading").show();
                                $(".PopWin").show();
                            }
                        }
                    }
                }, 200);

                //Load Event
                $("#MemWebView").bind('load', function () {
                    WiseScripts.Tool.ShowLoading(false);
                    sessionStorage.NowURL = document.getElementById("MemWebView").contentWindow.location.href;

                    Log.write("load OK:" + sessionStorage.NowURL);

                    //特別判斷
                    if (sessionStorage.NowURL.indexOf('blank.html') >= 0 &&
                        document.getElementById("MemWebView").contentWindow.history.length > 2
                    ) {
                        MainHome.fadeOutPage('Home', true);
                        document.getElementById("MemWebView").contentWindow.history.forward();
                    }
                    //---

                    IsLoadingShow = false;
                    $("#PopWin_Loading").hide();
                    $(".PopWin").hide();


                    //if (sessionStorage.NowURL.indexOf('blank.html') >= 0)
                    //    MainHome.fadeOutPage('Home');
                });
            };

            $("#MemWebView").unbind('load');

            if ($("#MemWebView").prop('src').indexOf('blank.html') >= 0 ||
                document.getElementById("MemWebView").contentWindow.location.href.indexOf(AppConfig.AppSSO) >= 0
            ) {
                var Acct = '?Acct=';

                WiseAES.enpryptAES(WiseScripts.Format.Date_yyyyMMddHHmmss(new Date()).replace(/\//g, "").replace(/\:/g, "").replace(/\s+/g, "") + 
                    localStorage.UserID, AppConfig.MAesKey1, AppConfig.MAesKey2, "T",
                    function (res) {
                        Acct += res;

                        $("#MemWebView").prop('src', AppConfig.AppSSO + Acct);
                        WiseScripts.Tool.ShowLoading(true, "專區資料下載中..");
                        $("#MemWebView").bind('load', handler);
                    }
                );
            }
            else {
                MainHome.fadeOutPage('MemberPage');
                //$("#MemWebView").bind('load', handler);

                sessionStorage.NowURL = document.getElementById("MemWebView").contentWindow.location.href;
                //Start Event
                var hnd = window.setInterval(function () {

                    //Log.write(document.getElementById("MemWebView").contentWindow.location.href);

                    if (sessionStorage.mainHomeLocation != 'MemberPage') {
                        window.clearInterval(hnd);
                    }
                    else {
                        if (document.getElementById("MemWebView").contentWindow.location.href !=
                            sessionStorage.NowURL
                        ) {
                            //Log.write("Loading..");
                            if (!IsLoadingShow) {
                                IsLoadingShow = true;
                                $("#PopWin_Loading").show();
                                $(".PopWin").show();
                            }
                        }
                    }
                }, 200);

                //Load Event
                $("#MemWebView").bind('load', function () {
                    WiseScripts.Tool.ShowLoading(false);
                    sessionStorage.NowURL = document.getElementById("MemWebView").contentWindow.location.href;

                    Log.write("load OK:" + sessionStorage.NowURL);

                    //特別判斷
                    if (sessionStorage.NowURL.indexOf('blank.html') >= 0 &&
                        document.getElementById("MemWebView").contentWindow.history.length > 2
                    ) {
                        MainHome.fadeOutPage('Home', true);
                        document.getElementById("MemWebView").contentWindow.history.forward();
                    }
                    //---

                    IsLoadingShow = false;
                    $("#PopWin_Loading").hide();
                    $(".PopWin").hide();
                });
            }
        },
        goToHome: function (successFn) {
            WiseScripts.Tool.NextPop('MainHome', null, function () {
                RecView = [];
                RecView.push("MainHome");
                
                if(successFn){
                    successFn();
                }
                
            }, 'T');
        },
        goToProfile: function (NoCancel, successFn) {
            if(!MainHome.CheckNet()){
                return;
            }
            
            //Log.write("goToProfile","MainHome goToProfile");
            $("#profile_ID").val(localStorage.UserID);
            var UserID=localStorage.UserID;
            if (NetStatusFn.getNetFlag()) {//有網路狀態
                if(NoCancel){ //第一次登入需檢查必填
                    WiseScripts.Tool.NoBack = true;
                    WiseScripts.Tool.NoBackMsg = $.i18n('請輸入必要資訊');
                    //$("#Profile_Cancel").hide();
                }

                WiseScripts.Tool.ShowLoading(false, '', '',function () {
                    WiseScripts.Tool.ShowLoading(true, $.i18n('同步使用者資料中..'));

                    Member.GetUserData(UserID,function (UserInfo) {
                        if(UserInfo.Gender=="M"){
                            $("#profile_s1").prop("checked", true);
                            $("#profile_s2_lab").removeClass("active");
                            $("#profile_s1_lab").addClass("active");
                        }else if(UserInfo.Gender=="F"){
                            $("#profile_s2").prop("checked", true);
                            $("#profile_s1_lab").removeClass("active");
                            $("#profile_s2_lab").addClass("active");
                        }

                        var Bir=UserInfo.Bir;
                        if (Bir) {
                            if (Bir.length == 8) {
                                Bir = Bir.insert(6, "-");
                                Bir = Bir.insert(4, "-");
                            }
                        }

                        $("#txtNickName").val(UserInfo.NickName); //TODO
                        var Zipcode = UserInfo.Zipcode;
                        FnGeo.setZipcode("profile_twZipcode", Zipcode);

                        if ($("#profile_BIR").attr("type") === "date") {
                            $("#profile_BIR").val(Bir);
                        } else {
                            var age = Member.GetAgeByBrithday(Bir);
                            age = " (" + $.i18n('$1歲', age) + ")";
                            $("#profile_BIR").val(Bir + age);
                        }

                        $("#profile_tall").val(UserInfo.Height);
                        if(localStorage["TargetW_" + UserID]){
                            $("#profile_tgW").val(localStorage["TargetW_" + UserID]);
                        }else{
                            $("#profile_tgW").val("");
                        }
                        
                        //TODO
                        if(UserInfo.PID){
                            $("#divProfile_PID").show();
                            $("#profile_PID").val(UserInfo.PID);
                        }else{
                            $("#divProfile_PID").hide();
                            $("#profile_PID").val("");
                        }
                        // MainHome.UpdateUserData(function(){ //successFn
                        //     if(successFn){
                        //         successFn();
                        //     }
                        // }); //TODO
                        WiseScripts.Tool.ShowLoading(false);
                        if (AppConfig.lMType.indexOf("BW") > -1) {
                            FnCtrl.focus("profile_tgW");
                        }
                    });
                },function(){//失敗
                    WiseScripts.Tool.ShowLoading(false);
                });
            }
            else {
                if (localStorage["Gender_" + UserID] == "M") {
                    $("#profile_s1").prop("checked", true);
                    $("#profile_s2_lab").removeClass("active");
                    $("#profile_s1_lab").addClass("active");
                }

                if (localStorage["Gender_" + UserID] == "F") {
                    $("#profile_s2").prop("checked", true);
                    $("#profile_s1_lab").removeClass("active");
                    $("#profile_s2_lab").addClass("active");
                }

                var Bir = localStorage["Bir_" + UserID];
                if (Bir.length == 8) {
                    Bir = Bir.insert(6, "-");
                    Bir = Bir.insert(4, "-");
                }

                $("#txtNickName").val(localStorage["NickName_" + UserID]); //TODO
                var Zipcode = localStorage["Zipcode_" + UserID];
                FnGeo.setZipcode("profile_twZipcode", Zipcode);

                if ($("#profile_BIR").attr("type") === "date") {
                    $("#profile_BIR").val(Bir);
                } else {
                    var age = Member.GetAgeByBrithday(Bir);
                    age = " (" + $.i18n('$1歲', age) + ")";
                    $("#profile_BIR").val(Bir + age);
                }
                
                $("#profile_tall").val(localStorage["Height_" + UserID]);
                $("#profile_tgW").val(localStorage["TargetW_" + UserID]);

                //$("#Profile_Cancel").show();
            }
            
            WiseScripts.Tool.NextPop('profile', function(){
                if(successFn){
                    successFn();
                }
            }, null, "T");
        },
        goToSetting: function () {
            MainHome.fadeOutPage('Setting');
            WiseScripts.Tool.NextPop('Setting', null, null, 'T');
        },
        goToDeviceINS: function () {
            WiseScripts.Tool.NextPop('Instructions', function(){
                FnDeviceINS.showByGroup("");
            }, null, 'T');
        },
        goToStandardInfo: function () {
            WiseScripts.Tool.NextPop('StandardInfo', function(){
                FnDeviceINS.showByGroup("");
            }, null, 'T');
        },
        goToPoints: function () {
            if(!MainHome.CheckNet()){
                return;
            }

            WiseScripts.Tool.NextPop('Points', function(){
                FnPoint.showPointList();
            }, null, 'T');
        },
        goToProducts: function () {
            if(!MainHome.CheckNet()){
                return;
            }

            WiseScripts.Tool.NextPop('Products', function(){
                FnProduct.showProductList();
            }, null, 'T');
        },
        goToMeasureScan: function () {
            if(!MainHome.CheckNet()){
                return;
            }

            $("#" + MeasureScan.txtCheckCodeId).val("");
            WiseScripts.Tool.NextPop('divMeasureScan', function(){
                
            }, null, 'F');
        },
        goToTimenotice: function () {
            // MainHome.fadeOutPage('Timenotice');
            WiseScripts.Tool.ShowLoading(true);

            LocalNotify.init(function(){
                WiseScripts.Tool.NextPop('Timenotice', function() {
                    WiseScripts.Tool.ShowLoading(false);
                }, function() {
                    WiseScripts.Tool.ShowLoading(false);
                }, 'T');
            });
        },
        goToTalk: function () {
            // MainHome.fadeOutPage('goToTalk');
            //WiseScripts.Tool.ShowLoading(true);
            ChatRoom.showChatList(function () {
                WiseScripts.Tool.NextPop('Talk', function () {
                    WiseScripts.Tool.ShowLoading(false);
                }, function () {
                    WiseScripts.Tool.ShowLoading(false);
                }, 'T');
            });

        },
        fadeOutPage: function (mainHomeLocation, NoAnim) {
            switch (mainHomeLocation) {
                case 'Home':
                    sessionStorage.mainHomeLocation = 'Home';

                    if (NoAnim) {
                        $("#MemberPage").hide();
                        $("#MainHomeDiv").show();
                    }
                    else {
                        $("#MemberPage").fadeOut();
                        $("#MainHomeDiv").fadeIn();
                    }

                    break;
                case 'MemberPage':
                    sessionStorage.mainHomeLocation = 'MemberPage';
                    $("#MainHomeDiv").fadeOut();
                    $("#MemberPage").fadeIn();
                    break;
                case 'Message':

                    break;
                case 'Setting':
                    sessionStorage.mainHomeLocation = 'Setting';
                    break;
            }
        },
        //推播
        // GoToMessage: function () {
        //     $("#LoadingText").html("訊息同步中....");
        //     MainHome.ShowMsg();
        //     $("#MsgList").html("<center><a style='font-size:120%;font-family:Microsoft JhengHei;'><br><br>尚無任何訊息<br><br></a></center>");

        //     WiseScripts.Tool.NextPop('Message', null, null, "T");
        // },
        // ShowMsg: function () {
        //     if (!localStorage["PushMessages"])
        //         return;

        //     if (localStorage["UnReadCount_" + localStorage.UserID])
        //         Count = parseInt(localStorage["UnReadCount_" + localStorage.UserID]);

        //     if (localStorage["UnReadIDs_" + localStorage.UserID])
        //         UnReadIDs = JSON.parse(localStorage["UnReadIDs_" + localStorage.UserID]);

        //     if (localStorage["ReadIDs_" + localStorage.UserID])
        //         ReadIDs = JSON.parse(localStorage["ReadIDs_" + localStorage.UserID]);

        //     var obj = JSON.parse(localStorage["PushMessages"]);

        //     var TheOpenI = -1;

        //     var HTML = "<table style='width:100%;'>";


        //     for (var i = 0; i < obj.length; i++) {

        //         var MoreTxt = "";
        //         if (obj[i].URL.length > 1) {
        //             if (obj[i].MsgType == "1")
        //                 MoreTxt = "<a style='color:blue' onclick='parent.OpenURL(\"" + obj[i].URL + "\");'>宣導影片&#62; &#62;</a>";
        //             else
        //                 MoreTxt = "<a style='color:blue' onclick='parent.OpenURL(\"" + obj[i].URL + "\");'>閱讀全文&#62; &#62;</a>";
        //         }

        //         var BgColor1 = "#F3D165";
        //         var BgColor2 = "#FFF8E5";

        //         if (obj[i].MsgType == "1") {
        //             BgColor1 = "#B3DC90";
        //             BgColor2 = "#EAF8DF";
        //         }

        //         var Display = "none";

        //         if (TheOpenIndex == obj[i].ID)
        //             TheOpenI = i;

        //         var RedBall = ""
        //         var UnReadHTML = "";

        //         if (obj[i].IsRead == 'N')
        //             RedBall = "_redball";

        //         HTML += "<tr onclick='ToggleMsg(\"" + obj[i].ID + "\",\"" + i + "\");'><td style='border-top:1px #B0BCA8 solid;width:80px;background-color:" +
        //             BgColor1 + ";vertical-align: text-top;'><img id='img_" + obj[i].ID + "' src='images/PushMsgType" + obj[i].MsgType + RedBall + ".jpg' style='width:80px;'></td>";

        //         HTML += "<td style='border-top:1px gray solid;'><div style='margin:10px;'><font color=gray>" +//vertical-align:top
        //             obj[i].SendDate.substr(0, obj[i].SendDate.length - 3) + "</font><br><div style='font-size:120%;font-family:Microsoft JhengHei'>"
        //             + obj[i].Title + "</div></div></td></tr>";

        //         HTML += "<tr id='tr_" + obj[i].ID + "' style='display:" + Display +
        //             ";'><td style='border-bottom:1px #B0BCA8 solid;width:80px;background-color:"
        //             + BgColor1 + "'></td><td style='border-top:1px #B0BCA8 solid;border-bottom:1px #B0BCA8 solid;background-color:"
        //             + BgColor2 + ";font-size:120%;font-family:Microsoft JhengHei;vertical-align:top'><div id='div_" + obj[i].ID + "' style='margin:10px;display:" + Display + "'>" + obj[i].Message + "<br><br> "
        //             + MoreTxt + "<br><br></div></td></tr>";

        //         HTML += UnReadHTML;
        //     }

        //     HTML += "</table>";

        //     if (obj.length > 0)
        //         $("#MsgList").html(HTML);
        //     else
        //         $("#MsgList").html("<center><a style='font-size:120%;font-family:Microsoft JhengHei;'><br><br>尚無任何訊息<br><br></a></center>");

        //     if (ScrollPosition != 0) {
        //         document.body.scrollTop = ScrollPosition;
        //     }

        //     if (TheOpenIndex >= 0) {
        //         DoOpenWork(TheOpenIndex, TheOpenI, 'YES');
        //         //parent.WSCall.StationService.MsgRead(localStorage.UserID, sessionStorage["UserType"]);
        //     }
        // },
        // DoOpenWork: function (Inx, i, NoAnimate) {
        //     var Speed = 400;

        //     if (NoAnimate == 'YES')
        //         Speed = 1;

        //     $("#tr_" + Inx).show();
        //     $("#div_" + Inx).animate({
        //         height: "toggle",
        //         opacity: "toggle"
        //     }, Speed);

        //     var UnReadPtr = $.inArray(parseInt(Inx), UnReadIDs);
        //     var ReadPtr = $.inArray(parseInt(Inx), ReadIDs);

        //     if (UnReadPtr != -1) {
        //         var obj = JSON.parse(localStorage["PushMessages"]);
        //         obj[i].IsRead = 'Y';

        //         localStorage.setItem("PushMessages", JSON.stringify(obj));

        //         UnReadIDs.splice(UnReadPtr, 1);

        //         Count--;

        //         if (Count < 1)
        //             Count = 0;

        //         if (Count == 0) {
        //             parent.$("#NewMsg").hide();
        //             parent.$(".mesnumber").hide();
        //             parent.cordova.plugins.notification.badge.clear();

        //         }
        //         else {
        //             parent.$("#NewMsg").show();
        //             parent.$(".mesnumber").show();
        //             parent.$(".mesnumber").text(Count);
        //             parent.$("#NewMsg").html(Count);
        //             parent.cordova.plugins.notification.badge.set(Count);
        //         }

        //         $("#img_" + Inx).prop('src', $("#img_" + Inx).prop('src').replace('_redball', ''));

        //         localStorage["UnReadCount_" + localStorage.UserID] = Count;
        //         localStorage["UnReadIDs_" + localStorage.UserID] = JSON.stringify(UnReadIDs);

        //         //parent.WSCall.StationService.UpdateBadge(Count);
        //     }


        //     if (ReadPtr == -1) {
        //         ReadIDs.push(parseInt(Inx));
        //         localStorage["ReadIDs_" + localStorage.UserID] = JSON.stringify(ReadIDs);
        //     }
        // },
        // GetPushMsg_Failed: function (UserID, Type, callback) {
        //     navigator.notification.confirm(
        //         '無法取得通知訊息，請確認網路連線是否正常？',
        //         function (button) {
        //             if (button == 1) {
        //                 //WSCall.StationService.GetPushMessage(UserID, Type, true, callback);
        //             }
        //             else {
        //                 $("#LoadingText").hide();
        //                 //$("#iframebox").contents().find("#LoadingText").hide();
        //                 //ColorBoxClose();
        //             }
        //         },
        //         $.i18n('系統訊息'),
        //         '重試,取消');
        // },
        // RegisterPush: function () {
        //     Log.write("Registing Push");
        //     //alert("Registing Push");

        //     push = PushNotification.init({
        //         android: {
        //             senderID: "860852166098",
        //             "icon": "push_icon",
        //             "iconColor": "lightgrey"
        //         },
        //         ios: {
        //             alert: "true",
        //             badge: true,
        //             sound: 'true'
        //         }
        //     });

        //     push.on('registration', function (data) {

        //         //alert('token:' + data.registrationId);

        //         console.log('token:' + data.registrationId);
        //         localStorage["PushID"] = data.registrationId;
        //         /*
        //         if (WiseScripts.Tool.MobileType.IsAndroid()) {
        //             SaveToken(ProjectFn.SerialToString(device.serial), data.registrationId);
        //         }
        //         else {
        //             window.plugins.uniqueDeviceID.get(
        //             function (serialID) {
        //                 SaveToken(serialID, data.registrationId);
        //             });
        //         }
        //         */
        //     });

        //     push.on('error', function (e) {
        //         console.log(e.message);
        //         //alert(e.message);
        //         setTimeout(function () {
        //             console.log("Retry");
        //             RegisterPush();
        //         }, 1000);
        //     });

        //     //註冊收到推播的事件
        //     push.on('notification', function (data) {

        //         //前景收到時
        //         if (!data.additionalData.foreground) {
        //             if (data.additionalData.coldstart) {

        //                 if (localStorage.UserID)
        //                     if (localStorage.UserID != "") {
        //                         TryTimes = 10;
        //                         AppColdStart(data.additionalData.key);
        //                     }
        //             }
        //             else {

        //                 if (localStorage.UserID)
        //                     if (localStorage.UserID != "")
        //                         //眺轉到對話視窗
        //                         OpenMessage(data.additionalData.key);
        //             }

        //         }
        //         else {

        //             if (WiseScripts.Tool.MobileType.IsiOS())
        //                 window.plugins.toast.showShortBottom("新訊息通知：" + data.additionalData.title, null, null);
        //             else
        //                 window.plugins.toast.showShortBottom("新訊息通知：" + data.title, null, null);

        //             var Count = 0;
        //             if (localStorage["UnReadCount_" + localStorage.UserID])
        //                 Count = parseInt(localStorage["UnReadCount_" + localStorage.UserID]);

        //             if (localStorage["UnReadIDs_" + localStorage.UserID])
        //                 UnReadIDs = JSON.parse(localStorage["UnReadIDs_" + localStorage.UserID]);

        //             UnReadIDs.push(parseInt(data.additionalData.key));

        //             localStorage["UnReadIDs_" + localStorage.UserID] = JSON.stringify(UnReadIDs);

        //             Count++;

        //             $(".mesnumber").text(Count);
        //             $("#NewMsg").html(Count);
        //             $("#NewMsg").show();
        //             $(".mesnumber").show();
        //             cordova.plugins.notification.badge.set(Count);

        //             if (localStorage.UserID && sessionStorage["UserType"]) {
        //                 // WSCall.StationService.GetPushMessage(localStorage.UserID, sessionStorage["UserType"], false, function () {
        //                 //     try {
        //                 //         document.getElementById('iframebox').contentWindow.ShowMsg();
        //                 //     }
        //                 //     catch (e) { }
        //                 // });
        //             }

        //         }
        //     });

        // },
    };

