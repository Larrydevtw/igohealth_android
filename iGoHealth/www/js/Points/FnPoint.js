var FnPoint = {
    divTabId: ".points-tab",
    divPointInfoId: "divPointInfo",
    lPoinTotalId: ["txtPointTotal", "txtMainPointTotal", "aProductPointTotal"],
    PointListId: "divPointList",
    ExchangeListId: "divExchangeList",
    init: function () {
        var divTabId = FnPoint.divTabId;
        $(divTabId).on('click', 'ul li a', function () {
            $(divTabId + " ul li a").removeClass("active");
            $(this).addClass("active");

            var targetName = $(this).attr("name");
            var pointsId = FnPoint.PointListId;
            var exchangeId = FnPoint.ExchangeListId;
            switch (targetName) {
                case exchangeId:
                    $("#" + pointsId).hide();
                    $("#" + exchangeId).show();
                    break;
                default: //PointsList
                    $("#" + pointsId).show();
                    $("#" + exchangeId).hide();
                    break;
            }
           
        });
    },
    showInfo: function () {
        FnPoint.getPointInfoData(localStorage.UserID, function (result) {
            console.log(result);
            var obj = JSON.parse(result);
            FnPoint.bindDataInfo(obj).then(function(){
                WiseScripts.Tool.NextPop('Points_info', function () {
    
                }, null, 'T');
            });   
        }); 
    },
    showPointTotal: function () {
        var UserID = localStorage.UserID;
        FnPoint.getPointTotal(UserID, function (result) {
            FnPoint.BindPointTotal(result);
        });
    },
    bindDataInfo:function(arrPointRule){
        return new Promise(function(resolve,reject){
            var $divPointInfoId = $("#"+FnPoint.divPointInfoId);
            $divPointInfoId.html("");
    
            var tbClass = "class=\"table table-sm\"";
            var HtmlStr = '<table ' + tbClass + '>';
            HtmlStr += '<thead>';
            HtmlStr += '<tr>';
            HtmlStr += '<th scope="col"></th>';
            HtmlStr += '<th scope="col">' + $.i18n('點數方式說明') + '</th>';
            HtmlStr += '<th scope="col" style="width: 80px;">' + $.i18n('發放規則') + '</th>';
            HtmlStr += '<th scope="col" style="width: 50px;">' + $.i18n('點數') + '</th>';
            HtmlStr += '</thead>';
    
            HtmlStr += '<tbody>';
            Log.write("HTMLSTR tbody",'bindDataInfo');
            for (var i = 0; i < arrPointRule.length; i++) {
                var ruleSort = arrPointRule[i].PR_Sort;
                var ruleName = arrPointRule[i].PR_Name;
                var rule = arrPointRule[i].PR_Rule;
                var rulePoint = arrPointRule[i].PR_Point;

                HtmlStr += '<tr>';
                HtmlStr += '<th scope="row">' + ruleSort + '.</th>';
                HtmlStr += '<td>' + ruleName + '</td>';
                HtmlStr += '<td>' + rule + '</td>';
                HtmlStr += '<td>+' + rulePoint + '</td>';
                HtmlStr += '</tr>';
                if (i === arrPointRule.length - 1) {
                    HtmlStr += '</tbody>';
                    $divPointInfoId.html(HtmlStr);
                    Log.write("HTMLSTR Success", 'bindDataInfo');
                    resolve();
                }
            }
           
        });
    },
    showPointList: function () {
        WiseScripts.Tool.ShowLoading(true, $.i18n("資料載入中.."));
        FnPoint.getPointData(localStorage.UserID, function (result) {
            console.log(result);
            var obj = JSON.parse(result);
            FnPoint.combinePointList(obj);
        });
    },
    combinePointList: function (objResult) {
        FnPoint.BindPointTotal(objResult.PointTotal);

        FnPoint.BindData(FnPoint.PointListId, objResult.PointList, function () {
            WiseScripts.Tool.ShowLoading(false);
        });

        FnPoint.BindData(FnPoint.ExchangeListId, objResult.ExchangeList, function () {
        });
    },
    BindPointTotal: function (pointTotal) {
        localStorage[localStorage.UserID+"_PointTotal"] = pointTotal;

        $.each(this.lPoinTotalId,function(idx,item){
            $("#" + item).html(pointTotal);
        });
    },
    BindData: function (bodyId, objList, successFn, errFn) {
        $("#" + bodyId).html("");

        Log.write('有資料: ' + JSON.stringify(objList), "BindData");

        objList = objList.sort(function (a, b) {
            return a.RecordDate < b.RecordDate ? 1 : -1;
        });

        var strHtml = "";
        $.each(objList, function (i, item) {
            var sID = objList[i].sID;
            var sKey = objList[i].sKey;
            var oTitle = objList[i].Title;
            var oDate = objList[i].RecordDate;
            var oPoint = objList[i].Point;
            var oStatus = objList[i].Status;

            var card = "";
            card += '<div class="card w-100">';

            card += '<div class="card-body card-box">';
            card += '<div class="row points-row">';

            switch (bodyId) {
                case FnPoint.PointListId:
                    card += '<div class="col">';
                    card += '<h5>'+oTitle+'</h5>';
                    card += '<h6>'+oDate+'</h6>';
                    card += '</div>';

                    card += '<div class="txtpoints">';
                    card += '+' + oPoint;
                    card += '</div>';
                    break;
                case FnPoint.ExchangeListId:
                    card += '<div class="col">';
                    card += '<h5>'+oTitle+'</h5>';
                    card += '<h6>'+oStatus+'</h6>';
                    card += '<h6>'+oDate+'</h6>';
                    card += '</div>';

                    card += '<div class="txtpoints red">';
                    card += '-' + oPoint;
                    card += '</div>';
                    break;
            }

            card += '</div>'; //row
            card += '</div>'; //card-box

            card += '</div>'; //card

            strHtml += card;
            if (i == objList.length - 1) {
                $("#" + bodyId).html(strHtml);
            }
        });
        if (successFn) {
            successFn();
        }
    },
    getPointInfoData: function (UserID, successFn) {
        // Log.alert(UserID,"WSCall Measurement GET");
        var UploadData = {
            "Platform": DeviceInfo.GetOS(),
            "Version": Domain.Version,
            "VersionNo": Domain.VersionNo,
            "ID": UserID,
            "B_NO": localStorage[UserID + "_B_NO"]
        };

        var PostInfo = {
            Url: AppConfig.AppServices + "/GetPointInfo",
            UploadData: UploadData,
            async: true
        };

        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result,"getPointInfoData");
            if(successFn){
                successFn(result);
            }  
        }, function (err) { //失敗
            FnCtrl.alert($.i18n("目前無網路連線或是無法連線至伺服器，請檢查網路，並稍後再試。"));
        });
    },
    getPointData: function (UserID, successFn) {
        // Log.alert(UserID,"WSCall Measurement GET");

        var UploadData = {
            "UserID": UserID
        };

        var PostInfo = {
            Url: AppConfig.AppServices + "/QueryPointHistory",
            UploadData: UploadData,
            async: true
        };

        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result,"getPointData");
            if(successFn){
                successFn(result);
            }  
        }, function (err) { //失敗
            FnCtrl.alert($.i18n("目前無網路連線或是無法連線至伺服器，請檢查網路，並稍後再試。"));
        });
    },
    getPointTotal: function (UserID, successFn) {
        // Log.alert(UserID,"WSCall Measurement GET");

        Log.write("isEnabledPoint:" + localStorage.isEnabledPoint, "FnPoint");
        Log.write("SyncAppInfo NetStatusFn.getNetFlag()" + NetStatusFn.getNetFlag(), "FnPoint");
        if (localStorage.isEnabledPoint === "N" || !NetStatusFn.getNetFlag()) {
            return;
        }

        var UploadData = {
            "UserID": UserID
        };

        var PostInfo = {
            Url: AppConfig.AppServices + "/GetPointTotal",
            UploadData: UploadData,
            async: true //非同步執行，預設值
        };

        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result, "getPointTotal");
            if (successFn) {
                successFn(result);
            }
        }, function (err) { //失敗
            //FnCtrl.alert($.i18n("目前無網路連線或是無法連線至伺服器，請檢查網路，並稍後再試。"));
        });
    }
};

$(function () {
    FnPoint.init();
});