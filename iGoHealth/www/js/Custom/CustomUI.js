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
        let chartDom = $$("#History_Chart");
        var myChart = echarts.init(chartDom);
        let chartValues = $$("#userHistory .chartType .chartvalues").dataset.chartvalues.split(",");
        let chartDays = $$("#History_Time .chartxaxis").dataset.chartxaxis.split(",");

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
                    case "UA":
                        target = $$("#userHistory .chartvalues.UA");
                        break;
                    case "TG":
                        target = $$("#userHistory .chartvalues.TG");
                        break;
                    case "HB":
                        target = $$("#userHistory .chartvalues.HB");
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

        if (page == "#main_page" || page == "#privacy_page" || page == "#login_page") {
            $$("#app-nav").style.display = "none";
        } else {
            if (page == "#userHistory") {
                CustomUI.setUserState(CustomUI.userHistory);
                // CustomUI.renderChart(chartDays, chartValues);
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
    setUserState: function (state, successFn) { //量測資料更新

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

            var chartValues = target.dataset.chartvalues.split(",");

            if(successFn){
                successFn(chartValues);
            }

        }
    },
    setTabTypes: function () {
        console.log("setTabTypes");
        // 2. 為每一個按鈕添加點擊事件監聽器
        navButtons.forEach((button) => {
        button.addEventListener("click", function (event) {
            // (可選) 如果您的按鈕有 href="#"，可以用這行防止頁面跳轉
            // event.preventDefault();
            console.log($(this));
            // 我們需要操作的是 a 標籤的父層 div，因為它的 offsetLeft 是相對於容器的
            const targetElement = this.parentElement;

            // --- 核心計算邏輯 ---

            // a. 獲取容器的可見寬度
            const containerWidth = scrollContainer.clientWidth;

            // b. 獲取被點擊元素的寬度
            const targetWidth = targetElement.offsetWidth;

            // c. 獲取被點擊元素相對於容器左側的距離
            const targetOffsetLeft = targetElement.offsetLeft;

            // d. 計算要滾動到的目標位置
            //    目標 = (元素左側距離 + 元素寬度的一半) - (容器寬度的一半)
            const scrollToPosition =
            targetOffsetLeft + targetWidth / 2 - containerWidth / 2;

            // --- 執行平滑滾動 ---
            scrollContainer.scrollTo({
            left: scrollToPosition,
            behavior: "smooth",
            });

            // (可選) 為被點擊的按鈕添加一個 'active' class，並移除其他按鈕的
            // 這可以讓您用 CSS 來突顯當前選項
            navButtons.forEach((btn) => btn.classList.remove("active"));
            this.classList.add("active");
        });
        });
    },
    /**
     * 將指定 ID 的元素在其滾動容器中置中顯示。
     * @param {string} containerId - 滾動容器的 ID。
     * @param {string} targetElementId - 要置中的目標元素（通常是 <a> 標籤）的 ID。
     */
    centerElementInView: function (containerId, targetElementId) {
        console.log("centerElementInView");
        // 1. 獲取 DOM 元素
        const scrollContainer = document.getElementById(containerId);
        const targetLink = document.getElementById(targetElementId);
        console.log(scrollContainer);
        console.log(targetLink);
        // 2. 防呆處理：如果找不到元素，就在控制台報錯並終止函數
        if (!scrollContainer) {
        console.error(
            `Error: Scroll container with ID "#${containerId}" not found.`
        );
        return;
        }
        if (!targetLink) {
        console.error(
            `Error: Target element with ID "#${targetElementId}" not found.`
        );
        return;
        }

        // 3. 獲取目標元素的父級 div，因為我們需要計算它的 offset
        const targetWrapper = targetLink.parentElement;
        if (!targetWrapper || !scrollContainer.contains(targetWrapper)) {
        console.error(
            "Error: Target element is not a direct child of a wrapper inside the container."
        );
        return;
        }

        // 4. 核心計算邏輯
        const containerWidth = scrollContainer.clientWidth;
        const targetWidth = targetWrapper.offsetWidth;
        const targetOffsetLeft = targetWrapper.offsetLeft;
        console.log(containerWidth);
        console.log(targetWidth);
        console.log(targetOffsetLeft);
        // 計算滾動位置，使目標元素的中心對齊容器的中心
        const scrollToPosition =
        targetOffsetLeft + targetWidth / 2 - containerWidth / 2;

        // 5. 執行平滑滾動
        scrollContainer.scrollTo({
        left: scrollToPosition,
        behavior: "smooth",
        });
        console.log(scrollToPosition);

        // 6. 更新 'active' 狀態，突顯當前選項
        const allLinks = scrollContainer.querySelectorAll("a.btn");
        allLinks.forEach((btn) => btn.classList.remove("active")); // 移除所有按鈕的 active class
        targetLink.classList.add("active"); // 為當前點擊的按鈕添加 active class
    },

    /**
     * 初始化一個滾動容器，使其內部所有 class 為 'btn' 的 <a> 元素在點擊後都能置中。
     * @param {string} containerId - 滾動容器的 ID。
     */
    setupClickToCenter: function (containerId) {
        console.log("setupClickToCenter");
        const scrollContainer = document.getElementById(containerId);
        if (!scrollContainer) {
        console.error(
            `Initialization failed: Scroll container with ID "#${containerId}" not found.`
        );
        return;
        }

        const navButtons = scrollContainer.querySelectorAll("a.btn");
        navButtons.forEach((button) => {
            console.log(button);
        // 為每個按鈕添加點擊事件監聽
        button.addEventListener("click", function (event) {
            // 點擊時，調用我們的核心函數
            // this.id 就是被點擊的 <a> 標籤的 ID，例如 "tbtnBP"
            CustomUI.centerElementInView(containerId, this.id);
        });
        });
    },
    /**
     * 將元素滾動到視窗中央，並可選添加垂直偏移
     * @param {HTMLElement} element - 要滾動到的目標 DOM 元素
     * @param {number} [offset=0] - 垂直偏移量 (px)，正數向下，負數向上
     */
    scrollToCenterWithOffset: function (element, offset = 0) {
        if (!element) return;

        element.scrollIntoView({
          block: "center",
        });
        return;
        // 1. 計算元素中心點在文件中的絕對位置
        const elementRect = element.getBoundingClientRect();
        const elementTop = elementRect.top + window.scrollY; // or window.pageYOffset
        const elementHeight = elementRect.height;
        const elementCenter = elementTop - elementHeight / 2;

        // 2. 計算視窗的中心點
        const viewportHeight = window.innerHeight;
        const viewportCenter = viewportHeight / 2;

        // 3. 計算最終要滾動到的目標 Y 座標
        // 目標是讓元素的中心點對齊視窗的中心點，然後再加上偏移
        const targetY = elementCenter - viewportCenter + elementHeight / 2 + offset;
        console.log("targetY" + targetY);
        // 4. 執行滾動
        window.scrollTo({
            top: targetY,
            // behavior: "smooth",
        });
    },
};