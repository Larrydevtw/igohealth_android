var morrisChart = {
    xLabelFormat: function (d) {
        var weekdays = new Array(7);
        weekdays[0] = "日";
        weekdays[1] = "一";
        weekdays[2] = "二";
        weekdays[3] = "三";
        weekdays[4] = "四";
        weekdays[5] = "五";
        weekdays[6] = "六";

        return ("0" + (d.getMonth() + 1)).slice(-2) + '/' +
            ("0" + (d.getDate())).slice(-2) + " " +
            weekdays[d.getDay()];
    },
    dateFormat: function (x) {
        var d = new Date(x);
        return ("0" + (d.getMonth() + 1)).slice(-2) + '/' + 
        ("0" + (d.getDate())).slice(-2) + " " +
        ("0" + (d.getHours())).slice(-2) + ":" + ("0" + (d.getMinutes())).slice(-2);
    },
    hoverCallback: function (index, options, content, row) { //TODO 暫時未使用
        Log.write(index,'index hoverCallback');
        Log.write(JSON.stringify(options),'options hoverCallback');
        Log.write(JSON.stringify(content),'content hoverCallback');
        Log.write(JSON.stringify(row),'row hoverCallback');
    },
    chartStyle:{
        isYScaleAuto: false
    },
    init:function(chartType,chartID, title, chartData, chartDataKey, xyAxisName, chartStyle, fn1, fn2){
        //Log.write(JSON.stringify(chartData) + JSON.stringify(chartDataKey) + JSON.stringify(xyAxisName), 'morrisChart init');

        switch(chartType){
            case "line":
                morrisChart.line(chartID, title, chartData, chartDataKey, xyAxisName, chartStyle, fn1, fn2);
                break;
            case "bar":
                morrisChart.bar(chartID, title, chartData, chartDataKey, xyAxisName, chartStyle, fn1, fn2);
                break;     
        }
    },
    line: function (chartID, title, chartData, chartDataKey, xyAxisName, chartStyle, fn1, fn2) {
        var lColors = ChartInfo.lColorsA;
        console.log("draw morris");

        var xKey = xyAxisName[0];
        var yKeys = chartDataKey;

        xyAxisName.shift();
        var yTitles = xyAxisName;

        if(!chartStyle){
            chartStyle = morrisChart.chartStyle;
        }

        if (chartStyle.isYScaleAuto) {
            Morris.Line({
                element: chartID,
                data: chartData,
                xLabels: "day",
                xLabelFormat: morrisChart.xLabelFormat,
                xkey: xKey,
                ykeys: yKeys,
                dateFormat: morrisChart.dateFormat,
                ymax : 100,
                ymin: 'auto',
                labels: yTitles,
                lineColors: lColors,
                resize: true
            });
        } else {
            Morris.Line({
                element: chartID,
                data: chartData,
                xLabels: "day",
                xLabelFormat: morrisChart.xLabelFormat,
                xkey: xKey,
                ykeys: yKeys,
                dateFormat: morrisChart.dateFormat,
                labels: yTitles,
                lineColors: lColors,
                resize: true
            });
        }

        //特效效果的Script Start
        if (fn1 !== null && fn1 != undefined) {
            fn1();
        }
        if (fn2 !== null && fn2 != undefined) {
            fn2();
        } //特效效果的Script End
    },
    bar: function (chartID, title, chartData, chartDataKey, xyAxisName, chartStyle, fn1, fn2) {
        var lColors = ChartInfo.lColorsA;
        console.log("draw morris bar");

        var xKey = xyAxisName[0];
        var yKeys = chartDataKey;
        xyAxisName.shift();
        var yTitles = xyAxisName;

        chartData = chartData.reverse();//Morris畫Bar:  the order in which you provide the data is the order in which the bars are displayed. 

        Morris.Bar({
            element: chartID,
            data: chartData,
            xLabels: "day",
            xLabelFormat: function (item) {
                var strDate  =  item.src[xKey].replace(/-/g,"/");
                var d = new Date(strDate);
                return ("0" + (d.getMonth() + 1)).slice(-2) + '/' +
                ("0" + (d.getDate())).slice(-2);
            },
            xkey: xKey,
            ykeys: yKeys,
            labels: yTitles,
            barColors: lColors,
            resize: true
        });

        //特效效果的Script Start
        if (fn1 !== null && fn1 != undefined) {
            fn1();
        }
        if (fn2 !== null && fn2 != undefined) {
            fn2();
        } //特效效果的Script End
    }
};