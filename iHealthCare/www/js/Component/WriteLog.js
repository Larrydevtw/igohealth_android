/*
顯示&記錄LOG
*/
var logOb;
var ReWrite = false;
var ReWriteStr = "";

var Log = Log || {}, Log = {
    write: function (a,docName,functionName) {
        var msgLog = "";
        if (docName) {
            if(docName==="SQLitePlugin"){
                return;
            }
            msgLog += "=====================";
            msgLog += "\n " + docName + " \n";
            msgLog += " " + a + " \n";
            msgLog += "=====================";
            console.log(msgLog);
        } else {
            msgLog = a;
            console.log(msgLog);
        }
       
        //下面留空間，將來做寫Log

        //if (!logOb) return;
        //if (ReWrite) return;
        //var log = "[" + (new Date()) + "] " + a + "\n";
        //logOb.file(function (file) {

        //    //超過1MB，重寫記錄
        //    if (file.size / 1024 > 1000) {
        //        logOb.remove(
        //        function () {
        //            console.log("Log刪除成功"); logOb = null;
        //            ReWrite = true;
        //            ReWriteStr = a;
        //            Log.Init();
        //        },
        //        function (e) { console.log("Log刪除失敗:" + e.code); }
        //        );
        //    }
        //    else {
        //        logOb.createWriter(function (fileWriter) {

        //            fileWriter.seek(fileWriter.length);

        //            //var blob = new Blob([log], {type:'text/plain'}); 
        //            //fileWriter.write(blob);

        //            fileWriter.write("[" + WiseScripts.Format.Date_yyyyMMddHHmmss(new Date) + "] " + a + "\r\n");
        //            console.log(a);

        //        }, function (e) { console.log("無法寫入Log:" + e); });
        //    }
        //});

    },
    alert: function (a,docName) {
        //自訂Alert格式(偵錯IOS使用)
        var msgLog = "";
        // if (docName) {
        //     msgLog += "===============================================";
        //     msgLog += "\n " + docName + " \n";
        //     msgLog += a+" \n";
        //     msgLog += "===============================================";
        // } else {
        //     msgLog = a;
        // }
        // alert(msgLog);
    },

    Toast: function (msg) {
        // Log.write(msg,"Log Toast");
        window.plugins.toast.showShortBottom(msg, null, null);
    },
    Init: function () {
        /*
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {

            dir.getFile("log.txt", { create: true }, function (file) {

                logOb = file;
                if (ReWrite) {
                    ReWrite = false;
                    Log.write("重寫記錄");
                    Log.write(ReWriteStr);
                    ReWriteStr = "";
                }

            });
        });
        */
    }
};
var WriteLog = WriteLog || {}, WriteLog = {

    //把訊息輸出到裝置畫面上及javaScript主控台上
    write: function (message, level)
    { 
        var msgLog = "";
        if (message) {
            msgLog += "BTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBT";
            msgLog += "\n " + message + " \n";
            msgLog += "BTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBTBT";
        } 
        console.log(msgLog);

        // level = level || "log"; //設預設值為"log"
        // if (typeof message === "object")
        // {
        //     message = JSON.stringify(message, null, "  ");
        // }
        // console.log(message);
        
        // if (level === "status" ||
        //     level === "error" ||
        //     level === "receive" ||
        //     level === "info" ||
        //     level === "result" ||
        //     level === "debug" ||
        //     level === "multiresult"
        //     )
        // {
        //     var msgDiv = document.createElement("div");
        //     msgDiv.textContent = message;

        //     if (level === "error")
        //     {
        //         msgDiv.style.color = "red";
        //     }
        //     else if (level === "receive")
        //     {
        //         msgDiv.style.color = "green";
        //     }
        //     else if (level === "info") 
        //     {
        //         msgDiv.style.color = "#ff44aa"; //近似粉紅色
        //     }
        //     else if (level === "result") 
        //     {
        //         msgDiv.style.color = "blue";
        //     }
        //     else if (level === "debug")
        //     {
        //         msgDiv.style.color = "gray";
        //     }
        //     else if (level === "multiresult")
        //     {
        //         msgDiv.style.color = "#ffaa33"; //近似橘色
        //     }



        //     msgDiv.style.padding = "5px 0";
        //     msgDiv.style.borderBottom = "rgb(192,192,192) solid 1px";
        //     //document.getElementById("output").appendChild(msgDiv);
        //     document.getElementById("divBTStatus").appendChild(msgDiv);
        // }
    }, //清除裝置畫面上的輸出訊息
    clearDisplay: function ()
    {   
        //document.getElementById("divBTStatus").innerHTML = "";
        // document.getElementById("devices").innerHTML = "";
        // document.getElementById("services").innerHTML = "";
        // document.getElementById("output").innerHTML = "";
    }

}