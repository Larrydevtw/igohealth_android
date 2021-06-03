var FnDynamic = {
    createTable: function (targetId, data) { //動態產生Table
        // 使用 Object.keys() 取得包含所有 key 的陣列
        console.log(data);
        var $thead = "<thead><tr>";
        var $tbody = "<tbody>";
        for (var i = 0; i < data.length; i++) {
            var $obj = Object.keys(data[i]);
            var $objLength = $obj.length;
            $tbody += "<tr>";
            $obj.map(function (key, index) {
                if (i == 0) {
                    $thead += "<th>" + key + "</th>";
                    if (index == $objLength - 1) {
                        $thead += "</tr></thead>";
                    }
                }

                $tbody += "<td>" + data[i][key] + "</td>";
                if (index == $objLength - 1) {
                    $tbody += "</tr>";
                }
                //console.log(data[i][key] + "," + index + "," + key);
            }, 0);
            if (i == data.length - 1) {
                $tbody += "</tbody>";
                $("#" + targetId).html($thead + $tbody);
            }
        }


    },
    setDdlValue: function (id, lDatas) {
        var divCtrl = $("#" + id);
        for (var i = 0; i < lDatas.length; i++) {
            var value = lDatas[i].value;
            var text = lDatas[i].text;
            var option = $("<option></option>");

            option.val(value).text(text);

            divCtrl.append(option);
        }
    },
};