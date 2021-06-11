var ChatFriend = ChatFriend || {},ChatFriend ={
    show:function() {
        WiseScripts.Tool.NextPop("Talk_Friend_Add", function () {
            FnCtrl.focus('txtFriendID');
        }, null, 'F');
    },
    search:function () {
        var searchID = $("#txtFriendID").val();
        alert(searchID);
        var UData={
            searchID:searchID
        };
        $.ajax({
            url: AppConfig.ChatServices+"/searchFriend",
            data: UData,
            type: 'POST',
            timeout: 20000, // in milliseconds
            async: true,
            success: function (clsReturn) { //200:回傳值正常，進行後續動作
                $("#friendInfo").html(JSON.stringify(clsReturn));
                var btnAdd = $("<button></button>");
                btnAdd.attr({
                    type:"button",
                    onclick:"ChatFriend.add('"+clsReturn.U_ID+"','"+clsReturn.U_Name+"');"
                });
                btnAdd.addClass("form-control").text("加入");

                $("#friendInfo").append(btnAdd);
                // if (clsReturn.Code == '200') {
                //     WiseAES.decryptAES(clsReturn.Data, AppConfig.ASKey1, AppConfig.ASKey2, 'T',
                //         function (result) { //解密成功:後端系統正程運作
                //             if (successFn) {
                //                 successFn(result);
                //             }
                //         },
                //         function (errMsg) { //解密失敗:後端有系統性錯誤
                //             WSCall.errCallback(errMsg);
                //         });
                // } else { //400:不正確請求信息 500:流程出現錯誤
                //     WSCall.errCallback(clsReturn.Data);
                // }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                // WSCall.errCallback(thrownError, function () {
                //     if (errFn) {
                //         errFn();
                //     }
                // });
            }
        });
    },
    add:function(friendID,friendName) {
        alert(friendID+"friendName:"+friendName);
        var userChatID=ChatInfo.ID;
        alert(userChatID);
        var UData = {
            userID : userChatID,
            friendID : friendID
        };
        $.ajax({
            url: AppConfig.ChatServices+"/addFriend",
            data: UData,
            type: 'POST',
            timeout: 20000, // in milliseconds
            async: true,
            success: function (clsReturn) { //200:回傳值正常，進行後續動作
                alert(clsReturn);
                var groupInfo={
                    "name": friendName,
                    "id": "1",
                    "key":clsReturn,
                    "count": "7",
                    "lastMsg": " Micheal 本年度醫院督導考核合格率是多少本年度醫院多少本年度醫院...",
                    "lastMsgTime": moment().format("YYYY.MM.DD HH:mm"),
                    "imageData":"images/default_message.jpg"
                };
                ChatList.groups.push(groupInfo);
                ChatList.bind(groupInfo);
                // if (clsReturn.Code == '200') {
                //     WiseAES.decryptAES(clsReturn.Data, AppConfig.ASKey1, AppConfig.ASKey2, 'T',
                //         function (result) { //解密成功:後端系統正程運作
                            
                //             if (successFn) {
                //                 successFn(result);
                //             }
                //         },
                //         function (errMsg) { //解密失敗:後端有系統性錯誤
                //             WSCall.errCallback(errMsg);
                //         });
                // } else { //400:不正確請求信息 500:流程出現錯誤
                //     WSCall.errCallback(clsReturn.Data);
                // }
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