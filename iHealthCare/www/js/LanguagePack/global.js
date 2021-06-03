$(function () {
    //設定語系
    //$.i18n().locale = 'zh-hant';
    //取得Key直對應的文字
    //$.i18n('app-title');

    //自動產生設定語言區塊 開發完成後請註解這一行
    Lang.iniLocaleSetting(function(){
        // $("#ddlToLocale").val("zh-hans");
    });
})