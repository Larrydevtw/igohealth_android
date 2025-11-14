var FnDeviceINS = {
    init: function (successFn, errFn) {
        var strSQL = "delete from DevicesINS";
        Log.write("init", "FnDeviceINS init");
        try {
            DAOFn.Query("", strSQL, function ResultFun(qResult) {
                var InsertArray = [{ //聿新易立測/中山瑞福(大陸)血糖/尿酸/膽固醇三合一
                    'DI_Model': 'ETB04',
                    'DI_Title': '【易立測】三高機',
                    'DI_Name': '【易立測】傳輸型血壓/血糖/膽固醇監測系統',
                    'DI_Active': 'Y',
                    'DI_ImagePath': 'images/devices/5050/ETB04.jpg',
                    'DI_ImageDetailPath': 'images/devices/5050/ETB04.jpg',
                    'DI_Text': '<h6 class="card-title">*藍牙智能模式</h6><p class="card-text"></p><p class="card-text">1. 開始量測(血壓、血糖、膽固醇)。</p><p class="card-text">2. 量測完成後三高機會自動啟動藍牙上傳。</p><p class="card-text">3. 待APP呈現量測數值後就可以關閉三高機。</p><h6 class="card-title">*藍牙配對模式</h6><p class="card-text">1. 開啟手機藍牙。</p><p class="card-text">2. 三高機啟動藍牙conn連線: 按住+不放，再按-，藍牙開啟。</p><img src="images/devices/5050/ETB04_help_00.gif" class="card-img-top"><p class="card-text">3. 點擊搜索設備，於清單中挑選欲配對的設備</p><p class="card-text">4. 出現配對成功訊息，關閉三高機。</p><img src="images/devices/5050/ETB04_help_01.gif" class="card-img-top"><p class="card-text">5. 之後流程與智能模式相同。</p>'
                }, {
                    'DI_Model': 'FORA D40',
                    'DI_Title': 'FORA D40',
                    'DI_Name': '血壓血糖二合一',
                    'DI_Active': 'N',
                    'DI_ImagePath': 'images/devices/FORA/D40.jpg',
                    'DI_ImageDetailPath': 'images/devices/FORA/D40.jpg',
                    'DI_Text': '<h6 class="card-title">*藍牙智能模式</h6><p class="card-text"></p><p class="card-text">1. 於手臂繫上臂帶。</p><p class="card-text">2. 調整臂帶下緣和手肘的距離約二指的寬度。</p><p class="card-text">3. 按下開始鍵，開始量測。</p><p class="card-text">4. 量測資料將顯示於畫面。</p><h6 class="card-title">*藍牙配對模式</h6><p class="card-text">1. 開啟手機藍牙。</p><p class="card-text">2. 點選連線按鈕，藍牙開啟。</p><p class="card-text">3. 點擊搜索設備，於清單中挑選欲配對的設備</p><p class="card-text">4. 出現配對成功訊息，設備將會自動關機。</p><p class="card-text">5. 之後流程與智能模式相同。</p>'
                }, {
                    'DI_Model': 'FORA GD40',
                    'DI_Title': 'FORA GD40',
                    'DI_Name': '血糖機',
                    'DI_Active': 'N',
                    'DI_ImagePath': 'images/devices/FORA/GD40.jpg',
                    'DI_ImageDetailPath': 'images/devices/FORA/GD40_help_00.jpg',
                    'DI_Text': '<h6 class="card-title">*藍牙智能模式</h6><p class="card-text"></p><p class="card-text"></p><p class="card-text">1. 採血筆蓋往右旋轉取下。</p><p class="card-text">2. 將採血針套入至採血筆頭，取下採血針頭護蓋。</p><p class="card-text">3. 將採血筆蓋套回並向左旋轉後固定。</p><p class="card-text">4. 雙手握住筆身及筆桿尾端往後拉，使產生喀一聲，按鈕內會變為橘色，代表設定完成。</p><p class="card-text">5. 採血筆蓋刻度轉至最小，或依個人需求調整。</p><p class="card-text">6. 從盒內取出試片，將試片插入機器。</p><p class="card-text">7. 手指採血前請先以酒精消毒，將採血筆牢牢抵住採血部位，按下採血筆的按鈕。</p><p class="card-text">8. 輕輕擠壓刺穿的周邊部位，以取得足夠的血量。</p><p class="card-text">9. 手指靠近試片吸入口，停留約2秒，待試片吸滿血量後，再移開。</p><p class="card-text">10. 將針頭刺入採血針頭護蓋，並依照法規將使用過的試片和採血針丟棄。</p><p class="card-text">11. 量測資料將顯示於畫面。</p><h6 class="card-title">*藍牙配對模式</h6><p class="card-text">1. 開啟手機藍牙。</p><p class="card-text">2. 啟動藍牙conn連線: 按住退片件不放，藍牙開啟。</p><p class="card-text">3. 點擊搜索設備，於清單中挑選欲配對的設備</p><p class="card-text">4. 出現配對成功訊息，設備將會自動關機。</p><p class="card-text">5. 之後流程與智能模式相同。</p>'
                }, {
                    'DI_Model': 'FORA IR21',
                    'DI_Title': 'FORA IR21',
                    'DI_Active': 'Y',
                    'DI_Name': '耳溫槍',
                    'DI_ImagePath': 'images/devices/FORA/IR20.jpg',
                    'DI_ImageDetailPath': 'images/devices/FORA/IR20_help_00.jpg',
                    'DI_Text': '<h6 class="card-title">*藍牙智能模式</h6><p class="card-text"></p><p class="card-text"></p><p class="card-text">1. 請先按下電源鍵。</p><p class="card-text">2. 對準量測點，按下掃瞄鍵2秒後放開。</p><p class="card-text">3. 量測資料將顯示於畫面。</p><h6 class="card-title">*藍牙配對模式</h6><p class="card-text">1. 開啟手機藍牙。</p><p class="card-text">2. 啟動耳溫槍藍牙: 按住電源鍵不放，同時再按壓掃描鍵按鈕，藍牙開啟。</p><p class="card-text">3. 點擊搜索設備，於清單中挑選欲配對的設備</p><p class="card-text">4. 出現配對成功訊息，設備將會自動關機。</p><p class="card-text">5. 之後流程與智能模式相同。</p>'
                }, {
                    'DI_Model': 'FLG-756',
                    'DI_Title': 'FLG-756',
                    'DI_Name': '歐瑟若體脂機',
                    'DI_Active': 'Y',
                    'DI_ImagePath': 'images/devices/FORA/FLG756.jpg',
                    'DI_ImageDetailPath': 'images/devices/FORA/FLG756_help_00.jpg',
                    'DI_Text': '<h6 class="card-title">*藍牙智能模式</h6><p class="card-text"></p><p class="card-text"></p><p class="card-text">1. 脫下鞋襪後，站上體重機。</p><p class="card-text">2. 站穩等待體重、體脂量測完畢。</p><p class="card-text">3. 量測資料將顯示於畫面。</p><h6 class="card-title">*藍牙配對模式</h6><p class="card-text">1. 開啟手機藍牙。</p><p class="card-text">2. 啟動歐瑟若體脂機藍牙</p><p class="card-text">3. 點擊搜索設備，於清單中挑選欲配對的設備</p><p class="card-text">4. 出現配對成功訊息，設備將會自動關機。</p><p class="card-text">5. 之後流程與智能模式相同。</p>'
                }];

                DAOFn.MutiInsertData('', 'DevicesINS', InsertArray, function ResultFun(result) {
                    //回傳值：成功→空字串、失敗→錯誤訊息；若IsUpdate設為F為不執行Update並會回傳「NoUpdate」字串
                    if (result == "") {
                        Log.write("success", "FnDeviceINS init");
                        if (successFn) {
                            successFn();
                        }
                    } else { //失敗
                        Log.write("err", "FnDeviceINS init");
                        if (errFn) {
                            errFn();
                        }
                    }
                });
            });
        } catch (e) {
            alert(e);
        }
    },
    showByDevice: function (device) {
        Log.write(device, "showByDevice");
        $(".devicecard_detail").hide();
        $(".devicecard").removeClass("devicecardon");
        switch(device){
            case "B04":
            case "B05":
                $("#device_detail_" + device).show();
                $("#divDevice_" + device).addClass("devicecardon");
                break;
        }
    },
    showByGroup: function (group) {
        Log.write(group, "showByGroup");
        $(".devicecard").show();
        $(".devicecard_detail").hide();
        FnDeviceINS.BindData(group, function () {
            Log.write("BindData success", "showByGroup");
        });
    },
    BindData: function (brandName, successFn) {
        var strSql = 'Select A.* from DevicesINS as A inner join DevicesInfo as B on B.DeviceModel = A.DI_Model and DI_Active = "Y"';

        if (brandName) {
            strSql += " and B.DeviceBrand = '" + brandName + "'";
        }

        DAOFn.Query('', strSql, function (result) {
            var objList = $.parseJSON(result);
            if (objList.length == 0) {
                Log.write('無資料');
            } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                Log.write('查詢錯誤');
            } else {
                Log.write('有資料');
                var strHtml = "";
                $.each(objList, function (i, item) {
                    var id = objList[i]._id;
                    var DI_Model = objList[i].DI_Model;
                    var DI_Title = objList[i].DI_Title;
                    var DI_Name = objList[i].DI_Name;
                    var DI_ImagePath = objList[i].DI_ImagePath;
                    var DI_Text = objList[i].DI_Text;
                    var DI_Url = objList[i].DI_Url;

                    var ins = "";
                    ins += '<div class="card mb-3" style="overflow:hidden;margin:10px;" onclick="FnDeviceINS.showDetail(' + id + ');">';
                    ins += '<div class="row no-gutters">';
                    ins += '<div class="col-4">';
                    ins += '<img src="' + DI_ImagePath + '" class="card-img" />';
                    ins += '</div>';
                    ins += '<div class="col-8">';
                    ins += '<div class="card-body">';
                    ins += '<h5 class="card-title">' + DI_Title + '</h5>';
                    ins += '<p class="card-text">' + DI_Name + '</p>';
                    ins += '</div>';
                    ins += '</div>';
                    ins += '</div>';
                    ins += '</div>';

                    strHtml += ins;
                    if (i == objList.length - 1) {
                        $("#divDeviceINS_body").html(strHtml);
                    }
                });
                if (successFn) {
                    successFn(objList);
                }
            }
        });
    },
    showDetail: function (_id) {
        $("#divDeviceINS_Detail_Body").html("");
        WiseScripts.Tool.NextPop('divDeviceINS_Detail', function () {
            WiseScripts.Tool.ShowLoading(true, $.i18n("資料載入中.."));
            FnDeviceINS.BindDetail(_id, function () {
                WiseScripts.Tool.ShowLoading(false);
            });
        }, null, 'T');
    },
    BindDetail: function (_id, successFn, errFn) {
        var strSql = 'Select * from DevicesINS where _id = ' + _id;
        DAOFn.Query('', strSql, function (result) {
            var objList = $.parseJSON(result);
            if (objList.length == 0) {
                Log.write('無資料');
                if (successFn) {
                    successFn();
                }
            } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                Log.write('查詢錯誤');
                if (errFn) {
                    errFn();
                }
            } else {
                Log.write('有資料');
                var strHtml = "";
                $.each(objList, function (i, item) {
                    var id = objList[i]._id;
                    var DI_Model = objList[i].DI_Model;
                    var DI_Title = objList[i].DI_Title;
                    var DI_Name = objList[i].DI_Name;
                    var DI_ImagePath = objList[i].DI_ImagePath;
                    var DI_ImageDetailPath = objList[i].DI_ImageDetailPath;
                    var DI_Text = objList[i].DI_Text;
                    var DI_Url = objList[i].DI_Url;

                    var ins = "";
                    ins += '<div class="card">';
                    ins += '<img src="' + DI_ImageDetailPath + '" class="card-img-top" />';
                    ins += '<div class="card-body">';
                    ins += '<h5 class="card-title">' + DI_Name + '</h5>';
                    ins += DI_Text;
                    ins += '</div>';
                    ins += '</div>';

                    strHtml += ins;
                    if (i == objList.length - 1) {
                        $("#divDeviceINS_Detail_Body").html(strHtml);
                    }
                });
                if (successFn) {
                    successFn();
                }
            }
        });
    },
};