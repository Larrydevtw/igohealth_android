var SidebarCustom = {
    sidebarId: "IP_Modal",
    openMenuFn:function(){      
    },
    closeMenuFn:function(){
    },
    init: function () {
        $('.dismiss, .overlay').on('click', function () {
            SidebarCustom.closeMenu();
        });

        $('.open-menu').on('click', function (e) {
            e.preventDefault();
            SidebarCustom.toggleMenu();
        });

        /* replace the default browser scrollbar in the sidebar, in case the sidebar menu has a height that is bigger than the viewport */
        $('.sidebar').mCustomScrollbar({
            theme: "minimal-dark"
        });
    },
    toggleMenu: function (isOpen) {
        var sideBar = document.getElementById(SidebarCustom.sidebarId);
        //console.log(sideBar.className);
        if (isOpen === 'N' || sideBar.classList.contains('active')) {
            //console.log('active; close');
            SidebarCustom.closeMenu();
        } else {
            //console.log('not active; open');
            SidebarCustom.openMenu();
        }
    },
    openMenu:function(){
        $('.sidebar').addClass('active');
        $('.overlay').addClass('active');
        // close opened sub-menus
        $('.collapse.show').toggleClass('show');
        $('a[aria-expanded=true]').attr('aria-expanded', 'false');

        if(SidebarCustom.openMenuFn){
            SidebarCustom.openMenuFn();
        }
    },
    closeMenu:function(){
        $('.sidebar').removeClass('active');
        $('.overlay').removeClass('active');

        if(SidebarCustom.closeMenuFn){
            SidebarCustom.closeMenuFn();
        }
    }
};

$(function () {
    SidebarCustom.init();
});
