var MeasureInfo={
    MType: "", //暫存 量測類別 
    Interval: "7", //查詢區間
    Gender: "", //M:男 F:女 //TODO No Use
    Age: "",  //TODO No Use
    lConvertMType:["BG","UA","CHOL"],
    DisplayRange: { //顯示數值高低區間
        BG: {
            Min: 0,
            Max: 250
        },
        UA: {
            Min: 90,
            Max: 550
        },
        CHOL: {
            Min: 0,
            Max: 250
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
    BG_Unit:" mg/dL", //血糖單位: tw(t):mg/dL；cn(c):mmol/L t/18=c (小數下一位，無條件捨去)
    BG_Convert_Num:1, //轉換數值
    BG_Display_Num:0, //顯示小數點以下第幾位 (tw:不顯示小數點；cn:顯示小數點一位))
    
    UA_Unit:" mg/dL", //單位: tw(t):mg/dL；cn(c):umol/L t*59.5=c (小數下一位，無條件捨去)
    UA_Convert_Num:59.5, //轉換數值
    UA_Display_Num:1, //顯示小數點以下第幾位 (tw:不顯示小數點；cn:顯示小數點一位))

    CHOL_Unit:" mg/dL", //尿酸單位: tw(t):mg/dL；cn(c):mmol/L t/38.67=c (小數下一位，無條件捨去)
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
        var currentVersion;

        if (!localStorage.StandardVersion) { //第一次安裝載入標準值
            Log.write("Null", 'localStorage.StandardVersion');
            HATMService.SaveStandardJSON(function(){
                Log.write("重新載入標準值，載入完畢。", "載入標準值");
                if(successFn){
                    successFn();
                }
            });
            localStorage.setItem("StandardVersion", configVersion); //目前標準值版號
            return;
        }

        currentVersion = localStorage.StandardVersion;

        Log.write("configVersion: " + configVersion + " ,currentVersion: " + currentVersion, 'iniStandardJSON');

        if (configVersion <= currentVersion) {
            Log.write("The same or lower Version", 'iniStandardJSON');
            if(successFn){
                successFn();
            }
        } else {
            localStorage.StandardVersion = configVersion;
            Log.write("Need to Update Version", 'iniStandardJSON');
            HATMService.SaveStandardJSON(function(){
                Log.write("重新載入標準值，載入完畢。", "載入標準值");
                if(successFn){
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

        var UA_Unit = "";
        var UA_Convert_Num=1;
        var UA_Display_Num=1;
        var Range_UA = { //輸入範圍限制
            Min: 0,
            Max: 20
        };

        var CHOL_Unit = "";
        var CHOL_Convert_Num=1;
        var CHOL_Display_Num=0;
        var Range_CHOL = { //輸入範圍限制
            Min: 0,
            Max: 999
        };

        switch (localLang) {
            case "zh-hans":
                BG_Unit = " mmol/L";
                BG_Convert_Num=18;

                Range_BG = { //輸入範圍限制
                    Min: 0,
                    Max: 55
                };
                BG_Display_Num=1;

                UA_Unit = " umol/L";
                UA_Convert_Num=1.0;

                Range_UA = { //輸入範圍限制
                    Min: 0,
                    Max: 1000
                };
                UA_Display_Num=0;

                CHOL_Unit = " mmol/L";
                CHOL_Convert_Num=38.67;

                Range_CHOL = { //輸入範圍限制
                    Min: 0,
                    Max: 30
                };
                CHOL_Display_Num=1;
                break;
            default: //zh-hant
                BG_Unit = " mg/dL";
                BG_Convert_Num=1;

                UA_Unit = " mg/dL";
                UA_Convert_Num=59.5;

                CHOL_Unit = " mg/dL";
                CHOL_Convert_Num=1;
                break;
        }
        //alert(BG_Unit);
        $("#BG_Unit").text(BG_Unit);
        MeasureInfo.BG_Unit = BG_Unit;
        MeasureInfo.BG_Convert_Num=BG_Convert_Num;
        MeasureInfo.Range.BG=Range_BG;
        MeasureInfo.BG_Display_Num=BG_Display_Num;

        $("#UA_Unit").text(UA_Unit);
        MeasureInfo.UA_Unit = UA_Unit;
        MeasureInfo.UA_Convert_Num=UA_Convert_Num;
        MeasureInfo.Range.UA=Range_UA;
        MeasureInfo.UA_Display_Num=UA_Display_Num;

        $("#CHOL_Unit").text(CHOL_Unit);
        MeasureInfo.CHOL_Unit = CHOL_Unit;
        MeasureInfo.CHOL_Convert_Num=CHOL_Convert_Num;
        MeasureInfo.Range.CHOL=Range_CHOL;
        MeasureInfo.CHOL_Display_Num=CHOL_Display_Num;

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
            case "CHOL":
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
            default:
                Convert_Num = 1;
                break;
        }

        result = Project.accMul(MValue,Convert_Num);
        Log.write(" ,MValue: "+MValue+" , Convert_Num: "+Convert_Num+" ,result"+result,'MValue*Convert_Num');
        return result;
    }
};