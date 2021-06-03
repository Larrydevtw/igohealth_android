var xmlhttp = new XMLHttpRequest();
var SiteXML = "";
var WFK = "";
var WFS = "";
var WFO = "";
var SiteInfo_val1 = "";
var WSCall = WSCall || {},
    WSCall = {
        Post: function (PostInfo, successFn, errFn) {
            var netFlag = NetStatusFn.getNetFlag();
            Log.write(netFlag,'Wscall Post');
            if (!netFlag) {
                Log.write("目前無網路連線或是無法連線至伺服器，請檢查網路，並稍後再試。", "WSCall Post");
                if(errFn){
                    errFn($.i18n('目前無網路連線!!!'));
                }
                return;
            }

            var CheckCode = DateTimeFun.getNow();
            var EquipmentID = AppConfig.EquipmentID;
            var SystemModel = AppConfig.SystemModel; //todo //WiseHC應該不用使用OID OCICS1^OID OCICS1: 照護者端； OID  

            var UploadData = JSON.stringify(PostInfo.UploadData);
            var async=PostInfo.async===undefined? true: PostInfo.async; //true:預設，非同步執行；false:同步執行(非必要不使用同步執行)
            var timeout=PostInfo.timeout===undefined? 20000: PostInfo.timeout; //預設:20000 in milliseconds
            var Url = PostInfo.Url;

            var ASKey1=PostInfo.ASKey1===undefined?AppConfig.ASKey1:PostInfo.ASKey1;
            var ASKey2=PostInfo.ASKey2===undefined?AppConfig.ASKey2:PostInfo.ASKey2;

            var deASKey1 = ASKey1;//PostInfo.deASKey1 === undefined ? ASKey1 : PostInfo.deASKey1;
            var deASKey2 = ASKey2;//PostInfo.deASKey2 === undefined ? ASKey2 : PostInfo.deASKey2;

            //alert(deASKey2);
            //資料加密
            ProjectFn.Wait([
                function (next) {
                    WiseAES.enpryptAES(CheckCode, ASKey1, ASKey2, "T",
                        function (res) {
                            CheckCode = res;
                            next();
                        });
                },
                function (next) {
                    WiseAES.enpryptAES(EquipmentID, ASKey1, ASKey2, "T",
                        function (res) {
                            EquipmentID = res;
                            next();
                        });
                },
                function (next) {
                    WiseAES.enpryptAES(UploadData, ASKey1, ASKey2, "T",
                        function (res) {
                            UploadData = res;
                            next();
                        });
                }
            ], function () {
                var UData = {
                    CheckCode: encodeURI(CheckCode),
                    EquipmentID: encodeURI(EquipmentID),
                    UploadData: encodeURI(UploadData),
                    SystemModel: encodeURI(SystemModel)
                };
                
                $.ajax({
                    url: Url, //AppConfig.AppServices + "/UploadMData",
                    data: UData,
                    type: "POST",
                    timeout: timeout, // in milliseconds
                    async:async,
                    success: function (clsReturn) { //200:回傳值正常，進行後續動作
                        //alert(clsReturn.Data);
                        NetStatusFn._bNetFlag = true;
                        $("#aOffline").hide();

                        if (clsReturn.Code == "200") {
                            WiseAES.decryptAES(clsReturn.Data, deASKey1,deASKey2, "T",
                                function (result) { //解密成功:後端系統正程運作
                                    if (successFn) {
                                        successFn(result);
                                    }
                                },
                                function (errMsg) { //解密失敗:後端有系統性錯誤
                                    WSCall.errCallback($.i18n('解密失敗'));
                                    if(errFn){
                                        errFn(($.i18n("服務呼叫失敗！請稍後再試。") + "解密失敗。"))
                                    }
                                });
                        } else { //400:不正確請求信息 500:流程出現錯誤
                            WSCall.errCallback(clsReturn.Data);
                            if(errFn){
                                errFn(clsReturn.Data);
                            }
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        WSCall.errCallback(thrownError + ": /n Data: " + JSON.stringify(PostInfo), function () {
                            if (errFn) {
                                errFn(thrownError);
                            }
                        });
                    }
                });
            });
        },
        errCallback: function (errMsg, successFn) {
            WiseScripts.Tool.ShowLoading(false);
            Log.write(errMsg,'WSCall errCallback');
            if (successFn) {
                successFn();
            }
        },
        Measurement: {
            GET: function (UserID, UserKind, MType, QDateTimeS, QDateTimeE, TopRows, CallBack) {
                // Log.alert(UserID,"WSCall Measurement GET");
                var UploadData = {
                    QMInfo: [{
                        "UserKind": UserKind,
                        "UserID": UserID,
                        "MType": MType,
                        "QDateTimeS": QDateTimeS,
                        "QDateTimeE": QDateTimeE,
                        "BioClass": "",
                        "TopRows": TopRows,
                    }]
                };

                var PostInfo = {
                    Url: AppConfig.AppServices + "/QueryMData",
                    UploadData: UploadData,
                    async: true 
                };
                WSCall.Post(PostInfo, function (result) { //成功
                    // Log.alert(MType + result);
                    CallBack(MType, result);
                }, function (err) { //失敗
                    Log.write($.i18n("獲取雲端資料失敗") + MType);
                    FnCtrl.alert($.i18n("獲取雲端資料失敗"));
                });
            },
            // TPH_UP: function (objList, CallBack) { //TODO
            //     var UN = "";
            //     var CI = "";

            //     if (objList.UserType == 4) {
            //         UN = objList.User.split("_")[1];
            //         CI = objList.User.split("_")[0];
            //     } else {
            //         UN = objList.User;
            //         CI = objList.User;
            //     }

            //     var strXMLData = "";

            //     switch (objList.MType) {
            //         case "BP":
            //             strXMLData = "<?xml version='1.0' encoding='utf-8'?>" +
            //                 "<Datas Remark='BP'>" +
            //                 "<Data License='6EwQzUc1QWXWvxOVxECsbo/HtbAH7WopoMTqCfW4Vt4iZdZf9qIwm5OQiMvBuTd7ShkiIv4mYm3t6zNSEvX6toIYWIUT04xZSTezYBu/Iu0='" +
            //                 " UserNum='" + UN + "'" +
            //                 " UserKind='" + objList.UserType + "'" +
            //                 " TimeStamp='" + objList.MTime + "'" +
            //                 " Type='BP'" +
            //                 " Unit='mmHg'" +
            //                 " SBP='" + objList.MValue.split(",")[0] + "' DBP='" + objList.MValue.split(",")[1] + "' HR='" + objList.MValue.split(",")[2] + "'" +
            //                 " Flag=''" +
            //                 " CreateUser='27220055APP'" +
            //                 " DeviceId='" + objList.MDeviceID + "'" +
            //                 " CardId='" + UN + "'" +
            //                 " MAC='111111111111'" +
            //                 " PS_No='215'>" +
            //                 "</Data>" +
            //                 "</Datas>";
            //             break;
            //         case "BT":
            //             strXMLData = "<?xml version='1.0' encoding='utf-8'?>" +
            //                 "<Datas Remark='BT'>" +
            //                 "<Data License='6EwQzUc1QWXWvxOVxECsbo/HtbAH7WopoMTqCfW4Vt4iZdZf9qIwm5OQiMvBuTd7ShkiIv4mYm3t6zNSEvX6toIYWIUT04xZSTezYBu/Iu0='" +
            //                 " UserNum='" + UN + "'" +
            //                 " UserKind='" + objList.UserType + "'" +
            //                 " TimeStamp='" + objList.MTime + "'" +
            //                 " Type='BT'" +
            //                 " Unit='℃'" +
            //                 " Value='" + RS.split(",")[3] + "'" +
            //                 " Flag=''" +
            //                 " CreateUser='27220055APP'" +
            //                 " DeviceId='" + objList.MDeviceID + "'" +
            //                 " CardId='" + UN + "'" +
            //                 " MAC='111111111111'" +
            //                 " PS_No='215'>" +
            //                 "</Data>" +
            //                 "</Datas>";
            //             break;
            //         case "BO":
            //             strXMLData = "<?xml version='1.0' encoding='utf-8'?>" +
            //                 "<Datas Remark='BO'>" +
            //                 "<Data License='6EwQzUc1QWXWvxOVxECsbo/HtbAH7WopoMTqCfW4Vt4iZdZf9qIwm5OQiMvBuTd7ShkiIv4mYm3t6zNSEvX6toIYWIUT04xZSTezYBu/Iu0='" +
            //                 " UserNum='" + UN + "'" +
            //                 " UserKind='" + objList.UserType + "'" +
            //                 " TimeStamp='" + objList.MTime + "'" +
            //                 " Type='BO'" +
            //                 " Unit='%'" +
            //                 " SPO2='" + objList.MValue.split(",")[0] + "' PR='" + objList.MValue.split(",")[1] + "'" +
            //                 " Flag=''" +
            //                 " CreateUser='27220055APP'" +
            //                 " DeviceId='" + objList.MDeviceID + "'" +
            //                 " CardId='" + UN + "'" +
            //                 " MAC='111111111111'" +
            //                 " PS_No='215'>" +
            //                 "</Data>" +
            //                 "</Datas>";
            //             break;
            //         case "BW":
            //             strXMLData = "<?xml version='1.0' encoding='utf-8'?>" +
            //                 "<Datas Remark='BW'>" +
            //                 "<Data License='6EwQzUc1QWXWvxOVxECsbo/HtbAH7WopoMTqCfW4Vt4iZdZf9qIwm5OQiMvBuTd7ShkiIv4mYm3t6zNSEvX6toIYWIUT04xZSTezYBu/Iu0='" +
            //                 " UserNum='" + UN + "'" +
            //                 " UserKind='" + objList.UserType + "'" +
            //                 " TimeStamp='" + objList.MTime + "'" +
            //                 " Type='BW'" +
            //                 " Unit='kg'" +
            //                 " Weight='" + objList.MValue.split(",")[0] + "'" +
            //                 " Height='" + objList.MValue.split(",")[1] + "'" +
            //                 " BMI='" + objList.MValue.split(",")[2] + "'" +
            //                 " Flag=''" +
            //                 " CreateUser='27220055APP'" +
            //                 " DeviceId='" + objList.MDeviceID + "'" +
            //                 " CardId='" + UN + "'" +
            //                 " MAC='111111111111'" +
            //                 " PS_No='215'>" +
            //                 "</Data>" +
            //                 "</Datas>";
            //             break;
            //         case "BG":
            //             strXMLData = "<?xml version='1.0' encoding='utf-8'?>" +
            //                 "<Datas Remark='BG'>" +
            //                 "<Data License='6EwQzUc1QWXWvxOVxECsbo/HtbAH7WopoMTqCfW4Vt4iZdZf9qIwm5OQiMvBuTd7ShkiIv4mYm3t6zNSEvX6toIYWIUT04xZSTezYBu/Iu0='" +
            //                 " UserNum='" + UN + "'" +
            //                 " UserKind='" + objList.UserType + "'" +
            //                 " TimeStamp='" + objList.MTime + "'" +
            //                 " Type='BG'" +
            //                 " Unit='mg/dL'" +
            //                 " Value='" + objList.MValue.split(",")[0] + "' Time='" + objList.MValue.split(",")[1] + "'" +
            //                 " Flag=''" +
            //                 " CreateUser='27220055APP'" +
            //                 " DeviceId='" + objList.MDeviceID + "'" +
            //                 " CardId='" + UN + "'" +
            //                 " MAC='111111111111'" +
            //                 " PS_No='215'>" +
            //                 "</Data>" +
            //                 "</Datas>";
            //             break;
            //     }

            //     WiseAES.enpryptTPH(strXMLData,
            //         function (FinalStr) {
            //             $.post(AppConfig.TPH_URL, FinalStr, function (result, status) {
            //                 switch (status) {
            //                     case "success":
            //                         Log.write("回傳：" + result);
            //                         CallBack(result);
            //                         break;
            //                     default:
            //                         CallBack("Time out");
            //                         break;
            //                 }
            //             }).fail(function () {
            //                 CallBack("Time out");
            //             });
            //         }
            //     );
            // }
        },
        Member: {
            Register: function (ID, Mail, Phone, Bir, Gender, PID, NickName, successFn, errFn) {
                // Log.write(AppConfig.HRSSNo+AppConfig.StationNo+AppConfig.EquipmentID,"WSCALL Member Register Result");
                var EquipmentID = AppConfig.EquipmentID;
                var StationInfo = {
                    HRSSNo: AppConfig.HRSSNo,
                    StationNo: AppConfig.StationNo,
                    EquipmentID: EquipmentID
                };

                var MemberRegister = {
                    memberInfo: {
                        ID: ID,
                        IDType: "01", //帳號類型(01:一般帳號；02:E-mail；03:行動電話；04:身分證字號；05:護照號碼)    
                        // Password: "",
                        // VCode:"",                            //驗證碼
                        NickName: NickName, //暱稱
                        SEX: Gender, //性別
                        Birthday: Bir, //生日
                        EMail: Mail, //電郵
                        CellPhone: Phone, //手機
                        FSysCode: "App", //其他會員系統的代號
                        FSysKey: "", //外來識別碼(整合其他會員系統資料的主鍵值)
                        ReSetPW: "1", //重設密碼(0: 不用重設/1: 必須重設)
                        // SMSTimes:  "",        //簡訊重送密碼次數
                        // PsErrorCounter:"",    //密碼錯誤次數
                        // LastWasLockedTime:"", //帳號解鎖時間(密碼連續錯誤3次以後，必須超過解鎖時間，M_PsErrorCounter才會歸零)
                        Flag: "W", //帳號驗證狀態(W申請中/Y驗證通過) 超過七天未驗證，排程將自動刪除該帳號(包含個人基本資料與其關聯檔)              
                        PLevel: "01", //會員等級(01:一般會員；02:加值會員)
                        PLanguage: localStorage.Lang
                    },
                    memberPersonal: {
                        PIDType: "1",
                        PersonalID: PID,
                        FirstName: "",
                        LastName: "",
                        Country: "",
                        City: "",
                        Area: "",
                        Address: "",
                        Latitude: "",
                        Longitude: ""
                    }
                };

                var CheckCode = DateTimeFun.getNow();
                var strStationInfo = JSON.stringify(StationInfo);
                var strMember = JSON.stringify(MemberRegister);

                ProjectFn.Wait([
                    function (next) {
                        WiseAES.enpryptAES(CheckCode, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                            function (res) {
                                CheckCode = res;
                                next();
                            });
                    },
                    function (next) {
                        WiseAES.enpryptAES(EquipmentID, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                            function (res) {
                                EquipmentID = res;
                                next();
                            });
                    },
                    function (next) {
                        WiseAES.enpryptAES(strStationInfo, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                            function (res) {
                                strStationInfo = res;
                                next();
                            });
                    },
                    function (next) {
                        WiseAES.enpryptAES(strMember, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                            function (res) {
                                strMember = res;
                                next();
                            });
                    }
                ], function () {
                    var URL = AppConfig.MemberServices + "/Register";
                    //Log.write("CheckCode: " + CheckCode + "\nEquipmentID: " + EquipmentID + "\nstrStationInfo: " + strStationInfo + "\nstrMember:" + strMember + "\n查詢網址：" + URL, "WSCall Member Register");
                    var UData = {
                        CheckCode: encodeURI(CheckCode),
                        EquipmentID: encodeURI(EquipmentID),
                        SInfo: encodeURI(strStationInfo),
                        MData: encodeURI(strMember)
                    };

                    $.ajax({
                        url: URL,
                        data: UData,
                        type: "POST",
                        timeout: 20000, // in milliseconds
                        success: function (clsReturn) {
                            Log.write(clsReturn.Code + clsReturn.Data, "WSCALL Member Register Result");

                            if (clsReturn.Code == "200") {
                                //解密
                                WiseAES.decryptAES(clsReturn.Data, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                                    //解密成功:後端系統正程運作
                                    function (result) {
                                        if (successFn) {
                                            successFn(result);
                                        }
                                    },

                                    //解密失敗:後端有系統性錯誤
                                    function (result) {
                                        WiseScripts.Tool.ShowLoading(false);
                                        if (errFn) {
                                            errFn(result);
                                        }
                                        Log.write("解密失敗:後端有系統性錯誤:" + result, "WSCALL Member Register Result");
                                    });

                            } else { //400:不正確請求信息 500:流程出現錯誤
                                if (errFn) {
                                    WiseScripts.Tool.ShowLoading(false);
                                    errFn(result);
                                    Log.write("解密失敗:後端有系統性錯誤:" + result, "WSCALL Member Register Result");
                                }
                            }
                        },
                        error: function (request, status, err) {
                            WiseScripts.Tool.ShowLoading(false);
                            navigator.notification.alert($.i18n('無法呼叫到服務，請檢查網路，並稍後再試。') + err, null, $.i18n('系統訊息'), $.i18n('確定'));
                        }
                    });
                });
            },
            //ActionType: 01:啟用帳號；02:會員登入；03:修改密碼；0301:修改密碼(第一次登入)
            //MCheckType:01:生日；02:E-mail；03:行動電話；04:暱稱
            SendDefPassword: function (ID, Mail, Phone, Bir, ActionType, CallBack, MCheckType) {
                var MCheckValue = "";
                Log.alert("ID:" + ID + " Mail:" + Mail, "SendDefPassword"+" ,Bir:"+Bir);
                switch (MCheckType) {
                    case "01":
                        MCheckValue = Bir;
                        break;
                    case "02":
                        MCheckValue = Mail;
                        break;
                    case "03":
                        MCheckValue = Phone;
                        break;
                }

                var AccountDefPws = {
                    AccountDefPws: [{
                        Language: localStorage.Lang,
                        ActionType: ActionType,
                        MID: ID,
                        MIDType: "01",
                        MCheckType: MCheckType,
                        MCheckValue: MCheckValue,
                        MEMail: Mail,
                        MCellPhone: Phone,
                    }]
                };
                var PostInfo = {
                    Url: AppConfig.MemberServices + "/SendDefPassword",
                    UploadData: AccountDefPws
                };

                WSCall.Post(PostInfo, function (result) {
                    //成功
                    CallBack(result);
                }, function () {
                    FnCtrl.alert($.i18n("服務呼叫失敗！請稍後再試。"));
                });
            },
            Login: function (ActionType, ID, PS, NewPS, CallBack) {
                Log.alert("WSCALL LOGIN");
                //ActionType：01:啟用帳號；02:會員登入；03:修改密碼；0301:修改密碼(第一次登入)
                var CheckCode = DateTimeFun.getNow();
                var EquipmentID = AppConfig.EquipmentID;
                var UploadData = "";
                var SystemModel = AppConfig.SystemModel;

                ActionType = WiseScripts.IO.ClrJson(ActionType);
                ID = WiseScripts.IO.ClrJson(ID);

                var URL = AppConfig.MemberServices + "/Login";
                Log.write(URL,"URL");
                ProjectFn.Wait([
                    function (next) {
                        WiseAES.md5(PS,
                            function (res) {
                                PS = res;
                                next();
                            });
                    },
                    function (next) {
                        if (ActionType === "0301") {
                            //第一次註冊登入修改密碼
                            Log.write("第一次註冊登入修改密碼",'WSCall Login');
                            next();
                        } else {
                            WiseAES.md5(NewPS,
                                function (res) {
                                    NewPS = res;
                                    next();
                                });
                        }
                    },
                    function (next) {
                        WiseAES.enpryptAES(CheckCode, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                            function (res) {
                                CheckCode = res;
                                next();
                            });
                    },
                    function (next) {
                        WiseAES.enpryptAES(EquipmentID, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                            function (res) {
                                EquipmentID = res;
                                next();
                            });
                    },
                    function (next) {
                        var MemberLogin = {
                            "MemberLogin": [{
                                "ActionType": ActionType,
                                "MID": ID,
                                "MOPassword": PS,
                                "MNPassword": NewPS
                            }]
                        };
                        UploadData = JSON.stringify(MemberLogin);
                        Log.write(UploadData,"UploadData");
                        WiseAES.enpryptAES(UploadData, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                            function (res) {
                                UploadData = res;
                                next();
                            });
                    }
                ], function () {
                    var UData = {
                        CheckCode: encodeURI(CheckCode),
                        EquipmentID: encodeURI(EquipmentID),
                        UploadData: encodeURI(UploadData),
                        SystemModel: encodeURI(SystemModel)
                    };
                    $.ajax({
                        type: "POST",
                        url: URL,
                        data: UData,
                        //dataType: "json",
                        timeout: 20000, // in milliseconds
                        success: function (clsReturn) {
                            WiseScripts.Tool.ShowLoading(false);
                            if (clsReturn.Code == "200") {
                                WiseAES.decryptAES(clsReturn.Data, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                                    function (result) { //解密成功:後端系統正程運作
                                        Log.alert(result, "WSCAll Login");
                                        CallBack(result);
                                    },
                                    function (result) { //解密失敗:後端有系統性錯誤
                                        navigator.notification.alert(clsReturn.Data,
                                            function () {

                                            }, "", "確定");
                                    });
                            } else { //400:不正確請求信息 500:流程出現錯誤
                                WiseScripts.Tool.ShowLoading(false);
                                navigator.notification.alert(clsReturn.Data,
                                    function () {

                                    }, "", "確定");
                            }
                        },
                        error: function (xhr, status, err) {
                            //TODO
                            if (localStorage.UserID) { //已有登入過，Server暫時無法連線時，採用離線登入
                                FnCtrl.toast($.i18n('目前無網路連線或是無法連線至伺服器，採用離線登入',2000));
                                Member.offlineLogin(ID,PS);
                            }else{
                                navigator.notification.alert($.i18n('目前無網路連線或是無法連線至伺服器，請檢查網路，並稍後再試。') + err, null, $.i18n('系統訊息'), $.i18n('確定'));
                            }

                            WiseScripts.Tool.ShowLoading(false);
                        }
                    });

                });

            },
            GetMemberInfo: function (MemberID, UserType, CallBack, FCallBack) {
                //加密MemberID
                Log.alert(MemberID + "^" + UserType + "URL:" + AppConfig.AppServices + "/GetUserInfo", "WSCall GetUserInfo");

                var SystemModel = AppConfig.SystemModel; 

                WiseAES.enpryptAES(MemberID, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                    function (result) {
                        $.ajax({
                            type: "POST",
                            url: AppConfig.AppServices + "/GetUserInfo",
                            data: {
                                SystemModel: SystemModel,
                                UserID: encodeURI(result),
                                Mtype: "UserType",
                                type: "GetUserInfo"
                            },
                            //dataType: "json",
                            timeout: 10000, // in milliseconds
                            success: function (result) {
                                Log.write("回傳：" + result, "WSCALL GetMemberInfo");
                                WiseAES.decryptAES(result, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                                    function (result) {
                                        var buff = result.split(',');
                                        if (buff.length >= 5) {
                                            //Gender,Age,Height,Bir
                                            var Gender = buff[0];
                                            var Age = buff[1];
                                            var Height = buff[2];
                                            var Bir = buff[3];
                                            var NickName = buff[4];
                                            var EMail = buff[5];
                                            var PID = buff[6];

                                            var B_NO = "";
                                            if (buff.length == 8) {
                                                B_NO = buff[7];
                                            }

                                            if (Age != "")
                                                Age = parseInt(Age);

                                            if (Height != "")
                                                Height = parseFloat(Height).toFixed(1);

                                            var UserInfo = {
                                                Gender: Gender,
                                                Age: Age,
                                                Height: Height,
                                                Bir: Bir,
                                                NickName: NickName,
                                                EMail: EMail,
                                                PID: PID,
                                                B_NO: B_NO
                                            };
                                            CallBack(UserInfo);
                                        } else {
                                            FCallBack();
                                        }
                                    },
                                    function () {
                                        Log.write("解密失敗");
                                        FCallBack();
                                    });
                            },
                            error: function (request, status, err) {
                                FCallBack();
                            }
                        });
                    });

            }
        },
        Vehicle: {
            VehicleOwner: function (VehicleNo, VehicleType, CallBack, TimeOutCallBack) {
                DAOFn.Query('', "select ServicesURL from ServicesInfo where ServicesName ='WSID_005" + Domain.Address + "'",
                    function (result) {
                        var URL = $.parseJSON(result)[0].ServicesURL;
                        var MyJSON =
                            "{" +
                            "\"VehicleOwnerToID\": [" +
                            "{" +
                            "\"VehicleNo\":\"" + WiseScripts.IO.ClrJson(VehicleNo) + "\"," +
                            "\"VehicleType\":\"" + VehicleType + "\"" +
                            "}" +
                            "]" +
                            "}";

                        Log.write("URL：" + URL);
                        Log.write("送出：" + MyJSON);

                        WiseAES.enpryptAES(MyJSON, AppConfig.MKey1, AppConfig.MKey2, "T",
                            function (FinalStr) {
                                $.post(URL + "/VehicleOwnerToID" + "/json", FinalStr, function (result, status) {
                                    //Log.write("取得");
                                    switch (status) {
                                        case "success":

                                            WiseAES.decryptAES(result, AppConfig.MKey1, AppConfig.MKey2, "T",
                                                function (result) {
                                                    Log.write("回傳：" + result);

                                                    //if ( WiseScripts.Validate.isNumeric(result))
                                                    if (result.indexOf("MemberFN00") != 0)
                                                        CallBack(result);
                                                    else
                                                        CallBack("N");
                                                },
                                                function () {
                                                    Log.write("解密失敗");
                                                });
                                            break;
                                        default:
                                            TimeOutCallBack();
                                            break;
                                    }
                                }).fail(function (jqXHR, textStatus, errorThrown) {
                                    TimeOutCallBack();
                                });
                            });

                    });
            },
            VehicleRegister: function (MID, MPassword, VehicleNo, VehicleType, CallBack) {
                var MyJSON =
                    "{" +
                    "\"DataVehicle\": [" +
                    "{" +
                    "\"MID\":\"" + parent.WiseScripts.IO.ClrJson(MID) + "\",";

                WiseAES.md5(MPassword,
                    function (res) {
                        MyJSON += "\"MPassword\":\"" + res + "\"," +
                            "\"VehicleNo\":\"" + VehicleNo + "\"," +
                            "\"VehicleType\":\"" + VehicleType + "\"," +
                            "\"VFlag\":\"Y\"" +
                            "}" +
                            "]" +
                            "}";
                        Log.write("送出：" + MyJSON);


                        DAOFn.Query('', "select ServicesURL from ServicesInfo where ServicesName ='WSID_004" + Domain.Address + "'",
                            function (result) {
                                var URL = $.parseJSON(result)[0].ServicesURL;

                                Log.write("查詢網址：" + URL + "/json");

                                WiseAES.enpryptAES(MyJSON, AppConfig.MKey1, AppConfig.MKey2, "T",
                                    function (FinalStr) {
                                        $.post(URL + "/VehicleRegister" + "/json", FinalStr, function (result, status) {
                                            switch (status) {
                                                case "success":


                                                    WiseAES.decryptAES(result, AppConfig.MKey1, AppConfig.MKey2, "T",
                                                        function (result) {
                                                            Log.write("回傳：" + result);
                                                            CallBack(result);
                                                        },
                                                        function () {
                                                            Log.write("解密失敗");
                                                        });
                                                    break;
                                                default:
                                                    WiseScripts.Tool.ShowLoading(false);
                                                    navigator.notification.alert($.i18n('無法呼叫到服務，請檢查網路，並稍後再試。') + err, null, $.i18n('系統訊息'), $.i18n('確定'));
                                                    break;
                                            }
                                        }).fail(function () {
                                            WiseScripts.Tool.ShowLoading(false);
                                            navigator.notification.alert($.i18n('無法呼叫到服務，請檢查網路，並稍後再試。') + err, null, $.i18n('系統訊息'), $.i18n('確定'));
                                        });
                                    });
                            });
                    });

            }
        }
    };
