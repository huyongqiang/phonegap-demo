/*! catapush phonegap v1.0.4 | (c) Catapush | catapush.com */
/**
 * Catapush Phonegap Library
 */
(function () {
    window.CatapushPhonegap = {
        catapush: null, // Catapush instance
        onForeground: !window.startOnBackground, // True if app in in foreground, false in background
        /**
         * Handy logging function
         * @param str
         */
        writeLog: function (str) {
            var that = this;
            var log = 'Catapush ' + str + " [" + (new Date()) + "]\n";
            console.log(log);
        },
        /**
         * Obtain current platform id as required by Catapush Api
         * @returns {number}
         */
        getPlatformId: function () {
            // https://github.com/apache/cordova-plugin-device
            var platform = device.platform.toLowerCase();
            if (platform == 'android' || platform == 'browser') { // TODO move browser to platform 4
                return 1;
            } else if (platform == 'ios') {
                return 2;
            } else if (platform == 'windows') {
                return 3;
            }
            throw new Error('Device not recognized');
        },
        updateTokenRetryTimeout: null, // Timeout in case it was not possible to update the token
        /**
         * Update current push token using Catapush API
         * @param token
         */
        updateToken: function (token) {
            clearTimeout(window.CatapushPhonegap.updateTokenRetryTimeout);
            this.catapush.updatePushToken(token,
                function (res) {
                },
                function (res) {
                    window.CatapushPhonegap.updateTokenRetryTimeout = setTimeout(window.CatapushPhonegap.updateToken, 5000); // Retry frequently
                }
            );
        },
        /**
         * Setup Push notification through plugin phonegap-plugin-push
         */
        setupPush: function () {
            // Payload documentation: https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/PAYLOAD.md#background-notifications
            var that = this;
            // Must be attached to window : https://github.com/phonegap/phonegap-plugin-push/issues/820
            that.writeLog('Notification init');

            window.push = PushNotification.init({
                android: {
                    senderID: "983884877713"
                },
                ios: {},
                windows: {}
            });

            window.push.on('registration', function (data) {
                window.CatapushPhonegap.writeLog('Notification registered');
                // Update token
                that.updateToken(data.registrationId);
            });

            window.push.on('notification', function (data) {
                window.CatapushPhonegap.writeLog('Notification received' + JSON.stringify(data));
                // Think about adding https://github.com/katzer/cordova-plugin-local-notifications
            });

            window.push.on('error', function (e) {
                window.CatapushPhonegap.writeLog('Notification error' + e.message);
            });
        },
        /**
         * Returns true if app is currently in foreground
         * @returns {boolean}
         */
        getOnForeground:function(){
          return this.onForeground;
        },
        /**
         * Triggered when application is put on foreground
         * @param callback
         */
        onShow: function (callback) {
            var that = this;
            $(that).on.apply($(that), ['catapush.phonegap.show', function () {
                callback(); // prevent args
            }]);
        },
        /**
         * Triggered when application is removed from foreground (closed or hidden)
         * @param callback
         */
        onHide: function (callback) {
            var that = this;
            $(that).on.apply($(that), ['catapush.phonegap.hide', function () {
                callback(); // prevent args
            }]);
        },
        /**
         * Show toastr messages
         * @param message
         */
        alert: function (message) {
            if ('plugins' in window && 'toast' in window.plugins && device.platform.toLowerCase() != 'browser') {
                window.plugins.toast.show(message, 'long', 'center');
            } else {
                alert(message);
            }
        },
        /**
         * Starts the plugin
         * @param catapush
         */
        start: function (catapush) {
            var that = this;

            // Initialize catapush
            this.catapush = catapush;

            this.writeLog("App initialized");

            // Enable push after logging
            this.catapush.onUserSet(function () {
                that.setupPush();
            });

            // Detect app status
            document.addEventListener("resume", function (e) {
                that.writeLog("App resumed");
                if (!window.CatapushPhonegap.onForeground) {
                    window.CatapushPhonegap.onForeground = true;
                    $(that).trigger.apply($(that), ['catapush.phonegap.show']);
                }
            }, false);
            document.addEventListener("pause", function () {
                that.writeLog("App paused");
                if (window.CatapushPhonegap.onForeground) {
                    window.CatapushPhonegap.onForeground = false;
                    $(that).trigger.apply($(that), ['catapush.phonegap.hide']);
                }
            }, false);
        },
        attachment: {
            //http://cordova.apache.org/docs/en/latest/reference/cordova-plugin-file/index.html
            //https://github.com/pwlin/cordova-plugin-file-opener2
            //https://github.com/don/FileOpener
            saveFile:function(dirEntry, fileData, fileName, callback) {
                var that = window.CatapushPhonegap;
                dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {

                    that.attachment.writeFile(fileEntry, fileData, false, callback);

                }, function(){window.CatapushPhonegap.writeLog('Unable to create file')});
            },
            writeFile:function(fileEntry, dataObj, isAppend, callback) {
                var that = window.CatapushPhonegap;
                // Create a FileWriter object for our FileEntry (log.txt).
                fileEntry.createWriter(function (fileWriter) {

                    fileWriter.onwriteend = function() {
                        //window.CatapushPhonegap.writeLog("Successful file write..."+fileEntry.fullPath);
                        if(callback){
                            callback();
                        }
                    };

                    fileWriter.onerror = function(e) {
                        window.CatapushPhonegap.writeLog("Failed file write: " + e.toString());
                    };

                    fileWriter.write(dataObj);
                });
            },
            storeAttachment: function (url,filename,type,callback) {
                var that = window.CatapushPhonegap;
                //window.CatapushPhonegap.writeLog('store: ' + url + 'filename: '+filename);
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'blob';

                xhr.onload = function() {
                    if (this.status == 200) {

                        var blob = new Blob([this.response], { type: type });
                        //saveFile(dirEntry, blob, "downloadedImage.png");

                        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
                            window.CatapushPhonegap.writeLog('file system open: ' + dirEntry.name);
                            //var isAppend = true;
                            //createFile(dirEntry, "fileToAppend.txt", isAppend);
                            //fs.root

                            dirEntry.getDirectory('attachments', {create: true}, function (dirEntry2) {
                                that.attachment.saveFile(dirEntry2, blob, filename, callback);
                            }, function () {
                                window.CatapushPhonegap.writeLog('Unable to create attachment directory');
                            });

                        }, function(){window.CatapushPhonegap.writeLog('Error FS storeAttachment')});

                    }
                };
                xhr.send();
            },
            hasFile:function(filename,callback){
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
                    dirEntry.getDirectory('attachments', {create: true}, function (dirEntry2) {
                        dirEntry2.getFile(filename, { create: false, exclusive: false }, function (fileEntry) {
                            //window.CatapushPhonegap.writeLog('File found: '+filename);
                            callback(true);
                        }, function(){
                            //window.CatapushPhonegap.writeLog('File not found: '+filename);
                            callback(false);
                        });
                    }, function () {
                        callback(false);
                    });
                }, function(){window.CatapushPhonegap.writeLog('Error FS hasFile')});
            },
            openFile:function(filename,type){
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
                    dirEntry.getDirectory('attachments', {create: true}, function (dirEntry2) {
                        dirEntry2.getFile(filename, { create: false, exclusive: false }, function (fileEntry) {
                            // Copy to  temporary
                            window.resolveLocalFileSystemURL(cordova.file.externalCacheDirectory, function (dirEntryNew) {
                                fileEntry.copyTo(dirEntryNew, filename, function(fileEntryNew){
                                    cordova.plugins.fileOpener2.open(
                                        fileEntryNew.nativeURL,
                                        type,
                                        {
                                            error : function(){ },
                                            success : function(){ }
                                        }
                                    );
                                }, function(){});
                            }, function () {
                            });
                        }, function(){
                        });

                    }, function () {
                    });
                }, function(){window.CatapushPhonegap.writeLog('Error FS openFile')});

            }
        }
    };
})();