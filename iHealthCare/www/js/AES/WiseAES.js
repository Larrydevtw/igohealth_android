var WiseAES = WiseAES || {}, WiseAES = {
    enpryptAES: function (planText, AppKey, AppIV, flag, successFn,errFn) {

        try {
            var result = "";
            // The initialization vector (must be 16 bytes)
            var key = WiseAES.md5ToByte(WiseAES.stringToByte(AppKey)); //var key = [107, 134, 206, 30, 189, 146, 100, 26, 200, 17, 108, 234, 181, 141, 100, 171];
            var iv = WiseAES.md5ToByte(WiseAES.stringToByte(AppIV)); //var iv = [54, 108, 154, 220, 131, 38, 225, 121, 128, 245, 76, 232, 207, 0, 199, 224];
            
            var textBytes = WiseAES.stringToByte(planText);//, 16); // aesjs.utils.utf8.toBytes(text);
            var aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
            var encryptedBytes = aesCbc.encrypt(textBytes);

            var encryptedText = WiseAES.ArrayBufferTobase64(encryptedBytes.buffer);

            result = WiseAES.EncodeFrom64(encryptedText);
            if (successFn) {
                successFn(result);
            }
        } catch (ex) {
            Log.write(ex, "enpryptAES ex");
            if(errFn){
                errFn(ex);
            }
        }
    },
    decryptAES: function (cipherText, AppKey, AppIV, flag, successFn,errFn) {

        try {
            cipherText = WiseAES.DecodeFrom64(cipherText);

            // An example 128-bit key
            var key = WiseAES.md5ToByte(WiseAES.stringToByte(AppKey));
            //var key = [107, 134, 206, 30, 189, 146, 100, 26, 200, 17, 108, 234, 181, 141, 100, 171];
            // The initialization vector (must be 16 bytes)
            //var iv = [54, 108, 154, 220, 131, 38, 225, 121, 128, 245, 76, 232, 207, 0, 199, 224];
            var iv = WiseAES.md5ToByte(WiseAES.stringToByte(AppIV));
            // Convert text to bytes (text must be a multiple of 16 bytes)
            // // To print or store the binary data, you may convert it to hex
            // // When ready to decrypt the hex string, convert it back to bytes
            var encryptedBytes = WiseAES.base64ToBytes(cipherText);
            //console.log("encryptedBytes: " + encryptedBytes);
    
            // The cipher-block chaining mode of operation maintains internal
            // state, so to decrypt a new instance must be instantiated.
            var aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
            var decryptedBytes = aesCbc.decrypt(encryptedBytes);

            var decryptedText = WiseAES.byteToString(decryptedBytes);

            decryptedText = WiseAES.trim(decryptedText);
            // "TextMustBe16Byte"
            if (successFn) {
                successFn(decryptedText);
            }
        } catch (ex) {
            Log.write(ex, "decryptAES ex");
            if(errFn){
                errFn(ex);
            }
        }
    },
    md5: function (str, successFn) {
        if (successFn) {
            successFn(md5.hex(str));
        }
        return md5.hex(str);
    },
    md5ToByte: function (str, successFn) {
        if (successFn) {
            successFn(md5.array(str));
        }
        return md5.array(str);
    },
    EncodeFrom64: function (planText) {
        return Base64.encode(planText);
    },
    DecodeFrom64: function (planText) {
        return Base64.decode(planText);
    },
    base64ToBytes: function (base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    },
    ArrayBufferTobase64: function (arrayBuffer) {
        var base64 = '';
        var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        var bytes = new Uint8Array(arrayBuffer);
        var byteLength = bytes.byteLength;
        var byteRemainder = byteLength % 3;
        var mainLength = byteLength - byteRemainder;

        var a, b, c, d;
        var chunk;

        // Main loop deals with bytes in chunks of 3
        for (var i = 0; i < mainLength; i = i + 3) {
            // Combine the three bytes into a single integer
            chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

            // Use bitmasks to extract 6-bit segments from the triplet
            a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
            b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
            c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
            d = chunk & 63; // 63       = 2^6 - 1

            // Convert the raw binary segments to the appropriate ASCII encoding
            base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
        }

        // Deal with the remaining bytes and padding
        if (byteRemainder == 1) {
            chunk = bytes[mainLength];

            a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

            // Set the 4 least significant bits to zero
            b = (chunk & 3) << 4; // 3   = 2^2 - 1

            base64 += encodings[a] + encodings[b] + '==';
        } else if (byteRemainder == 2) {
            chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

            a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
            b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

            // Set the 2 least significant bits to zero
            c = (chunk & 15) << 2; // 15    = 2^4 - 1

            base64 += encodings[a] + encodings[b] + encodings[c] + '=';
        }

        return base64;
    },
    stringToByte: function (str, keySize) {
        var len = str.length;

        var bytes = [];

        if (keySize) { //TODO pkcs7strip
            var lastStr = str.length - 1;
            for (var i = 0; i < len; i++) {
                c = str.charCodeAt(i);
                if (c >= 0x010000 && c <= 0x10FFFF) {
                    bytes.push(((c >> 18) & 0x07) | 0xF0);
                    bytes.push(((c >> 12) & 0x3F) | 0x80);
                    bytes.push(((c >> 6) & 0x3F) | 0x80);
                    bytes.push((c & 0x3F) | 0x80);
                } else if (c >= 0x000800 && c <= 0x00FFFF) {
                    bytes.push(((c >> 12) & 0x0F) | 0xE0);
                    bytes.push(((c >> 6) & 0x3F) | 0x80);
                    bytes.push((c & 0x3F) | 0x80);
                } else if (c >= 0x000080 && c <= 0x0007FF) {
                    bytes.push(((c >> 6) & 0x1F) | 0xC0);
                    bytes.push((c & 0x3F) | 0x80);
                } else {
                    bytes.push(c & 0xFF);
                }

                if (i == lastStr) {
                    var lenBytes = bytes.length;
                    var padding = 0;
                    if ((lenBytes % keySize) != 0) {
                        padding = keySize - (lenBytes % keySize);
                    }
                    for (var j = 0; j < padding; j++) {
                        bytes.push(32); //1
                    }
                }
            }
            // for (var i = 0; i < len; i++) {
            //     ch = str.charCodeAt(i);
            //     bytes.push(ch & 0xFF, ch >>> 8);

            //     if (i == lastStr) {
            //         var lenBytes = bytes.length;
            //         var padding = keySize - (lenBytes % keySize);
            //         for(var j=0;j<padding;j++){
            //             bytes.push(8);
            //         }
            //     }
            // }
            return bytes;
        }

        for (var i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if (c >= 0x010000 && c <= 0x10FFFF) {
                bytes.push(((c >> 18) & 0x07) | 0xF0);
                bytes.push(((c >> 12) & 0x3F) | 0x80);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if (c >= 0x000800 && c <= 0x00FFFF) {
                bytes.push(((c >> 12) & 0x0F) | 0xE0);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if (c >= 0x000080 && c <= 0x0007FF) {
                bytes.push(((c >> 6) & 0x1F) | 0xC0);
                bytes.push((c & 0x3F) | 0x80);
            } else {
                bytes.push(c & 0xFF);
            }
        }
        // for (var i = 0; i < len; i++)
        // {
        //     ch = str.charCodeAt(i);
        //     bytes.push(ch & 0xFF, ch >>> 8);
        // }

        return bytes;
        // var bytes = [];
        // var len, c;
        // len = str.length;
        // for (var i = 0; i < len; i++) {
        //     c = str.charCodeAt(i);
        //     if (c >= 0x010000 && c <= 0x10FFFF) {
        //         bytes.push(((c >> 18) & 0x07) | 0xF0);
        //         bytes.push(((c >> 12) & 0x3F) | 0x80);
        //         bytes.push(((c >> 6) & 0x3F) | 0x80);
        //         bytes.push((c & 0x3F) | 0x80);
        //     } else if (c >= 0x000800 && c <= 0x00FFFF) {
        //         bytes.push(((c >> 12) & 0x0F) | 0xE0);
        //         bytes.push(((c >> 6) & 0x3F) | 0x80);
        //         bytes.push((c & 0x3F) | 0x80);
        //     } else if (c >= 0x000080 && c <= 0x0007FF) {
        //         bytes.push(((c >> 6) & 0x1F) | 0xC0);
        //         bytes.push((c & 0x3F) | 0x80);
        //     } else {
        //         bytes.push(c & 0xFF);
        //     }
        // }
        // return bytes;
    },
    byteToString: function (arr) {
        if (typeof arr === 'string') {
            return arr;
        }
        var str = '',
            _arr = arr;
        for (var i = 0; i < _arr.length; i++) {
            var one = _arr[i].toString(2),
                v = one.match(/^1+?(?=0)/);
            if (v && one.length == 8) {
                var bytesLength = v[0].length;
                var store = _arr[i].toString(2).slice(7 - bytesLength);
                for (var st = 1; st < bytesLength; st++) {
                    store += _arr[st + i].toString(2).slice(2);
                }
                str += String.fromCharCode(parseInt(store, 2));
                i += bytesLength - 1;
            } else {
                str += String.fromCharCode(_arr[i]);
            }
        }
        return str;
    },
    trim: function (str) {
        var start = -1;
        var end = str.length;
        while (str.charCodeAt(--end) < 33);
        while (str.charCodeAt(++start) < 33);
        return str.slice(start, end + 1);
    }
};

