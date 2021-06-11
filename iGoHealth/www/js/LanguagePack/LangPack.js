var LangPack = LangPack||{},LangPack={
    LangJSON:null,
    LangXml:null,
    init: function (successFn) {
        //alert(localStorage.LangVersion+AppConfig.LangVersion);
        //TODO: 是否有判斷語言包版本的必要？
        LangPack.loadLangJSON(function () {
            if (successFn) {
                successFn();
            }
        });
    },
    loadLangJSON:function(successFn){
        var filePath = "./js/LanguagePack/HATMLanguage.json"; //$("#testSql").val();
        var localLang="zh-tw"

        ProjectFn.Wait([function (next) {
            Log.alert("取得設備本地語言");
            //取得設備本地語言
            navigator.globalization.getLocaleName(
                function (locale) {
                    localLang = locale.value.toLowerCase();
                    localStorage.setItem("Lang", localLang);
                    Log.alert(localLang);
                    next();
                }
                , function () {//錯誤預設給繁中
                    localStorage.setItem("Lang", localLang);
                    next();
                });
        }], function () {
            $.getJSON(filePath, function (LangJSON) {
                Log.alert("getJSON Success");
                LangPack.LangJSON = LangJSON;
                LangPack.setLang(LangJSON,function(){
                    if(successFn){
                        successFn();
                    }
                });
            }, function () {
                FnCtrl.alert("語言包無法載入", "System Message", null, "OK");
            });
        });
        
    },
    setLang: function (HATMLanguage,successFn) {
        var localLang=localStorage.Lang;
        Lang= new HashMap();
        // Lang.set("000000000", "123");
        // alert(a);
        //alert(HATMLanguage[0].LCode+HATMLanguage[0].TW);
        for (var i = 0; i < HATMLanguage.length; i++) {
            switch (localLang) {
                case "zh-cn":
                    Lang.set(HATMLanguage[i].LCode, HATMLanguage[i].CN);
                    break;
                case "zh-tw":
                case "en-us":
                case "en":
                case "ja":
                default:
                    // Lang.set(HATMLanguage[i].LCode, HATMLanguage[i].JP);
                    Lang.set(HATMLanguage[i].LCode, HATMLanguage[i].TW);
                    break;
            }
            if(i==HATMLanguage.length-1){
                localStorage.setItem("LangVersion",AppConfig.LangVersion);
                if(successFn){
                    successFn();
                }
            }
        }

        // localStorage.Lang = LangStr;

        // var xotree = new XML.ObjTree();
        // var xml = LangPack.LangXML;
        // LangPack.LangXML = null;
        // var LangPacket = xotree.parseXML(xml);
        
        // xml = null;
        // Lang = new HashMap();
        // for (var i = 0; i < LangPacket.HATMLanguage.Language.length; i++) {
        //     switch (localStorage.Lang) {
        //         case "TW":
        //             Lang.set(LangPacket.HATMLanguage.Language[i].LCode, LangPacket.HATMLanguage.Language[i].TW);
        //             break;
        //         case "EN":
        //             Lang.set(LangPacket.HATMLanguage.Language[i].LCode, LangPacket.HATMLanguage.Language[i].EN);
        //             break;
        //         case "CN":
        //             Lang.set(LangPacket.HATMLanguage.Language[i].LCode, LangPacket.HATMLanguage.Language[i].CN);
        //             break;
        //         case "JP":
        //             Lang.set(LangPacket.HATMLanguage.Language[i].LCode, LangPacket.HATMLanguage.Language[i].JP);
        //             break;
        //         default:
        //             alert("語言指定錯誤");
        //             break;
        //     }
        // }

    },
    // LoadLangXml: function (CB) {
    //     alert("LoadXml");
    //     WiseScripts.IO.ReadFileToString("HATMLanguage.xml",
    //         function (RS) {
    //             alert("RS");
    //             LangPack.LangXML = RS;

    //             if (localStorage.Lang) {
    //                 LangPack.SetLang(localStorage.Lang);
    //                 alert("Langpack Success");
    //                 if (CB)
    //                     CB();
    //             }
    //             else {
    //                 alert("取得設備本地語言");
    //                 //取得設備本地語言
    //                 navigator.globalization.getLocaleName(
    //                     function (locale) {
    //                         alert(locale.value);
    //                         switch (locale.value.toLowerCase()) {
    //                             case "zh-tw":
    //                                 LangPack.SetLang("TW");
    //                                 break;
    //                             case "zh-cn":
    //                                 LangPack.SetLang("CN");
    //                                 break;
    //                             case "en-us":
    //                             case "en":
    //                                 //LangPack.SetLang("EN");
    //                                 LangPack.SetLang("TW");
    //                                 break;
    //                             case "ja":
    //                                 //LangPack.SetLang("JP");
    //                                 LangPack.SetLang("TW");
    //                                 break;
    //                             default:
    //                                 LangPack.SetLang("TW");
    //                                 break;
    //                         }
    //                         if (CB)
    //                             CB();
    //                     }
    //                     ,
    //                     //錯誤預設給繁中
    //                     function () {
    //                         LangPack.SetLang("TW");

    //                         if (CB)
    //                             CB();
    //                     }
    //                 );
    //             }
    //         },
    //         function (err) { alert('語言包無法載入'+err); });
    // },
}