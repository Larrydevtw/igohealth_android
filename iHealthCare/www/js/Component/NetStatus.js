/*
確認網路狀態
Cordova下，使用以下plugin
https://github.com/apache/cordova-plugin-network-information

如果一直回傳Unknow，step1:移除plugin、step2:專案「重建」、step3:再加入plugin
*/

var NetStatusFn = {
    _bNetFlag: false,
    _NetType: "NONE",
    _onLineFun: null,
    _offLineFun: null,
    /*
    設定有網路與無網路時要執行的函數(有網路時欲執行函數,無網路時欲執行函數)
        回傳值：無回傳值
        使用方式：
        NetStatusFn.initFun(function onlineEvent() { alert("online");}, function offlineEvent() {alert("offline"); });
    */
    initFun: function (onOnlineFun, onOfflineFun, successFn) {
        document.addEventListener('deviceready', onDeviceReady.bind(this), false);

        function onDeviceReady() {
            NetStatusFn.checkConnection();
            document.addEventListener("online", NetStatusFn.onOnline, false);
            document.addEventListener("offline", NetStatusFn.onOffline, false);
        }

        NetStatusFn._onLineFun = onOnlineFun;
        NetStatusFn._offLineFun = onOfflineFun;

        if (successFn) {
            successFn();
        }
    },
    onOffline: function () {
        // Handle the offline event
        NetStatusFn._NetType = navigator.connection.type;
        NetStatusFn._bNetFlag = false;
        if (NetStatusFn._offLineFun != null) {
            NetStatusFn._offLineFun();
        }
    },
    onOnline: function () {
        // Handle the online event
        NetStatusFn._NetType = navigator.connection.type;
        NetStatusFn._bNetFlag = true;
        if (NetStatusFn._onLineFun != null) {
            NetStatusFn._onLineFun();
        }
    },
    checkConnection: function () {
        var networkState = navigator.connection.type;

        //var states = {};
        //states[Connection.UNKNOWN] = 'Unknown';
        //states[Connection.ETHERNET] = 'Ethernet';
        //states[Connection.WIFI] = 'WiFi';
        //states[Connection.CELL_2G] = 'Cell 2G';
        //states[Connection.CELL_3G] = 'Cell 3G';
        //states[Connection.CELL_4G] = 'Cell 4G';
        //states[Connection.CELL] = 'Cell generic';
        //states[Connection.NONE] = 'No network';
        NetStatusFn._NetType = networkState;

        //alert(NetStatusFn._NetType);
        //alert(Connection.UNKNOWN);
        //alert(Connection.NONE);

        //if (networkState == Connection.UNKNOWN || networkState == Connection.NONE) {
        if (networkState == navigator.connection.UNKNOWN || networkState == navigator.connection.NONE) {
            //無網路
            NetStatusFn._bNetFlag = false;
        } else {
            //alert(NetStatusFn._NetType);
            NetStatusFn._bNetFlag = true;
        }

    },
    /*
    回傳是否有網路
    回傳值：true/false
    使用方式：
    NetStatusFn.getNetFlag()
    */
    getNetFlag: function () {
        return NetStatusFn._bNetFlag;
    },
    /*
    回傳網路連線類型名稱
    回傳值：4G/3G/WIFI/NONE
    使用方式：
    NetStatusFn.getNetType()
    */
    getNetType: function () {
        return NetStatusFn._NetType;
    }
};