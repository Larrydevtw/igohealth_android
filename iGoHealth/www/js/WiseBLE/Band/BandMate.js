var BandMate = {
  HeartRate: 0,
  lDeviceNames : ["GOLiFE CARE Xe","MATE1"],
  DeviceName: "GOLiFE CARE Xe",//"MATE1",
  Status:"",
  connProgressFn : function(){FnCtrl.toast($.i18n('連接手環中...'),'long','center');}, 
  connSuccessFn: function(){},
  connErrFn : function(){FnCtrl.toast($.i18n('手環斷開連線'),'long','center');},
  switch:function(isOn){
    if (AppConfig.lMType.indexOf("STEP") > 0 && isOn === "Y") {
      $("#aPair_Band").show();
    }else{
      $("#aPair_Band").hide();
    }
  },
  init: function (successFn,errFn) {
    
    if (AppConfig.BandMateActive === "N"){
      Log.write("未啟用手環功能", 'BandMate.Status');
      return;
    }

    Log.write(BandMate.Status, 'BandMate.Status');
    if(!localStorage.UserID){
      Log.write("UserID is null", 'BandMate');
      return;
    }
    if (!cordova.plugins.BluetoothStatus.BTenabled) {
      Log.write("BluetoothStatus enabled false", 'BandMate');
      return;
    }
    if (AppConfig.lMType.indexOf("STEP") < 0) {
      $("#aPair_Band").hide();
      if (successFn) {
        successFn();
      }
      return;
    }
    $("#aPair_Band").show();
    if (BandMate.Status === "STATE_CONNECTED" || BandMate.Status === "connected") {
      if (successFn) {
        successFn();
      }
      return;
    }
    BandMate.initCRP();

    BandMate.getPairList().then(function (lDeviceInfo) {
      Log.write(JSON.stringify(lDeviceInfo),'lDeviceInfo');
      if(lDeviceInfo.length>0){
        var DevName = lDeviceInfo[0].DevName;
        var DevAdr = lDeviceInfo[0].DevAdr;
        var mPairingCode = lDeviceInfo[0].mPairingCode;
        var mPairingTime = lDeviceInfo[0].mPairingTime;
        var mProductID = lDeviceInfo[0].DmProductIDevAdr;
        
        Log.write(DevName+"/"+DevAdr+"/"+mPairingCode+"/"+mPairingTime+"/"+mProductID,'DeviceInfo');
        BandMate.connCRP(DevAdr, DevName,mPairingCode,mPairingTime);         
      }   
    });
  },
  initCRP: function(){
    var UserID = localStorage.UserID;
    var strWeight = localStorage["Weight_" + UserID] == undefined ? "57" : Math.floor(localStorage["Weight_" + UserID]).toString();
    var strHeight = localStorage["Height_" + UserID] == undefined ? "161" : Math.floor(localStorage["Height_" + UserID]).toString();
    var strGender = localStorage["Gender_" + UserID] == undefined ? "F" : localStorage["Gender_" + UserID];
    var strAge = localStorage["Age_" + UserID] == undefined ? "40" : Math.floor(localStorage["Age_" + UserID]).toString();
    console.log("UserInfo: "+strWeight+"/"+strHeight+"/"+strGender+"/"+strAge);

    DeviceCordova.initCRP(strWeight,strHeight,strGender,strAge, function(msg){
      Log.write(msg," success initCRP info");
      BandMate.processMData(msg);
    },function(msg){
      Log.write(msg, " error initCRP info");
    });
  },
  getTrueMac: function (mac) {
    return new Promise(function (resolve, reject) {
      var result = mac+",13428a8b002751ce2e6e014e1ace979ddc1897b5ca46af48c387b6a79aec4238";
      resolve(result);
      // DeviceCordova.scanCRP(mac, function (result) {
      //   Log.write(result,'BandMate getTrueMac');
      //   resolve(result);
      // });
    });
  },
  connCRP: function (DevAdr, DevName,mPairingCode,mPairingTime,successFn) {
    try {
      DeviceCordova.connCRP(DevAdr,mPairingCode,mPairingTime);
    } catch (error) {
      Log.write(error, DevName + "err connCRP info");
    }
  },
  disConn:function(){ //斷開手環連線
    BandMate.Status = "disconnected";
  },
  disConnCRP: function () { //解除配對
    return new Promise(function (resolve, reject) {
      BandMate.disConn();
      DeviceCordova.disConnCRP();
      resolve();
    });

  },
  startMeasureBP: function () {
    DeviceCordova.startMeasureBP(function (msg) {
      Log.write(msg, "success startMeasureBP info");
    }, function (msg) {
      Log.write(msg, "error startMeasureBP info");
    });
  },
  startMeasureBO: function () {
    DeviceCordova.startMeasureBO(function (msg) {
      Log.write(msg, "success startMeasureBO info");
    }, function (msg) {
      Log.write(msg, "error startMeasureBO info");
    });
  },
  getStep: function () {
    console.log("getStep");
    DeviceCordova.getStep(
      function (msg) {
        Log.write(msg, "success getStep info");
      },
      function (msg) {
        Log.write(msg, "error getStep info");
      }
    );
  },
  setLanguage: function () {
    DeviceCordova.sendDeviceLanguage(Lang.locale);
  },
  sendTodayWeather:function(){
    //CLOUDY,FOGGY,HAZE,OVERCAST,RAINY,SANDSTORM,SNOWY,SUNNY
    DeviceCordova.sendTodayWeather(
      "台北","34","Sunny",
      function (msg) {
        Log.write(msg, DevName + " success sendTodayWeather ");   
      },
      function (msg) {
        Log.write(msg, "err sendTodayWeather");
      }
    );
  },
  getPairList: function () {
    return new Promise(function (resolve, reject) {
      Log.write("getPairList", 'BandMate');

      var lDeviceInfo = [];
      try {
        lDeviceInfo = $.parseJSON(localStorage.getItem("BT40P_Band").toString());
      } catch (err) {
        Log.write(err, "FnBTPair BindBTPair");
      }
      resolve(lDeviceInfo);
    });
  },
  getDBLatestStep:function(MTimeStamp){
    return new Promise(function(resolve,reject){
      //離線DB MTimeStamp格式 2000-01-01 07:07;
      MTimeStamp = MTimeStamp.substring(0, 16).replace(/\//g, "-");
      var UserID = localStorage.UserID;
      var strSql = "select MAX(Cast(STEP as Integer)) as STEP from Management_STEP ";
      strSql += " where Account='" + UserID + "' and strftime('%Y-%m-%d', MTimeStamp) = strftime('%Y-%m-%d', '"+MTimeStamp+"') ";
      strSql += " group by strftime('%Y-%m-%d', MTimeStamp)";
      strSql += " order by MTimeStamp desc limit 1";
      DAOFn.Query('', strSql, function(result) {
          var step = "0";
          var objList = $.parseJSON(result);
          if (objList.length > 0) {
            step=objList[0].STEP.toString();
          }    
          resolve(step);     
      });
    });
  },
  processMData:function(MData){
    var lMData = MData.split(",");

    if (lMData.length > 4) { //量測資料
      BandMate.showValue(lMData);
      Log.write("量測資料: " + MData, 'processMData');
      return;
    }

    var dataType = lMData[0];
    switch (dataType) {
      case "battery":
        BandMate.fnBattery(lMData);
        break;
      case "connectState":
        BandMate.fnConnectState(lMData);
      break;
      default:
        break;
    }    
  },
  fnBattery:function(lMData){
    if(lMData.length<1){
      return;
    }
    var battery = lMData[1];
    if(battery<10){
      var message = $.i18n('手環低電量提醒$1%',battery);
      FnCtrl.alert(message);
    }
  },
  fnConnectState:function(lMData) {
    if(lMData.length<1){
      return;
    }
    var connectState = lMData[1];
    //0:unbind ,1: connecting ,2: connected ,3: disconnecting ,4: disconnected ,5: syncing ,6: syncSuccess , 7:syncError
    BandMate.Status = connectState;
    switch (connectState) {
      case "1":
      case "connecting":
        BandMate.connProgressFn();
        break;
      case "2":
      case "connected":
        //FnCtrl.toast($.i18n('手環連接成功!'),'short','center');
        BandMate.connSuccessFn();
        break;
      case "4":
      case "disconnected":
        BandMate.errFn();
        break;
      case "5":
      case "syncing":
        FnCtrl.toast($.i18n('同步手環中...'),'long','center');
        break;
      case "6":
      case "syncSuccess":
        FnCtrl.toast($.i18n('手環同步成功!'),'long','center');  
        break;
    }
  },
  showValue: function (lMData) {
    var isAnimate = true;
    var MTimeStamp = lMData[2];
    //"MATE1,C0:26:DF:00:53:6B,2017/09/22 18:09,BO,37.4"
    var MType = lMData[3];
    lMData.splice(3, 1);

    var MValue = lMData[3];

    switch (MType) {
      case "HR":
        BandMate.HeartRate = +MValue;
        Log.write(BandMate.HeartRate+"HeartRate",'BandMate HeartRate');
        Log.write(JSON.stringify(lMData),'HR Measure');
        break;
      case "STEP":
        Log.write(MValue+" /STEP",'STEP');
        var distance = lMData[4] / 1000;
        lMData[4] = Math.round(distance * 10) / 10;    
        break;
      case "BP":
          if(MValue==="255"){
            FnCtrl.alert($.i18n('請正確配戴手環後再進行量測。'));
            return;
          }
          Log.write(BandMate.HeartRate, MType+"HR");
          lMData.push(BandMate.HeartRate);
          break;
      case "BO":
        if(MValue==="-1"){
          FnCtrl.alert($.i18n('請正確配戴手環後再進行量測。'));
          return;
        }
        Log.write(BandMate.HeartRate, MType+"HR");
        lMData.push(BandMate.HeartRate);
        break;
    }

    if(MType==="STEP"){
      BandMate.getDBLatestStep(MTimeStamp).then(function(step){
        Log.write("MValue: "+ MValue + " ,STEP: " + step + " ,MTime: " + MTimeStamp +" /DBLatestStep",'STEP');
        if(MValue <= step){
          console.log("step same or step less");
        }else{
          console.log("step not the same");
          BandMate.saveMData(lMData,MType);

          lMData.shift();
          lMData.shift();
          lMData.shift();
          Measure.showValue(MType, lMData, isAnimate, MTimeStamp);
        }
      });  
    }else{
      BandMate.saveMData(lMData,MType);

      lMData.shift();
      lMData.shift();
      lMData.shift();
      Measure.showValue(MType, lMData, isAnimate, MTimeStamp);
    }
 
  },
  saveMData: function (lMData,MType) {//存進離線DB 
    var InsertArray = []; //存入DB的資料

    var UserID = localStorage.UserID;
    var UploadStatus = "A";

    var UserKind = AppConfig.UserKind;
    var CardID = localStorage.UserID;

    var MTimeStamp = lMData[2].substring(0, 16).replace(/\//g, "-");
    Log.write("顯示量測值：" + lMData);
    //存進離線DB MTimeStamp格式 2016-03-01 02:25;

    var DeviceModel = lMData[0];
    var DeviceId = lMData[1];
    var mainMeasureData = lMData[3];
    var Params = {
      'Account': UserID,
      'MTimeStamp': MTimeStamp,
      'DeviceModel':DeviceModel,
      'DeviceId':DeviceId,
      'StandardLevel': '',
      'Warnings': '',
      'MFlag': '',
      'RedItem': '',
      "UploadStatus": UploadStatus
    };
    switch (MType) {
      case "BP":
        Params.SBP = mainMeasureData;
        Params.DBP = lMData[4];
        Params.HR = lMData[5];
        break;
      case "STEP":
          Params.STEP = mainMeasureData;
          Params.Distance = lMData[4];
          Params.CAL = lMData[5];
          break;
      case "BG":
        Params.BS = mainMeasureData;
        Params.TimeType = lMData[4];
        break;
      case "BO":
        Params.SPO2 = mainMeasureData;
        Params.HR = lMData[4];
        break;
      case "BW":
      case "BF":
        //alert(lMData.length);
        Log.write(lMData, 'FnBT SaveData');
        //[3]體重,BMI,[5]體脂,基代,[7]身高,性別,[9]年齡
        Params.Weight = mainMeasureData;
        Params.Gender = lMData[8];
        Params.Age = lMData[9];
        Params.Height = lMData[7];
        Params.BMI = lMData[4];
        Params.BaseRate = lMData[6];
        Params.BodyRate = lMData[5];
        MType = "BW";
        break;
      default: //BT, UA, CHOL, HR
        Params[MType] = mainMeasureData;
        break;
    }
    InsertArray.push(Params);

    //塞入待上傳序
    //alert("塞入待上傳序");
    var lParams = {
      UploadStatus: lParams.UploadStatus,
      MRowKey: lParams.MRowKey,
      Memo: "",
      M_UP_Date: ""
    };

    ResultStr = lMData.join(",");
    WaitQueue.Add(ResultStr, MType, UserID, UserKind, CardID, lParams);

    FnBT.SaveDataToDB(InsertArray, MType, function () {

    });
  }
};
