var WiseFlot = WiseFlot || {}, WiseFlot = {
    lColors:["#55D3FF","#F6951D","#78BC28","#008B45","#CFB600","#1793C7"],
    GetBestTicks: function () {
        if ($(window).width() < 300)
            return 2;
        else if ($(window).width() < 500)
            return 3;
        else if ($(window).width() < 600)
            return 4;
        else if ($(window).width() < 800)
            return 6;
        else if ($(window).width() < 1000)
            return 7;
        else if ($(window).width() < 1200)
            return 8;
        else
            return 10;
    },
    DrawPic: function (Type, MyValue, top, bot, pL, pH, ptr, isAnimate) {

        var TheValue = WiseFlot.CalcAns(top, bot, pH, pL, MyValue);

        if (isAnimate) {
            var counter = { 'value': 0 }; //Start
            TweenMax.to(counter,
                3,
                {
                    'value': TheValue, //End
                    'onUpdate': function () {
                        switch (Type) {
                            case "BP":
                                $("#M" + Type + "_val" + ptr).removeAttr('d');
                                var Rd = 85;

                                if (ptr == 2)
                                    Rd = 70;

                                if (ptr == 3)
                                    Rd = 55;

                                $("#M" + Type + "_val" + ptr).attr('d', WiseFlot.describeArc(94, 90, Rd, 0, WiseFlot.CalcAns(200, 0, 360, 0, counter.value)));
                                break;
                            case "STEP":
                                return;
                            default: //BT, BG, UA, CHOL, BW, BF, BO, HR
                                $("#M" + Type + "_bg").height(counter.value);
                                break;
                        }

                    },
                    'onComplete': function () {

                    },
                    'ease': Expo.easeOut
                });
        }
        else {
            switch (Type) {
                case "BP":
                    $("#M" + Type + "_val" + ptr).removeAttr('d');
                    var Rd = 85;

                    if (ptr == 2)
                        Rd = 70;

                    if (ptr == 3)
                        Rd = 55;

                    $("#M" + Type + "_val" + ptr).attr('d', WiseFlot.describeArc(94, 90, Rd, 0, WiseFlot.CalcAns(200, 0, 360, 0, TheValue)));
                    break;
                case "STEP":
                    return;
                default: //BT, BG, UA, CHOL, BW, BF, BO, HR
                    $("#M" + Type + "_bg").height(TheValue);
                    break;
            }
        }


    },
    DrawCirVal: function (bot, top, val, cx, cy, r, AgB, AgT, MType, ptr) {
        if (val < bot)
            val = bot;

        if (val > top)
            val = top;

        var Avg = parseFloat(top + bot) / 2;

        //上半段
        if (val <= Avg) {
            val = WiseFlot.CalcAns(Avg, bot, 360, AgT, val);
        }

        //下半段
        else if (val > Avg) {
            val = WiseFlot.CalcAns(top, Avg, AgB, 0, val);
        }

        var angleInRadians = (val - 90) * Math.PI / 180.0;
        var vx = cx + (r * Math.cos(angleInRadians));
        var vy = cy + (r * Math.sin(angleInRadians));

        $("#M" + MType + "_value" + ptr).show();

        $("#M" + MType + "_value" + ptr).attr('cx', vx);
        $("#M" + MType + "_value" + ptr).attr('cy', vy);
    },

    polarToCartesian: function (centerX, centerY, radius, angleInDegrees) {
        var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    },
    describeArc: function (x, y, radius, startAngle, endAngle) {
        var start = WiseFlot.polarToCartesian(x, y, radius, endAngle);
        var end = WiseFlot.polarToCartesian(x, y, radius, startAngle);

        var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        var d = [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");

        return d;
    },
    CalcAns: function (top, bot, pH, pL, X) {
        if (X >= top)
            X = top;

        if (X <= bot)
            X = bot;

        return pL + (((X - bot) * (pH - pL)) / (top - bot));
    },

};