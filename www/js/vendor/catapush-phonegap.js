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
        }
    };
})();