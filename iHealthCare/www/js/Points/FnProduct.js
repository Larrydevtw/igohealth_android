var FnProduct = {
    B_NO: 1,
    ProductListId: "divProductList",
    PendingListId: "divPendingList",
    ReceivedListId: "divReceivedList",
    ProductDetailId: "divProduct_Detail",
    ProductCategoryId: "selProductCategory",
    ProductData: "",
    CurrentProductListType: "",
    init: function () {
        var ProductCategoryId = FnProduct.ProductCategoryId;
        FnDynamic.setDdlValue(ProductCategoryId, [{
            text: "商品",
            value: "HF"
        }, {
            text: "折價券",
            value: "COUPON"
        }]);

        $("#" + ProductCategoryId).on("change", function () {
            FnProduct.onSelCategoryChange();
        });
    },
    setB_NO: function (B_NO) {
        Log.write("B_NO: " + B_NO, 'setB_NO');

        var UserID = localStorage.UserID;
        
        if(B_NO){
            Log.write("B_NO value: " + B_NO, 'setB_NO');
            localStorage[UserID + "_B_NO"] = +B_NO;
        }

        Log.write("localStorage[B_NO]: " + localStorage[UserID + "_B_NO"], 'setB_NO');
        if (localStorage[UserID + "_B_NO"]) {
            FnProduct.B_NO = +localStorage[UserID + "_B_NO"];
        }
    },
    onSelCategoryChange: function () {
        var ProductCategory = $("#" + FnProduct.ProductCategoryId).val();
        Log.write(ProductCategory, 'onSelCategoryChange');

        FnProduct.showProductList(FnProduct.CurrentProductListType, ProductCategory);

    },
    showTab: function (productListType) {
        Log.write(productListType, "showTab");
        switch (productListType) {
            case FnProduct.ProductListId:
                // $("#ProductList-tab").trigger("click");
                break;
            case FnProduct.PendingListId:
                $("#PendingList-tab").trigger("click");
                break;
            case FnProduct.ReceivedListId:
                $("#ReceivedList-tab").trigger("click");
                break;
        }
    },
    showDetail: function (_id, productListType, oExchangeKey) {
        var bodyId = FnProduct.ProductDetailId + "_Body";
        $("#" + bodyId).html("");

        WiseScripts.Tool.NextPop(FnProduct.ProductDetailId, function () {
            WiseScripts.Tool.ShowLoading(true, $.i18n("資料載入中.."));
            FnProduct.getProductDetail(_id, function (result) {
                console.log(result);
                var objList = JSON.parse(result);
                FnProduct.combineProductDetail(objList, productListType, oExchangeKey);
            });
        }, null, 'T');
    },
    showProductList: function (productListType, ProductCategory) {

        if (!productListType) {
            productListType = FnProduct.ProductListId;
        }

        if (!ProductCategory) {
            ProductCategory = $("#" + FnProduct.ProductCategoryId).val();
        }

        FnProduct.CurrentProductListType = productListType;
        FnProduct.showTab(productListType);

        WiseScripts.Tool.ShowLoading(true, $.i18n("資料載入中.."));

        FnProduct.getProductData(localStorage.UserID, ProductCategory, function (result) {
            
            WiseScripts.Tool.ShowLoading(false);

            var objResult = JSON.parse(result);
            Log.write(JSON.stringify(Object.keys(objResult)), "showProductList");
            FnProduct.combineProductList(objResult, productListType);

        });
    },
    combineProductList: function (objResult, productListType) {
        FnPoint.BindPointTotal(objResult.PointTotal);

        Log.write(productListType, "combineProductList");

        FnProduct.BindData(FnProduct.ProductListId, objResult);
        FnProduct.BindData(FnProduct.PendingListId, objResult);
        FnProduct.BindData(FnProduct.ReceivedListId, objResult);
    },
    combineProductDetail: function (objList, productListType, oExchangeKey, successFn) {
        var bodyId = FnProduct.ProductDetailId + "_Body";

        FnProduct.BindDetail(bodyId, productListType, objList, oExchangeKey, function () {
            WiseScripts.Tool.ShowLoading(false);
        });
    },
    BindData: function (bodyId, objResult) {
        $("#" + bodyId).html("");
        return new Promise(function (resolve, reject) {

            WiseScripts.Tool.ShowLoading(true, $.i18n("資料載入中.."));

            var objList;

            switch (bodyId) {
                case FnProduct.ProductListId:

                    objList = objResult.ProductList;

                    break;
                case FnProduct.PendingListId:

                    objList = objResult.PendingList;

                    objList = objList.sort(function (a, b) {
                        return a.Pd_Date < b.Pd_Date ? 1 : -1;
                    });
                    break;
                case FnProduct.ReceivedListId:

                    objList = objResult.ReceivedList;

                    objList = objList.sort(function (a, b) {
                        return a.Rc_Date < b.Rc_Date ? 1 : -1;
                    });

                    break;
            }

            var strHtml = "";
            $.each(objList, function (i, item) {
                var oId = objList[i].sID;
                var oKey = objList[i].sKey;
                var oExchangeKey = objList[i].ExchangeKey;
                var oTitle = objList[i].Title;
                var oSubTitle = objList[i].SubTitle;
                var oCategory = objList[i].Category;
                var oImage = objList[i].ImagePath !== '' ? objList[i].ImagePath : ("data:image/jpg;base64," + objList[i].Image);
                var oPoint = objList[i].Point;
                var oQuantity = objList[i].Quantity;
                var oStatus = objList[i].Status;

                var Pd_Date = objList[i].Pd_Date;
                var Rc_Date = objList[i].Rc_Date;

                var card = "";
                card += '<div class="card w-100">'; //card

                card += '<div class="card-body card-box" onclick="FnProduct.showDetail(\'' + oKey + '\',\'' + bodyId + '\',\'' + oExchangeKey + '\');">'; //card-box
                card += '<div class="row">'; //row

                card += '<div class="col-4" style="padding:2px;">';
                card += '<img src="' + oImage + '" class="card-img" loading="lazy"/>';
                card += '</div>';

                card += '<div class="col-8">';
                card += '<div class="product-title">' + oTitle + '</div>';
                switch (bodyId) {
                    case FnProduct.ProductListId:
                        card += '<div>&nbsp;</div>';
                        card += '<div>' + $.i18n('剩餘', ' ') + $.i18n('組', oQuantity) + '</div>';
                        card += '<div class="product-point">' + oPoint + $.i18n('點') + '</div>';
                        break;
                    case FnProduct.PendingListId:
                        card += '<div>' + $.i18n('兌換日期', ': ' + Pd_Date) + '</div>';
                        card += '<div>' + $.i18n('兌換數量', ': ') + $.i18n('組', oQuantity) + '</div>';
                        card += '<div>' + $.i18n('兌換狀態', ': ') + oStatus + '</div>';
                        //card += '<div class="product-point">' + oPoint + $.i18n('點') + '</div>';
                        break;
                    case FnProduct.ReceivedListId:
                        card += '<div>' + $.i18n('核銷日期', ': ' + Rc_Date) + '</div>';
                        card += '<div>' + $.i18n('兌換數量', ': ') + $.i18n('組', oQuantity) + '</div>';
                        //card += '<div class="product-point">' + oPoint + $.i18n('點') + '</div>';
                        break;
                }
                card += '</div>'; //col-8

                card += '</div>'; //row
                card += '</div>'; //card-box

                card += '</div>'; //card

                strHtml += card;
                if (i == objList.length - 1) {
                    $("#" + bodyId).html(strHtml);
                }
            });
            
            WiseScripts.Tool.ShowLoading(false);
            resolve();
        });
    },
    BindDetail: function (bodyId, productListType, objList, oExchangeKey, successFn, errFn) {
        Log.write('有資料');

        var strHtml = "";
        $.each(objList, function (i, item) {
            var oId = objList[i].sID;
            var oKey = objList[i].sKey;
            var oName = objList[i].Name;
            var oTitle = objList[i].Title;
            var oSubTitle = objList[i].SubTitle;
            var oCategory = objList[i].Category;
            var oDescription = objList[i].Description.replace(/\*/g, '</br>*');
            var oPromotionalText = objList[i].PromotionalText;
            var oImage = objList[i].ImagePath !== '' ? objList[i].ImagePath : ("data:image/jpg;base64," + objList[i].Image);
            Log.write(oImage, 'oImage');
            var oQuantity = objList[i].Quantity;
            var oPoint = objList[i].Point;

            var dateFormat = "yyyy-MM-dd hh:mm";
            var oSDate = DateTimeFun.dateFormat(objList[i].SDate, dateFormat);
            var oEDate = DateTimeFun.dateFormat(objList[i].EDate, dateFormat);
            var oPlace = objList[i].Place;
            var oPlaceUrl = objList[i].PlaceUrl;

            var oOpeningTime = objList[i].OpeningTime;

            var card = "";
            card += '<div class="card">';

            card += '<img src="' + oImage + '" class="card-img-top"/>';

            card += '<div class="card-body">';
            card += '<h4 class="card-title">' + oTitle + '</h4>';
            card += '<h5 class="card-title" style="color:gray;">' + oSubTitle + '</h5>';
            card += '<h6 class="card-text">' + oDescription + '</h6>';

            card += '<br/>';

            var divPoint = "";
            divPoint += '<div class="card-text">';
            divPoint += '<span style="font-size:20px;">';
            divPoint += $.i18n('剩餘', ' ') + oQuantity + $.i18n('組', ' ');
            divPoint += '</span>';
            divPoint += '<span style="float:right;font-size:23px;color:#007bff">';
            divPoint += oPoint + $.i18n('點');
            divPoint += '</span>';
            divPoint += '</div>';
            divPoint += '<hr/>';
            // card += DI_Text;

            var divPlace = "";
            divPlace += '<h6><b>' + $.i18n('兌換期限') + '</b></h6>';
            divPlace += '<p class="card-text">';
            divPlace += oSDate + '~' + oEDate;
            divPlace += '</p>';

            divPlace += '<h6><b>' + $.i18n('兌換地點') + '</b></h6>';
            divPlace += '<p class="card-text">';
            divPlace += '<a href="' + oPlaceUrl + '">' + oPlace + '</a>';
            divPlace += '</p>';

            if (oOpeningTime !== "") {
                divPlace += '<h6><b>' + $.i18n('兌換時間') + '</b></h6>';
                divPlace += '<p class="card-text">' + oOpeningTime + '</p>';
            }

            switch (productListType) {
                case FnProduct.ProductListId:
                    card += divPoint;
                    card += divPlace;
                    card += '<button type="button" class="btn btn-primary btn-lg btn-block btnProduct" onclick="FnProduct.onBtnBuyClick(\'' + oKey + '\',' + oPoint + ',\'' + oTitle + '\',\'' + oCategory + '\')">' + $.i18n('我要兌換') + '</button>';
                    break;
                case FnProduct.PendingListId:
                    card += '<h6><b>' + $.i18n('兌換序號') + '</b></h6>';
                    card += '<p class="card-text">';
                    card += oExchangeKey;
                    card += '</p>';

                    card += divPlace;
                    card += '<button type="button" class="btn btn-primary btn-lg btn-block btnProduct" onclick="FnProduct.confirmReceive(\'' + oExchangeKey + '\',\'' + oTitle + '\')">' + $.i18n('領取(據點人員使用)') + '</button>';
                    break;
                case FnProduct.ReceivedListId:
                    switch (oCategory) {
                        case "COUPON":
                            divPlace = '<h6><b>' + $.i18n('使用期限') + '</b></h6>';
                            divPlace += '<p class="card-text">';
                            divPlace += oSDate + '~' + oEDate;
                            divPlace += '</p>';

                            divPlace += '<h6><b>' + $.i18n('使用地點') + '</b></h6>';
                            divPlace += '<p class="card-text">';
                            divPlace += '<a href="' + oPlaceUrl + '">' + oPlace + '</a>';
                            divPlace += '</p>';

                            card += divPlace;
                            break;
                        default:
                            break;
                    }
                    break;
            }

            card += '</div>';

            strHtml += card;
            if (i == objList.length - 1) {
                $("#" + bodyId).html(strHtml);
            }
        });
        if (successFn) {
            successFn();
        }
    },
    onBtnBuyClick: function (id, point, productName, ProductCategory) {
        FnCtrl.isBlockBtnClick(function () {
            FnProduct.confirmBuy(id, point, productName, ProductCategory);
        });
    },
    confirmBuy: function (id, point, productName, ProductCategory) {
        var pointTotal = localStorage[localStorage.UserID + "_PointTotal"];
        if (point > pointTotal) {
            FnCtrl.alert($.i18n('點數不足，無法進行兌換。'));
            return false;
        }

        var message = $.i18n("是否確定兌換", productName) + "\n" + $.i18n('商品兌換提示_Info');
        var title = $.i18n('提示');
        var buttonLabels = [$.i18n("確定"), $.i18n("取消")];

        navigator.notification.confirm(message, function (btnIndex) {
            if (btnIndex == 1) {
                Log.write('Buy' + id, 'FnProduct');
                FnProduct.buyProduct(id, ProductCategory);
            } else {
                Log.write('cancel' + id, 'FnProduct');
                //WiseScripts.Tool.BackPop();
            }
        }, title, buttonLabels);

    },
    confirmReceive: function (ExchangeKey, productName) {
        var title = $.i18n('由工作人員核銷');
        var icon = "info";
        var txtHtml = '<h5>' + $.i18n('請於兌換地點由工作人員輸入核銷代碼，方能進行商品領取。') + '</h5>' +
            '<input type="password" id="txtBranchCode" placeholder="驗證碼" style="" />';

        var preConfirmFn = function () {
            return new Promise((resolve, reject) => {
                // get your inputs using their placeholder or maybe add IDs to them
                resolve({
                    BranchCode: $('#txtBranchCode').val()
                });
                // maybe also reject() on some condition
            });
        };

        FnCtrl.confirmHtml({
            title: title,
            icon: icon,
            txtHtml: txtHtml,
            showCloseButton: true,
            confirmButtonText: $.i18n('確定'),
            cancelButtonText: $.i18n('取消')
        }, preConfirmFn, function (result) {

            var isConfirmed = result.isConfirmed;

            if (isConfirmed) {

                var BranchCode = result.value.BranchCode;
                if (!BranchCode) {
                    FnCtrl.alert($.i18n('請輸入據點代碼'));
                    return;
                }
                Log.write('Receive: ' + ExchangeKey + ' ,BranchCode:' + BranchCode, 'confirmReceive');
                FnProduct.receiveProduct(ExchangeKey, BranchCode);

            } else {
                Log.write('cancel: ' + ExchangeKey, 'confirmReceive');
                //WiseScripts.Tool.BackPop();
            }
        });
    },
    getProductData: function (UserID, ProductCategory, successFn) {
        // Log.alert(UserID,"WSCall Measurement GET");
        // var objResult = {
        //     "ProductList": [{
        //         "sID": "-1",
        //         "P_Name": "苦瓜萃取(含胜肽)複方膠囊",
        //         "P_Category": "Medicine",
        //         "P_Title": "苦瓜萃取(含胜肽)複方膠囊",
        //         "P_SubTitle": "*獨家專利定序Insumate苦瓜胜肽<br/>*含有45%綠原酸(Chlorogenic acid)的綠咖啡萃取!",
        //         "P_Image": "images/Products/Box_Mockups.jpg",
        //         "P_Point": "3000",

        //         "P_Memo": "",
        //         "P_Quantity": "19"
        //     }],
        //     "PendingList": [{
        //         "sID": "1",
        //         "P_Name": "苦瓜萃取(含胜肽)複方膠囊",
        //         "P_Category": "Medicine",
        //         "P_Title": "苦瓜萃取(含胜肽)複方膠囊",
        //         "P_SubTitle": "*獨家專利定序Insumate苦瓜胜肽<br/>*含有45%綠原酸(Chlorogenic acid)的綠咖啡萃取!",
        //         "P_Image": "images/Products/Box_Mockups.jpg",
        //         "P_Point": "3000",

        //         "P_Memo": "",
        //         "Pd_Date": "2020-09-07",
        //         "Pd_Quantity": "1"
        //     }],
        //     "ReceivedList": [{
        //         "sID": "1",
        //         "P_Name": "苦瓜萃取(含胜肽)複方膠囊",
        //         "P_Category": "Medicine",
        //         "P_Title": "苦瓜萃取(含胜肽)複方膠囊",
        //         "P_SubTitle": "*獨家專利定序Insumate苦瓜胜肽<br/>*含有45%綠原酸(Chlorogenic acid)的綠咖啡萃取!",
        //         "P_Image": "images/Products/Box_Mockups.jpg",
        //         "P_Quantity": "19",
        //         "P_Point": "3000",

        //         "P_Memo": "",
        //         "Rc_Date": "2020-09-09",
        //         "Rc_Quantity": "1"
        //     }]
        // }; //$.parseJSON(result);
        // for (var i = 0; i < 20; i++) {
        //     var obj = Object.assign({}, objResult.ProductList[0]);
        //     obj.sID = i;
        //     obj.P_Title = obj.P_Title + "_" + i;
        //     objResult.ProductList.push(obj);
        // }
        // objResult.ProductList.sort(function (a, b) {
        //     var keyA = a.sID;
        //     var keyB = b.sID;
        //     if (keyA < keyB) return -1;
        //     if (keyA > keyB) return 1;

        //     return 0;
        // });
        // result = JSON.stringify(objResult);
        // successFn(result);
        // return;
        var UploadData = {
            "UserID": UserID,
            "ProductCategory": ProductCategory
        };
        Log.write(JSON.stringify(UploadData), 'getProductData');
        var PostInfo = {
            Url: AppConfig.AppServices + "/QueryProductList",
            UploadData: UploadData,
            async: true
        };

        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result, "getProductData");
            if (successFn) {
                successFn(result);
            }
        }, function (err) { //失敗
            FnCtrl.alert($.i18n("目前無網路連線或是無法連線至伺服器，請檢查網路，並稍後再試。"));
        });
    },
    getProductDetail: function (_id, successFn) {
        // Log.alert(UserID,"WSCall Measurement GET");
        // var objList = [{
        //     "sID": _id,
        //     "P_Name": "苦瓜萃取(含胜肽)複方膠囊",
        //     "P_Category": "Medicine",
        //     "P_Title": "苦瓜萃取(含胜肽)複方膠囊",
        //     "P_SubTitle": "*獨家專利定序Insumate苦瓜胜肽<br/>*含有45%綠原酸(Chlorogenic acid)的綠咖啡萃取!",
        //     "P_Image": "images/Products/Box_Mockups.jpg",
        //     "P_ImagePath": "",
        //     "P_Quantity": "19",
        //     "P_Price": "666",
        //     "P_Point": "3000",
        //     "P_SDate": "2020-07-07 09:00",
        //     "P_EDate": "2020-12-30 17:00",
        //     "P_Place": "350苗栗縣竹南鎮公館里中華南路188號",
        //     "P_PlaceUrl": "https://goo.gl/maps/Sorb8HK9QJEHe6sv6",
        //     "P_TimeExplain": "2020-12-31前，週一至週五(例假日除外)，上午9點至下午5點(午休時間12:00~13:00)",
        //     "P_Memo": ""
        // }]; //$.parseJSON(result);

        // result = JSON.stringify(objList);
        // successFn(result);
        //return;
        var UploadData = {
            "ProductKey": _id
        };

        var PostInfo = {
            Url: AppConfig.AppServices + "/QueryProductDetail",
            UploadData: UploadData,
            async: true
        };
        Log.write(_id, "ProductKey");
        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result, "getProductDetail");
            if (successFn) {
                successFn(result);
            }
        }, function (err) { //失敗
            FnCtrl.alert($.i18n("目前無網路連線或是無法連線至伺服器，請檢查網路，並稍後再試。"));
        });
    },
    buyProduct: function (ProductKey, ProductCategory, successFn) {

        WiseScripts.Tool.ShowLoading(true, $.i18n("商品兌換中，請稍後"));

        var UploadData = {
            "M_ID": localStorage.UserID,
            "ProductKey": ProductKey,
            "ProductCategory": ProductCategory,
            "Quantity": 1,
            "B_NO": FnProduct.B_NO
        };

        var PostInfo = {
            Url: AppConfig.AppServices + "/BuyProduct",
            UploadData: UploadData,
            async: true
        };
        Log.write(ProductKey, "ProductKey");
        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result, "BuyProduct success");
            FnProduct.buyProductSuccess(result);
            if (successFn) {
                successFn(result);
            }
            WiseScripts.Tool.ShowLoading(false);
        }, function (err) { //失敗
            FnCtrl.alert($.i18n("目前無網路連線或是無法連線至伺服器，請檢查網路，並稍後再試。"));
            WiseScripts.Tool.ShowLoading(false);
        });
    },
    checkBuyProduct: function (_id, successFn) {
        var UploadData = {
            "ProductKey": _id
        };

        var PostInfo = {
            Url: AppConfig.AppServices + "/CheckBuyProduct",
            UploadData: UploadData,
            async: true
        };
        Log.write(_id, "ProductKey");
        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result, "CheckBuyProduct");
            if (successFn) {
                successFn(result);
            }
        }, function (err) { //失敗
            FnCtrl.alert($.i18n("目前無網路連線或是無法連線至伺服器，請檢查網路，並稍後再試。"));
        });
    },
    receiveProduct: function (ExchangeKey, BranchCode, successFn) {

        WiseScripts.Tool.ShowLoading(true, $.i18n('資料驗證中'));

        var UploadData = {
            "M_ID": localStorage.UserID,
            "ExchangeKey": ExchangeKey,
            "Quantity": 1,
            "B_NO": FnProduct.B_NO,
            "BranchCode": BranchCode
        };

        var PostInfo = {
            Url: AppConfig.AppServices + "/ReceiveProduct",
            UploadData: UploadData,
            async: true
        };
        Log.write(ExchangeKey, "ExchangeKey");
        WSCall.Post(PostInfo, function (result) { //成功
            Log.write(result, "receiveProduct success");
            WiseScripts.Tool.ShowLoading(false);

            FnProduct.buyProductSuccess(result);
            if (successFn) {
                successFn(result);
            }
        }, function (err) { //失敗
            WiseScripts.Tool.ShowLoading(false);
            Log.write(err, receiveProduct);
            FnCtrl.alert($.i18n("目前無網路連線或是無法連線至伺服器，請檢查網路，並稍後再試。"));
        });
    },
    buyProductSuccess: function (strResult) {
        var obj = JSON.parse(strResult);
        var code = obj.code;
        var result = obj.result;
        switch (code) {
            case "0": //點數不足；兌換出現錯誤
                FnCtrl.alert(result);
                break;
            case "1": //已兌換待領取
                FnCtrl.alert($.i18n('兌換成功_Info'), $.i18n('提示'), function () {
                    app.onBack();
                    FnProduct.showProductList(FnProduct.PendingListId);
                });
                break;
            case "2": //已領取
                FnCtrl.alert($.i18n('領取成功_Info'), $.i18n('提示'), function () {
                    app.onBack();
                    FnProduct.showProductList(FnProduct.ReceivedListId);
                });
                break;
            case "3": //已兌換審核中
                break;
            default: //4
                FnCtrl.alert(result);
                break;
        }
    },
};
$(function () {
    FnProduct.init();
});