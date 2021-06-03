var FnBTPair = {
  ShowPage: function (step) {
    //Log.write("BTMode S", "FnBTPair ");
    $("#ulScanList").html("");
    FnBTPair.BindBTPair();

    ProjectFn.getSysParams("mSys", "BTMode", function (msgFlag) {
      var BTMode = msgFlag;
      Log.write("BTMode:" + BTMode, "ShowPage BTMode");
      //$("#chkBTMode").attr("data-flag",BTMode);
      CustomStyle.iniSwitchToggle("chkBTMode", $.i18n("配對模式"), $.i18n("智能連線模式"), BTMode);

      FnBTPair.ShowByBTMode(BTMode, function () {
        WiseScripts.Tool.NextPop("BluetoothSettingPage_" + step, function () {}, null, "T");
      });
    });
  },
  StartScan: function () {
    //
    Log.write("", "FnBTPair StartScan");
    // FnBT.StartScan(true);
    sessionStorage.BTWin = "Y";
    sessionStorage.BTReady = "N";

    //parent.WiseBT.MySetting.UsingScan = true;
    MSCordovaBLE.MySetting.AutoConnect = false;
    MSCordovaBLE.MySetting.ScanCallBackFn = FnBTPair.ScanBTDev;
    //parent.MSCordovaBLE.MySetting.DisconveryCallBackFn = ScanBTDev;
    //parent.MSCordovaBLE.StartScan();
    if (!cordova.plugins.BluetoothStatus.BTenabled) {
      if (window.cordova.platformId === "android") {
        //android 格式
        // alert("android");
        cordova.plugins.BluetoothStatus.enableBT(); //開啟藍牙(Android Only)
      } else if (window.cordova.platformId === "ios") {
        //ios 格式,ios很嚴謹,如果格式不對則無法 connect !
        FnCtrl.alert($.i18n("請開啟藍牙來接收設備量測資料。"), "");
      }
    }

    MSCordovaBLE.startScan();
  },
  SwitchBTMode: function (_thisCtrl) {
    var BTMode = $(_thisCtrl).attr("data-flag");

    CustomStyle.fn_Toggle("chkBTMode", null, function () {
      ProjectFn.setSysParams("mSys", "BTMode", BTMode, function (msg) {
        Log.write(msg + "FnBTMode:" + BTMode + "，儲存設定至SQLLite中", "FnBTPair SwitchBTMode");
        FnBTPair.ShowByBTMode(BTMode);
      });
    });
  },
  ShowByBTMode: function (BTMode, successFn) {
    if (BTMode == "Y") {
      //true 配對模式
      $("#divBTPair").show();
      // $("#txtBTModeTitle").text($.i18n("配對模式")+" ");
      $("#txtBTModeExplain").text("");
      //$("#txtBTModeExplain").text($.i18n("此模式需先配對設備才可以進行量測。請開啟設備藍牙後，點選下方搜索設備進行設備配對。"));
      Log.write(MSCordovaBLE.MySetting.AutoConnect, "配對模式 MSCordovaBLE.MySetting.AutoConnect");
    } else {
      $("#divBTPair").hide();
      // $("#txtBTModeTitle").text($.i18n("智能連線模式")+" ");
      $("#txtBTModeExplain").text($.i18n("不需配對設備，會自動接收可接收設備量測資料。"));
      Log.write(MSCordovaBLE.MySetting.AutoConnect, "智能連線模式 MSCordovaBLE.MySetting.AutoConnect");
    }

    if (successFn) {
      successFn();
    }
  },
  // exit:function(){
  //     onBack();
  //     Log.write("Exit","FnBTPair");
  // },
  BindBTPair: function () {
    //bind 已配對的藍牙
    //DevName:xxx,DevAdr:111
    //alert(localStorage.getItem("BT40P").toString());
    //FnBT.StartScan(false);

    Log.write("", "FnBTPair BindBTPair");
    ProjectFn.setSysParams(
      "mSys",
      "BT40P",
      localStorage.getItem("BT40P").toString(),
      function (msg) {
        var vDevPairObj = [];

        try {
          vDevPairObj = $.parseJSON(localStorage.getItem("BT40P").toString());
        } catch (err) {
          Log.write(err, "FnBTPair BindBTPair");
        }

        $("#ulPair").html("");
        $.each(vDevPairObj, function (i, item) {
          if (item !== undefined) {
            //$("#ulPair").append("<div class='idKey idKeyP' keyValue ='" + item.DevAdr + "' onclick='delDev(\"" + item.DevName + "\",\"" + item.DevAdr + "\");'>" + item.DevName + "</div>");
            var deviceName = item.DevName;

            FnBT.DeviceToName(deviceName).then(function (result) {

              if (result) {
                deviceName = result + "-" + deviceName;
              }

              var liHTML = "";
              liHTML += "<li class='idKey idKeyP' keyValue ='" + item.DevAdr + "'>";
              liHTML += "<div class='L'><p>" + deviceName + "</p><span>" + item.DevAdr + "</span></div>";
              liHTML += "<div class='R'><a onclick='FnBTPair.delDev(\"" + deviceName + '","' + item.DevAdr + "\");'><i class='wise_close'></i></a></div>";
              liHTML += "</li>";
              $("#ulPair").append(liHTML);

              if ($(".idKeyS[keyValue='" + item.DevAdr + "']").length > 0) {
                $(".idKeyS[keyValue='" + item.DevAdr + "']").remove();
              }
            });
          }
        });
      }
    );
  },
  ScanBTDev: function (device) {
    //掃4.0設備
    Log.write(device, "FnBTPair ScanBTDev");
    //var vScanObjList = [];
    //$("#ulScanList").html("");
    //先停止掃描
    //parent.ble.stopScan(
    //        function () {
    //            parent.Log.write("掃描已停止");
    //            //再開始掃描週邊設備
    //            parent.ble.startScan([], function (device) {
    //                //Log.write("SCANing：" + device.name);//device.id
    if (device.name !== undefined) {
      if ($(".idKey[keyValue='" + device.address + "']").length < 1) {
        //var devInfo = {};
        //devInfo.DevName = device.name;
        //devInfo.DevAdr = device.id;
        //$("#ulScanList").append("<div class='idKey idKeyS' keyValue='" + device.id + "' onclick='addDev(\"" + device.name + "\",\"" + device.id + "\");'>" + device.name + "</div>");
        var deviceName = device.name;
        FnBT.DeviceToName(deviceName).then(function (result) {

          if (result) {
            deviceName = result + "-" + deviceName;
          }

          var liHTML = "";
          liHTML += "<li class='idKey idKeyS' keyValue='" + device.address;
          liHTML += "' onclick='FnBTPair.addDev(\"" + device.name + '","' + device.address + "\");'>";
          liHTML += "<div class='L'><p>" + deviceName + "</p><span>" + device.address + "</span></div>";
          liHTML += "</li>";
          $("#ulScanList").append(liHTML);
        });
      }
    }
    //    });
    //}
    //, function (e) {
    //    parent.Log.write("停止掃描發生錯誤：" + e);
    //    ScanBTDev();
    //});
  },
  addDev: function (DevName, DevID) {
    //加入配對
    Log.write(DevName + " " + DevID, "FnBTPair addDev");
    var vDevPairObj = [];
    try {
      vDevPairObj = $.parseJSON(localStorage.getItem("BT40P").toString()); //json to object
    } catch (err) {
      Log.write(err, "FnBTPair addDev");
    }
    if (localStorage.getItem("LIS_Mode") == "Y") {
      //检验
      if (vDevPairObj.length > 0) {
        navigator.notification.alert(
          $.i18n("檢測模式下僅能配對一台設備!"),
          null,
          $.i18n('系統訊息'),
          "確定"
        );
        return;
      } else {
        BTSetting.SingleDevicePoolingAddress = DevID;
      }
    }
    var devInfo = {};
    devInfo.DevName = DevName;
    devInfo.DevAdr = DevID;
    vDevPairObj.push(devInfo);

    var JsonStr = JSON.stringify(vDevPairObj); //object to json
    localStorage.setItem("BT40P", JsonStr);

    $(".idKeyS[keyValue='" + DevID + "']").remove();
    FnBTPair.BindBTPair();

    var device = {
      name: DevName,
      id: DevID
    };
    var OS = WiseScripts.Tool.MobileType.IsAndroid() ? "android" : "iOS";
    //if(OS==="android"){//TODO IOS目前沒有關機指令，之後再做測試．
    FnBT.SetDeviceTime(device, function () {
      //success
    }, function () {
      //err
    });
    //}
    FnCtrl.alert($.i18n("設備配對成功！"));
  },
  delDev: function (DevName, DevID) {
    //移除配對
    Log.write(DevName + "FnBTPair delDev ");
    navigator.notification.confirm(
      $.i18n("是否移除「$1」此配對？", DevName),
      function (button) {
        if (button == 1) {
          var vDevPairObj = [];
          try {
            vDevPairObj = $.parseJSON(
              localStorage.getItem("BT40P").toString()
            ); //json to object
          } catch (err) {
            Log.write(err, "FnBTPair addDev");
          }

          for (var i = 0; i < vDevPairObj.length; i++) {
            if (vDevPairObj[i].DevAdr.toString() == DevID.toString()) {
              vDevPairObj.splice(i, 1);
              break;
            }
          }
          var JsonStr = JSON.stringify(vDevPairObj); //object to json
          localStorage.setItem("BT40P", JsonStr);
          Log.write(DevName + "已解除配對!", "FnBTPair delDev err");
          //parent.WiseBT.removePairDevices(
          //    DevID
          //    , function () {
          //    parent.Log.write(DevName + "已解除配對");
          //    }
          //    , function () { }
          //);
          FnBTPair.BindBTPair();
        }
      },
      $.i18n('系統訊息'),
      [$.i18n('是'), $.i18n('否')]
    );
  }
};
