//增加Date函數
Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

//var previousPoint = null, previousLabel = null;
//$.fn.UseTooltip = function () {
//    $(this).bind("plothover", function (event, pos, item) {
//        if (item) {
//            if ((previousLabel != item.series.label) || (previousPoint != item.dataIndex)) {
//                previousPoint = item.dataIndex;
//                previousLabel = item.series.label;
//                $("#tooltip").remove();

//                var x = item.datapoint[0];
//                var y = item.datapoint[1];

//                var color = item.series.color;
//                var month = new Date(x).getMonth();

//                //console.log(item);

//                if (item.seriesIndex == 0) {
//                    jqueryFlotPlugin.showTooltip(item.pageX,
//                    item.pageY,
//                    color,
//                    "<strong>" + item.series.label + "</strong><br/>" + x + ": <strong>" + y + "</strong>");
//                } else {
//                    jqueryFlotPlugin.showTooltip(item.pageX,
//                    item.pageY,
//                    color,
//                    "<strong>" + item.series.label + "</strong><br/>" + x + ": <strong>" + y + "</strong>");
//                }
//            }
//        } else {
//            $("#tooltip").remove();
//            previousPoint = null;
//        }
//    });
//};

var jqueryFlotPlugin = jqueryFlotPlugin || {}, jqueryFlotPlugin =
    {

        /*
        將最大日期與最小日期區間劃分為GoldScale等份，傳進來時間需先日期排序(flot 區間,string 資料字串)
        回傳值：
        使用方式：
        */
        getXTimeArray: function (GoldScale, arr) {
            var resultArr = [];

            if (arr.length == 0) { return resultArr; }

            //var GoldScale = 10.0;//將最大日期與最小日期區間劃分為10等份，傳進來時間需先日期排序

            if (arr.length <= GoldScale) {
                //資料量小於區間數，直接劃出
                //for (var i = 0; i < arr.length ; i++)
                //{
                //    //alert(new Date(arr[i][0]));
                //    resultArr.push(new Date(arr[i][0]));
                //}
                $.map(arr, function (itemValue, i) {
                    //alert(itemValue.length);
                    var subArray = itemValue;
                    if (subArray.length == 2) {
                        //alert(subArray[0]);
                        resultArr.push([subArray[0]]);
                    }
                });
            } else {
                //取得最大日期
                var maxDate = arr[arr.length - 1][0];
                //取得最小日期
                var minDate = arr[0][0];
                var dM = (maxDate - minDate) / 86400000; //兩日期相差天數
                var SplitRange = Math.ceil(parseFloat(dM) / GoldScale); //取得每個區間天數
                for (var i = 0; i <= GoldScale; i++) {
                    //resultArr.push([minDate.addDays(i * SplitRange)]);
                    resultArr.push([minDate + i * 86400000 * SplitRange]);
                }
            }

            return resultArr;
        }
        //,
        //showTooltip: function (x, y, color, contents) {
        //    $('<div id="tooltip">' + contents + '</div>').css({
        //        position: 'absolute',
        //        display: 'none',
        //        top: y - 50,
        //        left: x - 50,
        //        border: '2px solid ' + color,
        //        padding: '3px',
        //        'font-size': '12px',
        //        'border-radius': '5px',
        //        'background-color': '#fff',
        //        'font-family': 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
        //        opacity: 0.9
        //    }).appendTo("body").fadeIn(200);
        //}

    }

