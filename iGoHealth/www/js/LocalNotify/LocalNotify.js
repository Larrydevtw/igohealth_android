//使用Plugin 
//Moment.js (https://momentjs.com/)
//cordova-plugin-local-notifications (https://github.com/katzer/cordova-plugin-local-notifications)
var LocalNotify = LocalNotify || {},
    LocalNotify = {
        lTimes: ["07:00", "10:00", "11:30", "14:30", "17:30", "19:30", "22:00"], //SA_Time
        lActives:["N","N","N","N","N","N","N"], //SA_Active
        lKeys:[], //SA_NO
        lTimeTypes:["1","2","3","4","5","6","7"], //SA_Memo
        smallIcon: 'res://push_icon.png',
        icon: 'file://images/push_icon.png',
        init: function (successFn,errFn) { //依據帳戶切換提醒 暫時未使用            
            LocalNotify.get().then(function (objResult) {
                Log.write('success', 'init get');
                Log.write(JSON.stringify(objResult), 'LocalNotify.get()');
                LocalNotify.lTimes = objResult.lTimes;
                LocalNotify.lActives = objResult.lActives;
                LocalNotify.lKeys = objResult.lKeys;
                return LocalNotify.iniTime();
            }).then(function () {
                return LocalNotify.iniActive();
            }).then(function () {
                //alert("success");
                if (successFn) {
                    successFn();
                }
            });
            
            // var d = moment().add(1, 'days').hours(10).minutes(0).seconds(0);
            // //Log.write(d, 'LocalNotify init');
            // d = moment().hours(10).minutes(11).seconds(12);
            // //Log.write(d, 'LocalNotify init');

            // var time = parseInt($('#txtTime').val());
            // var type = $("#ddlType").val();
            // var date = moment().date();
            // var month = moment().month() + 1;
            // var year = moment().year();
            // alert(date + "/" + month + "/" + year, 'LocalNotify init');
            // alert(time + type, 'LocalNotify init');
            // cordova.plugins.notification.local.schedule([{
            //         id: 1,
            //         title: 'My first notification1',
            //         text:'123123'
            //     }, 
            //     {
            //         id: 2,
            //         title: 'My first notification2',
            //         smallIcon: LocalNotify.smallIcon,
            //         icon: LocalNotify.icon
            //     },
            //     {
            //         id: 3,
            //         title: 'My first notification3',
            //         smallIcon: LocalNotify.smallIcon,
            //         icon: LocalNotify.icon
            //     }
            // ]);
            // cordova.plugins.notification.local.schedule({
            //     title: 'The big survey',
            //     text: 'Are you a fan of RB Leipzig?',
            //     attachments: ['/imgages/logoA.png'],
            //     // actions: [
            //     //     { id: 'yes', title: 'Yes' },
            //     //     { id: 'no', title: 'No' }
            //     // ],
            //     trigger: {
            //         every: {
            //             hour: time,
            //             minute: 0
            //         }
            //     }
            //     //trigger: { every: 'minute'}
            // });
        },
        get:function(){
            return new Promise(function(resolve,reject){
                var freq = 'day';
                var userID = localStorage.UserID;
                var strSql = "select SA_NO,SA_Title,SA_Time,SA_Text,SA_Freq,SA_Active";
                strSql+=" from SetAlarm where UserID = '" + userID + "' and SA_Freq='"+freq+"' order by SA_Memo;";
                DAOFn.Query('', strSql, function ResultFun(result) {
                    var objList = $.parseJSON(result);
                    var objResult={};
                    Log.alert(objList.length,"LocalNotify get");
                    if (objList.length == 0) {
                        Log.write('無資料');
                    } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                        Log.write('查詢錯誤');
                    } else {
                        Log.write('有資料',"LocalNotify.get");
                        var lTimes=[];
                        var lActives = [];
                        var lKeys =[];
                        $.each(objList, function (i, item) {
                            lTimes.push(objList[i].SA_Time);
                            lActives.push(objList[i].SA_Active);
                            lKeys.push(objList[i].SA_NO);
                        });
                        objResult={
                            lTimes:lTimes,
                            lActives:lActives,
                            lKeys:lKeys
                        };
                    }
                    objResult.lResults=objList;
                    resolve(objResult);
                });
            });
        },
        save: function (InsertArray, successFn) { //儲存設定至Table SetAlarm
            Log.write(JSON.stringify(InsertArray), "LocalNotify save");
            var UserID = localStorage.UserID;
            var strSql = "delete from SetAlarm";
            strSql += " where UserID = '" + UserID + "'";
            //strSql += " and (SA_UP_Date IS NULL or SA_UP_Date='')";
            DAOFn.Query("", strSql, function () {
                DAOFn.MutiInsertData('', 'SetAlarm', InsertArray, function ResultFun(result) {
                    Log.write("success", "LocalNotify save");
                    if (successFn) {
                        successFn();
                    }
                });
            });
        },
        iniTime: function (lTimes) {
            if(!lTimes){
                lTimes=LocalNotify.lTimes;
            }

            return new Promise(function (resolve, reject) {
                var index = 0;
                $('#Timenotice .timepicker').each(function () {
                    var timeId = $(this).attr("id");
                    var timeVal = lTimes[index]; //$(this).val();
                    Log.write("timeId:" + timeId + "," + index + ":" + timeVal, 'LocalNotify iniTime');
                    var key=timeId.replace("notifyTime","");
                    var successFn = "function(){LocalNotify.onChangeTime('notifyTime"+key+"','notifyActive"+key+"');}";
                    DateTimeFun.iniTime(timeId, timeVal, successFn);
                    index++;
                });
                resolve(index);
            });
        },
        iniActive:function(lKeys,lActives){
            Log.write("iniActive",'iniActive');
            if(!lKeys){
                lKeys=LocalNotify.lKeys;
            }
            if(!lActives){
                lActives=LocalNotify.lActives;
            }
            return new Promise(function(resolve,reject){
               $("#Timenotice input[type='checkbox']").each(function(i){
                    var active=lActives[i]==="Y"?true:false;
                    $(this).prop("checked",active);

                    $(this).attr("data-key",lKeys[i]);
                    // console.log($(this).prop("checked"));
               });
               resolve();
            });
        },
        getDefaultTime: function () { //預設量測提醒資料設定
            return new Promise(function (resolve, reject) {
                var arrResult = [];
                var userID = localStorage.UserID;
                var date = moment().format("YYYY/MM/DD HH:mm");
                var lTime = LocalNotify.lTimes;
                var lTimeTypes = LocalNotify.lTimeTypes;
                var notifyType= $.i18n("血糖");
                for (var i = 0; i < lTime.length; i++) {
                    var time = lTime[i];
                    var timeType=lTimeTypes[i];
                    var timeHHmm = time.split(':');
                    var HH = timeHHmm[0];
                    var mm = timeHHmm.length > 1 ? timeHHmm[1] : "00";
                    var title = $.i18n("量測提醒");
                    var message = $.i18n("$1提醒您，$2記得量測$3喔!", $.i18n(Domain.AppName), time, notifyType);

                    var startTime = moment().hours(HH).minutes(mm).format("YYYY/MM/DD HH:mm");
                    var endTime = moment().add(365, "days").hours(HH).minutes(mm).format("YYYY/MM/DD HH:mm");
                    // console.log(startTime);
                    arrResult.push({
                        "UserID": userID,
                        "SA_Title": title,
                        "SA_Time": time,
                        "SA_Text": message,
                        "SA_Freq": "day",
                        "SA_Start": startTime,
                        "SA_End": endTime,
                        "SA_Memo": timeType,
                        "SA_Active": "N",
                        "SA_CR_Date": date,
                        "SA_UP_Date": ""
                    });
                }
                resolve(arrResult);
            });
        },
        switch: function (notifyInfo) { //鬧鐘設定切換
            var notifyType= $.i18n("血糖");
            var time = notifyInfo.time;
            var active=notifyInfo.active;
            var SA_NO=notifyInfo.SA_NO;
            var message = $.i18n("$1提醒您，$2記得量測$3喔!", $.i18n(Domain.AppName), time, notifyType);
            var title=$.i18n('量測提醒');
            var date = moment().format("YYYY/MM/DD HH:mm");
            var timeHHmm = time.split(':');
            var HH = timeHHmm[0];
            var mm = timeHHmm.length > 1 ? timeHHmm[1] : "00";
            var startTime = moment().hours(HH).minutes(mm).format("YYYY/MM/DD HH:mm");
            var endTime = moment().add(365, "days").hours(HH).minutes(mm).format("YYYY/MM/DD HH:mm");

            var params = {
                "SA_Title": title,
                "SA_Active": active,
                "SA_Time": time,
                "SA_Text": message,
                "SA_Start": startTime,
                "SA_End": endTime,
                "SA_UP_Date": date
            };
            DAOFn.UpdateData('','SetAlarm',params,'SA_NO',SA_NO,'',
                function ResultFun(result) { 
                    Log.alert('success resultFun_Update:' + result);
                    if(active==="Y"){
                        LocalNotify.scheduleAll();
                    }else{
                        LocalNotify.unSchedule(SA_NO);
                    }
                }
            );
        },
        onChangeActive: function (id, obj) { //鬧鐘設定開關改變事件
            var time = $("#" + id).val();
            var active=$(obj).prop("checked")?"Y":"N";
            var SA_NO=$(obj).attr("data-key");
            
            var notifyInfo = {
                "SA_NO": SA_NO,
                "time": time,
                "active": active    
            };
            LocalNotify.switch(notifyInfo);
        },
        onChangeTime: function (timeId,activeId) { //鬧鐘設定時間改變事件
            var time = $("#"+timeId).val();
            var active=$("#"+activeId).prop("checked")?"Y":"N";
            var SA_NO=$("#"+activeId).attr("data-key");

            var notifyInfo = {
                "SA_NO": SA_NO,
                "time": time,
                "active": active    
            };
            LocalNotify.switch(notifyInfo);
        },
        getScheduleAll: function (userID) { //依據使用者撈取通知設定
            return new Promise(function (resolve, reject) {
                var freq = "day";
                var strSql = "select SA_NO,SA_Title,SA_Time,SA_Text,SA_Freq,SA_Active";
                strSql += " from SetAlarm where UserID = '" + userID + "' and SA_Active='Y' and SA_Freq='" + freq + "' order by SA_Time;";
                DAOFn.Query('', strSql, function ResultFun(result) {
                    var arrResult=[];
                    var objList = $.parseJSON(result);
                    if (objList.length == 0) {
                        Log.write('無資料');
                    } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                        Log.write('查詢錯誤');
                    } else {
                        Log.write('有資料');
                        $.each(objList, function (i, item) {
                            var timeHHmm = objList[i].SA_Time.split(':');
                            var HH = parseInt(timeHHmm[0]);
                            var mm = timeHHmm.length > 1 ? parseInt(timeHHmm[1]) : 0;
                            var notify = {
                                id: objList[i].SA_NO,
                                title: objList[i].SA_Title,
                                text: objList[i].SA_Text,
                                smallIcon: LocalNotify.smallIcon,
                                icon: LocalNotify.icon,
                                trigger: {
                                    every: {
                                        hour: HH,
                                        minute: mm
                                    }
                                },
                                foreground: true,
                                // attachments: ['file://images/devices/5050/ETB04.jpg'],
                                // actions: [
                                //     { id: 'Y', title: '是' },
                                //     { id: 'N',  title: '否' }
                                // ]
                            };
                            arrResult.push(notify);
                        });
                    }
                    resolve(arrResult);
                });
                
            });

        },
        scheduleAll: function (successFn) { //設定鬧鐘設置
            // var timeHHmm = notifyInfo.SA_Time.split(':');
            // var HH = parseInt(timeHHmm[0]);
            // var mm = timeHHmm.length > 1 ? parseInt(timeHHmm[1]) : 0;
            // Log.write(JSON.stringify(notifyInfo));
            cordova.plugins.notification.local.hasPermission(function (granted) { 
                if(!granted){
                    FnCtrl.alert($.i18n('請至應用程式設定中開啟通知功能!'));
                }
            });
            cordova.plugins.notification.local.cancelAll(function(result){
                Log.alert(result);
                var userID = localStorage.UserID;
                LocalNotify.getScheduleAll(userID).then(function(arrResult){
                    Log.alert(JSON.stringify(arrResult));
                    cordova.plugins.notification.local.schedule(arrResult);
                });
            });
        },
        unscheduleAll: function (successFn) { //設定鬧鐘設置
            cordova.plugins.notification.local.cancelAll(function(result){
                if(successFn){
                    successFn();
                }
            });
        },
        unSchedule: function (id, fn) { //TODO取消設定鬧鐘設置
            //alert(id);
            cordova.plugins.notification.local.cancel(id, function () {
                // Notification was cancelled
                //alert(id+"cancel");
            });
            //parent.navigator.notification.alert("cancel");
            //alert("取消設定鬧鐘設置");
            if (fn !== undefined && fn != null) {
                fn();
            }
        },

        // unactive: function (id) { //取消提醒
        //     //新增一筆資料並取得流水號(db name,資料表名稱string,欲寫入的欄位陣列object,執行結果回傳函數)
        //     //回傳值：成功→空字串、失敗→錯誤訊息
        //     //使用方式：
        //     var Params = {
        //         'SA_Active': "N"
        //     };
        //     //alert("取消提醒");
        //     DAOFn.UpdateData('', 'SetAlarm', Params, 'SA_NO', id, '', function ResultFun(result) {
        //         if (result == "") {
        //             fn_UnSchedule(id);
        //         }
        //     });
        // },
        // onActiveByUser: function (ID, CB) { //取消該使用者所有提醒(登出的時候執行)
        //     var strSQL = "select * from SetAlarm Where UserID= '" + ID + "'";
        //     DAOFn.Query("", strSQL, function ResultFun(result) {
        //         var objList = $.parseJSON(result);
        //         if (objList.length == 0) {
        //             //alert("無資料");
        //             return;
        //         } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
        //             //alert("查詢錯誤");
        //             return;
        //         } else {
        //             //alert("有資料");
        //             $.each(objList, function (i, item) {
        //                 var SA_NO = item.SA_NO;
        //                 //帳號登出 清除該使用者的鬧鐘設定
        //                 fn_AlarmCancel(SA_NO, function () {
        //                     //alert("N");
        //                 })
        //             });
        //         }
        //     });
        // }

    };