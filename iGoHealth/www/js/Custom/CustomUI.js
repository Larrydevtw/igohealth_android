var CustomUI = {
    init: function (successFn) {
        const $$ = str => document.querySelector(str);
        const $$all = str => document.querySelectorAll(str);

        //圖表
        let chartDom = $$("#chart");
        var myChart = echarts.init(chartDom);
        let chartValues = $$("#userState .chartvalues").dataset.chartvalues.split(",");
        let chartDays = $$("#userState .chartxaxis").dataset.chartxaxis.split(",");

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

        /*Modal 視窗操作*/
        let page = "";
        let userState = "";
        let parentPage = "";

        //表單資料更新
        const setUserState = state => {
            if (state) {
                userState = state;
                $$("#userState .chartvalues.active").classList.remove("active");
                let target;
                switch (state) {
                    case "D":
                        target = $$("#userState .chartvalues.D");
                        break;
                    case "B":
                        target = $$("#userState .chartvalues.B");
                        break;
                    case "C":
                        target = $$("#userState .chartvalues.C");
                        break;
                }
                target.classList.add("active");
                chartValues = target.dataset.chartvalues.split(",");
            }
        }


        const closeAllPage = () => {
            [...$$all(".block, #app-nav")].map(page => {
                page.style.display = "none";
            });
        };

        const openPage = page => {
            if (page == "#main_page" || page == "#privacy_page" || page == "#login_page") {
                $$("#app-nav").style.display = "none";
            } else {
                if (page == "#userState") {
                    setUserState(userState);
                    renderChart(chartDays, chartValues);
                    // $$("#navPlus."+userState).style.display = "inline";
                    $$("#navPlus").style.display = "inline";
                } else {
                    $$("#navPlus").style.display = "none";
                }

                //手動轉址
                if (page == "#stateManual") {
                    if (userState) {
                        page = page + userState;
                        console.log(page);
                    } else {
                        page = "#index";
                    }
                }

                //nav顯示
                $$("#app-nav").style.display = "block";
                // console.log( $$(page).dataset.navname);
                if ($$(page)) {
                    $$("#navTitle").innerHTML = $$(page).dataset.navname;
                    //回上頁設定
                    parentPage = $$(page).dataset.parent;
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
                userState = t.classList.item(0); //取得代號        
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
                    content.style.display = "none"
                }); //關閉所有MD_content
            });
        });

        /*按鈕連結 */
        [...$$all(".gotoPage")].map(btn => {
            btn.addEventListener('click', event => {
                closeAllPage();
                page = event.currentTarget.dataset.pagename;
                if (event.currentTarget.dataset.state) {
                    userState = event.currentTarget.dataset.state;
                }
                openPage(page);
            })
        });

        //回上一頁
        $$('#backBtn').addEventListener('click', () => {
            closeAllPage();
            openPage(parentPage)
        });

        //回上一頁
        $$('.IPbtn.parent').addEventListener('click', event => {
            //event.currentTarget.nextElementSibling.classList.toggle('on')
            event.currentTarget.classList.toggle('on')
        });

        if(successFn){
            successFn();
        }
    }
};