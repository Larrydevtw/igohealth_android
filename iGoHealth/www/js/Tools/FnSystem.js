var FnSystem = {
  LastSyncTime: "",
  isAutoSyncData: "N",
  DebugMode: "N",
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
        Platform: DeviceInfo.GetOS(),
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
          Platform: DeviceInfo.GetOS(),
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
        Platform: DeviceInfo.GetOS(),
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

    lAppInfo.forEach(function (appInfo, idx) {
      Log.write(JSON.stringify(appInfo), "ShowByGroup");

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
          FnSystem.CheckMType(message,function(){
            if(successFn){
              successFn();
            }
          });
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
        default: //
          //FnCtrl.alert(strResult);
          break;
      }

      Log.write(idx, "FnSystem ShowByGroup idx");
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
            var OS = DeviceInfo.GetOS();
            var url = "";

            window.open(url);
            if (OS === "iOS") {
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
    Log.write(JSON.stringify(appInfo), "FnSystem CheckStandardValue");

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
    $("#StandardInfo").html(displayStandardValue);

    var StandardInfo = JSON.parse(strStandardInfo);
    var VersionNo = StandardInfo.VersionNo;

    var CurrentVersionNo = localStorage.StandardVersion;

    Log.write(
      "VersionNo: " + VersionNo + " CurrentVersionNo: " + CurrentVersionNo,
      "FnSystem CheckStandardValue"
    );

    if (VersionNo <= CurrentVersionNo) {
      Log.write("The same VersionNo", "FnSystem CheckStandardValue");
    } else {
      Log.write("Need to Update StandardValue", "FnSystem CheckStandardValue");

      FnSystem.UpdateStandardValue(
        function () {
          localStorage.StandardVersion = VersionNo;
        },
        function (err) {
          Log.write(err, "FnSystem CheckStandardValue");
        }
      );
    }
  },
  UpdateStandardValue: function (successFn, errFn) {
    var UploadData = {
      Platform: DeviceInfo.GetOS(),
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

        Log.write(result, "FnSystem UpdateStandardValue");

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
        Log.write("UpdateStandardValue err:" + err, "FnSystem");
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
    if (FnSystem.DebugMode == "" || FnSystem.DebugMode == "N") {
      //console.log("FnSystemLog" + action + ":" + message);
    } else {
      FnSystem.QueueLog(message, action, successFn);
    }
  },
  QueueLog: function (message, action) {
    var LogData = {
      Platform: DeviceInfo.GetOS(),
      PlatformVersion: DeviceInfo.GetPlatformVersion(),
      Version: Domain.Version,
      VersionNo: Domain.VersionNo,
      ID: localStorage.UserID,
      Action: action,
      Message: message,
    };

    var arrLogData = localStorage.arrLogData + "";
    if (arrLogData != "") {
      arrLogData += "^" + JSON.stringify(LogData);
    } else {
      arrLogData = JSON.stringify(LogData);
    }
    localStorage.arrLogData = arrLogData;
  },
  CallQueueLog: function (successFn, errFn) {
    if (FnSystem.DebugMode == "" || FnSystem.DebugMode == "N") {
      // alert("FnSystem.DebugMode:" + FnSystem.DebugMode);
      return;
    }
    // alert("FnSystem.DebugMode:" + FnSystem.DebugMode);
    var action = "QueueLog";
    var message = localStorage.arrLogData + "";
    FnSystem.CallLog(
      action,
      message,
      function () {
        localStorage.arrLogData = "";
        if (successFn) {
          successFn();
        }
      },
      function () {
        if (errFn) {
          errFn();
        }
      }
    );
  },
  CallLog: function (action, message, successFn, errFn) {
    var UploadData = {
      Platform: DeviceInfo.GetOS(),
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
          successFn();
        }
      },
      function (err) {
        //失敗
        Log.write("Log err:" + err, "Log");
        if (errFn) {
          errFn();
        }
      }
    );
  },
};
