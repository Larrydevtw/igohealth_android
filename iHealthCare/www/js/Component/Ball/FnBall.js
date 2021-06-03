var FnBall = {
    init: function (clickCB) {
        var assistiveLeft, assistiveTop, timerid;
        $('.assistive-wrap').show();

        var stickEdge = function (el) {
            var left = parseInt(el.style.left) || 0,
                width = parseInt(el.offsetWidth) || 0,
                windowWith = (document.documentElement || document.body).offsetWidth;
            var top = parseInt(el.style.top) || 0, //球的位置Y
                height = parseInt(el.offsetHeight) || 0, //球的高度
                windowHeight = screen.height; //烛幕高度

            if (left > (windowWith - width) / 2) {
                left = windowWith - width - 2;
            } else {
                left = 0;
            }

            //烛幕Y轴极大值
            //(Math.floor(windowHeight/2) - Math.floor(height/2))
            //烛幕Y轴极小值
            //(Math.floor(windowHeight/2) + Math.floor(height/2))-windowHeight
            var cMaxY = (Math.floor(windowHeight / 2) - Math.floor(height / 2));
            var cMinY = (Math.floor(windowHeight / 2) + Math.floor(height / 2)) - windowHeight;
            var vEL_Y = parseInt(el.style.top.toString().replace('px', ''));
            if (vEL_Y < cMinY) {
                el.style.top = cMinY + 'px';
            } else if (vEL_Y > cMaxY) {
                el.style.top = cMaxY + 'px';
            }

            el.style.transition = 'all .2s';
            el.style['-webkit-transition'] = 'all .2s';
            el.style.left = left + 'px';
            timerid = setTimeout(function () {
                el.style.transition = 'all .5s';
                el.style['-webkit-transition'] = 'all .5s';
                el.style.opacity = '.3';
            }, 2000);
        };

        mTouch('.assistive-touch')
            .on('swipestart', function () {
                clearTimeout(timerid);

                this.style.transition = 'none';
                this.style['-webkit-transition'] = 'none';
                this.style.opacity = '.8';

                ////初始位置
                //var width = parseInt(el.offsetWidth) || 0,
                //      windowWith = (document.documentElement || document.body).offsetWidth;

                //var height = parseInt(el.offsetHeight) || 0,//球的高度
                //	windowHeight = screen.height;//烛幕高度
                //assistiveLeft = (windowWith - width - 2);
                //assistiveTop = (Math.floor(windowHeight / 2) - Math.floor(height / 2)) - 50;
                assistiveLeft = parseInt(this.style.left) || 0;
                assistiveTop = parseInt(this.style.top) || 0;
                return false;
            })
            .on('swiping', function (e) {
                this.style.left = assistiveLeft + e.mTouchEvent.moveX + 'px';
                this.style.top = assistiveTop + e.mTouchEvent.moveY + 'px';
            })
            .on('swipeend', function () {
                stickEdge(this);
            })
            .on('tap', function () {
                clickCB();
            });
    }
};