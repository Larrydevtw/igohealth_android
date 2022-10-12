var Login = Login || {},
    Login = {
        refreshAllMData: function (isRefresh, successFn) {

            Log.write("isRefresh: " + isRefresh + " / isAutoSyncData: " + FnSystem.isAutoSyncData, 'Login refreshAllMData');

            if (isRefresh === "N") {
                Log.write("return", 'Login refreshAllMData');
                return false;
            }

            Log.write("Start", 'Login refreshAllMData');

            //更新雲端資料
            WiseScripts.Tool.ShowLoading(true, $.i18n("下載雲端資料中..."));
            Measure.refresh("All", function () { //successFn
                if (successFn) {
                    successFn();
                }
                WiseScripts.Tool.ShowLoading(false, '', '', function () {
                    FnCtrl.toast($.i18n('雲端資料同步成功!'), 'short', 'center');
                });
            }, function (err) { //errFn
                WiseScripts.Tool.ShowLoading(false);
            });
        },
        confirmRefresh: function () {
            var message = $.i18n('是否確定同步伺服器上所有資料') + $.i18n('手機上資料將會清除並重新載入');
            var title = $.i18n('系統訊息');
            var buttonLabels = [$.i18n('是'), $.i18n('否')];

            navigator.notification.confirm(message, confirmCallback, title, buttonLabels);

            function confirmCallback(btnIndex) {
                if (btnIndex == 1) {
                    Login.refreshAllMData("Y");
                }
            }
        },
        saveUserInfo: function (UserID, Pwd, FTime, successFn) { //FTime: 紀錄第一次從雲端下載資料的時間
            Log.write("更新UserInfo:" + UserID + "；" + Pwd + "FTime" + FTime, "Login saveUserInfo");
            var Params = {
                'UserID': UserID
            };

            if (FTime != "") {
                Params.FTime = FTime; //DateTimeFun.getNowDate() //回傳八碼
            } else {
                Params._Psd = Pwd;
            }
            //alert(ID + PS);
            DAOFn.SimpleMerge('', 'UserInfo', Params, 'UserID', UserID, "", function (result) {
                Log.write("更新UserInfo:" + result);
                if (result == "") {
                    if (successFn) {
                        successFn();
                    }
                    //Log.write("成功更新UserInfo","Login saveUserInfo");
                }
            }, 'T');
        },
        getUserFTime: function () {
            var result = "";
            return new Promise(function (resolve, reject) {
                DAOFn.Query('', "select FTime from UserInfo Where UserID='" + localStorage.UserID + "'",
                    function (data) {
                        var objList = $.parseJSON(data);
                        if (objList.length == 0) { //如果沒有註冊資料，進行註冊動作//跳出「抓取雲端設定中，請稍待..」
                            Log.write("沒有註冊資料", "HATMSERVICES GetSiteInfo");
                        } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) { //資料庫錯誤
                            Log.write("資料庫錯誤:" + JSON.stringify(objList[0]));
                        } else {
                            result = objList[0].FTime == null ? "" : objList[0].FTime;
                        }
                        Log.alert(result);
                        resolve(result);
                    });
            });
        },
        checkService: function (UserID, Pwd, successFn) { //判斷更改Service位址 //開發者使用
            Log.write("ChangeService檢查開始", "checkService");

            if (Pwd == "#wise#" && UserID == "ethinkadmin") { //查看目前所呼叫的Service資訊
                ProjectFn.getSysParams("mSys", "PostUrl", function (postUrl) {
                    if (postUrl == "") {
                        postUrl = Domain.Address;
                    }
                    FnCtrl.alert("postUrl:" + postUrl + "\nDomain.Version:" + Domain.Version);
                });
                return;
            }

            WiseAES.enpryptAES(UserID + Pwd, AppConfig.ASKey1, AppConfig.ASKey2, "T", function (result) {
                Log.write("加密後" + result, "checkService");
                var postUrl = "";
                switch (result) {
                    case Domain.Chk_AddressLocal:
                        postUrl = Domain.AddressLocal;
                        Login.confirmChangeService(postUrl);
                        break;
                    case Domain.Chk_AddressLocal_A:
                        postUrl = Domain.AddressLocal_A;
                        Login.confirmChangeService(postUrl);
                        break;
                    case Domain.Chk_AddressTest:
                        postUrl = Domain.AddressTest;
                        Login.confirmChangeService(postUrl);
                        break;
                    case Domain.Chk_AddressNT:
                        postUrl = Domain.AddressNT;
                        Login.confirmChangeService(postUrl);
                        break;
                    case Domain.Chk_AddressCN:
                        postUrl = Domain.AddressCN;
                        Login.confirmChangeService(postUrl);
                        break;
                    default:
                        Log.write("TODO ChangeService檢查結束，進行登入動作", "confirmChangeService");
                        // if (successFn) {
                        //     successFn();
                        // }
                        //TODO 
                        ProjectFn.getSysParams("mSys", "PostUrl", function (postUrl) {
                            if (postUrl == "") {
                                // ProjectFn.setSysParams("mSys", "PostUrl", Domain.Address, function (msg) {
                                //     Log.write(msg + "Domain.Address:" + Domain.Address + "，儲存Domain.Address設定至SQLLite中", "checkService");
                                if (successFn) {
                                    successFn();
                                }
                                // });
                            } else {
                                Log.write("Domain.Address:" + postUrl + "，SQLLite取得Domain.Address", "checkService");
                                Domain.Address = postUrl; //更改預設postUrl主機位址
                                AppConfig.AppServices = "http://" + postUrl + Domain.ServiceRoot + Domain.ServiceApi;
                                AppConfig.MemberServices = "http://" + postUrl + Domain.ServiceRoot + "/HATM_Services/api/HATMMember";
                                Log.Toast("***http://" + Domain.Address + "***");
                                if (successFn) {
                                    successFn();
                                }
                            }
                        });
                        break;
                }

            });
        },
        confirmChangeService: function (postUrl) {
            var message = "是否將主機位址: " + Domain.Address + "，更改為\n主機位址: " + postUrl + "?";
            var title = "系統訊息";
            var buttonLabels = ["是", "否"];

            navigator.notification.confirm(message, confirmCallback, title, buttonLabels);

            function confirmCallback(btnIndex) {
                if (btnIndex == 1) {
                    Domain.Address = postUrl; //更改預設postUrl主機位址
                    AppConfig.AppServices = "http://" + postUrl + Domain.ServiceRoot + Domain.ServiceApi;
                    AppConfig.MemberServices = "http://" + postUrl + Domain.ServiceRoot + "/HATM_Services/api/HATMMember";

                    FnCtrl.toast("主機位址更改為:" + AppConfig.AppServices);
                    Log.write(AppConfig.AppServices, "confirmChangeService");

                    ProjectFn.setSysParams("mSys", "PostUrl", postUrl, function (msg) {
                        Log.write(msg + "Domain.Address:" + postUrl + "，儲存Domain.Address設定至SQLLite中", "checkService");
                    });
                }
                Member.GoToLogin();
            }
        },

    };