/*
sqlite 用
Cordova下，使用以下plugin
https://github.com/litehelpers/Cordova-sqlite-storage
*/

var gDB = AppConfig.DbName;//預設DB name
var gResult = "";


//====================DAOFn(public)===============================
var DAOFn = DAOFn || {}, DAOFn =
    {

        /*
        新增一筆資料(db name,資料表名稱string,欲寫入的欄位陣列object,執行結果回傳函數)
        回傳值：成功→空字串、失敗→錯誤訊息
        使用方式：
        var Params = {
        'UI_NAME':'sinclair'
        ,'UI_TEL':'0988123456'
        ,'UI_ADD':'臺灣高雄市鼓山區中華一路352號'
        };
        DAOFn.InsertData('','mUser_Info',Params,function ResultFun(result) { alert("resultFun_Insert:" + result);});
        */
        InsertData: function (dbName, tableName, Params, callback) {
            if (dbName.length == 0) { dbName = gDB; }
            var db = window.sqlitePlugin.openDatabase({ name: dbName, location: 'default' });
            var strResult = "";
            if (Params.length < 1) { callback("沒有傳入欲寫入欄位"); return; }
            var strSQL = "";
            var strCol = "";//欲寫入欄位名稱
            var strQuNum = "";//sqlite 的value, 「?」個數
            var valueArray = [];//欲寫入的值
            for (var key in Params) {
                strCol += key + ",";
                strQuNum += "?,";
                valueArray.push(Params[key]);
            }
            strCol = strCol.substring(0, strCol.length - 1);//去除最後一個,
            strQuNum = strQuNum.substring(0, strQuNum.length - 1);//去除最後一個,

            strSQL = " insert into " + tableName + " (" + strCol + " )values(" + strQuNum + "); ";

            db.transaction(function (tx) {
                //執行SQL
                tx.executeSql(
                    strSQL
                    , valueArray
                    , function (tx, res) { callback(""); }//成功欲執行
                    , function (e) {//失敗欲執行
                        strResult = '[{"Err":"' + e.message + '"}]';
                        callback(strResult);
                    }
                );
            });

        }
        ,
        /*
        單一table新增多筆資料(db name,資料表名稱string,欲寫入的欄位陣列object,執行結果回傳函數)
        回傳值：成功→空字串、失敗→錯誤訊息
        使用方式：
        var InsertArray = [];
        for (var i = 0; i < objBody.length ; i++) {
            var item = objBody[i];
            var contentParams = {
                'ris_city_flag': item.ris_city_flag
                            , 'ris_town_tid': item.ris_town_tid
                            , 'ris_town_id': item.ris_town_id
                            , 'ris_town_name': item.ris_town_name
                            , 'ris_village_id': item.ris_village_id
                            , 'ris_village_name': item.ris_village_name
                            , 'Ris_Active': item.Ris_Active
            };
            
            InsertArray.push(contentParams);
        }
        DAOFn.MutiInsertData('', 'Ris_Town_Village', InsertArray, function ResultFun(result) {
            alert("resultFun_Insert:" + result);
            alert("更新完成");
            WiseScripts.Tool.ShowLoading(false);
        });
        */
        MutiInsertData: function (dbName, tableName, ParamsList, callback) {
            if (dbName.length == 0) { dbName = gDB; }
            var db = window.sqlitePlugin.openDatabase({ name: dbName, location: 'default' });
            var strResult = "";
            if (ParamsList.length < 1) { callback("沒有傳入欲寫入資料"); return; }

            db.transaction(function (tx) {
                for (var i = 0; i < ParamsList.length; i++) {
                    var strSQL = "";
                    var strCol = "";//欲寫入欄位名稱
                    var strQuNum = "";//sqlite 的value, 「?」個數
                    var valueArray = [];//欲寫入的值
                    var Params = ParamsList[i];
                    for (var key in Params) {
                        strCol += key + ",";
                        strQuNum += "?,";
                        valueArray.push(Params[key]);
                    }
                    strCol = strCol.substring(0, strCol.length - 1);//去除最後一個,
                    strQuNum = strQuNum.substring(0, strQuNum.length - 1);//去除最後一個,

                    strSQL = " insert into " + tableName + " (" + strCol + " )values(" + strQuNum + "); ";

                    //Log.write(i,"MultiInsert "+tableName);
                    //執行SQL
                    tx.executeSql(strSQL, valueArray);

                }
            }
            , function (err) {//失敗欲執行
                strResult = '[{"Err":"' + err + '"}]';
                callback(strResult);
            }
             , function () { callback(""); }//成功欲執行
            );
        }
        ,
        /*
        新增一筆資料並取得流水號(db name,資料表名稱string,欲寫入的欄位陣列object,執行結果回傳函數)
        回傳值：成功→「CurrentID」新增流水號、失敗→錯誤訊息
        使用方式：
        var Params = {
        'UI_NAME':'sinclair'
        ,'UI_TEL':'0988123456'
        ,'UI_ADD':'臺灣高雄市鼓山區中華一路352號'
        };
        DAOFn.InsertDataAndGetIndex('','mUser_Info',Params,function ResultFun(result) { alert("resultFun_InsertGet:" + result);});
        */
        InsertDataAndGetIndex: function (dbName, tableName, Params, callback) {
            if (dbName == "") { dbName = gDB; }
            var db = window.sqlitePlugin.openDatabase({ name: dbName, location: 'default' });
            var strResult = "";
            if (Params.length < 1) { callback("沒有傳入欲寫入欄位"); return; }
            var strSQL = "";
            var strCol = "";//欲寫入欄位名稱
            var strQuNum = "";//sqlite 的value, 「?」個數
            var valueArray = [];//欲寫入的值

            for (var key in Params) {
                strCol += key + ",";
                strQuNum += "?,";
                valueArray.push(Params[key]);
            }
            strCol = strCol.substring(0, strCol.length - 1);//去除最後一個,
            strQuNum = strQuNum.substring(0, strQuNum.length - 1);//去除最後一個,

            strSQL = " insert into " + tableName + " (" + strCol + " )values(" + strQuNum + "); ";

            db.transaction(function (tx) {
                //執行SQL
                tx.executeSql(
                    strSQL
                    , valueArray
                    , function (tx, res) {
                        strResult = '[{"CurrentID":"' + res.insertId + '"}]';
                        callback(strResult);
                    }//成功欲執行
                    , function (e) {//失敗欲執行
                        strResult = '[{"Err":"' + e.message + '"}]';
                        callback(strResult);
                    }
                );
            });
        }
        ,
        /*
        更新資料(db name,資料表名稱string,欲寫入的欄位陣列object,PK欄位名稱,PK值,其他欲增加的where條件，若沒有給空字串,執行結果回傳函數)
        回傳值：成功→空字串、失敗→錯誤訊息
        使用方式：
        var Params = {
        'UI_NAME':'sinclair'
        ,'UI_TEL':'0988123456'
        ,'UI_ADD':'臺灣高雄市鼓山區中華一路352號'
        };
        DAOFn.UpdateData('','mUser_Info',Params,'id','23','',function ResultFun(result) { alert("resultFun_Update:" + result);});
        */
        UpdateData: function (dbName, tableName, Params, PkColName, PkColValue, otherWhere, callback) {
            if (dbName == "") { dbName = gDB; }
            var db = window.sqlitePlugin.openDatabase({ name: dbName, location: 'default' });
            var strResult = "";
            if (Params.length < 1) { callback("沒有傳入欲寫入欄位"); return; }
            var strSQL = "";
            var strCol = "";//欲寫入欄位名稱
            var valueArray = [];//欲寫入的值
            for (var key in Params) {
                strCol += key + "=?,";
                valueArray.push(Params[key]);
            }

            strCol = strCol.substring(0, strCol.length - 1);//去除最後一個,
            valueArray.push(PkColValue);//加上where查詢值
            strSQL = " UPDATE " + tableName + " SET " + strCol + " WHERE " + PkColName + "=? " + otherWhere + " ;";
            Log.write(strSQL,"UpdateData");
            Log.write(JSON.stringify(valueArray),"UpdateData");
            db.transaction(function (tx) {
                //執行SQL
                tx.executeSql(
                    strSQL
                    , valueArray
                    , function (tx, res) { callback(""); }//成功欲執行
                    , function (e) {//失敗欲執行
                        strResult = '[{"Err":"' + e.message + '"}]';
                        callback(strResult);
                    }
                );
            });
        }
        ,
        /*
        刪除資料(db name,資料表名稱string,PK欄位名稱,PK值,其他欲增加的where條件，若沒有給空字串,執行結果回傳函數)
        回傳值：成功→空字串、失敗→錯誤訊息
        使用方式：
      
        DAOFn.DeleteData('','mUser_Info','id','1','',function ResultFun(result) { alert("resultFun_Del:" + result);});
        */
        DeleteData: function (dbName, tableName, PkColName, PkColValue, otherWhere, callback) {
            if (dbName == "") { dbName = gDB; }
            var db = window.sqlitePlugin.openDatabase({ name: dbName, location: 'default' });
            var strResult = "";
            var strSQL = "";

            strSQL = " delete from " + tableName + " where " + PkColName + "=? " + otherWhere + "; ";

            db.transaction(function (tx) {
                //執行SQL
                tx.executeSql(
                    strSQL
                    , [PkColValue]
                    , function (tx, res) { callback(""); }//成功欲執行
                    , function (e) {//失敗欲執行
                        strResult = '[{"Err":"' + e.message + '"}]';
                        callback(strResult);
                    }
                );
            });
        }
        ,
        /*
        查詢(db name,查詢SQL語法,執行結果回傳函數)
        回傳值：以JSON格式回傳資料
        使用方式：
        var strSQL = "select * from mUser_Info ";
        DAOFn.Query("", strSQL, function ResultFun(result) {
            var objList = $.parseJSON(result);
            if (objList.length == 0) {
                Log.write("無資料");
                return;
            } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                Log.write("查詢錯誤");
                return;
            } else {
                Log.write("有資料");
                $.each(objList, function (i, item) {
                    $(objSelect).append("<option value='" + item.ris_village_id + "'>" + item.ris_village_name + "</option>");
                });
            }
        });

        */
        Query: function (dbName, exeSQL, callback) {
            if (exeSQL.indexOf("--") >= 0) {
                strResult = '[{"Err":"SQLInj"}]';
                return;
            }


            if (dbName == "") { dbName = gDB; }
            var db = window.sqlitePlugin.openDatabase({ name: dbName, location: 'default' });
            var strResult = "";

            db.transaction(function (tx) {
                //執行SQL
                tx.executeSql(
                    exeSQL
                    , []
                    , function (tx, res) {//成功欲執行
                        for (var i = 0; i < res.rows.length; i++) {
                            var row = res.rows.item(i);
                            strResult += JSON.stringify(row) + ",";
                        }
                        if (strResult.length > 1) {
                            strResult = strResult.substring(0, strResult.length - 1);//去除最後一個,
                        }
                        callback('[' + strResult + ']');
                    }
                    , function (e) {//失敗欲執行
                        strResult = '[{"Err":"' + e.message + '"}]';
                        callback(strResult);
                    }
                );
            });
        }
        ,
        /*
        查詢(db name,查詢SQL語法,執行結果回傳函數)
        回傳值：以JSON格式回傳資料
        使用方式：
        var strSQL = "select * from mUser_Info ";
        DAOFn.QueryAsync('', strSql).then(function(result) {
            var objList = $.parseJSON(result);
            if (objList.length == 0) {
                Log.write("無資料");
                return;
            } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                Log.write("查詢錯誤");
                return;
            } else {
                Log.write("有資料");
                $.each(objList, function (i, item) {
                    $(objSelect).append("<option value='" + item.ris_village_id + "'>" + item.ris_village_name + "</option>");
                });
            }
        });

        */
       QueryAsync: function (dbName, exeSQL) {
            return new Promise(function(resolve,reject){
                if (exeSQL.indexOf("--") >= 0) {
                    strResult = '[{"Err":"SQLInj"}]';
                    return;
                }
    
                if (dbName == "") { dbName = gDB; }
                var db = window.sqlitePlugin.openDatabase({ name: dbName, location: 'default' });
                var strResult = "";
    
                db.transaction(function (tx) {
                    //執行SQL
                    tx.executeSql(
                        exeSQL
                        , []
                        , function (tx, res) {//成功欲執行
                            for (var i = 0; i < res.rows.length; i++) {
                                var row = res.rows.item(i);
                                strResult += JSON.stringify(row) + ",";
                            }
                            if (strResult.length > 1) {
                                strResult = strResult.substring(0, strResult.length - 1);//去除最後一個,
                            }
                            strResult = '[' + strResult + ']';
                            resolve(strResult);
                        }
                        , function (e) {//失敗欲執行
                            strResult = '[{"Err":"' + e.message + '"}]';
                            resolve(strResult);
                        }
                    );
                });
            });
       },
        /*
        簡單版Merge(db name,資料表名稱string,欲寫入的欄位陣列object,PK欄位名稱,PK值,其他欲增加的where條件，若沒有給空字串,執行結果回傳函數, 「是否有update預設為開啟T」)
        回傳值：成功→空字串、失敗→錯誤訊息；若IsUpdate設為F為不執行Update並會回傳「NoUpdate」字串
        使用方式：
        //以下為確認Table mCustom_Params是否已有「CP_ParaName=CP_ParaName  and UI_ID='mSys' 」如果有就update，沒有就insert
            var Params = {
                'UI_ID': 'mSys'
                        , 'CP_ParaName': ParaName
                        , 'CP_ParaValue': ParaValue
                        , 'CP_ACTIVE': '1'
                        , 'CP_UP_Date': DateTimeFun.getNow()
            };
            
            DAOFn.SimpleMerge('', 'mCustom_Params', Params, 'CP_ParaName', ParaName, " and UI_ID='mSys' ", function ResultFun(result) { },'T');
       */
        SimpleMergeP: function (dbName, tableName, Params, PkColName, PkColValue, otherWhere, callback, IsUpdate) {
            if (dbName == "") { dbName = gDB; }
            if (IsUpdate != "F") { IsUpdate = "T"; }
            var db = window.sqlitePlugin.openDatabase({ name: dbName, location: 'default' });
            var strResult = "";
            var valueArray = [];//欲寫入的值
            valueArray.push(PkColValue);//加上where查詢值
            var strSQL = "select " + PkColName + " FROM " + tableName + " WHERE " + PkColName + "=? " + otherWhere + " LIMIT 1 ;";
            //console.log(strSQL);
            db.transaction(function (tx) {
                //執行SQL
                tx.executeSql(
                    strSQL
                    , valueArray
                    , function (tx, res) {
                        //成功欲執行
                        if (res.rows.length > 0) {
                            //update
                            if (IsUpdate == "T") {
                                console.log("MergeUpdate");
                                DAOFn.UpdateData(dbName, tableName, Params, PkColName, PkColValue, otherWhere, callback);
                            } else {
                                console.log("MergeNoUpdate");
                                callback("NoUpdate");
                            }
                        } else {
                            //insert
                            console.log("MergeInsert");
                            DAOFn.InsertData(dbName, tableName, Params, callback);
                        }
                    }
                    , function (e) {//失敗欲執行
                        console.log("merge ERR " + e.message);
                        strResult = '[{"Err":"' + e.message + '"}]';
                        callback(strResult);
                    }
                );
            });
        }
        ,
        /*
        在Transation中一次執行多個Execute(db name,欲執行的Execute,執行結果回傳函數)
        回傳值：成功→空字串、失敗→錯誤訊息
        使用方式：
        DAOFn.ExecuteSqlWithTransation(
                '',
                function (tx)
                {
                    tx.executeSql("insert Atable(A1,A2)values('1','2');");
                    tx.executeSql("insert Btable(B1,B2)values('3','4');");
                    tx.executeSql("insert Ctable(C1,C2)values('5','6');");
                }
                ,
                function (result) {
                alert(result);
                }
            );
        */
        ExecuteSqlWithTransation: function (dbName, ExecuteFun, callback) {
            if (dbName.length == 0) { dbName = gDB; }
            var db = window.sqlitePlugin.openDatabase({ name: dbName, location: 'default' });
            var strResult = "";

            db.transaction(
                ExecuteFun
            , function (err) {//失敗欲執行
                strResult = '[{"Err":"' + err + '"}]';
                callback(strResult);
            }
             , function () { callback(""); }//成功欲執行
            );
        }
        ,
        /*
        高效能簡單版Merge(db name,資料表名稱string,欲寫入的欄位陣列object,PK欄位名稱,PK值,其他欲增加的where條件，若沒有給空字串,執行結果回傳函數, 「是否有update預設為開啟T」)
        回傳值：成功→空字串、失敗→錯誤訊息；若IsUpdate設為F為不執行Update並會回傳「NoUpdate」字串
        使用方式：
        //以下為確認Table mCustom_Params是否已有「CP_ParaName=CP_ParaName  and UI_ID='mSys' 」如果有就update，沒有就insert
            var Params = {
                'UI_ID': 'mSys'
                        , 'CP_ParaName': ParaName
                        , 'CP_ParaValue': ParaValue
                        , 'CP_ACTIVE': '1'
                        , 'CP_UP_Date': DateTimeFun.getNow()
            };
            
            DAOFn.SimpleMerge('', 'mCustom_Params', Params, 'CP_ParaName', ParaName, " and UI_ID='mSys' ", function ResultFun(result) { },'T');
       */
        SimpleMerge: function (dbName, tableName, Params, PkColName, PkColValue, otherWhere, callback, IsUpdate) {
            if (dbName == "") { dbName = gDB; }
            if (IsUpdate != "F") { IsUpdate = "T"; }
            var db = window.sqlitePlugin.openDatabase({ name: dbName, location: 'default' });
            var strResult = "";
            var valueArray = [];//欲寫入的值
            valueArray.push(PkColValue);//加上where查詢值
            var strSQL = "select " + PkColName + " FROM " + tableName + " WHERE " + PkColName + "=? " + otherWhere + " LIMIT 1 ;";
            //console.log(strSQL);
            //var callbackResult = "";
            db.transaction(

                function (tx) {
                    //執行SQL
                    tx.executeSql(
                        strSQL
                        , valueArray
                        , function (tx_sub1, res) {
                            //成功欲執行
                            if (res.rows.length > 0) {
                                //update
                                if (IsUpdate == "T") {
                                    console.log("MergeUpdate");
                                    //var strSQL = "";
                                    var strCol = "";//欲寫入欄位名稱
                                    var valueArray_sub = [];//欲寫入的值
                                    for (var key in Params) {
                                        strCol += key + "=?,";
                                        valueArray_sub.push(Params[key]);
                                    }

                                    strCol = strCol.substring(0, strCol.length - 1);//去除最後一個,
                                    valueArray_sub.push(PkColValue);//加上where查詢值
                                    strSQL = " UPDATE " + tableName + " SET " + strCol + " WHERE " + PkColName + "=? " + otherWhere + " ;";
                                    tx.executeSql(
                                        strSQL
                                        , valueArray_sub
                                        , function (tx_sub2, res) { strResult = ""; }//成功欲執行
                                        , function (e) {//失敗欲執行
                                            strResult = '[{"Err":"' + e.message + '"}]';
                                            //callback(strResult);
                                        }
                                    );
                                } else {
                                    console.log("MergeNoUpdate");
                                    //callback("NoUpdate");
                                    strResult = "NoUpdate";
                                }
                            } else {
                                //insert
                                console.log("MergeInsert");
                                var strCol = "";//欲寫入欄位名稱
                                var strQuNum = "";//sqlite 的value, 「?」個數
                                var valueArray_sub = [];//欲寫入的值
                                for (var key in Params) {
                                    strCol += key + ",";
                                    strQuNum += "?,";
                                    valueArray_sub.push(Params[key]);
                                }
                                strCol = strCol.substring(0, strCol.length - 1);//去除最後一個,
                                strQuNum = strQuNum.substring(0, strQuNum.length - 1);//去除最後一個,

                                strSQL = " insert into " + tableName + " (" + strCol + " )values(" + strQuNum + "); ";
                                tx.executeSql(
                                    strSQL
                                    , valueArray_sub
                                    , function (tx_sub2, res) { strResult = ""; }//成功欲執行
                                    , function (e) {//失敗欲執行
                                        strResult = '[{"Err":"' + e.message + '"}]';
                                        //callback(strResult);
                                    }
                                );
                            }
                        }
                        , function (e) {//失敗欲執行
                            console.log("merge ERR " + e.message);
                            strResult = '[{"Err":"' + e.message + '"}]';
                            //callback(strResult);
                        }
                    );
                }
                , function (err) {//失敗欲執行
                    strResult = '[{"Err":"' + err + '"}]';
                    callback(strResult);
                }, function () { callback(strResult); }//成功欲執行
            );
        }



    };