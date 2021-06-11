/*
 * 用途: 聊天室
 * 使用套件: cordova-plugin-camera
 * 需搭配PushMsg.js
 */

var ChatRoom = ChatRoom || {},
    ChatRoom = {
        icon: "",
        name: "",
        groupKey:"",
        show: function (groupKey, fromChatName, icon, messageInfo) {
            FnBT.StopScan();
            ChatRoom.groupKey=groupKey;
            var currentPage = RecView[RecView.length - 1];
            console.log(currentPage);
            $("#chatRoomTitle").text(fromChatName);
            if (icon) {
                ChatRoom.icon = icon;
            } else {
                ChatRoom.icon = "images/default_message.jpg";
            }
            ChatRoom.name = fromChatName;
            if (currentPage === "Talk_on") {
                ChatRoom.receive(messageInfo.msgType, messageInfo,function(){
                    ChatRoom.scroll2Buttom();
                });
            } else {
                WiseScripts.Tool.ShowLoading(true);
                Log.write(currentPage, "chatRoom currentPage");
                WiseScripts.Tool.NextPop('Talk_on', function () {
                    ChatRoom.bindChatHistory().then(function () {
                        if (messageInfo) { //currentPage === "Talk_on") {
                            ChatRoom.receive(messageInfo.msgType, messageInfo,function(){
                                ChatRoom.scroll2Buttom();
                            });
                        }else{
                            ChatRoom.scroll2Buttom();
                        }
                        WiseScripts.Tool.ShowLoading(false);
                    });
                }, function () {
                    WiseScripts.Tool.ShowLoading(false);
                }, 'T');

            }

        },
        receiveMsg: function (roomID, fromChatName, icon, messageInfo) {
            FnBT.StopScan();
            var currentPage = RecView[RecView.length - 1];
            console.log(currentPage);

            if (currentPage === "Talk_on") {
                ChatRoom.receive(messageInfo.msgType, messageInfo,function(){
                    ChatRoom.scroll2Buttom();
                });
            } else {
                WiseScripts.Tool.ShowLoading(true);
                Log.write(currentPage, "chatRoom currentPage");
                WiseScripts.Tool.NextPop('Talk_on', function () {
                    ChatRoom.bindChatHistory().then(function () {
                        if (messageInfo) { //currentPage === "Talk_on") {
                            ChatRoom.receive(messageInfo.msgType, messageInfo,function(){
                                ChatRoom.scroll2Buttom();
                            });
                        }else{
                            ChatRoom.scroll2Buttom();
                        }
                        WiseScripts.Tool.ShowLoading(false);
                    });
                }, function () {
                    WiseScripts.Tool.ShowLoading(false);
                }, 'T');

            }

        },
        showChatList: function (successFn) {
            ChatList.get().then(function () {
                Log.write("bind chatlist success");
                if (successFn) {
                    successFn();
                }
            });

        },
        toggleMenu2: function () { //TODO 未來擴充功能使用
            if ($("#menu2").is(":hidden")) {
                $("#aMenu2").html("<i class='wise_cross'></i>"); //ICON圖示切換 為wise_cross       
                WiseScripts.Tool.NoBack = true;
            } else {
                $("#aMenu2").html("<i class='wise_plus'></i>"); //ICON圖示切換 為wise_plus       
                WiseScripts.Tool.NoBack = false;
            }

            $("#menu2").fadeToggle();
        },
        bindChatHistory: function () {
            $("#chatRoomBody").html("");
            return new Promise(function (resolve, reject) {
                var lChatContents = [{
                    area: "A",
                    msgType: "text",
                    icon: "",
                    name: "Micheal",
                    contentVal: "本年度醫院督導考核合格率是多少 本年度醫院督導考核合格率是多少？",
                    time: "13:52"
                }, {
                    area: "B",
                    msgType: "text",
                    icon: "images/push_icon.png",
                    name: "吳醫師",
                    contentVal: "本年度醫院督導考核合格率是多少？",
                    time: "13:51"
                }, {
                    area: "A",
                    msgType: "text",
                    icon: "",
                    name: "Micheal",
                    contentVal: "本年度醫院督導考核合格率是多少 本年度醫院督導考核合格率是多少？",
                    time: "13:53"
                }, {
                    area: "B",
                    msgType: "text",
                    icon: "images/push_icon.png",
                    name: "吳醫師",
                    contentVal: "本年度醫院督導考核合格率是多少 本年度醫院督導考核合格率是多少？",
                    time: "13:55"
                }, {
                    area: "A",
                    msgType: "text",
                    icon: "",
                    name: "Micheal",
                    contentVal: "本年度醫院督導考核合格率是多少 本年度醫院督導考核合格率是多少？",
                    time: "13:58"
                }, {
                    area: "A",
                    msgType: "text",
                    icon: "",
                    name: "Micheal",
                    contentVal: "本年度醫院督導考核合格率是多少 本年度醫院督導考核合格率是多少？",
                    time: "13:58"
                }, {
                    area: "A",
                    msgType: "text",
                    icon: "",
                    name: "Micheal",
                    contentVal: "本年度醫院督導考核合格率是多少 本年度醫院督導考核合格率是多少？",
                    time: "13:58"
                }];

                for (var i = 0; i < lChatContents.length; i++) {
                    var messageInfo = lChatContents[i];
                    if (messageInfo.area === "A") {
                        ChatRoom.send(messageInfo.msgType, messageInfo);
                    } else {
                        ChatRoom.receive(messageInfo.msgType, messageInfo);
                    }
                };
                resolve();
            });

        },
        takePicture: function () { //拍照
            WiseScripts.Tool.ShowLoading(true, $.i18n("照片處理中.."));
            FnPicture.take("", function (imageData) {
                ChatRoom.sendImage(imageData);
                WiseScripts.Tool.ShowLoading(false);
            });
        },
        selectPicture: function () { //選照片
            WiseScripts.Tool.ShowLoading(true, $.i18n("照片處理中.."));
            FnPicture.select("", function (imageData) {
                ChatRoom.sendImage(imageData);
                // jQuery('#ImgPhoto').nailthumb({
                //     width: parent.IconViewSize,
                //     height: parent.IconViewSize
                // });
                WiseScripts.Tool.ShowLoading(false);
            });
        },
        sendMsg: function () {
            var messageInfo = {
                icon: ChatRoom.icon,
                name: ChatRoom.name,
                contentVal: $("#txtSendMsg").val(),
                time: moment().format("HH:mm")
            }
            ChatRoom.send("text", messageInfo,function(){
                FnCtrl.focus("txtSendMsg");
                // var UData={
                //     msgID:"11",
                //     title:ChatRoom.name,
                //     message:messageInfo.contentVal,
                //     msgType:"text",
                //     userKey:ChatRoom.groupKey
                // };
                //alert(JSON.stringify(UData));
                ChatRoom.insertSendQueue(messageInfo.contentVal,"text");              
            });
        },
        sendImage: function (dataImage) {
            var messageInfo = {
                icon: ChatRoom.icon,
                name: ChatRoom.name,
                contentVal: dataImage,
                time: moment().format("HH:mm")
            };
            console.log(dataImage);
            ChatRoom.send("image", messageInfo,function(){
                ChatRoom.scroll2Buttom();                
            });
        },
        sendFile: function () {
            var messageInfo = {
                icon: ChatRoom.icon,
                name: ChatRoom.name,
                contentVal: $("#txtSendMsg").val(),
                time: moment().format("HH:mm")
            }
            ChatRoom.send("file", messageInfo);
        },

        send: function (msgType, messageInfo,successFn) {
            console.log("SEND:" + JSON.stringify(messageInfo));
            
            var divArea = $("<div></div>");
            divArea.addClass("areaA");

            var divTime = $("<p></p>");
            //alert(moment().format("HH:mm"));
            divTime.html("<span>" + messageInfo.time + "</span>");

            var divRight = $("<div></div>");
            divRight.addClass("right");

            var divContent = $("<div></div>");
            var contentVal = messageInfo.contentVal;
            switch (msgType) {
                case "text":
                    divContent.addClass("text");
                    divContent.html(contentVal);
                    $("#txtSendMsg").val("");
                    break;
                case "image":
                    divContent.addClass("filebox");
                    divContent.html("<a><img src='" + contentVal + "' style='width:100%;'></a>");
                    break;
                case "file": //TODO
                    var fileIcon = "wise_paper";
                    var fileName = "簡報簡報.docx";
                    var filePath = "";
                    divContent.addClass("text");

                    divContent.append("<div class='L'><i class='" + fileIcon + "'></i></div>");
                    var divFile = $("<div></div>");
                    divFile.addClass("R");
                    divFile.append("<div>" + fileName + "</div>");
                    divFile.append("<div><a href='" + filePath + "'>" + $.i18n('下載') + "</a></div>")
                    break;
            }

            divRight.append(divTime)
                .append(divContent);

            divArea.append(divRight);
  
            $("#chatRoomBody").append(divArea);

            if(successFn){
                successFn();
            }
            //ChatRoom.scroll2Buttom();
        },
        receive: function (msgType, messageInfo,successFn) {
            console.log("receive:" + JSON.stringify(messageInfo));
            var divArea = $("<div></div>");
            divArea.addClass("areaB");

            var divIcon = $("<div></div>");
            divIcon.addClass("left");
            var icon = messageInfo.icon; //"images/push_icon.png";
            divIcon.html("<img src='" + icon + "'>");

            var divRight = $("<div></div>");
            divRight.addClass("right");

            var userName = messageInfo.name; //"Michael";
            var divUser = $("<span></span>");
            divUser.addClass("name");
            divUser.text(userName);

            var divContent = $("<div></div>");
            var contentVal = messageInfo.contentVal;
            switch (msgType) {
                case "text":
                    divContent.addClass("text");
                    contentVal = Display.showText(contentVal);
                    divContent.html(contentVal);
                    // $("#txtSendMsg").val("");
                    break;
                case "image":
                    divContent.addClass("filebox");
                    divContent.html("<a href='"+contentVal+"'><img src='" + contentVal + "' style='width:100%;'></a>");
                    break;
                case "url":
                    divContent.addClass("text");
                    var urlText = Display.showText(contentVal);
                    divContent.html("<a href='"+contentVal+"'>"+urlText+"</a>");
                    break;
            }

            var divTime = $("<p></p>");
            divTime.html("<span>" + moment().format("HH:mm") + "</span>");

            divRight.append(divUser)
                .append(divContent)
                .append(divTime);

            divArea.append(divIcon)
                .append(divRight);

            $("#chatRoomBody").append(divArea);
            if(successFn){
                successFn();
            }
        },
        scroll2Buttom: function () {
            //alert("scroll2Buttom");
            var scrollHeight = $('#chatRoomBody').prop("scrollHeight");
            $('#chatRoomBody').animate({
                scrollTop: scrollHeight
            }, 400);
        },
        insertSendQueue:function(contentVal,msgType){
            var UData = {
                title:"",
                message:contentVal,
                groupKey : ChatRoom.groupKey,
                userID:ChatInfo.ID,
                msgType:msgType
            };
            alert(JSON.stringify(UData));
            $.ajax({
                url: AppConfig.ChatServices+"/sendMsg",
                data: UData,
                type: 'POST',
                timeout: 20000, // in milliseconds
                async: true,
                success: function (clsReturn) { //200:回傳值正常，進行後續動作
                    if (clsReturn.Code == '200') {
                        WiseAES.decryptAES(clsReturn.Data, AppConfig.ASKey1, AppConfig.ASKey2, 'T',
                            function (result) { //解密成功:後端系統正程運作
                                
                                if (successFn) {
                                    successFn(result);
                                }
                            },
                            function (errMsg) { //解密失敗:後端有系統性錯誤
                                WSCall.errCallback(errMsg);
                            });
                    } else { //400:不正確請求信息 500:流程出現錯誤
                        WSCall.errCallback(clsReturn.Data);
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    WSCall.errCallback(thrownError, function () {
                        if (errFn) {
                            errFn();
                        }
                    });
                }
            });
        }
    }
// var divStatus='<div id="status-box">Server: <span id="status">-</span> / <span id="online">0</span> online.</div>';
// var divStatus='<div id="message_block"><ul id="messages"></ul></div>';
// var divStatus='<form action=""><input id="m" autocomplete="off" /><button>Send</button></form>';
// $('body').prepend(txtResult).prepend(txtDownload).prepend(btnTranslate).prepend(ddlToLocale).prepend("<h1>簡易聊天室測試 server:"+AppConfig.ChatServices+"</h1>");
// var userName = "";
// $(function () {
//   var status = $("#status");
//   var online = $("#online");

//   alert(AppConfig.ChatServices);
//   var socket = io.connect(AppConfig.ChatServices);//io();
//   userName = prompt("請輸入暱稱", "guest");
//   if (userName == "" || userName == null) {
//     userName = "guest";
//   }
//   socket.on("connect", function () {
//     console.log("connect");
//     status.html("Connected.");
//   });
//   //加入聊天
//   socket.emit("add user", userName);
//   socket.on('add user', function (data) {
//     if (userName === data.userName) {
//       appendMessage(data.userName + "您好!歡迎加入!");
//     } else {
//       appendMessage(data.userName + "已加入");
//     }
//   });

//   //監聽新訊息事件
//   socket.on('chat message', function (data) {
//     appendMessage(data.userName + ":" + data.msg);
//   });
//   //離開聊天
//   socket.on('user left', function (data) {
//     appendMessage(data.userName + "已離開");
//   });
//   socket.on("disconnect", function () {
//     console.log("disconnected");
//     status.html("Disconnected.");
//   });
//   socket.on("online", function (amount) {
//     console.log(amount);
//     online.html(amount);
//   });
//   $('form').submit(function () {
//     socket.emit('chat message', $('#m').val());
//     $('#m').val('');
//     return false;
//   });
//   //socket.on('say to someone', function (id, msg) {
//   //  console.log('123');
//   //  console.log(id);
//   //  socket.broadcast.to(id).emit('my message', msg);
//   //});
// });

// function appendMessage(msg) {
//   $('#messages').append($('<li>').text(msg));
//   var message = document.getElementById("message_block");
//   message.scrollTop = message.scrollHeight;

// }
