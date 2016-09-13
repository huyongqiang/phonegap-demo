/**
 * Example of usage of the Catapush Phonegap Library.
 * The ydn plugin is used to store login details.
 * Catapush Widget is used to show messages.
 * Different pages are rendered as different divs (the switchToView function hide one page to show another).
 *
 */
window.CatapushMessenger = {
    catapush: null, // Main catapush instance
    /**
     * Configuration
     */
    config: {
        appKey: 'KEY'
    },
    // Simple db wrapper to store settings (eg. login details)
    db: {
        db: null,
        init: function () {
            var schema = {
                stores: [{
                    name: 'settings',
                    indexes: [{
                        name: 'value'
                    }]
                }]
            };
            this.db = new ydn.db.Storage('catapush-messenger');
        },
        getSetting: function (key) {
            var deferred = jQuery.Deferred();
            var s = this.db.get('settings', key);
            s.done(function (val) {
                if (typeof(val) !== 'undefined') {
                    deferred.resolve(val.value);
                } else {
                    deferred.resolve(null);
                }
            });
            return deferred.promise();
        },
        setSetting: function (key, data) {
            this.db.put('settings', {value: data}, key);
        },
        clear:function(){
            this.db.clear();
        }
    },
    /**
     * Switches between different pages
     * @param view
     */
    switchToView: function (view) {
        $('.messenger-view').hide();
        $('.messenger-view.messenger-view-' + view).show();
    },
    /**
     * Starts Catapush widget to show messages
     */
    loadCatapushWidget: function () {
        var that = this;
        // Hide messages if not on foreground to prevent reading
        if(!window.CatapushPhonegap.getOnForeground()){
            $('.messenger-view.messenger-view-messages .container').hide();
        }
        $('.messenger-view.messenger-view-messages .container').catapushWidget({
            'instance': this.catapush,
            'connect': false,
            'display': {
                'overflow': false,
                'showDayMark': true
            },
            'event':{
                'beforeSendRead':function(message){
                    return window.CatapushPhonegap.getOnForeground();
                }
            },
            'interaction': {
                'scrollOnMessage': true,
                'scrollOnLoad': true,
            },
            'strings': {
                'en-us': {
                    'today': 'today',
                    'noMessages': 'no messages to show'
                },
                'it-it': {
                    'today': 'oggi',
                    'noMessages': 'nessun messaggio da visualizzare'
                }
            }
        });
        // Event on connect show messages
        this.catapush.onConnected(function () {
            window.CatapushPhonegap.writeLog('Xmpp connected');

            that.switchToView('messages');
            $('.messenger-view.messenger-view-messages .container').catapushWidget('scrollToLastMessage', true);
            // Store login details if details set
            if($('#messenger-login-form input[name="password"]').val().length) {
                that.db.setSetting('loginDetails', {
                    user: $('#messenger-login-form input[name="user"]').val(),
                    password: $('#messenger-login-form input[name="password"]').val()
                });
            }
        });
        // Event on error alert
        this.catapush.onConnectError(function (err) {
            var message = 'Generic Connect Error';
            if (err.name == 'NetworkProblem') {
                message = 'Connection error';
                that.switchToView('missing-connection');
                return;
            } else if (err.name == 'WrongAuthentication' || err.name == 'WrongAuthenticationClientCredentials') {
                message = 'Authentication error';
            }
            window.CatapushPhonegap.alert(message);
            that.switchToView('login');
        });
        this.catapush.onReconnected(function () {
            window.CatapushPhonegap.writeLog('Xmpp reconnected');
            that.switchToView('messages');
            $('.messenger-view.messenger-view-messages .container').catapushWidget('scrollToLastMessage', true);
        });
        // Event on app shown show widget
        window.CatapushPhonegap.onShow(function(){
            $('.messenger-view.messenger-view-messages .container').show();
            $('.messenger-view.messenger-view-messages .container').catapushWidget('checkRead');
            $('.messenger-view.messenger-view-messages .container').catapushWidget('scrollToLastMessage', true);
        });
    },
    /**
     * Login
     * @param user
     * @param password
     * @param platform
     */
    login: function (user, password, platform) {
        var that = this;
        this.catapush.setApp(this.config.appKey, platform).setUser(user, password);
        this.catapush.connect();
    },
    /**
     * Logout
     */
    logout: function () {
        if (this.catapush) {
            this.catapush.resetConnection();
            this.catapush.resetStorage();
            this.db.clear();
            $('.messenger-view.messenger-view-messages .container').catapushWidget('clear');
            $('#messenger-login-form input[name="password"]').val('');
        }
    },
    init: function () {
        var that = this;

        window.CatapushPhonegap.writeLog('App started');

        // Init db
        this.db.init();

        // Init catapush library
        that.catapush = Catapush.get();

        // Init catapush widget
        that.loadCatapushWidget();

        // Init phonegap library
        window.CatapushPhonegap.start(this.catapush);

        // Init view or try login if data stored
        $('#messenger-login-form').submit(function (e) {
            e.preventDefault();
            that.login($('#messenger-login-form input[name="user"]').val(), $('#messenger-login-form input[name="password"]').val(), window.CatapushPhonegap.getPlatformId(), true);
            that.switchToView('loading');
        });

        // If login details are available login automatically
        this.db.getSetting('loginDetails').done(function (loginDetails) {
            if (!loginDetails) {
                that.switchToView('login');
            } else {
                $('#messenger-login-form input[name="user"]').val(loginDetails.user);
                that.login(loginDetails.user, loginDetails.password, window.CatapushPhonegap.getPlatformId(), true);
                that.switchToView('loading');
            }
        });

        // Handle logout button
        $('.logout').click(function () {
            that.logout();
            that.switchToView('login');
        });
    }
};