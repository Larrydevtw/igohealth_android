/*
jszipPlugin
需先import jszip.min.js
https://stuk.github.io/jszip/
*/
var jszipPlugin = jszipPlugin || {}, jszipPlugin = {
    /*
    壓縮，將文字壓縮成ZIP base64 file 
    jszipPlugin.zipString("data",function(zipString){});
    */
    zipString: function (inputString,callback) {
        var zip = new JSZip();
        zip.file("Data.txt", inputString);
        var content = zip.generate({
            type: "base64"
            , compression: "DEFLATE"
            , compressionOptions: { level: 6 } //壓縮率 between 1 (best speed) and 9 (best compression)
        });
        callback(content);
    },
    /*
    解壓縮，將ZIP base64 file解壓縮取出文字
    jszipPlugin.unzipString("base64FileString",function(contentString){});
    */
    unzipString: function (base64FileString, callback) {
        var new_zip = new JSZip();
        new_zip.load(base64FileString, { base64: true });
        var vRtn = new_zip.file("Data.txt").asText(); 
        callback(vRtn);
    }


}