var ChatList = ChatList||{},ChatList={
    targetID:"chatList", //綁定目標區塊
    groups:[{
        "name": "陳醫師0911",
        "id": "1",
        "key":'A730F73D-7A42-419E-A714-E865080E23F0',
        "count": "7",
        "lastMsg": " Micheal 本年度醫院督導考核合格率是多少本年度醫院多少本年度醫院...",
        "lastMsgTime":"2016-03-01 02:25",
        "imageData":"images/default_message.jpg"
    }, {
        "name": "吳醫師0909",
        "id": "2",
        'key':'C32AB824-EF01-4E25-AE28-82C0DC440931',
        "count": "20",
        "lastMsg": "報告局長 本年度合格率98%",
        "lastMsgTime":"2016-03-01 02:25",
        "imageData":"images/default_person.jpg"
    }],
    get:function() {
        return new Promise(function (resolve, reject) {
            $("#"+ChatList.targetID).html("");  
            var groups = ChatList.groups;
            //for(var j=0;j<10;j++){
            //    var key=j;
                for(var i=0;i<groups.length;i++){
                    var groupInfo= groups[i];
                    groupInfo.name=groupInfo.name;//+i.toString();
                    ChatList.bind(groupInfo);    
                }
            //}
            Log.write(groups,"chatlist get");
            resolve();
        });
    },
    getFriendList:function(successFn) {
        alert("123");
        ChatInfo.getUserKey().then(function(userKey){
            var UploadData={
                userID:localStorage.UserID,
                deviceId:AppConfig.EquipmentID 
            }
            var PostInfo = {
                Url: AppConfig.ChatServices + '/GetFriendList',
                UploadData: UploadData,
                async: true,
                ASKey1: AppConfig.ASKeyChat,
                ASKey2: AppConfig.ASKeyChat,
                deASKey1: AppConfig.ASKeyChat,
                deASKey2: userKey
            }
            WSCall.Post(PostInfo, function (result) { //成功
                successFn(result);
                alert(result);
            }, function (err) { //失敗
                FnCtrl.alert($.i18n('獲取雲端資料失敗'));
            })
        });

    },
    bind:function(groupInfo) {
        var divList=$("<div></div>")
        divList.addClass("list");
        divList.attr("onclick","ChatRoom.show('"+groupInfo.key+"','"+groupInfo.name+"','"+groupInfo.imageData+"');")

        var divIcon=$("<div></div>");
        divIcon.addClass("left");
        divIcon.html("<img src='"+groupInfo.imageData+"'/>");

        var divContent=$("<div></div>");
        divContent.addClass("center");
        divContent.append("<div>"+groupInfo.name+"</div>");
        divContent.append("<p>"+groupInfo.lastMsg+"</p>");

        var divRight = $("<div></div>");
        divRight.addClass("right");
        //alert(moment(chatInfo.lastMsgTime).format("MM/DD HH:mm"));
        divRight.append("<div>" + moment(groupInfo.lastMsgTime).format("HH:mm") + "</div>");
        divRight.append("<span>"+groupInfo.count+"</span>");

        divList.append(divIcon)
               .append(divContent)
               .append(divRight);

        $("#"+ChatList.targetID).append(divList);            
    },
}