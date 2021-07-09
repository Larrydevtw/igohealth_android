var FnGeo = {
    arrTargets: [],
    init: function (successFn) {

        var arrTargets = FnGeo.arrTargets;

        if (arrTargets.length == 0) {

            Log.write("arrTargets.length為0", 'FnGeo');

            if (successFn) {
                successFn();
            }
            return;
        }

        var lastItem = arrTargets.length - 1;

        for (var i = 0; i < arrTargets.length; i++) {
            var targetId = arrTargets[i];
            $('#' + targetId).twzipcode();
            // $('#' + targetId).twzipcode({
            //     'zipcodeSel'  : '110',
            // });
            if (i === lastItem) {
                if (successFn) {
                    successFn();
                }
            }
        }

    },
    getZipcode: function (targetId, successFn) {
        var selector = "#" + targetId;

        // var county = $(selector).twzipcode('get', 'county');
        // var district = $(selector).twzipcode('get', 'district');
        var zipcode = $(selector).twzipcode('get', 'zipcode');
        console.log(zipcode);

        if (successFn) {
            successFn(zipcode);
        }
    },
    setZipcode: function (targetId, zipcode, successFn) { //FnGeo.setZipcode(targetId,zipcode);
        var selector = "#" + targetId;
        Log.write(selector, 'FnGeo setZipcode');
        Log.write(zipcode, 'FnGeo setZipcode');
        // 直接設置郵遞區號
        $(selector).twzipcode('set', zipcode);

        if (successFn) {
            successFn();
        }
    }
};