//==================== Bionime ===============================
//此程式是華廣生技系列機型的共用函式,目前支援的設備型號:
// '2282RAA0429' 華廣血糖(GM282) 
// '2282RAA0426' 華廣血糖(GM282) 
// ...

var Bionime = Bionime || {}, Bionime = {
              
    //以藍芽位址取代設備序號資料
    getDeviceSerial: function (address)
    {
        sessionStorage["DeviceSerial_" + address] = address;
        WriteLog.write("設備序號：" + address + "/" + sessionStorage["DeviceSerial_" + address], "info");
    }
        
    ,//計算checksum
    //Checksum = (Byte[0] + byte[1] + …. Byte[n]) & 0xFF
    // Example:
    //  [0xB0, 0x20, 0x4F]                          -> 0x1F              
    //  [0x4F, 0xFF, 0x47, 0x4D, 0x37, 0x38, 0x32]  -> 0x83 
    //  [0x4F, 0xFE, 0x41, 0x30, 0x30, 0x38]        -> 0x26 
    checksumByte: function (buffer)
    {
        var z = 0x00;
        for (var i = 0; i < buffer.length - 1; i++) {
            z += buffer[i];
        }
        z = z & 0xff;

        return z;
    }
    
    ,//Hex文字字串轉成byte陣列
    parseHexStringToByteArr: function (returnData)
    {
        //輸入一串Hex文字,如: "4F,FE,41,30,30,38,"
        //會傳回一個byte陣列,如: [0x4F, 0xFE, 0x41, 0x30, 0x30, 0x38]
        var dataStrArr = returnData.split(",");

        var result = [];
        for (var i = 0; i < dataStrArr.length; i++) {
            if (dataStrArr[i] != "") {
                result.push(parseInt(dataStrArr[i], 16));
            }
        }

        return result;
    }

    ,//byte陣列轉成ASCII文字字串
    binArrToString: function (array)
    {
    	var result = ""; 
    	for(var i = 0; i < array.length; ++i){ 
         		result+= (String.fromCharCode(array[i])); 
         	} 
     	return result; 
     } 

}