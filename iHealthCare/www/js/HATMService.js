var HATMService = HATMService || {},
    HATMService = {
        SaveStandardJSON: function (successFn, errFn) {
            Log.write("SaveStandardJSON start","SaveStandardJSON");

            try{
                var filePath = "./js/data/StandardVal.json"; //$("#testSql").val();
                $.getJSON(filePath, function (InsertArray) {

                    HATMService.SaveStandardJSONFromData(InsertArray,function(){
                        if (successFn) {
                            successFn();
                        }
                    },function(result){
                        if (errFn) {
                            errFn(result);
                        }
                    });
                });
            }catch(err){
                if(errFn){
                    errFn(err);
                }
            }

        },
        SaveStandardJSONFromData: function (InsertArray, successFn, errFn) {
            ProjectFn.Wait([function (next) {
                DAOFn.Query("", "delete from StandardJSON", function (result) {
                    Log.write("resultFun_Insert:" + result, "SaveStandardJSON delete");
                    next();
                });
            }], function () {
                DAOFn.MutiInsertData('', 'StandardJSON', InsertArray, function (result) {
                    Log.write("resultFun_Insert:" + result, "SaveStandardJSON MutiInsertData");
                    if (result == "") {
                        if (successFn) {
                            successFn();
                        }
                    } else {
                        if (errFn) {
                            errFn(result);
                        }
                    }
                });
            });
        },
        RegisterSite: function (successFn, errFn) {
            //Log.write("AAA","HATMService RegisterSite");
            //WiseScripts.Tool.ShowLoading(true, "載入雲端設定檔...");
            //判斷是否有註冊資料
            DAOFn.Query('', 'select * from StationInfo',
                function (result) {
                    //Log.alert(result, "RegisterSite");
                    var objList = $.parseJSON(result);
                    if (objList.length == 0) { //如果沒有註冊資料，進行註冊動作//跳出「抓取雲端設定中，請稍待..」

                        Log.alert("尚未註冊，進行註冊", "HATMServices RegisterSite");
                        //記錄認證成功資訊=====
                        HATMService.SaveSiteInfo(function () {
                            WiseScripts.Tool.ShowLoading(false, '', '', function () {
                                Log.write($.i18n('同步成功，歡迎使用。'), "註冊成功");
                                var msg = $.i18n('同步成功，歡迎使用。');
                                Log.Toast(msg);

                                if (successFn) {
                                    successFn();
                                }
                            });
                        });
                    } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) { //資料庫錯誤
                        alert("資料庫錯誤:" + JSON.stringify(objList[0]));
                        if (errFn) {
                            errFn();
                        }
                    } else { //已有註冊
                        //檢查ServiceInfo 版本
                        HATMService.ChkServicesInfo(function () {
                            WiseScripts.Tool.ShowLoading(false, '', '', function () {
                                if (successFn) {
                                    successFn();
                                }
                            });

                        });
                    }
                }
            );
        },
        GetAppInfo: function (successFn, errFn) { //TODO
            DAOFn.Query('', 'select * from AppInfo',
                function (result) {
                    var objList = $.parseJSON(result);
                    if (objList.length == 0) { //如果沒有註冊資料，進行註冊動作//跳出「抓取雲端設定中，請稍待..」
                        Log.write("沒有註冊資料", "HATMSERVICES GetAppInfo");
                    } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) { //資料庫錯誤
                        alert("資料庫錯誤:" + JSON.stringify(objList[0]));
                        if (errFn) {
                            errFn();
                        }
                    } else { //已有註冊
                        if (successFn) {
                            successFn();
                        }
                    }
                }
            );
        },
        SaveServicesInfo: function (successFn) { //TODO
            DAOFn.Query('', 'delete from ServicesInfo',
                function (strResult) {
                    if (AppConfig.serviceFromLocal) { //是否從本機撈取Service Url路徑
                        //單一table新增多筆資料(db name,資料表名稱string,欲寫入的欄位陣列object,執行結果回傳函數)
                        //回傳值：成功→空字串、失敗→錯誤訊息
                        var InsertArray = AppConfig.lServiceUrl;
                        DAOFn.MutiInsertData('', 'ServicesInfo', InsertArray, function ResultFun(result) {
                            if (result == "") {
                                Log.write("ServicesURL 新增完成", "iniDB ServicesURL");
                                var serviceVer = AppConfig.serviceVer;
                                Log.write(serviceVer, "iniDB ServicesURL");
                                ProjectFn.setSysParams("mSys", "ServiceVersion", serviceVer, function (msg) {
                                    Log.write("ServiceVersion 設定完成", "iniDB ServicesURL");
                                    if (successFn) {
                                        successFn();
                                    }

                                });
                            } else {
                                Log.write("ServicesURL 新增失敗，原因:" + result, "iniDB ServicesURL");
                            }
                        });
                    }

                    //TODO暫時不用這個流程
                    // var objList = $.parseJSON(strResult);
                    // if (objList.length == 0) {

                    //     for (var i = 0; i < R.StationParameter.ServiceInfo.length; i++) {
                    //         var ServicesName = WiseScripts.IO.isEmpty(R.StationParameter.ServiceInfo[i].WSID);
                    //         var ServicesURL = WiseScripts.IO.isEmpty(R.StationParameter.ServiceInfo[i].WSValue);
                    //         var Params = {
                    //             'ServicesName': ServicesName,
                    //             'ServicesURL': ServicesURL
                    //         };
                    //         Log.write(ServicesName + ServicesURL, "iniDB ServicesURL");
                    //         //寫入服務資訊
                    //         DAOFn.InsertData('', 'ServicesInfo', Params,
                    //             function (strResult) {
                    //                 if (strResult == "") {
                    //                     //Log.write("服務資訊更新成功");
                    //                 }
                    //                 else {
                    //                     Log.write("服務資訊更新失敗" + strResult);
                    //                 }

                    //             });
                    //     }
                    //     Log.write("服務資訊更新完成");
                    // }
                    // else {
                    //     Log.write("服務DB刪除失敗：" + strResult)
                    // }

                }
            );
        },
        ChkServicesInfo: function (successFn) {
            ProjectFn.getSysParams("mSys", "ServiceVersion", function (version) {
                var serviceVer = AppConfig.serviceVer;
                if (version == "" || version < serviceVer) {
                    Log.alert("serviceVer:" + serviceVer + "\nversion:" + version + "，ServiceInfo無版本紀錄或是版本較舊，重新載入Service", "HATMService ChkServicesInfo");
                    HATMService.SaveServicesInfo(function () {
                        if (successFn) {
                            successFn();
                        }
                    });

                    return;
                }


                Log.alert("serviceVer:" + serviceVer + "\nversion:" + version + "，使用目前ServiceInfo版本", "HATMService ChkServicesInfo");
                if (successFn) {
                    successFn();
                }
            });

        },
        SaveSiteInfo: function (successFn, errFn) { //RegisterAccount, RegisterCode, StationParameterXML, UpList) {
            var RegisterAccount = "Larry";
            var RegisterCode = "AAA";
            //var StationParameterXML={};
            //var UpList;
            var Params;
            Log.write("SaveSiteInfo","SERVICES");
            HATMService.SaveServicesInfo(function () {
                DAOFn.Query('', 'delete from StationInfo',
                    function (strResult) {
                        var objList = $.parseJSON(strResult);
                        if (objList.length == 0) {

                            try {
                                var d = new Date();
                                d.setTime(d.getTime() - 1000 * 60 * 5);

                                Params = {
                                    'ESynTime': WiseScripts.IO.isEmpty(WiseScripts.Format.Date_yyyyMMddHHmmss(d)),
                                    'StationAccount': WiseScripts.IO.isEmpty(RegisterAccount),
                                    'StationLicense': WiseScripts.IO.isEmpty(RegisterCode)
                                    // , 'StationNo': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_StationNo)
                                    // , 'StationCode': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_StationCode)
                                    // , 'StationName': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_StationName)
                                    // , 'StationDeadline': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_StationDeadline)
                                    // , 'IsAutoUpdate': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_IsAutoUpdate)
                                    // , 'ShuntDays': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_ShuntDays)
                                    // , 'ShuntTime': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_ShuntTime)
                                    // , 'IsShowPowerOff': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_IsShowPowerOff)
                                    // , 'IsShowUID': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_IsShowUID)
                                    // , 'IsPrint': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_IsPrint)
                                    // , 'PtCompany_CH': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_PtCompany_CH)
                                    // , 'PtCompany_EN': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_PtCompany_EN)
                                    // , 'PtAddress_CH': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_PtAddress_CH)
                                    // , 'PtAddress_EN': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_PtAddress_EN)
                                    // , 'PtTEL': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_PtTEL)
                                    // , 'PtWeb': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_PtWeb)
                                    // , 'VideoLink': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_VideoLink)
                                    // , 'BackgroundA_F': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_BackgroundA_F)
                                    // , 'BackgroundB_F': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_BackgroundB_F)
                                    // , 'BackgroundC_F': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_BackgroundC_F)
                                    // , 'BackgroundA_S': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_BackgroundA_S)
                                    // , 'BackgroundB_S': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_BackgroundB_S)
                                    // , 'BackgroundC_S': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_BackgroundC_S)
                                    // , 'LogoA': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_LogoA)
                                    // , 'LogoB': WiseScripts.IO.isEmpty(R.StationParameter.StationInfo.cfg_LogoB)
                                    // , 'UpID': WiseScripts.IO.isEmpty(UpList[0])
                                    // , 'UpCode': WiseScripts.IO.isEmpty(UpList[1])
                                    // , 'UpKey1': WiseScripts.IO.isEmpty(UpList[2])
                                    // , 'UpKey2': WiseScripts.IO.isEmpty(UpList[3])
                                };
                            } catch (e) {
                                Log.write(e, "錯誤 iniDB.js SaveSiteInfo");
                            }

                            /*
                            for (var key in Params) {
                                Log.write(key + "," + Params[key]);
                            }
                            */

                            //寫入站點資訊
                            DAOFn.InsertData('', 'StationInfo', Params,
                                function (strResult) {
                                    if (strResult == "") {
                                        Log.alert("站點資訊更新成功", "iniDB.js SaveSiteInfo");

                                        if (successFn) {
                                            successFn();
                                        }
                                        //呼叫圖片設定
                                        //SetPictures();

                                        //啟用站點回報功能
                                        //TODO
                                    } else {
                                        Log.write("站點資訊更新失敗" + strResult, "iniDB.js SaveSiteInfo");
                                    }
                                });
                        } else {
                            Log.write("站點DB刪除失敗" + strResult);
                            if (errFn) {
                                errFn();
                            }
                        }
                    });
            });

        },

    };