//var NowCardID = ""; //TODO
var isBounding = false;
var Member = {
    isRegister: "N",
    Login: function () {
        // NowCardID = "";
        isBounding = false;
        var UserID = document.getElementById("login_userId").value;
        var Pwd = document.getElementById("login_userPwd").value;

        Login.checkService(UserID, Pwd, function () { //切換服務功能
            Member.LoginCheck(UserID, Pwd); //進入登入流程
        });

    },
    LoginCheck: function (UserID, Pwd) { //依據不同網路連線狀態
        Log.alert("LoginCheck");
        if (NetStatusFn.getNetFlag()) { //有網路狀態
            if (UserID.length < 1) {
                navigator.notification.alert($.i18n('請輸入帳號'), null, $.i18n('系統訊息'), $.i18n('確定'));
                return;
            } else {
                if (!WiseScripts.Validate.chkAccount(UserID)) {
                    navigator.notification.alert($.i18n('無法接受的帳號格式'), null, $.i18n('系統訊息'), $.i18n('確定'));
                    return;
                }
            }

            if (Pwd.length < 4) {
                navigator.notification.alert($.i18n('帳號或密碼不正確'), null, $.i18n('系統訊息'), $.i18n('確定'));
                return;
            }

            WiseScripts.Tool.ShowLoading(true, $.i18n('登入中...'));
            //會員登入驗證
            WSCall.Member.Login("02", UserID, Pwd, "",
                Member.LoginCallBack);
        } else { //無網路用離線登入
            Member.offlineLogin(UserID, Pwd);
        }
    },
    offlineLogin: function (UserID, Pwd) {
        //alert("offlineLogin");
        $("#aOffline").show();
        $("#aReload").hide();
        if (UserID == localStorage.UserID && Pwd == localStorage.UserPS) {
            window.plugins.toast.showShortCenter($.i18n('無網路連線，採離線登入'));
            NetStatusFn._bNetFlag = false;

            if (localStorage.getItem("OffLineUser_" + UserID.toLowerCase())) {

                Log.write("非第一次離線登入，檢查離線登入時間", "offlineLogin");
                var tmp = localStorage.getItem("OffLineUser_" + UserID.toLowerCase());
                var offY = tmp.substr(0, 4);
                var offM = tmp.substr(4, 2);
                var offD = tmp.substr(6, 2);

                var OffDate = new Date(offY, parseInt(offM) - 1, offD);

                var daydiff = Math.round((new Date().getTime() - OffDate.getTime()) / (1000 * 60 * 60 * 24));

                //alert(daydiff);

                if (daydiff <= 7)
                    Member.LoginCallBack("MemberFN0009_00");
                else {
                    navigator.notification.alert($.i18n("離線登入：此帳號已超過一週未連線，無法再使用離線登入。"), null, $.i18n('系統訊息'), $.i18n('確定'));
                }
            } else {
                Log.write("第一次離線登入", "offlineLogin");
                localStorage.setItem("OffLineUser_" + UserID.toLowerCase(), WiseScripts.Format.String_yyyyMMdd(new Date()));
                Member.LoginCallBack("MemberFN0009_00");
            }
        } else {
            navigator.notification.alert($.i18n("無法偵測到網路，請開啟網路。"), null, $.i18n('系統訊息'), $.i18n('確定'));
        }
    },
    LoginCallBack: function (result) {
        var UserID = document.getElementById("login_userId").value;
        var Pwd = document.getElementById("login_userPwd").value;

        switch (result) {
            case "MemberFN0009_00": //登入成功
            case "MemberFN0010_00":
                if (isBounding) {
                    DoBoundWork(UserID, Pwd);
                } else {
                    Member.LoginSuccess();
                }
                break;

            case "MemberFN0009_05": //未啟用帳號，進行帳號啟用
                WiseScripts.Tool.ShowLoading(true, $.i18n("帳號啟用中"));
                WSCall.Member.Login("01", UserID, Pwd, "",
                    Member.LoginCallBack);
                break;

            case "MemberFN0009_03": //帳號或密碼錯誤
            case "MemberFN0005_02":
                navigator.notification.alert($.i18n('帳號或密碼不正確'), null, $.i18n('系統訊息'), $.i18n('確定'));
                break;

            case "MemberFN0009_04": //帳號已停用
                navigator.notification.alert($.i18n('帳號已停用'), null, $.i18n('系統訊息'), $.i18n('確定'));
                break;

            case "MemberFN0009_07": //密碼錯誤超過三次
                navigator.notification.alert($.i18n('密碼錯誤超過3次，帳號已被鎖定，請稍後再登入。'), null, $.i18n('系統訊息'), $.i18n('確定'));
                break;

            default:
                navigator.notification.alert($.i18n('登入異常') + "：" + result, null, $.i18n('系統訊息'), $.i18n('確定'));
                break;
        }
    },
    //登入成功
    LoginSuccess: function () {
        Log.write("登入成功", "Login");
        WiseScripts.Tool.ShowLoading(false, '', '', function () {
            var UserID = document.getElementById("login_userId").value;
            var Pwd = document.getElementById("login_userPwd").value;
            //如密碼只有四位數，強制更改密碼
            if (Pwd.length == 4) {
                //密碼4位為驗證碼，代表剛註冊完第一次登入
                Member.ResetPS("Y");
            } else if (Pwd.length == 6) {
                //TODO:密碼6位為驗證碼，代表為忘記密碼
                Member.ResetPS("N");
            } else {
                if (NetStatusFn.getNetFlag()) {
                    localStorage.removeItem("OffLineUser_" + UserID.toLowerCase());
                }
                Member.DoLoginSuccessWork(UserID, Pwd);
            }
        });

    },
    DoLoginSuccessWork: function (_UserID, _UserPS) {
        localStorage.setItem("UserID", _UserID.toLowerCase());
        localStorage.setItem("UserPS", _UserPS); //TODO localStoraage暫時儲存未加密 
        try { //註冊推播(暫無使用)
            PushMsg.init(_UserID);
        } catch (e) {
            Log.write("註冊推播 失敗" + e.toString(), "RegisterPush");
        }
        //先將密碼加密在儲存
        WiseAES.enpryptAES(_UserPS, AppConfig.ASKey1, AppConfig.ASKey2, "T",
            function (res) {
                _UserPS = res;
                Login.saveUserInfo(_UserID, _UserPS, "", function () {
                    // NowCardID = "";
                    // sessionStorage["NFCReady"] = "F";

                    WiseScripts.Tool.NextPop('MainHome', null, function () {
                        RecView = [];
                        RecView.push("MainHome");
                        try {
                            MainHome.onLoad(); //TODO 登入成功在進行各種初始化動作
                        } catch (error) {
                            Log.write(error,"MainHome.onLoad");
                        }
                    }, 'T');
                });
            }
        );
    },
    Apply: function () { //註冊會員
        //檢查必填資料是否漏填
        if (document.getElementById("signup_ID").value.length < 1) {
            navigator.notification.alert($.i18n('請輸入帳號'), null, $.i18n('系統訊息'), $.i18n('確定'));
            return;
        } else {
            if (!WiseScripts.Validate.isPhone(document.getElementById("signup_ID").value)) {
                navigator.notification.alert($.i18n("帳號請輸入行動電話號碼"), null, $.i18n('系統訊息'), $.i18n('確定'));
                return;
            }
        }

        if (document.getElementById("signup_BIR").value.length < 1) {
            navigator.notification.alert($.i18n('請輸入生日'), null, $.i18n('系統訊息'), $.i18n('確定'));
            return;
        } else {
            if (document.getElementById("signup_BIR").value.length > 0 && !WiseScripts.Validate.isDate(document.getElementById("signup_BIR").value)) {
                navigator.notification.alert($.i18n('出生日期錯誤'), null, $.i18n('系統訊息'), $.i18n('確定'));
                return;
            }
        }

        if (document.getElementById("signup_PID").value.length < 1) { //2018/05/02
            if (CustomInfo.PID_Validate === "Y") {
                navigator.notification.alert("請填寫身分證", null, $.i18n('系統訊息'), $.i18n('確定'));
                return;
            }
        } else {
            if (!WiseScripts.Validate.isID(document.getElementById("signup_PID").value)) {
                navigator.notification.alert($.i18n("不正確的身分證"), null, $.i18n('系統訊息'), $.i18n('確定'));
                return;
            }
        }

        var UserSex = $('input:radio[name=sex]:checked').val();

        if (UserSex == "") {
            navigator.notification.alert($.i18n('請選擇性別'), null, $.i18n('系統訊息'), $.i18n('確定'));
            return;
        }

        if (document.getElementById("signup_mail").value.length == 0) {
            if (CustomInfo.EMail_Validate === "Y") {
                navigator.notification.alert($.i18n("請填寫電子郵件。"), null, $.i18n('系統訊息'), $.i18n('確定'));
                return;
            }
        }

        if (document.getElementById("signup_mail").value.length > 0 && !WiseScripts.Validate.isEmail(document.getElementById("signup_mail").value)) {
            navigator.notification.alert($.i18n('無法接受的電子信箱'), null, $.i18n('系統訊息'), $.i18n('確定'));
            return;
        }

        WiseScripts.Tool.ShowLoading(true, $.i18n("註冊中.."));
        var UserID = document.getElementById("signup_ID").value;
        WSCall.Member.Register(
            UserID, document.getElementById("signup_mail").value,
            document.getElementById("signup_ID").value,
            document.getElementById("signup_BIR").value.replace(/\/|-/g, ""),
            UserSex,
            document.getElementById("signup_PID").value,
            document.getElementById("signup_Nick").value,
            function (Result) {
                Log.write("收到：" + Result);
                switch (Result) {
                    case "MemberFN0006_03":
                    case "MemberFN0006_00":
                        navigator.notification.alert($.i18n('帳號註冊成功_Info'), null, $.i18n('系統訊息'), $.i18n('確定'));

                        WiseScripts.Tool.BackPop(null, function () {
                            Member.GoToLogin(function () {
                                $("#login_userId").val(UserID);
                                FnCtrl.focus("login_userPwd");
                            });
                        });
                        break;
                    case "MemberFN0006_04":
                        navigator.notification.alert($.i18n('預設密碼送出失敗'), null, $.i18n('系統訊息'), $.i18n('確定'));
                        break;
                    case "MemberFN0004_02":
                        navigator.notification.alert($.i18n('帳號已被註冊'), null, $.i18n('系統訊息'), $.i18n('確定'));
                        break;
                    case "MemberFN0004_03":
                        navigator.notification.alert($.i18n("此身分識證字號已註冊"), null, $.i18n('系統訊息'), $.i18n('確定'));
                        break;
                    default:
                        navigator.notification.alert($.i18n('系統訊息') + "：" + Result, null, $.i18n('系統訊息'), $.i18n('確定'));
                        break;
                }

                WiseScripts.Tool.ShowLoading(false);
            });
    },
    GoToSingup: function () {
        $("#signup_ID").val('');
        $("#signup_BIR").val('1990-01-01');
        $("#signup_Nick").val('');
        $("#signup_PID").val('');
        $("#signup_s1").prop('checked', true);
        $("#signup_mail").val('');

        WiseScripts.Tool.NextPop('reg_page', function () {
            FnCtrl.focus('signup_ID');
        }, null, 'T');
    },
    GoToPrivacy: function () {
        WiseScripts.Tool.NextPop('privacy_page', function () {
        }, null, 'F');
    },
    GoToLogin: function (successFn) {
        $("#login_userId").val('');
        $("#login_userPwd").val('');

        WiseScripts.Tool.NextPop('login_page', function () {
            FnCtrl.focus("login_userId");
            if (successFn) {
                successFn();
            }
        }, null, 'T');
    },

    GoToForget: function () {
        $("#forget_ID").val('');
        $("#forget_mail").val('');
        $("#forget_bir").val('');
        // $("#forget_phone").val('');
        WiseScripts.Tool.NextPop('forget_page', function () {
            FnCtrl.focus('forget_ID');
        }, null, 'T');
    },
    ResetPS: function (isRegister, successFn) {
        
        Member.isRegister = isRegister;

        Member.GoToResetPS(function () {
            FnCtrl.focus("Reset_PS1");
            if (successFn) {
                successFn();
            }
        });
    },
    GoToResetPS: function (successFn) {
        $("#Reset_PS1").val('');
        $("#Reset_PS2").val('');
        WiseScripts.Tool.NextPop('ResetPS', function () {
            if (successFn) {
                successFn();
            }
        }, null, "N");
    },
    SendPassword: function () { //忘記密碼
        //防呆
        //檢查必填資料是否漏填
        var UserID = document.getElementById("forget_ID").value;
        var UserMail = document.getElementById("forget_mail").value;
        var UserBir = document.getElementById("forget_bir").value;
        var UserPhone = UserID; //帳號就是手機號碼 //document.getElementById("forget_phone").value;ool.ShowLoading(true);

        if (UserID.length < 1) {
            navigator.notification.alert($.i18n('請輸入帳號'), null, $.i18n('系統訊息'), $.i18n('確定'));
            return;
        } else {
            if (!WiseScripts.Validate.chkAccount(UserID)) {
                navigator.notification.alert($.i18n('無法接受的帳號格式'), null, $.i18n('系統訊息'), $.i18n('確定'));
                return;
            }
        }

        var MCheckType = CustomInfo.Member_CheckType;
        switch (MCheckType) {
            case "01":
                if (UserBir.length == 0) {
                    navigator.notification.alert("請填寫生日。", null, $.i18n('系統訊息'), $.i18n('確定'));
                    return;
                }
                break;
            case "02":
                if (UserMail.length == 0) {
                    navigator.notification.alert("請填寫電子郵件。", null, $.i18n('系統訊息'), $.i18n('確定'));
                    return;
                }
                if (UserMail.length > 0 && !WiseScripts.Validate.isEmail(UserMail)) { //檢查Email
                    navigator.notification.alert($.i18n('無法接受的電子信箱'), null, $.i18n('系統訊息'), $.i18n('確定'));
                    return;
                }
                break;
            case "03":
                if (UserPhone.length > 0 && !WiseScripts.Validate.isPhone(UserPhone)) { //檢查手機號
                    navigator.notification.alert($.i18n('無法接受的手機號碼'), null, $.i18n('系統訊息'), $.i18n('確定'));
                    return;
                }
                break;
        }

        WiseScripts.Tool.ShowLoading(true, "傳送中..");

        // if (UserPhone.length > 0) //TODO 目前已Email為主
        //     MCheckType = "03";

        WSCall.Member.SendDefPassword(
            UserID,
            UserMail,
            UserPhone,
            UserBir,
            "02",
            Member.SendPasswordCallBack,
            MCheckType
        );
    },
    SendPasswordCallBack: function (result) {
        WiseScripts.Tool.ShowLoading(false);
        Log.write("收到：" + result);

        switch (result) {
            case "MemberFN0014_00":
                //發送成功
                navigator.notification.alert($.i18n('新密碼發送成功'), null, $.i18n('系統訊息'), $.i18n('確定'));
                WiseScripts.Tool.BackPop(function () {
                    Member.GoToLogin(function () {
                        var UserID = document.getElementById("forget_ID").value;
                        $("#login_userId").val(UserID);
                        FnCtrl.focus('login_userPwd');
                    });
                }, null);
                break;
            case "MemberFN0014_07":
                //簡訊重送密碼次數已超過3次，請輸入電子信箱
                navigator.notification.alert($.i18n('簡訊重送密碼次數已超過3次，請輸入電子信箱'), null, $.i18n('系統訊息'), $.i18n('確定'));
                break;
            case "MemberFN0009_04":
                //帳號已停用
                navigator.notification.alert($.i18n('帳號已停用'), null, $.i18n('系統訊息'), $.i18n('確定'));
                break;
            case "MemberFN0009_07":
                //密碼錯誤超過3次，帳號已被鎖定，請稍後再登入。
                navigator.notification.alert($.i18n('密碼錯誤超過3次，帳號已被鎖定，請稍後再登入。'), null, $.i18n('系統訊息'), $.i18n('確定'));
                break;
            case "MemberFN0014_08":
                //出生日期、信箱或手機與註冊時不符合
                navigator.notification.alert($.i18n('填寫資訊與註冊時不符合'), null, $.i18n('系統訊息'), $.i18n('確定'));
                break;
            case "MemberFN0005_02":
                //查無此帳號
                navigator.notification.alert($.i18n('查無此帳號'), null, $.i18n('系統訊息'), $.i18n('確定'));
                break;
            case "MemberFN0014_09":
                //發送預設密碼
                //WiseScripts.T                    
                var UserID = document.getElementById("forget_ID").value;
                var UserMail = document.getElementById("forget_mail").value;
                var UserPhone = UserID; //帳號就是手機號碼 //document.getElementById("forget_phone").value;ool.ShowLoading(true);

                var MCheckType = "03";

                if (UserMail.length > 0) {
                    MCheckType = "02";
                }

                WSCall.Member.SendDefPassword(
                    UserID,
                    UserMail,
                    UserPhone,
                    "",
                    "01",
                    Member.SendPasswordCallBack,
                    MCheckType);
                break;
            default:
                navigator.notification.alert($.i18n('預設密碼送出失敗') + "：" + result, null, $.i18n('系統訊息'), $.i18n('確定'));
                break;
        }
    },
    ChgPassword: function () {
        var UserID = document.getElementById("login_userId").value;
        var Pwd = document.getElementById("login_userPwd").value;

        if (document.getElementById("Reset_PS1").value != document.getElementById("Reset_PS2").value) {
            navigator.notification.alert($.i18n('兩次密碼輸入不一致'), null, $.i18n('系統訊息'), $.i18n('確定'));
            return;
        }

        if (document.getElementById("Reset_PS1").value.length < 1) {
            navigator.notification.alert($.i18n('密碼格式不正確'), null, $.i18n('系統訊息'), $.i18n('確定'));
            return;
        }

        if (!WiseScripts.Validate.chkPassword(document.getElementById("Reset_PS1").value)) {
            navigator.notification.alert($.i18n('密碼格式不正確'), null, $.i18n('系統訊息'), $.i18n('確定'));
            return;
        }

        WiseScripts.Tool.ShowLoading(true, "修改中..");

        var ActionType = "03";
        if (Member.isRegister === "Y") {
            ActionType = "0301";
            Log.write("Register / Member.isRegister: " + Member.isRegister, "Member.isRegister");
        }

        WSCall.Member.Login(ActionType, UserID, Pwd, document.getElementById("Reset_PS1").value,
            function (result) {
                WiseScripts.Tool.ShowLoading(false);
                switch (result) {
                    case "MemberFN0011_00":
                        Member.isRegister = "N";
                        Log.write("Register / Member.isRegister: " + Member.isRegister, "Member.isRegister");

                        navigator.notification.alert($.i18n('密碼修改成功'), null, $.i18n('系統訊息'), $.i18n('確定'));

                        Pwd = document.getElementById("Reset_PS1").value;
                        //Member.DoLoginSuccessWork(document.getElementById("login_userId").value, document.getElementById("login_userPwd").value);
                        WiseScripts.Tool.BackPop(function () {
                            Log.write(UserID + Pwd, "ChgPassword");
                            Member.DoLoginSuccessWork(UserID, Pwd);
                        });

                        break;
                    default:
                        navigator.notification.alert($.i18n('密碼修改失敗') + ":" + result, null, $.i18n('系統訊息'), $.i18n('確定'));
                        break;
                }
            });
    },

    Logout: function () {
        var message = $.i18n('是否確定登出?');
        navigator.notification.confirm(message, confirmCallback, $.i18n('系統訊息'), $.i18n('是') + ',' + $.i18n('否'));

        function confirmCallback(btnIndex) {
            if (btnIndex == 1) {

                if($$){ //選單收合
                    $$("#IP_Modal").style.display = "none";     
                }

                //TODO 登出後將帳號表中的密碼即登入記錄去除去除
                var Params = {
                    '_Psd': '',
                    'FTime': ''
                };
                DAOFn.UpdateData('', 'UserInfo', Params, 'UserID', localStorage.UserID, '', function ResultFun(result) {
                    Log.write("localStorage.UserID:" + localStorage.UserID + "\nRecView:" + RecView, "Logout");
                    localStorage.UserID = "";
                    localStorage.UserPS = "";
                    Member.GoToLogin(function(){
                        RecView = [];
                        RecView.push("login_page");
                    });             
                });
            } else {

            }
        }

    },
    GetUserType: function () { //TODO
        var UserType = "";
        var userKind = AppConfig.UserKind;
        if (userKind == "7") {
            UserType = "M";
        } else if (userKind == "1") {
            UserType = "C";
        }
        return UserType;
    },

    GetUserData: function (UserID, CB) {

        WSCall.Member.GetMemberInfo(UserID, Member.GetUserType(), function (UserInfo) {
                //網路抓的到時
                //alert(NickName);
                localStorage["NickName_" + UserID] = UserInfo.NickName;
                Member.showDisplayName();

                if (UserInfo.Bir != "") {
                    localStorage["Bir_" + UserID] = UserInfo.Bir;
                    // Age = Member.GetAgeByBrithday(Bir);
                } else {
                    var NowDate = new Date();
                    localStorage["Bir_" + UserID] = NowDate.getFullYear() - UserInfo.Age + "0101";
                }

                if (UserInfo.B_NO != "") {
                    FnProduct.setB_NO(UserInfo.B_NO);
                }else{
                    FnProduct.setB_NO();
                }

                //判斷線上資料的完整性
                if (UserInfo.Gender != "") {
                    localStorage["Gender_" + UserID] = UserInfo.Gender;
                }

                if (UserInfo.Age != "") {
                    localStorage["Age_" + UserID] = UserInfo.Age;
                }

                if (UserInfo.Height != "") {
                    localStorage["Height_" + UserID] = UserInfo.Height;
                }

                if (UserInfo.EMail != "") {
                    localStorage["EMail_" + UserID] = UserInfo.EMail;
                }

                if (UserInfo.PID != "") {
                    localStorage["PID_" + UserID] = UserInfo.PID;
                }

                // var UserInfo={
                //     Gender:Gender, 
                //     Age:Age, 
                //     Height:Height, 
                //     Bir:Bir, 
                //     NickName:NickName
                // };
                var a = JSON.stringify(UserInfo);
                Log.write(a, "Member GetUserData");
                if (CB) {
                    CB(UserInfo);
                }

            },
            function () {
                Log.alert("GetUserData失敗", "Member GetUserData");
                //網路抓不到時
                if (CB)
                    CB();
            });
    },

    showDisplayName: function () {
        var UserID = localStorage.UserID;
        var NickName = localStorage["NickName_" + UserID];
        var displayName = $.i18n('會員') + '(' + UserID + ')';

        if (NickName) {
            displayName = NickName;
        }

        $("#txtDisplayName").html(displayName);
    },

    GetAgeByBrithday: function (_birthday) {
        var age = -1;
        var today = new Date();
        var todayYear = today.getFullYear();
        var todayMonth = today.getMonth() + 1;
        var todayDay = today.getDate();
        var birthday = parseDate(_birthday);
        Log.write("birthday: " + birthday, "GetAgeByBrithday");
        if (birthday != 'ERR') {
            birthdayYear = birthday.getFullYear();
            birthdayMonth = birthday.getMonth();
            birthdayDay = birthday.getDate();
            if (todayYear - birthdayYear < 0) {
                FnCtrl.alert("生日日期錯誤");
            } else {
                if (todayMonth * 1 - birthdayMonth * 1 < 0) {
                    age = (todayYear * 1 - birthdayYear * 1) - 1;
                } else {
                    if (todayDay - birthdayDay >= 0) { //alert(thisDay+'-'+brithd+"_ddd");
                        age = (todayYear * 1 - birthdayYear * 1);
                    } else if (todayMonth * 1 - birthdayMonth * 1 == 0) {
                        age = (todayYear * 1 - birthdayYear * 1) - 1;
                    } else
                        age = (todayYear * 1 - birthdayYear * 1);
                }
            }
            return age * 1;
        } else {
            return -1;
        }
    },
    UpdateUserData: function (UserID, successFn, errFn) {
        //TODO
        try {
            var age = localStorage["Age_" + UserID];
            var gender = localStorage["Gender_" + UserID];
            var height = localStorage["Height_" + UserID];
            Log.write("age: " + age + " ,gender" + gender + " ,height" + height, "UpdateUserData");
            if (gender == "M") { //使用者性別 0:男；1:女  (Oserio FLG-756 體脂機專用參數)
                gender = 0;
            } else {
                gender = 1;
            }
            //Log.write(gender, "UpdateUserData");
            MSCordovaBLE.MySetting.UserAge = age;
            MSCordovaBLE.MySetting.UserGender = gender;
            MSCordovaBLE.MySetting.UserHeight = height;

            if (successFn) {
                successFn();
            }
        } catch (e) {
            if (errFn) {
                errFn(e);
            }
        }
    },
    SaveUserData: function () {
        var NickName = $("#txtNickName").val(); //TODO
        if (NickName == "#wise#") { //查看目前所呼叫的Service資訊
            ProjectFn.getSysParams("mSys", "PostUrl", function (postUrl) {
                if (postUrl == "") {
                    postUrl = Domain.Address;
                }
                FnCtrl.alert("postUrl:" + postUrl + "\nVersion:" + Domain.Version);
            });
            return;
        }

        //防呆
        if ($("#profile_BIR").val() == "") {
            navigator.notification.alert("請輸入生日", function () {}, parent.$.i18n('系統訊息'), parent.$.i18n('確定'));
            return;
        }

        if(AppConfig.lMType.indexOf("BW") > -1){
            if ($("#profile_tall").val() == "") {
                navigator.notification.alert("請輸入身高", function () {}, parent.$.i18n('系統訊息'), parent.$.i18n('確定'));
                return;
            }
            if (!$.isNumeric($("#profile_tall").val())) {
                navigator.notification.alert("身高不正確", function () {}, parent.$.i18n('系統訊息'), parent.$.i18n('確定'));
                return;
            } else {
                if (parseInt($("#profile_tall").val()) > 250 || parseInt($("#profile_tall").val()) < 30) {
                    navigator.notification.alert("身高不正確", function () {}, parent.$.i18n('系統訊息'), parent.$.i18n('確定'));
                    return;
                }
            }
        }

        if (!$("#profile_s1").prop("checked") && !$("#profile_s2").prop("checked")) {
            navigator.notification.alert("請選擇性別", function () {}, parent.$.i18n('系統訊息'), parent.$.i18n('確定'));
            return;
        }

        //TODO 20180418 目標體重不一定要輸入
        // if ($("#profile_tgW").val() == "") {
        //     parent.navigator.notification.alert("請輸入目標體重", function () { }, parent.$.i18n('系統訊息'), parent.$.i18n('確定'));
        //     return;
        // }

        // if (!$.isNumeric($("#profile_tgW").val())) {
        //     parent.navigator.notification.alert("目標體重不正確", function () { }, parent.$.i18n('系統訊息'), parent.$.i18n('確定'));
        //     return;
        // }
        // else {
        //     if (parseInt($("#profile_tgW").val()) > 250 || parseInt($("#profile_tgW").val()) < 5) {
        //         parent.navigator.notification.alert("目標體重不正確", function () { }, parent.$.i18n('系統訊息'), parent.$.i18n('確定'));
        //         return;
        //     }
        // }

        if (parseInt((new Date() - parent.parseDate($("#profile_BIR").val())) / 86400000) <= 0) {
            navigator.notification.alert("生日不正確", function () {}, parent.$.i18n('系統訊息'), parent.$.i18n('確定'));
            return;
        }

        //防呆結束
        // Log.alert("SaveUserData S","Member.js SaveUserData");

        var Bir = $("#profile_BIR").val();
        Log.write("Bir: " + Bir, "SaveUserData");

        var UserType = Member.GetUserType(); //M: 會員 C:卡片 //TODO
        var Gender = $("#profile_s1").prop("checked") ? 'M' : 'F';
        var Height = parseFloat($("#profile_tall").val()).toFixed(1);
        var Age = Member.GetAgeByBrithday($("#profile_BIR").val());

        var UserID = localStorage.UserID;

        localStorage["Gender_" + UserID] = Gender;
        localStorage["Bir_" + UserID] = Bir;
        localStorage["Height_" + UserID] = Height;
        localStorage["Age_" + UserID] = Age;
        localStorage["NickName_" + UserID] = NickName;

        var TargetW = $("#profile_tgW").val();
        if (TargetW) {
            TargetW = Math.round((TargetW) * 10) / 10;
            localStorage["TargetW_" + UserID] = TargetW; //TODO
            var WMax = +TargetW + 5;
            var WMin = +TargetW - 5;
            $("#MBW_txt1").html(Math.round(WMin));
            $("#MBW_txt2").html(Math.round(WMax));
        } else {
            Log.write("TargetW is empty", 'SaveUserData');
        }

        Measure.readByMType("BW");
        Member.showDisplayName();
        FnPoint.showPointTotal();

        localStorage["UserDataSet_" + UserID] = new Date().getTime();
        Log.write("Age: " + Age, "SaveUserData");

        var MData = {
            Height: Height,
            Gender: Gender,
            Age: Age
        };

        MeasureInfo.MType = "BW";
        var UserInfo = {
            UserID: UserID,
            NickName: NickName,
            Bir: Bir,
            UserType: UserType,
            Gender: Gender,
            Height: Height,
            Age: Age
        };

        Member.SysUserDataToCloud(UserInfo, function () {
            Member.UpdateUserData(UserID, function () {
                WiseScripts.Tool.NoBack = false;
                WiseScripts.Tool.NoBackMsg = "";
                app.onBack();

                setTimeout(function () {
                    var isCheckMData = "N";
                    MeasureManual.insertMData(MData, UserID, isCheckMData);
                }, 1000);
            });

        });

    },

    SysUserDataToCloud: function (UserInfo, successFn, errFn) {
        if (!NetStatusFn.getNetFlag()) { //無網路狀態
            FnCtrl.alert("目前無網路，無法更新使用者資料。");
            if (successFn) {
                successFn();
            }
            return;
        }

        var UserData = UserInfo.UserID + "," + UserInfo.UserType + "," + UserInfo.Gender + "," + UserInfo.Height + "," + UserInfo.Age + "," + UserInfo.Bir + "," + UserInfo.NickName;
        Log.alert(UserData, "Member.js SysUserDataToCloud");

        var SystemModel = AppConfig.SystemModel; 

        WiseAES.enpryptAES(UserData, AppConfig.ASKey1, AppConfig.ASKey2, "T", function (result) {
            Log.alert(result, "Member.js SysUserDataToCloud Ajax");

            $.ajax({
                type: "POST",
                url: AppConfig.AppServices + "/SetUserInfo",
                data: {
                    SystemModel: SystemModel,
                    DataString: encodeURI(result),
                    type: "SetUserInfo"
                },
                //dataType: "json",
                timeout: 10000, // in milliseconds
                success: function (result) {
                    Log.alert(result, "Member SysUserDataToCloud");
                    if (result == "OK") {
                        window.plugins.toast.showShortBottom($.i18n("使用者資料已同步雲端"), null, null);
                        if (successFn) {
                            successFn();
                        }
                    } else {
                        if (errFn) {
                            errFn();
                        }
                    }
                },
                error: function (request, status, err) {
                    alert(err);
                }
            });
        });
    }
};