var FnSystem = {
  LastSyncTime: "",
  isAutoSyncData: "N",
  DebugMode: "N",
  DevDebugMode:"Y",
  UploadAppInfo: function (successFn, errFn) {
    Log.write("UploadAppInfo", "FnSystem UploadAppInfo");

    Log.write(
      "isEnabledSyncAppInfo:" + localStorage.isEnabledSyncAppInfo,
      "FnSystem"
    );
    Log.write(
      "SyncAppInfo NetStatusFn.getNetFlag()" + NetStatusFn.getNetFlag(),
      "FnSystem"
    );

    if (
      localStorage.isEnabledSyncAppInfo === "N" ||
      !NetStatusFn.getNetFlag()
    ) {
      if (successFn) {
        successFn();
      }
      return false;
    }

    NetStatusFn.getNetInfo(function (NetInfo) {
      Log.write(JSON.stringify(NetInfo), "FnSystem UploadAppInfo");

      var UploadData = {
        ID: localStorage.UserID,
        Platform: DeviceInfo.OS,
        PlatformVersion: DeviceInfo.GetPlatformVersion(),
        Version: Domain.Version,
        VersionNo: Domain.VersionNo,
        NetInfo: NetInfo,
      };

      var UData = {
        UploadData: JSON.stringify(UploadData),
      };

      var PostInfo = {
        Url: AppConfig.AppServices + "/UploadAppInfo",
        UploadData: UData,
        async: true,
      };

      Log.write(PostInfo.Url, "FnSystem UploadAppInfo");

      $.ajax({
        url: PostInfo.Url, //AppConfig.AppServices + "/UploadMData",
        data: PostInfo.UploadData,
        type: "POST",
        timeout: 20000, // in milliseconds
        async: PostInfo.async,
        success: function (clsReturn) {
          //200:回傳值正常，進行後續動作
        },
      });
    });
  },
  SyncAppInfo: function (successFn, errFn) {
    Log.write(
      "isEnabledSyncAppInfo:" + localStorage.isEnabledSyncAppInfo,
      "FnSystem"
    );
    Log.write(
      "SyncAppInfo NetStatusFn.getNetFlag()" + NetStatusFn.getNetFlag(),
      "FnSystem"
    );

    if (
      localStorage.isEnabledSyncAppInfo === "N" ||
      !NetStatusFn.getNetFlag()
    ) {
      if (successFn) {
        successFn();
      }
      return false;
    }

    NetStatusFn.getNetInfo(function (NetInfo) {
      FnSystem.GetLastSyncTime().then(function (LastSyncTime) {
        var UploadData = {
          ID: localStorage.UserID,
          Platform: DeviceInfo.OS,
          PlatformVersion: DeviceInfo.GetPlatformVersion(),
          Version: Domain.Version,
          VersionNo: Domain.VersionNo,
          LastSyncTime: LastSyncTime,
          NetInfo: NetInfo,
        };

        var PostInfo = {
          Url: AppConfig.AppServices + "/SyncAppInfo",
          UploadData: UploadData,
          async: true,
        };

        WSCall.Post(
          PostInfo,
          function (result) {
            //成功
            var LastSyncTime = DateTimeFun.getNow();
            FnSystem.SetLastSyncTime(LastSyncTime);

            FnSystem.ShowByGroup(result,function(){           
              if (successFn) {
                successFn(result);
              }
            });
          },
          function (err) {
            //失敗
            Log.write("SyncAppInfo err:" + err, "FnSystem");
            if (errFn) {
              errFn();
            }
          }
        );
      });
    });
  },
  SyncAuthority: function (successFn, errFn) {
    Log.write(
      "isEnabledSyncAppInfo:" + localStorage.isEnabledSyncAppInfo,
      "FnSystem SyncAuthority"
    );
    Log.write(
      "SyncAppInfo NetStatusFn.getNetFlag()" + NetStatusFn.getNetFlag(),
      "FnSystem SyncAuthority"
    );

    if (
      localStorage.isEnabledSyncAppInfo === "N" ||
      !NetStatusFn.getNetFlag()
    ) {
      if (successFn) {
        successFn();
      }
      return false;
    }
    FnSystem.GetLastSyncTime().then(function (LastSyncTime) {
      var UploadData = {
        Platform: DeviceInfo.OS,
        PlatformVersion: DeviceInfo.GetPlatformVersion(),
        Version: Domain.Version,
        VersionNo: Domain.VersionNo,
        LastSyncTime: LastSyncTime,
        ID: localStorage.UserID,
      };

      var PostInfo = {
        Url: AppConfig.AppServices + "/SyncAuthority",
        UploadData: UploadData,
        async: true,
      };

      WSCall.Post(
        PostInfo,
        function (result) {
          //成功
          var LastSyncTime = DateTimeFun.getNow();
          FnSystem.SetLastSyncTime(LastSyncTime);

          FnSystem.ShowByGroup(result,function() {
            if (successFn) {
              successFn(result);
            }
          });
        
        },
        function (err) {
          //失敗
          Log.write("SyncAppInfo err:" + err, "FnSystem SyncAuthority");
          if (errFn) {
            errFn();
          }
        }
      );
    });
  },
  SetLastSyncTime: function (LastSyncTime) {
    FnSystem.LastSyncTime = LastSyncTime;

    return new Promise(function (resolve, reject) {
      ProjectFn.setSysParams(
        "mSys",
        "LastSyncTime",
        LastSyncTime,
        function (result) {
          Log.write(
            msg + "LastSyncTime:" + LastSyncTime + "，儲存設定至SQLLite中",
            "FnSystem SetLastSyncTime"
          );
          resolve(result);
        }
      );
    });
  },
  GetLastSyncTime: function () {
    return new Promise(function (resolve, reject) {
      ProjectFn.getSysParams("mSys", "LastSyncTime", function (result) {
        Log.write(result, "LastSyncTime");
        resolve(result);
      });
    });
  },
  ShowByGroup: function (strResult, successFn) {
    var lAppInfo = JSON.parse(strResult);

    Log.write("lAppInfo length:" + lAppInfo.length, "FnSystem ShowByGroup");

    lAppInfo.forEach(function (appInfo, idx) {
      Log.write(JSON.stringify(appInfo), "FnSystem ShowByGroup appInfo");

      var group = appInfo.Group;
      var message = appInfo.Message;

      switch (group) {
        case "CheckUpdate":
          FnSystem.CheckUpdate(message);
          break;
        case "CheckStandardValue":
          FnSystem.CheckStandardValue(appInfo);
          break;
        case "CheckAutoSyncData":
          FnSystem.CheckAutoSyncData(message);
          break;
        case "CheckBTModeFunction":
          FnSystem.CheckBTModeFunction(message);
          break;
        case "CheckUpdateUserInfoFunction":
          FnSystem.CheckUpdateUserInfoFunction(message);
          break;
        case "Message":
          var title = appInfo.Title ? appInfo.Title : $.i18n("系統訊息");
          FnCtrl.alert(message, title);
          break;
        case "CheckDevFunction":
          FnSystem.CheckDevFunction(message);
          break;
        case "CheckMType":
          FnSystem.CheckMType(message);
          break;
        case "CheckDeviceINS":
          FnSystem.CheckDeviceINS(message);
          break;
        case "DebugMode":
          FnSystem.DebugMode = message + "";
          if (FnSystem.DebugMode === "Y") {
            $("#aCallQueueLog").show();
          } else {
            $("#aCallQueueLog").hide();
          }
          break;
        case "DevDebugMode":
          FnSystem.DevDebugMode = message + "";
          break;
        default: //
          //FnCtrl.alert(strResult);
          break;
      }
      Log.write("group:" + group + ",idx:" + idx, "FnSystem ShowByGroup idx");

      if(idx == lAppInfo.length-1){
        Log.write("success", "FnSystem ShowByGroup");
        if (successFn) {
          successFn();
        }
      }
    });
  },
  CheckUpdate: function (VersionNo) {
    var displayVersionNo = VersionNo;

    VersionNo = parseInt(VersionNo.replace(/\./g, ""));
    var NowVersionNo = parseInt(Domain.VersionNo.replace(/\./g, ""));

    Log.write(VersionNo, "CheckUpdate");
    Log.write(NowVersionNo, "CheckUpdate");
    if (VersionNo > NowVersionNo) {
      var message = $.i18n("發現新版本:$1，建議前往更新。", displayVersionNo);
      var buttonLabels = [$.i18n("好"), $.i18n("關閉")];
      navigator.notification.confirm(
        message,
        confirmCallback,
        $.i18n("系統訊息"),
        buttonLabels
      );

      function confirmCallback(btnIndex) {
        switch (btnIndex) {
          case 1:
            var OS = DeviceInfo.OS;
            var url = "";

            window.open(url);
            if (OS === "ios") {
              url =
                "itms-apps://itunes.apple.com/us/app/i%E9%A1%A7%E5%81%A5%E5%BA%B7/id1576044908";
            } else {
              url =
                "https://play.google.com/store/apps/details?id=tw.com.ethink.iGoHealth";
            }
            window.open(url);
            break;
          case 0:
          case 2:
            break;
        }
      }
    }
  },
  CheckStandardValue: function (appInfo) {

    var strStandardInfo = appInfo.Message;
    if (strStandardInfo === undefined) {
      Log.write(
        "未取得雲端標準值版本資料，不進行後續檢查",
        "FnSystem CheckStandardValue"
      );
      return;
    }

    //Display StandardValue
    var displayStandardValue = appInfo.Data;
    $("#StandardInfo_Content").html(displayStandardValue);

    var StandardInfo = JSON.parse(strStandardInfo);
    var VersionNo = StandardInfo.versionno;

    var CurrentVersionNo = localStorage.StandardVersion;

    Log.write(
      "VersionNo: " + VersionNo + " CurrentVersionNo: " + CurrentVersionNo,
      "FnSystem StandardValue CheckStandardValue"
    );

    if (VersionNo <= CurrentVersionNo) {
      Log.write(
        "The same or lower VersionNo, No need to upate. return.",
        "FnSystem StandardValue CheckStandardValue"
      );
    } else {
      Log.write(
        "Need to Update StandardValue",
        "FnSystem StandardValue CheckStandardValue"
      );

      FnSystem.UpdateStandardValue(
        function () {
          MeasureInfo.SetStandardVersion(VersionNo);
        },
        function (err) {
          Log.write(err, "FnSystem StandardValue CheckStandardValue");
        }
      );
    }
  },
  UpdateStandardValue: function (successFn, errFn) {
    var UploadData = {
      Platform: DeviceInfo.OS,
      PlatformVersion: DeviceInfo.GetPlatformVersion(),
      Version: Domain.Version,
      VersionNo: Domain.VersionNo,
      StandardVersion: localStorage.StandardVersion,
      ID: localStorage.UserID,
    };

    var PostInfo = {
      Url: AppConfig.AppServices + "/GetStandardJSON",
      UploadData: UploadData,
      async: true,
    };

    // WiseScripts.Tool.ShowLoading(true, $.i18n('資料載入中，請稍候...'));

    WSCall.Post(
      PostInfo,
      function (result) {
        //成功

        Log.write(result, "FnSystem StandardValue UpdateStandardValue");

        var InsertArray = JSON.parse(result);

        HATMService.SaveStandardJSONFromData(
          InsertArray,
          function () {
            //WiseScripts.Tool.ShowLoading(false);
            if (successFn) {
              successFn();
            }
          },
          function (result) {
            //WiseScripts.Tool.ShowLoading(false);
            if (errFn) {
              errFn(result);
            }
          }
        );
      },
      function (err) {
        //失敗
        Log.write(
          "UpdateStandardValue err:" + err,
          "FnSystem StandardValue UpdateStandardValue"
        );
        if (errFn) {
          errFn();
        }
      }
    );
  },
  CheckAutoSyncData: function (isAutoSyncData) {
    var LastSyncTime = FnSystem.LastSyncTime;
    Log.write(LastSyncTime, "FnSystem LastSyncTime");

    FnSystem.isAutoSyncData = isAutoSyncData;
    Log.write(isAutoSyncData, "FnSystem isAutoSyncData");
  },
  CheckBTModeFunction: function (isOpenBTMode) {
    FnBT.isOpenBTMode = isOpenBTMode;
    Log.write(isOpenBTMode, "FnSystem CheckBTModeFunction");
  },
  CheckUpdateUserInfoFunction: function (isUpdateUserInfo) {
    Member.isUpdateUserInfo = isUpdateUserInfo;
    Log.write(isUpdateUserInfo, "FnSystem isUpdateUserInfo");
  },
  CheckDevFunction: function (strJson) {
    Log.write(strJson + " / " + Domain.VersionNo, "FnSystem CheckDevFunction");

    try {
      var lDevFunction = JSON.parse(strJson);

      Domain.lDevFunction = lDevFunction;

      CustomInfo.setFunction();
    } catch (error) {
      Log.write(error, "FnSystem CheckDevFunction");
    }
  },
  CheckMType: function (strJson, successFn) {
    Log.write(strJson + " / " + Domain.VersionNo, "FnSystem CheckMType");

    try {

      var lMType = JSON.parse(strJson);
      if(lMType.indexOf("BG") > 0){
        AppConfig.lMType = lMType;
        // Custom.setMType(lMType);
      }

      if(successFn){
        successFn();
      }

    } catch (error) {
      Log.write(error, "FnSystem CheckMType error");
    }
  },
  CheckDeviceINS: function (strJson) {
    try {
      Log.write(strJson, "CheckDeviceINS");

      var obj = JSON.parse(strJson);
      var Params = obj.Params;
      var TableName = obj.TableName; //DevicesINS
      var PKColumn = obj.PKColumn; //DI_Model
      var PKValue = obj.PKValue;

      if (!obj || !TableName || !PKColumn) {
        Log.write(obj + " / " + TableName + " / " + PKColumn, "CheckDeviceINS");
        return;
      }

      DAOFn.SimpleMerge(
        "",
        TableName,
        Params,
        PKColumn,
        PKValue,
        "",
        function (result) {
          Log.write("更新CheckDeviceINS:" + result);
          if (result == "") {
            if (successFn) {
              successFn();
            }
            //Log.write("成功更新UserInfo","Login saveUserInfo");
          }
        },
        "T"
      );
    } catch (error) {
      Log.write(error, "FnSystem CheckDeviceINS");
    }
  },
  Log: function (message, action, successFn) {
    if (FnSystem.DebugMode === "Y") {
      //console.log("FnSystemLog" + action + ":" + message);
      FnSystem.QueueLog(message, action, successFn);
    } else {
      if (FnSystem.DevDebugMode == "Y") {
        if (action.indexOf("Upload") !== -1) {
          FnSystem.QueueLog(message, action, successFn);
        }
      }
    }
  },
  QueueLog: function (message, action) {
    var LogData = {
      Platform: DeviceInfo.OS,
      PlatformVersion: DeviceInfo.GetPlatformVersion(),
      Version: Domain.Version,
      VersionNo: Domain.VersionNo,
      ID: localStorage.UserID,
      Action: action,
      Message: message,
    };

    var arrLogData = localStorage.arrLogData + "";
    if (arrLogData != "") {
      arrLogData += "`" + JSON.stringify(LogData);
    } else {
      arrLogData = JSON.stringify(LogData);
    }
    localStorage.arrLogData = arrLogData;
  },
  CallQueueLog: function (successFn, errFn) {
    // if (FnSystem.DebugMode == "" || FnSystem.DebugMode == "N") {
    //   // alert("FnSystem.DebugMode:" + FnSystem.DebugMode);
    //   return;
    // }
    // alert("FnSystem.DebugMode:" + FnSystem.DebugMode);
    Log.write(
      "localStorage.arrLogData: " + localStorage.arrLogData,
      "FnSystem CallQueueLog"
    );
    if (!localStorage.arrLogData || localStorage.arrLogData == "") {
      Log.write("沒有檔案需要上傳", "FnSystem CallQueueLog");
      return;
    }
    Log.write(
      "CallQueueLog：開始上傳" + localStorage.arrLogData.length,
      "FnSystem CallQueueLog"
    );
    var action = "QueueLog";
    var message = localStorage.arrLogData + "";
    FnSystem.CallLog(
      action,
      message,
      function (result) {
        localStorage.arrLogData = "";
        Log.write(
          "上傳成功 / " + result,
          "FnSystem CallQueueLog"
        );
        if (successFn) {
          successFn();
        }
      },
      function (err) {
        Log.write(
          "上傳失敗 / " + JSON.stringify(err),
          "FnSystem CallQueueLog"
        );
        if (errFn) {
          errFn();
        }
      }
    );
  },
  CallLog: function (action, message, successFn, errFn) {
    var UploadData = {
      Platform: DeviceInfo.OS,
      PlatformVersion: DeviceInfo.GetPlatformVersion(),
      Version: Domain.Version,
      VersionNo: Domain.VersionNo,
      ID: localStorage.UserID,
      Action: action,
      Message: message,
    };
    var PostInfo = {
      Url: AppConfig.AppServices + "/AppInfoLog",
      UploadData: UploadData,
      async: true,
    };

    WSCall.Post(
      PostInfo,
      function (result) {
        if (successFn) {
          successFn(result);
        }
      },
      function (err) {
        //失敗
        Log.write("Log err:" + err, "Log");
        if (errFn) {
          errFn(err);
        }
      }
    );
  },
};
