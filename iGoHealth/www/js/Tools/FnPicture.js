var FnPicture = FnPicture || {},
FnPicture = {
        take: function (targetID, successFn) { //拍照
            //alert("take");
            var cameraOptions = {
                sourceType: Camera.PictureSourceType.CAMERA,
                destinationType: Camera.DestinationType.DATA_URL,
                //encodingType: Camera.EncodingType.PNG,
                //correctOrientation: true,
                // targetWidth: W,
                // targetHeight: H,
                // quality: Q,
                allowEdit: false, //在部份手機沒有這東西
                cameraDirection: 1
            };

            navigator.camera.getPicture(function (imageData) {
                FnPicture.onSuccess(imageData, targetID, successFn);
            }, function (errMsg) {
                FnPicture.onErr(errMsg);
            }, cameraOptions);
        },
        select: function (targetID, successFn) { //選照片
            // alert("select");
            var cameraOptions = {
                sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
                destinationType: Camera.DestinationType.DATA_URL,
                encodingType: Camera.EncodingType.JPEG,
                mediaType: Camera.MediaType.PICTURE,
                allowEdit: false
                // targetWidth: W,
                // targetHeight: H,
                // quality: Q
            };
            navigator.camera.getPicture(function (imageData) {
                FnPicture.onSuccess(imageData, targetID, successFn);
            }, function (errMsg) {
                FnPicture.onErr(errMsg);
            }, cameraOptions);
        },
        onSuccess: function (imageData, targetID, successFn) {
            var imageData = "data:image/jpeg;base64," + imageData;
            if (successFn) {
                successFn(imageData);
            } else {
                $("#" + targetID).prop('src', imageData);
            }

        },
        onErr: function (errMsg) {
            Log.write("選擇圖片發生錯誤：" + errMsg);
            WiseScripts.Tool.ShowLoading(false);
        }

    }