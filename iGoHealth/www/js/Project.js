//這邊放整個APP共用的相關程式

//var ReRegister = false;

var UserKind = AppConfig.UserKind;
/*
1:RFID卡號
2:身分證
3:識別號
4:健保卡
5:指靜脈
6:QRCODE(帳號編碼)
7:會員帳號
8:手機機碼
9:會員流水號(M_No)
A:台北健康雲
B:新竹健康雲
C:台南健康雲
*/

var Project = Project || {}, Project =
    {
        AppInit: function () {
            Log.write("AppIni","Project.js");
            window.addEventListener('native.keyboardshow', function (e) {//TODO 確認功能
                setTimeout(function () {
                    document.activeElement.scrollIntoViewIfNeeded();
                }, 100);
            });

            if (WiseScripts.Tool.MobileType.IsiOS()){
                $("#sysCloseMenu").hide();
            }

            RecView.push("login_page");
            sessionStorage.WhereAmI = 'login_page';
            sessionStorage.mainHomeLocation = 'login_page'; //畫面導覽 站存目前所在頁面

            //畫面初始化調整
            // $("#menu").hide(); //選單
            // $(".MegCount").hide(); //TODO 訊息通知

            //$("body").disableSelection(); //讓網頁內的文字無法被選取 //2021.06.15移除，因為需使用JqueryUI
            
            Log.write("判斷是否自動登入 localStorage.UserID:" + localStorage.UserID, "Project.js AppInit");
            //判斷是否自動登入
            if (localStorage.UserID) {
                Log.write("自動登入", "Project.js AppInit");

                //RecView.push('MainHome');
                var Pwd = localStorage.UserPS;
                var UserID = localStorage.UserID;

                document.getElementById("login_userId").value = UserID;
                document.getElementById("login_userPwd").value = Pwd;

                WiseScripts.Tool.NextPop('login_page', function () {
                    Member.Login();
                }, null, 'T');
                // WiseAES.decryptAES(Pwd, AppConfig.ASKey1, AppConfig.ASKey2, "T",
                //     function (result) {
                //         Pwd = result;
                //         Log.write(Pwd,"解密後 local Pwd");
                //         document.getElementById("login_userId").value = UserID;
                //         document.getElementById("login_userPwd").value = Pwd;

                //         WiseScripts.Tool.NextPop('login_page', function () {
                //             Member.Login();
                //         }, null, 'T');
                //     },
                //     function () {
                //         Log.write("解密失敗");
                //     }
                // );
            }
            $("#txtReleaseVer").text(Domain.Version);
            $("#txtReleaseVer_Menu").text(Domain.Version);           
        },
        
        // GetVersion:function() { //TODO 需加入 cordova-plugin-app-version
        //     var result="";
        //     cordova.getAppVersion.getVersionNumber().then(function (version) {
        //         var ver = version.split(".");
        //         result=ver[0] + "." + WiseScripts.IO.padLeft(ver[1], 2, '0') + "." + WiseScripts.IO.padLeft(ver[2], 2, '0');
        //         Log.write(result,"GetVersion Result");
        //         return result;
        //     });
        // },
        ShowDataPick: function (ObjID, TheMode) {
            Keyboard.hide();
            Log.alert(ObjID,"ShowDataPick");
            var TheDate = new Date();

            if ($("#" + ObjID).val().length > 0) {
                var tmp = $("#" + ObjID).val().split('/');
                TheDate.setFullYear(tmp[0]);
                TheDate.setMonth(parseInt(tmp[1]) - 1);
                TheDate.setDate(tmp[2]);
            }
            else {
                TheDate.setFullYear(TheDate.getFullYear() - 40);
            }


            if (WiseScripts.Tool.MobileType.IsiOS()) {
                options = {
                    date: TheDate,
                    mode: TheMode,
                    locale: 'zh_tw'
                };
            }
            else {
                options = {
                    date: (TheDate.getMonth() + 1) + "/" + TheDate.getDate() + "/" + TheDate.getFullYear() + "/" + TheDate.getHours() + "/" + TheDate.getMinutes(),
                    mode: TheMode
                };
            }

            function onSuccess(date) {

                switch (TheMode) {
                    case 'datetime':
                        $("#ETime_Date").val(date.getFullYear() + '/' + WiseScripts.IO.padLeft((date.getMonth() + 1), 2, '0') + '/' + WiseScripts.IO.padLeft(date.getDate(), 2, '0'));
                        $("#ETime_H").val(date.getHours());
                        $("#ETime_M").val(date.getMinutes());
                        break;
                    case 'date':
                        $("#" + ObjID).val(date.getFullYear() + '/' + WiseScripts.IO.padLeft((date.getMonth() + 1), 2, '0') + '/' + WiseScripts.IO.padLeft(date.getDate(), 2, '0'));
                        break;
                    case 'time':
                        $("#ETime_H").val(date.getHours());
                        $("#ETime_M").val(date.getMinutes());
                        break;
                }
            }

            function onError(error) { // Android only
                //alert('Error: ' + error);
            }

            datePicker.show(options, onSuccess, onError);
        },
        accMul: function (arg1, arg2) { //處理JS小數點 乘法精準度函數
            var m = 0,
                s1 = arg1.toString(),
                s2 = arg2.toString();
            try {
                m += s1.split(".")[1].length;
            } catch (e) {}
            try {
                m += s2.split(".")[1].length;
            } catch (e) {}
            return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
        },
        accDiv: function (arg1, arg2) {//處理JS小數點 除法精準度函數
            var t1 = 0,
                t2 = 0,
                r1, r2;
            try {
                t1 = arg1.toString().split(".")[1].length;
            } catch (e) {}
            try {
                t2 = arg2.toString().split(".")[1].length;
            } catch (e) {}
            r1 = Number(arg1.toString().replace(".", ""));
            r2 = Number(arg2.toString().replace(".", ""));
            Log.write((r1 / r2) * Math.pow(10, t2 - t1),"accDiv");
            return (r1 / r2) * Math.pow(10, t2 - t1);
        }
    };