var Lang = Lang || {},
    Lang = {
        locale: "",
        MSFTApi:{
            url:"https://api.cognitive.microsofttranslator.com/translate?api-version=3.0",
            key:"31ba41584d3f402b98e0499dfc14a20a"
        },
        logoA:"images/logoA.png",
        logoB:"images/logoB.png",
        logoB_Menu:"images/logoB_Menu.png",
        i18n:function(_localeChangeType){ //對整個頁面以及自訂元素進行語言轉換
            //localeChangeType: init、change
            var localeChangeType = _localeChangeType === undefined ? "init" : _localeChangeType;

            $("#member").attr("placeholder", $.i18n("帳號"));
            $("#password").attr("placeholder", $.i18n("密碼"));
            $('body').i18n();
            $("#WiseLogoA").prop("src",Lang.logoA);
            $("#WiseLogoA_1").prop("src",Lang.logoA);
            $("#WiseLogoB").prop("src",Lang.logoB);
            $("#WiseLogoB_Menu").prop("src",Lang.logoB_Menu);
            MeasureInfo.init(Lang.locale,localeChangeType);
        },
        init: function (successFn) { //初始化；載入語系相關檔案        
            $.i18n().load({
                'zh-hant': 'js/LanguagePack/i18n/zh-hant.json',
                'zh-hans': 'js/LanguagePack/i18n/zh-hans.json',
                'en': 'js/LanguagePack/i18n/en.json'
            }).done(function () {
                console.log('done!');
                var localLang="";
                ProjectFn.Wait([function(next){
                    if(localStorage.Lang){
                        localLang=localStorage.Lang;
                    }else{
                        if(Lang.locale!==""){
                            localLang=Lang.locale;
                        }else{
                            localLang = (navigator.language || navigator.browserLanguage).toLowerCase();
                        }
                    }
                    //alert(localLang);
                    if (localLang.includes('zh-hans')) { //ios回傳格式會有語言和地區
                        localLang = "zh-hans";
                    } else if (localLang.includes('zh-hant')) {
                        localLang = "zh-hant";
                    } else if (localLang.includes('en')) {
                        localLang = "en";
                    }
                    var imageLocale = "";
                    switch (localLang) {
                        case "zh-cn":
                        case "zh-hans":
                            localLang = "zh-hans";
                            imageLocale = "CN";
                            break;
                        // case "en"://"en"; TODO
                        // case "en-us":
                        //     localLang = "en";
                        //     imageLocale = "EN";
                        //     break;
                        // case "ja":
                        //     localLang = "ja";
                        //     imageLocale = "JA";
                        //     break;
                        default: //zh-tw、zh-hant
                            localLang = "zh-hant";
                            imageLocale = "";
                            break;
                    }

                    imageLocale = imageLocale == "" ? "" : "_" + imageLocale;
                    Lang.logoA = "images/logoA" + imageLocale + ".png";
                    Lang.logoB = "images/logoB" + imageLocale + ".png";
                    Lang.logoB_Menu = "images/logoB" + imageLocale + "_Menu.png";

                    Log.write(localLang, "Lang");
                    Lang.locale = localLang;
                    $.i18n().locale = localLang;
                    next();
                }],function(){
                    localStorage.Lang=Lang.locale; //暫存語系至localstorage
                    Log.write($.i18n().locale,"Lang init");
                    Lang.i18n();//對整個頁面以及自訂元素進行語言轉換

                    if(successFn){
                        successFn();
                    }
                });
            });
        },
        switch:function(localLang,successFn) { //TODO//切換語系
            //alert(localLang);
            var imageLocale = "";
            switch (localLang) {
                case "zh-cn":
                case "zh-hans":
                    localLang = "zh-hans";
                    imageLocale = "CN";
                    break;
                case "en"://"en"; TODO
                case "en-us":
                    localLang = "en";
                    imageLocale = "EN";
                    break;
                case "ja":
                    localLang = "ja";
                    imageLocale = "JA";
                    break;
                default: //zh-tw、zh-hant
                    localLang = "zh-hant";
                    imageLocale = "";
                    break;
            }
            imageLocale = imageLocale == "" ? "" : "_" + imageLocale;
            Lang.logoA = "images/logoA" + imageLocale + ".png";
            Lang.logoB = "images/logoB" + imageLocale + ".png";
            Lang.logoB_Menu = "images/logoB" + imageLocale + "_Menu.png";

            Lang.locale = localLang;
            $.i18n().locale = localLang;

            localStorage.Lang = Lang.locale; //暫存語系至localstorage
            Log.write($.i18n().locale, "Lang init");
            Lang.i18n("change"); //對整個頁面以及自訂元素進行語言轉換

            if (successFn) {
                successFn();
            }
        },
        confirmSwitch:function() { //TODO//目前只有簡繁體需要切換，使用confirm
            var message=$.i18n('請選擇切換語系');
            var buttonLabels = [$.i18n("繁體中文"), $.i18n("簡體中文")];
            navigator.notification.confirm(message, confirmCallback,$.i18n('系統訊息'),buttonLabels);

            function confirmCallback(btnIndex) {
                if (btnIndex == 1) {
                    Lang.switch("zh-hant");
                } else {
                    Lang.switch("zh-hans");
                }
            }  
        },

        translate: function (lToLocale, successFn) {
            var fromLocale = "zh-Hant";
            var toLocale = lToLocale[0];
            // var fromTexts = JSON.stringify([{
            //     "Text": "我是Larry。"
            // }, {
            //     "Text": "公司為慧智達科技"
            // }]);
            var lTexts = [];
            var fromFilePath = "js/LanguagePack/i18n/zh-hant.json";
            var toFilePath = "js/LanguagePack/i18n/" + toLocale + ".json";
            var toFileLength = 0;
            var resultFile;
            ProjectFn.Wait([function (next) {
                $.getJSON(toFilePath, function (resultObj) {
                    console.log(resultObj);
                    toFileLength = Object.keys(resultObj).length;
                    console.log("toFileLength:" + toFileLength);
                    resultFile = resultObj;
                    next();
                });
            }], function () {
                $.getJSON(fromFilePath, function (resultObj) {
                    var fromFileLength = Object.keys(resultObj).length;
                    console.log("fromFileLength:" + fromFileLength);
                    var count = 0;
                    $.each(resultObj, function (key, val) {
                        count++;
                        if (key === "@metadata") {
                            resultFile[key] = resultObj[key];
                            resultFile[key].locale=toLocale;
                            return;
                        } else {
                            if (count > toFileLength) {
                                lTexts = [];
                                lTexts.push(resultObj[key]);

                                Lang.translateByMSFTApi(fromLocale, lToLocale, lTexts, function (result) {
                                    resultFile[key] = result[0];
                                    console.log(result);
                                    //Log.write(result, "Lang.translateByMSFTApi success");
                                    //console.log(resultObj);
                                });
                            }
                        }
                        if (count === fromFileLength) {
                            //console.log(resultFile);
                            var strResultFile = JSON.stringify(resultFile);
                            var txtResult = "來源語言筆數:" + fromFileLength + ";目標語言筆數:" + toFileLength;
                            if (fromFileLength === toFileLength) {
                                txtResult += ";<span style='color:#4286f4'>筆數相同，未進行轉換。</span>";
                            } else {
                                txtResult += ";<span style='color:#4286f4'>共轉換" + (+fromFileLength - toFileLength) + "筆。</span>";
                            }
                            $("#txtResult").html(txtResult);
                            $("#txtResultFile").val(strResultFile);
                            console.log(strResultFile);
                            if (successFn) {
                                successFn();
                            }
                        }
                    });
                });
            });
        },
        translateByMSFTApi: function (fromLocale, lToLocale, _lTexts, successFn) {
            //陣列最多可以有 25 個項目。
            //要求中包含的完整文字不能超過 5,000 個字元，包括空格。
            if (!fromLocale) {
                fromLocale = "zh-Hant";
            }
            if (!lToLocale) {
                lToLocale.push("zh-Hans");
            }
            var lTexts = [{
                "Text": _lTexts[0]
            }];

            var apiUrl = Lang.MSFTApi.url+"&from=" + fromLocale + "&to=" + lToLocale[0];
            if (lTexts.length > 1) {
                apiUrl += "&to=" + lToLocale[1];
            }

            var fromTexts = JSON.stringify(lTexts);
            $.ajax({
                url: apiUrl,
                headers: {
                    'Ocp-Apim-Subscription-Key': Lang.MSFTApi.key,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                dataType: 'json',
                data: fromTexts,
                async: true,
                success: function (data) {
                    var dataLength = data.length;
                    //console.log(data);
                    //console.log('succes: ' + JSON.stringify(data));
                    var result = "";
                    //console.log(dataLength);
                    $.each(data, function (i) {
                        //console.log(data[i].translations[0].text);
                        result += data[i].translations[0].text;
                        if (i === dataLength - 1) {
                            //console.log(result);
                            //console.log(result.length);
                            result = result.replace(/、/g, ",").replace(/「/g, "\"").replace(/」/g, "\"");
                            if (successFn) {
                                result = result.split("^");
                                successFn(result);
                            }
                        }
                    });
                },
                error: function (err) {
                    console.log(err);
                }

            });
        },

        //製作語言檔使用方法
        getLanguageJSON: function (filePath, successFn, errFn) { //舊版語言套件轉換使用
            //var filePath="js/LanguagePack/HATMLanguage.json";
            var toFilePath="js/LanguagePack/i18n/zh-hant.json";
            var toResultFile;
            ProjectFn.Wait([function(next){
                $.getJSON(toFilePath, function (resultObj){
                    toResultFile=resultObj;
                    console.log(toResultFile);
                    next();
                });
            }],function(){
                var fromFilePath="js/data/StandardVal.json";
                $.getJSON(fromFilePath, function (resultObj) {
                    //console.log(resultObj);
                    console.log(Array.isArray(resultObj));
                    var objLength = 0;
                    var fromResultFile = "";
                    objLength = resultObj.length;
                    var toResultFile_Key = Object.keys(toResultFile);
                    console.log(toResultFile_Key);
                    $.each(resultObj, function (i) {
                        var resultVal=resultObj[i].HSL_Warnings;
                        //console.log(i+resultVal);
                        if(toResultFile_Key.indexOf(resultVal)<0){
                            //console.log(i+resultVal);
                            toResultFile_Key.push(resultVal);
                            fromResultFile += "\"" + resultVal + "\":\"" + resultVal + "\",";
                        }

                        if (i + 1 === objLength) {
                            // this will be executed at the end of the loop
                            console.log("done");
                            if(fromResultFile===""){
                                $("#txtResult").text("無資料需要轉換");
                            }else{
                                $("#txtResult").text("資料轉換完畢");
                            }
                            $("#txtResultFile").val(fromResultFile);
                            if (successFn) {
                                successFn();
                            }
                        }
                    });
                });
            });
        },
        iniLocaleSetting: function (successFn) { //初始化設定區塊
            var ddlToLocale = $("<select></select>");
            ddlToLocale.attr({
                "id": "ddlToLocale",
                "onchange": "Lang.ddlToLocaleChange();"
            });

            var lLocales = [{
                "text": "繁體中文",
                "value": "zh-hant"
            }, {
                "text": "簡體中文",
                "value": "zh-hans"
            }, {
                "text": "英文",
                "value": "en"
            }];
            $.each(lLocales, function (i) {
                var option = $("<option></option>");
                option.text(lLocales[i].text);
                option.val(lLocales[i].value);

                ddlToLocale.append(option);
            });
            var btnTranslate = $('<input type="button" id="btnTranslate" onclick="Lang.btnTranslateClick();" value="開始轉換" class="btn btn-primary"/>');
            var txtDownload = '<br/><br/><span style="font-size:2em;">轉換結果</span><button type="button" id="btnDownload" class="btn btn-sm btn-primary" onclick="Lang.btnDownloadClick();">下載</button>';
            var txtResult = '<h4 id="txtResult"></h4><textarea id="txtResultFile" class="form-control"></textarea><hr/>';
            $('body').prepend(txtResult).prepend(txtDownload).prepend(btnTranslate).prepend(ddlToLocale).prepend("<h1>轉換文字資源檔</h1>");
            $("#ddlToLocale").val(Lang.locale);
            Lang.init(function(){
                console.log("success");
            });
            if(successFn){
                successFn();
            }
        },
        ddlToLocaleChange: function () {
            $.i18n().locale = $("#ddlToLocale").val();
            Lang.i18n("change");
        },
        btnTranslateClick: function () {
            $("#btnTranslate").val("語言轉換中...");
            $("#btnTranslate").prop("disabled", true);
            var toLocale = $("#ddlToLocale").val();
            var lToLocale = [];
            lToLocale.push(toLocale);
            lToLocale.push("en");
            var r = confirm("確定開始進行語言轉換?");
            if (r) {
                Lang.translate(lToLocale, function () {
                    $("#btnTranslate").val("轉換");
                    $("#btnTranslate").prop("disabled", false);
                });
            } else {
                alert("取消轉換");
                $("#btnTranslate").val("轉換");
                $("#btnTranslate").prop("disabled", false);
            }
        },
        btnDownloadClick: function () {
            var fileName = $("#ddlToLocale").val() + ".json";
            Lang.fileDownload($("#txtResultFile").val(), fileName);
        },
        fileDownload: function (content, filename) {
            console.log("funDownload");
            // 建立隱藏的可下載連結
            var eleLink = document.createElement('a');
            eleLink.download = filename;
            eleLink.style.display = 'none'; // 字元內容轉變成blob地址 
            var blob = new Blob([content]);
            eleLink.href = URL.createObjectURL(blob);
            // 觸發點選 
            document.body.appendChild(eleLink);
            eleLink.click();
            // 然後移除
            document.body.removeChild(eleLink);
        },
    };