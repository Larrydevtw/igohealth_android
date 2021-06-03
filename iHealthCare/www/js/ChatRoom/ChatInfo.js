var ChatInfo = ChatInfo || {},ChatInfo={
    ID:"",
    userName:"",
    getUserKey:function(){
        return new Promise(function(resolve,reject){
            var strSql = "select UD_Key from ChatUserInfo where U_ID = '"+ChatInfo.ID+"';";
            DAOFn.Query('',strSql , function ResultFun(result) {
               alert(result);
               var userKey = "";
               var objList = $.parseJSON(result);
               if (objList.length == 0) {
                   Log.write('無資料');
               } else if (objList.length == 1 && objList[0].hasOwnProperty('Err')) {
                   Log.write('查詢錯誤');
               } else {
                   Log.write('有資料');
                   userKey=objList[0].UD_Key;
               }
               resolve(userKey);
           });
           

        });
    }
}