var $$ = str => document.querySelector(str);
var $$all = str => document.querySelectorAll(str);

var CustomUI = {
    /*Modal 視窗操作*/
    page: "",
    userHistory: "",
    parentPage: "",
    init: function(successFn){

        //開啟modal視窗
        [...$$all('.modalOpen')].map(btn => {
            btn.addEventListener('click', event => {
                var _modal = $$("#IP_Modal");
                _modal.style.display = "block";
                //console.log(event.target.dataset.modalcontent)
                if (event.target.dataset.modalcontent != undefined) {
                    _modal.querySelector(event.target.dataset.modalcontent).style.display = "block";
                }
            });
        });

        //關閉視窗
        [...$$all('.modalClose')].map(btn => {
            btn.addEventListener('click', event => {
                $$("#IP_Modal").style.display = "none";
                [...$$all('.MD_content')].map(content => {
                    content.style.display = "none"
                }); //關閉所有MD_content
            });
        });

        //回上一頁
        $$('#backBtn').addEventListener('click', () => {
            app.onBack();
        });

        //左側選單收合
        $$('.IPbtn.parent').addEventListener('click', event => {
            //event.currentTarget.nextElementSibling.classList.toggle('on')
            event.currentTarget.classList.toggle('on');
        });

        if(successFn){
            successFn();
        }

        //CustomUI.Demo();
    },
    Demo: function (successFn) {

        Log.write("單純查看UI導覽使用，正式上線不使用相關程式碼",'CustomUI Demo');

        //圖表
        let chartDom = $$("#chart");
        var myChart = echarts.init(chartDom);
        let chartValues = $$("#userHistory .chartvalues").dataset.chartvalues.split(",");
        let chartDays = $$("#userHistory .chartxaxis").dataset.chartxaxis.split(",");

        const renderChart = () => {
            //xData = days?days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            //value = value?value: [150, 230, 224, 218, 135, 147, 260]    
            let option = {
                xAxis: {
                    type: 'category',
                    data: chartDays
                },
                yAxis: {
                    type: 'value'
                },
                series: [{
                    data: chartValues,
                    type: 'line'
                }]
            };
            myChart.setOption(option);
        };

        //表單資料更新
        const setUserState = state => {
            if (state) {
                userHistory = state;
                $$("#userHistory .chartvalues.active").classList.remove("active");
                let target;
                switch (state) {
                    case "D":
                        target = $$("#userHistory .chartvalues.D");
                        break;
                    case "B":
                        target = $$("#userHistory .chartvalues.B");
                        break;
                    case "C":
                        target = $$("#userHistory .chartvalues.C");
                        break;
                }
                target.classList.add("active");
                chartValues = target.dataset.chartvalues.split(",");
            }
        };

        //圖表天數 & 圖表數值
        [...$$all(".chartvalues, .chartxaxis")].map(btn => {
            btn.addEventListener('click', event => {
                let t = event.currentTarget;
                if (t.classList.contains("chartvalues"))[...$$all(".chartvalues")].map(btnA => {
                    btnA.classList.remove("active")
                });
                if (t.classList.contains("chartxaxis"))[...$$all(".chartxaxis")].map(btnA => {
                    btnA.classList.remove("active");
                });
                if (t.dataset.chartxaxis) chartDays = t.dataset.chartxaxis.split(",");
                if (t.dataset.chartvalues) chartValues = t.dataset.chartvalues.split(",");
                t.classList.add("active");
                CustomUI.userHistory = t.classList.item(0); //取得代號        
                renderChart(chartDays, chartValues);
            });
        });

        //開啟modal視窗
        [...$$all('.modalOpen')].map(btn => {
            btn.addEventListener('click', event => {
                let _modal = $$("#IP_Modal");
                _modal.style.display = "block";
                //console.log(event.target.dataset.modalcontent)
                if (event.target.dataset.modalcontent != undefined) {
                    _modal.querySelector(event.target.dataset.modalcontent).style.display = "block";
                }
            });
        });

        //關閉視窗
        [...$$all('.modalClose')].map(btn => {
            btn.addEventListener('click', event => {
                $$("#IP_Modal").style.display = "none";
                [...$$all('.MD_content')].map(content => {
                    content.style.display = "none";
                }); //關閉所有MD_content
            });
        });

        /*按鈕連結 */
        [...$$all(".gotoPage")].map(btn => {
            btn.addEventListener('click', event => {
                CustomUI.closeAllPage();
                CustomUI.page = event.currentTarget.dataset.pagename;
                if (event.currentTarget.dataset.state) {
                    CustomUI.userHistory = event.currentTarget.dataset.state;
                }
                CustomUI.openPage(CustomUI.page);
            });
        });

        //回上一頁
        $$('#backBtn').addEventListener('click', () => {
            CustomUI.closeAllPage();
            CustomUI.openPage(CustomUI.parentPage);
        });

        //回上一頁
        $$('.IPbtn.parent').addEventListener('click', event => {
            //event.currentTarget.nextElementSibling.classList.toggle('on')
            event.currentTarget.classList.toggle('on');
        });

        if (successFn) {
            successFn();
        }
    },
    openPage: function (page, successFn) {

        page = "#" + page;
        page = page.replace(/##/g, '#');

        var $$ = str => document.querySelector(str);

        if (page == "#main_page" || page == "#privacy_page" || page == "#login_page") {
            $$("#app-nav").style.display = "none";
        } else {
            if (page == "#CustomUI.userHistory") {
                setUserState(CustomUI.userHistory);
                renderChart(chartDays, chartValues);
                // $$("#navPlus."+CustomUI.userHistory).style.display = "inline";
                $$("#navPlus").style.display = "inline";
            } else {
                $$("#navPlus").style.display = "none";
            }

            //手動轉址
            if (page == "#stateManual") {
                if (CustomUI.userHistory) {
                    page = page + CustomUI.userHistory;
                    console.log(page);
                } else {
                    page = "#MainHome";
                }
            }

            //nav顯示
            $$("#app-nav").style.display = "block";
            // console.log( $$(page).dataset.navname);
            if ($$(page)) {
                $$("#navTitle").innerHTML = $$(page).dataset.navname;
                //回上頁設定
                CustomUI.parentPage = $$(page).dataset.parent;
                if ($$(page).dataset.parent) {
                    $$("#backBtn").style.display = "inline";
                    $$("#mainMenu").style.display = "none";
                } else {
                    $$("#backBtn").style.display = "none";
                    $$("#mainMenu").style.display = "inline";
                }
            }
        }
        if ($$(page)) {
            $$(page).style.display = "block";
            document.documentElement.scrollTop = 0;
        } else {
            console.log("沒有此分頁:" + page);
        }

        if(successFn){
            successFn();
        }
    },
    closeAllPage: function (successFn) {

        var $$all = str => document.querySelectorAll(str);

        [...$$all(".block, #app-nav")].map(page => {
            page.style.display = "none";
        });

        if(successFn){
            successFn();
        }
    },
    setUserState: function (state) {//量測資料更新

        if (state) {
            CustomUI.userHistory = state;
            $$("#userHistory .chartvalues.active").classList.remove("active");
            var target;
            switch (state) {
                case "D":
                    target = $$("#userHistory .chartvalues.D");
                    break;
                case "B":
                    target = $$("#userHistory .chartvalues.B");
                    break;
                case "C":
                    target = $$("#userHistory .chartvalues.C");
                    break;
            }
            target.classList.add("active");
            chartValues = target.dataset.chartvalues.split(",");
        }
    }
};