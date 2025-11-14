var MeasureInfo={
    MType: "", //暫存 量測類別 
    Interval: "7", //查詢區間
    Gender: "", //M:男 F:女 //TODO No Use
    Age: "", //TODO No Use
    lConvertMType: ["BG", "UA", "TG", "CHOL","HB"],
    DisplayRange: { //顯示數值高低區間
        BG: {
            Min: 0,
            Max: 250
        },
        UA: {
            Min: 0,
            Max: 30
        },
        CHOL: {
            Min: 0,
            Max: 250
        },
        TG: {
            Min: 0,
            Max: 999,
        },
        HB: {
            Min: 0,
            Max: 25,
        },
    },
    Range: { //輸入範圍限制
        BG: {
            Min: 0,
            Max: 999
        },
        UA: {
            Min: 0,
            Max: 20
        },
    TG: {
      Min: 0,
      Max: 999,
    },
    HB: {
      Min: 0,
      Max: 30,
        },
        CHOL: {
            Min: 0,
            Max: 999
        },
        BP: {
            SBPMin: 0,
            SBPMax: 300,
            DBPMin: 0,
            DBPMax: 300,
            HRMin: 20,
            HRMax: 200
        },
        BW: {
            HMin: 0,
            HMax: 500,
            WMin: 0,
            WMax: 500,
            FMin: 0,
            FMax: 100
        },
        BT: {
            Min: 0,
            Max: 45
        },
        BO: {
            Min: 85,
            Max: 99
        },
        HR: {
            Min: 20,
            Max: 200
        },
    },
    DeviceRange: {
        BG: {
            Min: 20,
            Max: 600
        },
        UA: {
            Min: 3,
            Max: 20
        },
        CHOL: {
            Min: 100,
            Max: 300
        },
        HB: {
            Min: 7,
            Max: 26
        },
        TG: {
            Min: 70,
            Max: 600
        }
    },
    BG_Unit:" mg/dL", //血糖單位: tw(t):mg/dL；cn(c):mmol/L t/18=c (小數下一位，無條件捨去)
    BG_Convert_Num:1, //轉換數值
    BG_Display_Num:0, //顯示小數點以下第幾位 (tw:不顯示小數點；cn:顯示小數點一位))
    
    UA_Unit:" mg/dL", //單位: tw(t):mg/dL；cn(c):umol/L t*59.5=c (小數下一位，無條件捨去)
    UA_Convert_Num:59.5, //轉換數值
    UA_Display_Num:1, //顯示小數點以下第幾位 (tw:不顯示小數點；cn:顯示小數點一位))

  TG_Unit: " mg/dL", //單位
  TG_Convert_Num: 1, //轉換數值
  TG_Display_Num: 0, //顯示小數點以下第幾位

  HB_Unit: " g/dL", //單位
  HB_Convert_Num: 10, //轉換數值
  HB_Display_Num: 1, //顯示小數點以下第幾位

  CHOL_Unit:" mg/dL", //單位: tw(t):mg/dL；cn(c):mmol/L t/38.67=c (小數下一位，無條件捨去)
    CHOL_Convert_Num:1, //轉換數值
    CHOL_Display_Num:0, //顯示小數點以下第幾位 (tw:不顯示小數點；cn:顯示小數點一位))

    dailyRoutine:{
        wakeUp:5,
        breakfast:8,
        lunch:12,
        dinner:18,
        bedTime:22
    },
    iniStandardJSON:function(successFn,errFn){        

        var configVersion = AppConfig.StandardVersion;
        var currentVersion = "";//localStorage.StandardVersion;
        MeasureInfo.GetStandardVersion(function(result){
            currentVersion = result;

            Log.write(
              "configVersion : " +
                configVersion +
                " / currentVersion:" +
                currentVersion,
              "MeasureInfo StandardValue iniStandardJSON UploadLog"
            );

            if (
              !currentVersion || currentVersion == "" ||
              currentVersion == "undefined"
            ) {
              //第一次安裝載入標準值
              Log.write(
                "第一次安裝載入標準值",
                "MeasureInfo StandardValue iniStandardJSON"
              );
              HATMService.SaveStandardJSON(function () {
                Log.write("重新載入標準值，載入完畢。", "載入標準值");
                MeasureInfo.SetStandardVersion(configVersion); //目前標準值版號
                Log.write(
                  "重新載入標準值，載入完畢:" + configVersion,
                  "MeasureInfo StandardValue iniStandardJSON"
                );
                if (successFn) {
                  successFn();
                }
              });
              return;
            }

            if (configVersion <= currentVersion) {
              Log.write(
                "The same or lower VersionNo, No need to upate. return.",
                "MeasureInfo StandardValue iniStandardJSON"
              );
              if (successFn) {
                successFn();
              }
            } else {
              MeasureInfo.SetStandardVersion(configVersion); //目前標準值版號
              Log.write(
                "Need to Update Version / configVersion:" + configVersion,
                "MeasureInfo StandardValue iniStandardJSON"
              );
              HATMService.SaveStandardJSON(function () {
                Log.write(
                  "重新載入標準值，載入完畢。",
                  "MeasureInfo StandardValue iniStandardJSON"
                );
                if (successFn) {
                  successFn();
                }
              });
              // HATMService.SaveStandardJSON(function(){
              //     Log.write("重新載入標準值，載入完畢。", "載入標準值");
              //     if(successFn){
              //         successFn();
              //     }
              // });
            }
        });
    },
    GetStandardVersion: function(successFn){
        ProjectFn.getSysParams(
          "mSys",
          "StandardVersion",
          function (currentVersion) {
            localStorage.StandardVersion = currentVersion;
            if (successFn) {
              successFn(currentVersion);
            }
          }
        );
    },
    SetStandardVersion:function(currentVersion, successFn){
        ProjectFn.setSysParams(
          "mSys",
          "StandardVersion",
          currentVersion,
          function (result) {
            localStorage.StandardVersion = currentVersion;
            if(successFn){
                successFn(result);
            }
            Log.write(
              "result:" +
                result +
                " / currentVersion:" +
                currentVersion +
                "，儲存設定至SQLLite中",
              "MeasureInfo SetStandardVersion UploadLog"
            );
          }
        );
    },
    init: function (localLang,localeChangeType) { //依據不同語系，做血糖顯示設定
        //alert(localLang);
        var BG_Unit = "";
        var BG_Convert_Num=1;
        var BG_Display_Num=0;
        var Range_BG = { //輸入範圍限制
            Min: 0,
            Max: 999
        };

        var CHOL_Unit = "";
        var CHOL_Convert_Num=1;
        var CHOL_Display_Num=0;
        var Range_CHOL = { //輸入範圍限制
            Min: 0,
            Max: 999
        };

        var UA_Unit = "";
        var UA_Convert_Num = 1;
        var UA_Display_Num = 1;
        var Range_UA = {
          //輸入範圍限制
          Min: 0,
          Max: 20,
        };

        var TG_Unit = "";
        var TG_Convert_Num = 1;
        // var TG_Display_Num = 0;
        // var Range_TG = {
        //   //輸入範圍限制
        //   Min: 0,
        //   Max: 999,
        // };

        var HB_Unit = "";
        var HB_Convert_Num = 1;
        // var HB_Display_Num = 0;
        // var Range_HB = {
        //   //輸入範圍限制
        //   Min: 0,
        //   Max: 20,
        // };

        switch (localLang) {
            case "zh-hans":
                BG_Unit = " mmol/L";
                BG_Convert_Num=18;

                Range_BG = { //輸入範圍限制
                    Min: 0,
                    Max: 55
                };
                BG_Display_Num=1;

                CHOL_Unit = " mmol/L";
                CHOL_Convert_Num=38.67;

                Range_CHOL = { //輸入範圍限制
                    Min: 0,
                    Max: 30
                };
                CHOL_Display_Num=1;

                UA_Unit = " umol/L";
                UA_Convert_Num = 1.0;

                Range_UA = {
                  //輸入範圍限制
                  Min: 0,
                  Max: 1000,
                };
                UA_Display_Num = 0;

                TG_Unit = " mmol/L";
                TG_Convert_Num=88.57;

                // Range_TG = { //輸入範圍限制
                //     Min: 0,
                //     Max: 1000
                // };
                // TG_Display_Num=0;

                HB_Unit = " g/L";
                HB_Convert_Num = 1.0;

                // Range_HB = {
                //   //輸入範圍限制
                //   Min: 0,
                //   Max: 1000,
                // };
                // HB_Display_Num = 0;
                break;
            default: //zh-hant
                BG_Unit = " mg/dL";
                BG_Convert_Num=1;

                CHOL_Unit = " mg/dL";
                CHOL_Convert_Num = 1;

                UA_Unit = " mg/dL";
                UA_Convert_Num = 59.5;

                TG_Unit = " mg/dL";
                TG_Convert_Num = 1;

                HB_Unit = " g/dL";
                HB_Convert_Num = 10;          
                break;
        }
        //alert(BG_Unit);
        $("#BG_Unit").text(BG_Unit);
        MeasureInfo.BG_Unit = BG_Unit;
        MeasureInfo.BG_Convert_Num=BG_Convert_Num;
        MeasureInfo.Range.BG=Range_BG;
        MeasureInfo.BG_Display_Num=BG_Display_Num;

        $("#CHOL_Unit").text(CHOL_Unit);
        MeasureInfo.CHOL_Unit = CHOL_Unit;
        MeasureInfo.CHOL_Convert_Num=CHOL_Convert_Num;
        MeasureInfo.Range.CHOL=Range_CHOL;
        MeasureInfo.CHOL_Display_Num=CHOL_Display_Num;

        $("#UA_Unit").text(UA_Unit);
        MeasureInfo.UA_Unit = UA_Unit;
        MeasureInfo.UA_Convert_Num=UA_Convert_Num;
        MeasureInfo.Range.UA=Range_UA;
        MeasureInfo.UA_Display_Num=UA_Display_Num;

        $("#TG_Unit").text(TG_Unit);
        MeasureInfo.TG_Unit = TG_Unit;
        MeasureInfo.TG_Convert_Num = TG_Convert_Num;
        // MeasureInfo.Range.TG = Range_TG;
        // MeasureInfo.TG_isplay_Num = TG_Display_Num;

        $("#HB_Unit").text(HB_Unit);
        MeasureInfo.HB_Unit = HB_Unit;
        MeasureInfo.HB_Convert_Num = HB_Convert_Num;
        // MeasureInfo.Range.HB = Range_HB;
        // MeasureInfo.HB_Display_Num = HB_Display_Num;

        if(localeChangeType === "change"){
            MeasureInfo.reloadMValue();
        }
    },
    reloadMValue:function(){
        var lConvertMType = MeasureInfo.lConvertMType;
        var lMType = AppConfig.lMType;
        for(var i=0;i<lMType.length;i++){
            var MType = lMType[i];
            if(lConvertMType.indexOf(MType)>-1){
                Measure.readByMType(MType);
            }
        }
    },
    convertMValue: function(MType,val,DeviceModel) {
        Log.write(MType + "/" + val + " , DeviceModel" + DeviceModel, 'convertMValue start');
        var result=val;
        var Convert_Num;
        var Display_Num;

        if(DeviceModel === "DS3" && MType === "BG"){
            Log.write(DeviceModel,'DeviceModel');
            Log.write(Lang.locale,'DeviceModel Lang.locale');

            switch(Lang.locale){
                case "zh-hans":
                    var vDS_tmp = parseFloat(val);
                    if (vDS_tmp > 4) {
                        result = Math.floor((vDS_tmp * 5 + 4) / 9) / 10;
                    } else {
                        result = Math.floor((vDS_tmp * 5) / 9) / 10;
                    }
                    break;
                default: //zh-hant
                    break;
            }
            Log.write(result,'convertMValue end');
            return result;
        }

        switch(MType){
            case "BG":
            case "UA":
            case "TG":
            case "CHOL":
            case "HB":
                Convert_Num = MeasureInfo[MType+"_Convert_Num"];
                Display_Num=Math.pow(10,MeasureInfo[MType+"_Display_Num"]);
                Log.write(Convert_Num+","+Display_Num,'convertMValue');
                //無條件進位到指定位數
                result = Math.floor(Project.accDiv(val, Convert_Num) * Display_Num) / Display_Num;
                break;
            default:
                result = val;
                break;   
        }
        Log.write(result,'convertMValue end');
        return result;
    },
    convertSaveMValue: function(MType,MValue,isFromDevice,successFn) {
        var result="";
        var Convert_Num; 
        switch (MType) {
            case "BG":
                if (isFromDevice === "Y") {
                    Convert_Num = 1;
                } else {
                    Convert_Num = MeasureInfo.BG_Convert_Num;
                }
                break;
            case "UA": 
                if(isFromDevice==="Y"){
                    Convert_Num =59.5;
                }else{
                    Convert_Num =MeasureInfo.UA_Convert_Num;
                }          
                break;
            case "CHOL": 
                if(isFromDevice==="Y"){
                    Convert_Num =1;
                }else{
                    Convert_Num =MeasureInfo.CHOL_Convert_Num;
                }          
                break;
            case "TG": 
                if(isFromDevice==="Y"){
                    Convert_Num =1;
                }else{
                    Convert_Num =MeasureInfo.TG_Convert_Num;
                }          
                break;
            case "HB": 
                if(isFromDevice==="Y"){
                    Convert_Num =10;
                }else{
                    Convert_Num =MeasureInfo.HB_Convert_Num;
                }          
                break;
            default:
                Convert_Num = 1;
                break;
        }

        result = Project.accMul(MValue,Convert_Num);
        Log.write(" ,MValue: "+MValue+" , Convert_Num: "+Convert_Num+" ,result"+result,'MValue*Convert_Num');
        return result;
    }
};