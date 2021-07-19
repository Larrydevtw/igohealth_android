var CustomStyle=CustomStyle||{},CustomStyle={
    banner_H:"50px", //預設Banner高度
    adjustStatus_H:function(bannerHeight){
        if (DeviceInfo.getOS() === "Android") { //android
            Log.write("android平台 " + bannerHeight, "index.js 頂部狀態列設定");
            return;
        } else { //ios
            $(".app").addClass("bangs");
            Log.write("ios平台 ", "index.js 頂部狀態列設定");
        }
        // var iconSize="30px";
        // if(!bannerHeight){
        //     bannerHeight=CustomStyle.banner_H;
        // }

        // if(window.screen.availWidth<=768){
        //     Display.txtMaxLength=20;
        //     if(window.screen.availWidth<=320){
        //         // alert
        //         console.log("window.screen.availWidth<320");
        //         $(".tab-custom-style").css("font-size","13px");
        //     }else if(window.screen.availWidth<=480){
        //         $(".tab-custom-style").css("font-size","15px");
        //         // alert
        //         console.log("window.screen.availWidth<480");
        //     }else{
        //         $(".tab-custom-style").css("font-size","16px");
        //         // alert
        //         console.log("window.screen.availWidth");
        //     }      
        // }else{
        //     $(".tab-custom-style").removeClass("tab-custom-style");
        //     bannerHeight="65px";
        //     iconSize="35px";
        //     Display.txtMaxLength=50;
        //     //$(".tab-custom-style").css("font-size: 12px;");
        // }
        // $(".BannerIcon").css("font-size",iconSize);
        //$(".main-box .box").css("height","208px"); //TODO 因新增顯示日期 增加高度208

        // var statusBarHeight="0px";
        // var headerHeight = $(".header").css("height");
        // //TODO
        // if (DeviceInfo.getOS() === "Android") { //android
        //     Log.write("android平台 " + bannerHeight, "index.js 頂部狀態列設定");
        //     return;
        // } else { //ios
        //     $(".header").addClass("Statusbar");
        //     //statusBarHeight = "20px";
        //     // var headerColor = $(".header").css("background-color");
        //     // var headerHeight = $(".header").css("height");
        //     // $(".Statusbar").css({
        //     //     //"height": "calc(" + headerHeight + " + " + statusBarHeight + ")",
        //     //     "height": statusBarHeight,
        //     //     "background": headerColor
        //     // });
        //     // $(".SideStatusbar").css("height", statusBarHeight);
        //     // $(".dismiss").css("top", "calc(" + statusBarHeight + " + 15px)");
        //     // Log.write("ios平台 " + bannerHeight, "index.js 頂部狀態列設定");
        // }

        // $(".header").css("height", "calc(" + headerHeight + " + " + statusBarHeight + ")", );
        // $(".header").css("height",bannerHeight);
        // $("#menu").css("top","calc("+statusBarHeight+" + "+bannerHeight+")");
        // $(".header .nowifi").css("top","calc("+bannerHeight+")");
        
        // var adjustHeight=statusBarHeight+" - "+bannerHeight;
        // $("#MainHome").css("height","calc(100% - "+adjustHeight+")");
        // $(".popup-body").css("height","calc(100% - "+adjustHeight+")");
        // $(".eventbox").css("height","calc(100% - "+adjustHeight+" + 4px)");
        // $(".messbox").css("height","calc(100% - "+adjustHeight+" + 4px)");
    },
    iniSwitchToggle:function(targetID,lbName_L,lbName_R,toggleFlag){
        var toggle = document.getElementById(targetID);
        var toggleContent="";
        var checkedStyle="";

        toggleContent+='<div class="inner-container">';
        toggleContent+='<div class="toggle"><p>'+lbName_R+'</p></div>';
        toggleContent+='<div class="toggle"><p>'+lbName_L+'</p></div>';
        toggleContent+='</div>';
        toggleContent+='<div class="inner-container" id="toggle-'+targetID+'" '+checkedStyle+'>';
        toggleContent+='<div class="toggle"><p>'+lbName_R+'</p></div>';
        toggleContent+='<div class="toggle"><p>'+lbName_L+'</p></div>';
        toggleContent+='</div>';
        toggle.innerHTML=toggleContent;

        toggle.setAttribute("data-flag", toggleFlag);
        CustomStyle.fn_Toggle(targetID,toggleFlag);
    },
    fn_Toggle:function(targetID,toggleFlag,successFn){
        var toggle =document.getElementById(targetID);
        var toggleContainer = document.getElementById('toggle-'+targetID);

        if(!toggleFlag){
            toggleFlag=toggle.getAttribute("data-flag");   
        }  
        Log.write(toggleFlag,"fn_Toggle");

        if (toggleFlag=="Y") {
            toggleContainer.classList.add("toggle_L");
            toggleContainer.classList.remove("toggle_R");
            // toggleContainer.style.clipPath = 'inset(0 50% 0 0)';
            // toggleContainer.style.backgroundColor = 'dodgerblue';
            toggleFlag="N";
        } else {
            toggleContainer.classList.add("toggle_R");
            toggleContainer.classList.remove("toggle_L");
            //toggleContainer.style.clipPath = 'inset(0 0 0 50%)';
            // toggleContainer.style.backgroundColor = 'dodgerblue';//#9AC841
            toggleFlag="Y";
        }
        toggle.setAttribute("data-flag", toggleFlag);

        if(successFn){
            successFn();
        }
    }
};