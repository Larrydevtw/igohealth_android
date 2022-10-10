var FnBTPairBand = {
  ShowPage: function (step) {
    $("#ulScanList_Band").html("");
    $("#ulPair_Band").html("");
    $("#btnPair_Band_Search").html($.i18n('搜索手環'));

    $("#divPair_Band_Search").hide();
    $("#divPair_Band_Function").hide();

    $("#btnPair_Band_Search").on("blur", function () {
      $("#btnPair_Band_Search").html($.i18n('搜索手環'));
    });

    WiseScripts.Tool.NextPop("BluetoothSettingPage_Band_" + step, function () {
      FnBTPairBand.BindList();
    }, null, 'T');
  },
  StartScan: function () {
    Log.write("", "FnBTPairBand StartScan");
    MSCordovaBLE.MySetting.AutoConnect = false;
    MSCordovaBLE.MySetting.ScanCallBackFn = FnBTPairBand.ScanBTDev;

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
    $("#btnPair_Band_Search").html($.i18n('搜索手環中...'));
    MSCordovaBLE.startScan();
  },
  BindList: function () {
    //bind 已配對的藍牙
    //DevName:xxx,DevAdr:111

    Log.write("", "FnBTPairBand BindList");

    BandMate.getPairList().then(function (lDeviceInfo) {
      $("#ulPair_Band").html("");
      if (lDeviceInfo.length > 0) {
        setTimeout(function(){
          var DevName = lDeviceInfo[0].DevName;
          var DevAdr = lDeviceInfo[0].DevAdr;

          var liHTML = "";
          liHTML += "<li class='idKey idKeyP' keyValue ='" + DevAdr + "'>";
          liHTML += "<div class='L'><p>" + DevName + "</p><span>" + DevAdr + "</span></div>";
          liHTML += "<div class='R'><a onclick='FnBTPairBand.confirmDelDev(\"" + DevName + '","' + DevAdr + "\");'><i class='wise_close'></i></a></div>";
          liHTML += "</li>";
          $("#ulPair_Band").append(liHTML);

          if ($(".idKeyS[keyValue='" + DevAdr + "']").length > 0) {
            $(".idKeyS[keyValue='" + DevAdr + "']").remove();
          }

          FnBTPairBand.switchPageMode(true);    
        },10);
      }else{
        FnBTPairBand.switchPageMode(false);  
      }        
    });
  },
  ScanBTDev: function (device) {
    //掃4.0設備
    Log.write(JSON.stringify(device),'device');

    if (device.name === BandMate.DeviceName) {
      BandMate.getTrueMac(device.address).then(function(_dev){
        var dev = _dev.split(",");
        var mac = dev[0];
        var productId = dev[1]; 
        if ($(".idKey[keyValue='" + mac + "']").length < 1) {
          var liHTML = "";
          liHTML += "<li class='idKey idKeyS' keyValue='" + mac;
          liHTML += "' onclick='FnBTPairBand.addDev(\"" + device.name + '","' + mac +'","' + productId + "\");'>";
          liHTML += "<div class='L'><p>" + device.name + "</p><span>" + mac + "</span></div>";
          liHTML += "</li>";
          $("#ulScanList_Band").append(liHTML);
        }
      });
    }
  },
  addDev: function (DevName, DevID,ProductID) {
    Log.write(DevName + " " + DevID + " " + ProductID, "FnBTPairBand addDev");

    FnBT.StopScan();

    FnBTPairBand.addDevSuccess(DevName, DevID, ProductID, function () {
      BandMate.init();
    });
    
    BandMate.connProgressFn = function(){
      $("#btnPair_Band_Search").html($.i18n('同步手環中...'));
      WiseScripts.Tool.ShowLoading(true,$.i18n('同步手環中...'));
    };
    BandMate.connSuccessFn = function(){
      WiseScripts.Tool.ShowLoading(false);
      FnCtrl.alert($.i18n("手環配對成功！"), "", function () {
        app.onBack();
      });
    };
    BandMate.connErrFn = function(){
      FnBTPairBand.addDevErr(DevID,function(){
        WiseScripts.Tool.ShowLoading(false);
        FnCtrl.alert("can not connect");
      });
    };
  },
  addDevSuccess: function (DevName, DevID,ProductID,successFn) {
    var lDeviceInfo = [];
    try {
      lDeviceInfo = $.parseJSON(localStorage.getItem("BT40P_Band").toString()); //json to object
    } catch (err) {
      Log.write(err, "FnBTPair addDev");
    }

    var devInfo = {};
    devInfo.DevName = DevName;
    devInfo.DevAdr = DevID;
    devInfo.mPairingCode = "7534";
    devInfo.mPairingTime = "1571068848";
    devInfo.mProductID = "13428a8b002751ce2e6e014e1ace979ddc1897b5ca46af48c387b6a79aec4238";
    lDeviceInfo.push(devInfo);

    var JsonStr = JSON.stringify(lDeviceInfo); //object to json
    localStorage.setItem("BT40P_Band", JsonStr);
    $(".idKeyS[keyValue='" + DevID + "']").remove();

    if(successFn){
      successFn();
    }
  },
  addDevErr: function (DevID,successFn){
    localStorage.setItem("BT40P_Band", "[]"); 

    $("#ulScanList_Band").html("");
    $("#ulPair_Band").html("");
    $("#btnPair_Band_Search").html($.i18n('搜索手環'));

    $("#divPair_Band_Function").hide();
    $(".idKeyS[keyValue='" + DevID + "']").remove();
    if(successFn){
      successFn();
    }
  },
  confirmDelDev: function (DevName, DevID) {
    //移除配對
    Log.write(DevName+"/"+DevID,'FnBTPairBand');
    navigator.notification.confirm(
      $.i18n("是否移除「$1」此配對？", DevName),
      function (button) {
        if (button == 1) {
          WiseScripts.Tool.ShowLoading(true, $.i18n('移除配對中...'));
          setTimeout(function(){
            FnBTPairBand.delDev(DevID);
            WiseScripts.Tool.ShowLoading(false);
          },2000);
        }
      },
      $.i18n("系統訊息"),
      [$.i18n("是"), $.i18n("否")]
    );
  },
  delDev:function(DevID,successFn){
    BandMate.disConnCRP().then(function () {
      var lDeviceInfo = [];
      try {
        lDeviceInfo = $.parseJSON(
          localStorage.getItem("BT40P_Band").toString()
        ); //json to object
      } catch (err) {
        Log.write(err, "FnBTPairBand delDev");
      }
      Log.write("移除配對", "FnBTPairBand delDev");
      for (var i = 0; i < lDeviceInfo.length; i++) {
        if (lDeviceInfo[i].DevAdr.toString() == DevID.toString()) {
          lDeviceInfo.splice(i, 1);
          break;
        }
      }
      var JsonStr = JSON.stringify(lDeviceInfo); //object to json
      Log.write(JsonStr,'FnBTPairBand JsonStr');

      localStorage.setItem("BT40P_Band", JsonStr);
      FnBTPairBand.BindList();
      $("#ulScanList_Band").html("");

      FnCtrl.alert($.i18n("移除手環成功!"));
      if(successFn){
        successFn();
      }
    });
  },
  switchPageMode: function (isPairBand) {
    if (isPairBand) {
      $("#divPair_Band_Search").hide();
      if(DeviceCordova.BandType == "MATE1"){
        $("#divPair_Band_Function").show();
      }  
    } else {
      $("#divPair_Band_Search").show();
      $("#divPair_Band_Function").hide();
    }

  }
};
