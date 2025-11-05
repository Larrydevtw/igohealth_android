//iOS：phonegap-plugin-push
//android： cordova-plugin-FCM
//查看OS：cordova-plugin-device 
var PushMsg = PushMsg || {}, PushMsg = {
    OS: "",
    init: function (UserID) {
        //alert("init");
        var OS = DeviceInfo.OS;
        ChatInfo.ID= UserID;
        //alert(OS);
        if (OS) {
            PushMsg.OS = OS;
        }
        //Log.alert(OS);
        if (OS === "android") {
            PushMsg.init_Android(UserID);
        } else {
            PushMsg.init_iOS(UserID);
        }
    },
    init_iOS: function (UserID) {
        //alert('PushNotification.init');
        try {
            const push = PushNotification.init({
                android: {
                    senderID: "417582916445",
                    "icon": "push_icon",
                    "iconColor": "lightgrey"
                },
                ios: {
                    alert: "true",
                    badge: true,
                    sound: 'true'
                }
            });
            //alert('registration');

            push.on('registration', function (data) {
                Log.alert('token:' + data.registrationId);
                Log.write('token:' + data.registrationId);
                var token = data.registrationId;
                var deviceSerial = "";

                localStorage["PushID"] = data.registrationId;

                var deviceID = device.uuid;
                Log.alert(deviceID);
                PushMsg.SaveToken(deviceID, token, UserID, function () {
                    Log.alert("SaveToken Success");
                    if (successFn) {
                        successFn();
                    }
                });

                // ProjectFn.Wait([function (next) {

                // }], function () {


                // });
            });

            //註冊收到推播的事件
            push.on('notification', function (data) {
                Log.alert(JSON.stringify(data));
                console.log(JSON.stringify(data));
                var key = 1;
                var foreground = data.additionalData.foreground; //true/false
                var coldstart = data.additionalData.coldstart; //true/false
                var title = "";
                var message = "";
                var count = 0;
                var sound = "default"; //default

                if (data.additionalData.key) {//來自推播訊息
                    key = data.additionalData.key;
                    title = data.title;
                    message = data.message;
                    count = data.count;
                    sound = data.sound; //default
                } else {//來自本機提醒
                    key = data.additionalData.id;
                    title = data.additionalData.title;
                    message = data.additionalData.text;
                }
                var UserID = localStorage.UserID != null ? localStorage.UserID : "";
                Log.alert("key:" + key + " ,title:" + title + " ,foreground:" + foreground + " ,coldstart:" + coldstart + " ,message:" + message + " ,count:" + count + " ,sound:" + sound);
                if (coldstart) { //前景收到時
                    PushMsg.OpenMessage(key);//轉到對話視窗     
                }
                else {
                    navigator.notification.alert(message, null, title, "OK");
                    // var Count = 0;
                    // var UnReadIDs;
                    // if (localStorage["UnReadCount_" + UserID])
                    //     Count = parseInt(localStorage["UnReadCount_" + UserID]);

                    // if (localStorage["UnReadIDs_" + UserID])
                    //     UnReadIDs = JSON.parse(localStorage["UnReadIDs_" + UserID]);

                    // UnReadIDs.push(parseInt(key));
                    // localStorage["UnReadIDs_" + UserID] = JSON.stringify(UnReadIDs);
                    // //alert(localStorage["UnReadIDs_" + UserID]);
                    // Count++;

                    // $(".mesnumber").text(Count);
                    // $("#NewMsg").html(Count);
                    // $("#NewMsg").show();
                    // $(".mesnumber").show();
                    // cordova.plugins.notification.badge.set(Count);

                    //if (localStorage.UserID && sessionStorage["MType"]) {
                    //    WSCall.StationService.GetPushMessage(localStorage.UserID, sessionStorage["MType"], false, function () {
                    //        try {
                    //            document.getElementById('iframebox').contentWindow.ShowMsg();
                    //        }
                    //        catch (e) { }
                    //    });
                    //}

                }

            });

            push.on('error', function (e) {
                alert(e.message);
                //alert(e.message);
                setTimeout(function () {
                    console.log("Retry");
                }, 1000);
            });
        } catch (e) {
            alert(e);
        }

    },
    init_Android: function (UserID) {
        Log.alert("init；UserID: " + UserID)
        if (!UserID) {
            Log.alert("UserID 離開");
            return;
        }

        FCMPlugin.getToken(function (token) {
            Log.write("token: " + token + "\ndevice: " + device.serial,"push token");
            Log.alert(token);
            PushMsg.SaveToken(device.serial, token, UserID, function () {
                Log.alert("SaveToken Success");
            });
        });
        
        FCMPlugin.onNotification(function (data) {
            //alert(JSON.stringify(data));
            console.log(JSON.stringify(data));
            var key = data.key;
            var wasTapped = data.wasTapped; //true/false
            //var coldstart = data.additionalData.coldstart; //true/false
            var userName = data.title;
            var message = data.body;
            var msgType=data.msgType;
            var groupID=data.groupID;
            var action =data.action;
            var userIcon =data.userIcon;
            var time =data.time;
            var count = 0;
            var sound = data.sound; //default
            // PushMsg.GetPushMsg_Latest(localStorage.UserID, "M", function (msg) {
            //     navigator.notification.alert(msg, null, "訊息通知", "系統訊息");
            // });
            var chatInfo={
                icon:userIcon,
                name:userName,
                msgType:msgType,
                contentVal:message,
                time:time
            }
            if (wasTapped) {
                //Notification was received on device tray and tapped by the user.
                //alert("tapped");
                Log.write(JSON.stringify(data));
                //alert(action);
                if(action==="chat"){
                    ChatRoom.receiveMsg(groupID,userName,userIcon,chatInfo);
                }
            } else {
                //Notification was received in foreground. Maybe the user needs to be notified.
                if(action==="chat"){
                    ChatRoom.receiveMsg(groupID,userName,userIcon,chatInfo);
                }else{
                    navigator.notification.alert(message, null, title, "OK");
                }
                Log.write(JSON.stringify(data));
            }
        }, function (msg) { //FCM註冊成功
            Log.alert(msg+"FCMPlugin.onNotification");
            Log.write(msg, "PushMsg init");
        });
    },
    SaveToken: function (SID, PID, UserID, successFn) {//Token SID:,PID:TOKEN
        var DType = PushMsg.OS;

        //Log.alert("SaveTokenS");
        var UploadData = {
            'SID': encodeURI(SID),
            'token': encodeURI(PID),
            'DType': encodeURI(DType),
            'EID': encodeURI(UserID)
        };
        var ASKey1 = AppConfig.ASKeyChat;
        var ASKey2 =AppConfig.ASKeyChat; //TODO
        // if(localStorage.UserKey){
        //     ASKey2= localStorage.UserKey;
        // };
        //alert(ASKey2);
        var PostInfo = {
            Url: AppConfig.ChatServices + '/SaveToken',
            UploadData: UploadData,
            async: true,
            ASKey1: ASKey1,
            ASKey2: ASKey2
        };
        WSCall.Post(PostInfo, function (result) { //成功
            alert("TOKEN"+result);
            var params=JSON.parse(result);
            alert("params:"+params);
            var U_ID =  ChatInfo.ID;
            if(params){   
                params.U_ID = U_ID;
                params.UP_Date = moment().format("YYYY-MM-DD HH:mm:ss");
  
                //localStorage.UserKey = params.UD_Key;
                //alert("New "+localStorage.UserKey);

                ChatList.getFriendList(function () {
                    alert("success");
                });

                DAOFn.SimpleMerge('', 'ChatUserInfo', params, 'U_ID',U_ID,'', 
                    function ResultFun(result) {
                        alert("success"+result);
                    }
                );
            }else{
                Log.alert('Token資訊已是最新','PushMsg Token');
                ChatList.getFriendList(function(){
                    alert("success");
                })
                // var strSql ="Select UD_Key ChatUserInfo where U_ID ='"+U_ID+"';"; 
                // DAOFn.Query('', strSql, function ResultFun(result) {
                //     var objList = $.parseJSON(result);
                //     if (objList.length == 0) {
                //         Log.write('無資料');
                //     } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                //         Log.write('查詢錯誤');
                //     } else {
                //         Log.write('有資料');
                //         localStorage.UserKey=objList[0].UD_Key;
                //         alert("Token資訊已是最新"+localStorage.UserKey);    
                //     }
                // });
            }
 
            successFn(result);
        }, function (err) { //失敗
            FnCtrl.alert($.i18n('獲取雲端資料失敗'));
        })

        // Log.alert(AppConfig.AppServices);
        // //Log.alert(JSON.stringify(postData));
        // window.ajax = $.ajax({
        //     url: AppConfig.AppServices+"/SaveToken",
        //     type: "POST", //Request type
        //     //dataType: "json", 
        //     async: "false",
        //     data: postData,
        //     success: function (result) {
        //         Log.alert("成功");
        //         if (successFn) {
        //             successFn();
        //         }
        //     },
        //     error: function (xhr, status, err) {
        //         Log.alert("Cancel Executing Query ! " + err);
        //     }
        // });

    },

    GetPushMsg_Latest: function (UserID, Type, successFn) {
        if (!Type) {
            Type = "M";  //C:卡片 M:會員
        }
        WiseAES.enpryptAES(UserID, AppConfig.ASKey1, AppConfig.ASKey2, "T",
            function (result) {
                $.ajax({
                    type: "POST",
                    url: AppConfig.AppServices,
                    data: 'UserID=' + encodeURI(result) + '&Mtype=' + Type + '&type=GetPushMsg_Latest',
                    timeout: 10000, // in milliseconds
                    success: function (result) {
                        Log.write(result, "GetPushMsg_Latest");

                        var _msgInfo = JSON.parse(result);
                        var msgInfo = _msgInfo[0];

                        var url = msgInfo.URL;
                        var msg = msgInfo.Message;
                        var msgType = msgInfo.MsgType;  //0:文章 1:影片網址

                        if (msgType == "0") {
                            if (successFn)
                                successFn(msg);
                        }
                    },
                    error: function (request, status, err) {
                        Lor.Write(request, "GetPushMsg_Latest err");
                    }
                });
            });
    },
    AppColdStart: function (Key) {
        if (localStorage["UserID"] != "")
            //眺轉到對話視窗
            OpenMessage(Key);
        else {
            TryTimes--;
            if (TryTimes > 0) {
                setTimeout(AppColdStart, 1000);
            }
        }
    },
    OpenMessage: function (Key) {
        //alert(Key);
        // if ($('#ulSet:visible').length > 0) {
        //     $('#ulSet').hide();
        // }

        // $('#responsive').modal("show");
        // if (Key)
        //     ColorBoxOpen("Message.html?Key=" + Key);
        // else
        //     ColorBoxOpen("Message.html");
    }
}