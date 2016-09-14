/*! catapush v1.0.11 | (c) Catapush | catapush.com */
/**
 * Main class, it's the connection between all other components, services and models
 */
(function ($, Strophe, ydn) {
    window.Catapush = {
        ext:{ // External libraries
            '$': $,
            'Strophe': Strophe,
            'ydn':ydn
        },
        config: null, // the configuration
        customer: null, // the customer
        mobileApp: null, // the mobile app
        mobileUser: null, // the mobile user
        xmppConnection: null, // the xmpp connection
        storage: null,
        /** Getters and setters **/
        getConfig: function () {
            return this.config;
        },
        setConfig: function (config) {
            this.config = config;
        },
        getMobileApp: function () {
            return this.mobileApp;
        },
        setMobileApp: function (mobileApp) {
            this.mobileApp = mobileApp;
        },
        getMobileUser: function () {
            return this.mobileUser;
        },
        setMobileUser: function (mobileUser) {
            this.mobileUser = mobileUser;
        },

        /**
         * Initialize storage and other neededs
         */
        setUp: function () {
            this.storage = new this.model.storage(this);
        },

        /**
         * Starts authentication and connects to the server
         */
        connect: function () {
            var that = this;
            that.service.event.publish('catapush.connecting');
            var authenticateLibrary = this.authenticateApiLibrary();
            authenticateLibrary.fail(function (err) {
                that.service.event.publish('catapush.connecterror', [err]);
                throw err;
            });
            authenticateLibrary.done(function (res) {
                that.service.event.publish('catapush.userset');
                var connectXmpp = that.connectXmpp();
                connectXmpp.fail(function (err) {
                    that.service.event.publish('catapush.connecterror', [err]);
                    throw err;
                });
                connectXmpp.done(function (res) {
                    that.service.event.publish('catapush.connected');

                    // Add handlers
                    //connection.addHandler(on_chat_message, null, 'message', null);
                    //connection.addHandler(on_presence, null, 'presence');
                    //connection.addHandler(on_error_iq, null, 'iq', 'error');
                });
            });
        },

        /**
         * Disconnect
         */
        disconnect: function () {
            this.disconnectXmpp();
        },

        /**
         * Authenticate with private libraries (get session and oauth token)
         */
        authenticateApiLibrary: function () {
            // POST /v1/apps/{appKey}/sessions
            var that = this;
            var deferred = this.ext.$.Deferred();
            that.service.api.getSession(this.getConfig(), this.getMobileApp().getAppKey(), this.getMobileApp().getPlatform(), this.getMobileUser().getUser(), this.getMobileUser().getPassword(), null, null, function (res) {
                //console.log(res);
                that.mobileUser.setId(res.idUser);
                that.mobileApp.setId(res.fkApp.idApp);
                that.customer = new that.model.customer(that, res.fkApp.fkCustomer.idCustomer);
                // POST /oauth
                that.service.api.getOauthToken(that.getConfig(), res.oauthClient.client_id, res.oauthClient.client_secret, function (res) {
                    //console.log(res);
                    that.mobileUser.setAccessToken(res.access_token);
                    deferred.resolve();
                }, function (err) {
                    deferred.reject(err);
                });
            }, function (err) {
                deferred.reject(err);
            });
            return deferred.promise();
        },

        /**
         * Connect to xmpp
         */
        connectXmpp: function () {
            var that = this;
            var deferred = this.ext.$.Deferred();
            var messageHandler = function(xmppMessage){
                //console.log('ok message received');
                // Add message handlers to xmpp connection
                if (that.ext.$('received', xmppMessage).length) {
                    // this is an ack, not a real message. Check against read ack
                    var messageId = that.ext.$('received', xmppMessage).attr('id');
                    var message = that.storage.getMessageByField('readReceiptSentId', messageId, function (message) {
                        message.setReadReceiptConfirmationReceived(true);
                        that.storage.updateMessage(message);
                    });
                } else {
                    // real message received
                    var message = (new that.model.xmppMessage(that, xmppMessage)).getMessage();
                    message.setReceivedAt(new Date());
                    that.storage.addMessage(message);
                    that.service.event.publish('catapush.messagereceived', [message]);
                    var sent = that.service.xmpp.sendReceipt(that.xmppConnection, message);
                    if(sent){
                        message.setReceivedReceiptSent(true);
                        that.storage.updateMessage(message);
                    }
                }
                return true; // keep handler active
            };
            this.xmppConnection = this.service.xmpp.connect(this.getConfig(), this.getMobileUser(), true, messageHandler, function (res) {
                deferred.resolve();
            }, function () {
                // On connection disconnect
                that.service.event.publish('catapush.disconnected');
                deferred.resolve();
            }, function (err) {
                that.service.event.publish('catapush.connecterror',[err]);
                deferred.reject(err);
            },function () {
                that.service.event.publish('catapush.reconnected');
            });
            return deferred.promise();
        },

        /**
         * Disconnect from xmpp
         */
        disconnectXmpp: function () {
            this.service.xmpp.disconnect(this.getConfig(), this.xmppConnection);
        },

        /**
         * Mark a message as read in storage and send read receipt
         * @param messageId
         */
        setMessageRead: function (messageId) {
            var that = this;
            var deferred = this.ext.$.Deferred();
            this.storage.getMessageById(messageId, function (message) {
                if (!message) {
                    return;
                }
                message.setReadAt(new Date());
                that.storage.updateMessage(message);
                var uniqueId = that.service.xmpp.sendRead(that.xmppConnection, message);
                if(uniqueId) {
                    message.setReadReceiptSentAt(new Date());
                    message.setReadReceiptSentId(uniqueId);
                    that.storage.updateMessage(message);
                }
                deferred.resolve(message);
            });
            return deferred.promise();
        },

        /**
         * Reset storage
         */
        resetStorage: function () {
            var deferred = this.ext.$.Deferred();
            this.storage.clear(function(){
                deferred.resolve();
            });
            return deferred.promise();
        },

        /**
         * Reset connection
         */
        resetConnection: function () {
            if (this.xmppConnection) {
                this.disconnectXmpp();
                //this.xmppConnection.disconnect();
                this.xmppConnection.reset();
            }
        }
    };
})(jQuery, Strophe, ydn);
/**
 * Mixed utilities
 */
(function (catapush) {
    catapush.component = catapush.component || {};
    catapush.component.util = {
        /**
         * Equivalent of php urlencode, this is particularely useful to convert externalIdentifiers to xmpp externalIdentifiers
         */
        urlencode: function (str) {
            // taken from http://phpjs.org/functions/urlencode/
            // https://github.com/kvz/phpjs/blob/master/functions/url/urlencode.js

            str = (str + '')
                .toString()

            // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
            // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
            return encodeURIComponent(str)
                .replace(/!/g, '%21')
                .replace(/'/g, '%27')
                .replace(/\(/g, '%28')
                .replace(/\)/g, '%29')
                .replace(/\*/g, '%2A')
                .replace(/%20/g, '+');
        },
        /**
         * Prints a date as iso 8601 without milliseconds and with Zulu timezone
         * @param date
         * @returns {*}
         */
        toIsoStringWithoutMilliseconds: function (date) {
            if (!Date.prototype.toIsoStringWithoutMilliseconds) {
                ( function () {

                    function pad(number) {
                        var r = String(number);
                        if (r.length === 1) {
                            r = '0' + r;
                        }
                        return r;
                    }

                    Date.prototype.toIsoStringWithoutMilliseconds = function () {
                        return this.getUTCFullYear()
                            + '-' + pad(this.getUTCMonth() + 1)
                            + '-' + pad(this.getUTCDate())
                            + 'T' + pad(this.getUTCHours())
                            + ':' + pad(this.getUTCMinutes())
                            + ':' + pad(this.getUTCSeconds())
                            //+ '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )
                            + 'Z';
                    };

                }() );
            }
            ;
            return date.toIsoStringWithoutMilliseconds();
        }
    };
})(window.Catapush);
/**
 * Configuration for different environments
 */
(function (catapush) {
    var config = function (env) {
        //if (!env || env == 'prod') {
            this.apiLibraryUrl = 'http://mobile.catapush.com';
            //this.xmppBoshUrl = 'http://mobile.catapush.com/http-bind/';
            this.xmppBoshUrl = 'ws://ws-xmpp.catapush.com:5290/';
            this.xmppHostname = 'xmpp.catapush.com';
        /*} else if (env == 'dev') {
            this.apiLibraryUrl = 'http://dev.api_library-integration.devel.catapush.rocks';
            //this.xmppBoshUrl = 'http://dev.api_library-nicola.devel.catapush.rocks/http-bind/';
            this.xmppBoshUrl = 'ws://54.72.117.154:5290/';
            this.xmppHostname = 'xmpp.catapush.rocks';
        }*/
    };
    config.prototype = {
        apiLibraryUrl: null,
        xmppBoshUrl: null,
        xmppHostname: null,
        storageDbPrefix: '1',
        getApiLibraryUrl: function () {
            return this.apiLibraryUrl;
        },
        getXmppBoshUrl: function () {
            return this.xmppBoshUrl;
        },
        getXmppHostname: function () {
            return this.xmppHostname;
        },
        getStorageDbPrefix: function () {
            return this.storageDbPrefix;
        }

    };

    catapush.model = catapush.model || {};
    catapush.model.config = config;
})(window.Catapush);
/**
 * Error standard model
 */
(function (catapush) {
    var error = function (code) {
        this.name = code;
        this.message = catapush.model.errorCodes[code];
    };
    error.prototype = {
        name: null,
        message: null
    };

    catapush.model = catapush.model || {};
    catapush.model.error = error;
    catapush.model.error.prototype = new Error;

    /**
     * All errors generated by this library
     */
    catapush.model.errorCodes = {
        'NetworkProblem': 'Missing connection',
        'ApplicationNotFound': 'Application Not Found',
        'WrongAuthentication': 'Wrong authentication details',
        'WrongAuthenticationClientCredentials': 'Wrong authentication client credentials',
        'GeneralProblem': 'Unknown error'
    };
})(window.Catapush);
/**
 * Represents a customer (application owner)
 */
(function (catapush) {
    var customer = function (catapushInstance, id) {
        this.catapushInstance = catapushInstance;
        this.id = id;
    };
    customer.prototype = {
        catapushInstance: null,
        id: null,
        getId: function () {
            return this.id;
        }
    };

    catapush.model = catapush.model || {};
    catapush.model.customer = customer;
})(window.Catapush);
/**
 * General message model (usually generated from a xmppMessage)
 */
(function (catapush) {
    var message = function (catapushInstance) {
        this.catapushInstance = catapushInstance;

    };
    message.prototype = {
        catapushInstance: null,
        received: true,
        id: null,
        from: null,
        to: null,
        title: null,
        text: null,
        sentAt: null,
        receivedAt: null,
        readAt: null,

        receivedReceiptSent: false, // true if the receive ack has bee sent
        readReceiptSentAt: null, // Date when the read receipt has been sent
        readReceiptSentId: null, // unique id generated locally for the read confirm sent
        readReceiptConfirmationReceived: false, // true if an ack of the read confirm has bee received

        getId: function () {
            return this.id;
        },
        setId: function (id) {
            this.id = id;
        },
        getFrom: function () {
            return this.from;
        },
        setFrom: function (from) {
            this.from = from;
        },
        getTo: function () {
            return this.to;
        },
        setTo: function (to) {
            this.to = to;
        },
        getTitle: function () {
            return this.title;
        },
        setTitle: function (title) {
            this.title = title;
        },
        getText: function () {
            return this.text;
        },
        setText: function (text) {
            this.text = text;
        },
        getSentAt: function () {
            return this.sentAt;
        },
        setSentAt: function (sentAt) {
            this.sentAt = sentAt;
        },
        getReceivedAt: function () {
            return this.receivedAt;
        },
        setReceivedAt: function (receivedAt) {
            this.receivedAt = receivedAt;
        },
        getReadAt: function () {
            return this.readAt;
        },
        setReadAt: function (readAt) {
            this.readAt = readAt;
        },
        getReceivedReceiptSent: function () {
            return this.receivedReceiptSent;
        },
        setReceivedReceiptSent: function (receivedReceiptSent) {
            this.receivedReceiptSent = receivedReceiptSent;
        },
        getReadReceiptSentAt: function () {
            return this.readReceiptSentAt;
        },
        setReadReceiptSentAt: function (readReceiptSentAt) {
            this.readReceiptSentAt = readReceiptSentAt;
        },
        getReadReceiptSentId: function () {
            return this.readReceiptSentId;
        },
        setReadReceiptSentId: function (readReceiptSentId) {
            this.readReceiptSentId = readReceiptSentId;
        },
        getReadReceiptConfirmationReceived: function () {
            return this.readReceiptConfirmationReceived;
        },
        setReadReceiptConfirmationReceived: function (readReceiptConfirmationReceived) {
            this.readReceiptConfirmationReceived = readReceiptConfirmationReceived;
        },

        /**
         * Get the object to be stored in local database
         */
        getForStorage: function () {
            return {
                id: this.getId(),
                from: this.getFrom(),
                to: this.getTo(),
                title: this.getTitle(),
                text: this.getText(),
                sentAtTimestamp: this.getSentAt() ? this.getSentAt().getTime() : null,
                receivedAtTimestamp: this.getReceivedAt() ? this.getReceivedAt().getTime() : null,
                readAtTimestamp: this.getReadAt() ? this.getReadAt().getTime() : null,
                receivedReceiptSent: this.getReceivedReceiptSent(),
                readReceiptSentAtTimestamp: this.getReadReceiptSentAt() ? this.getReadReceiptSentAt().getTime() : null,
                readReceiptSentId: this.getReadReceiptSentId(),
                readReceiptConfirmationReceived: this.getReadReceiptConfirmationReceived(),
                sentAtTimestampAndId: this.getSentAtTimestampAndId()
            }
        },
        /**
         * Used for a realiable index purpose: ordering messages in a unique way
         * @returns {*}
         */
        getSentAtTimestampAndId: function () {
            function pad(number) {
                var r = String(number);
                if (r.length === 1) {
                    r = '0' + r;
                }
                return r;
            }

            return pad(this.getSentAt().getTime(), 15) + this.getId();
        },
        /**
         * Create the model from the object stored in local database
         * @param obj
         */
        createFromStorage: function (obj) {
            this.id = obj.id;
            this.from = obj.from;
            this.to = obj.to;
            this.title = obj.title;
            this.text = obj.text;
            this.sentAt = obj.sentAtTimestamp ? new Date(obj.sentAtTimestamp) : null;
            this.receivedAt = obj.receivedAtTimestamp ? new Date(obj.receivedAtTimestamp) : null;
            this.readAt = obj.readAtTimestamp ? new Date(obj.readAtTimestamp) : null;
            this.receivedReceiptSent = obj.receivedReceiptSent;
            this.readReceiptSentAt = obj.readReceiptSentAtTimestamp ? new Date(obj.readReceiptSentAtTimestamp) : null;
            this.readReceiptSentId = obj.readReceiptSentId;
            this.readReceiptConfirmationReceived = obj.readReceiptConfirmationReceived;
        },
        /**
         * Get an object without references to the internal library, that can be exposed externally without worries
         */
        getExternal: function () {
            /*var ob = this.catapushInstance.ext.$.extend({},this,true);
             unset(ob['catapushIstance']);
             return ob;*/
            return {
                id: this.getId(),
                from: this.getFrom(),
                to: this.getTo(),
                title: this.getTitle(),
                text: this.getText(),
                sentAt: this.getSentAt(),
                readAt: this.getReadAt()
            };
        },

        toString: function () {
            return JSON.stringify(this.getForStorage());
        }
    };

    catapush.model = catapush.model || {};
    catapush.model.message = message;
})(window.Catapush);
/**
 * Mobile application
 */
(function (catapush) {
    var mobileApp = function (catapushInstance, appKey, platform) {
        this.catapushInstance = catapushInstance;
        this.appKey = appKey;
        this.platform = platform;
    };
    mobileApp.prototype = {
        catapushInstance: null,
        id: null,
        appKey: null,
        platform: null,
        getAppKey: function () {
            return this.appKey;
        },
        getPlatform: function () {
            return this.platform;
        },
        getId: function () {
            return this.id;
        },
        setId: function (id) {
            this.id = id;
        },

        getCustomer: function () {
            return this.catapushInstance.customer;
        }
    };

    catapush.model = catapush.model || {};
    catapush.model.mobileApp = mobileApp;
})(window.Catapush);
/**
 * Mobile Application User
 */
(function (catapush) {
    var mobileUser = function (catapushInstance, user, password) {
        this.catapushInstance = catapushInstance;
        this.user = user;
        this.password = password;
    };
    mobileUser.prototype = {
        catapushInstance: null,
        id: null,
        user: null,
        password: null,
        accessToken: null,
        pushToken: null,
        getId: function () {
            return this.id;
        },
        setId: function (id) {
            this.id = id;
        },
        getUser: function () {
            return this.user;
        },
        getPassword: function () {
            return this.password;
        },
        getAccessToken: function () {
            return this.accessToken;
        },
        setAccessToken: function (accessToken) {
            this.accessToken = accessToken;
        },
        getPushToken: function () {
            return this.pushToken;
        },
        setPushToken: function (pushToken) {
            this.pushToken = pushToken;
        },

        getMobileApp: function () {
            return this.catapushInstance.mobileApp;
        },

        /**
         * Full jid from mobile app and externalIdentifier
         * @returns {string}
         */
        getJid: function () {
            var jid =
                [
                    this.catapushInstance.component.util.urlencode(this.user),
                    '@',
                    'push',
                    this.getMobileApp().getId(),
                    '-',
                    this.getMobileApp().getCustomer().getId(),
                    '.',
                    this.catapushInstance.config.getXmppHostname()
                ].join('');
            return jid;
        }
    };

    catapush.model = catapush.model || {};
    catapush.model.mobileUser = mobileUser;
})(window.Catapush);
/**
 * Provides an easy interface to store and retreive data. Some functions are particularly dedicated to messages.
 */
(function (catapush) {
    var storage = function (catapushInstance) {
        this.catapushInstance = catapushInstance;
        this.setup();
    };
    storage.prototype = {
        db: null,
        catapushInstance: null,
        setup: function () {
            var schema = {
                stores: [{
                    name: 'messages',
                    indexes: [{
                        name: 'id'
                    }, {
                        name: 'sentAtTimestamp'
                    }, {
                        name: 'readReceiptSentId'
                    }, {
                        name: 'sentAtTimestampAndId'
                    }]
                }]
            };
            this.db = new this.catapushInstance.ext.ydn.db.Storage('catapush-' + this.catapushInstance.getConfig().getStorageDbPrefix(), schema);
        },
        /**
         * Add a Message
         * @param message
         */
        addMessage: function (message,callback) {
            this.db.put('messages', message.getForStorage(), message.getId()).done(function() {
                if (callback) {
                    callback();
                }
            });
        },
        /**
         * Updates a Message (unique by Id)
         * @param message
         */
        updateMessage: function (message,callback) {
            this.db.put('messages', message.getForStorage(), message.getId()).done(function() {
                if (callback) {
                    callback();
                }
            });
        },
        /**
         * Get last number messages stored, ordered by sentAtTimestampAndId
         * @param number
         * @param callback
         */
        getLastMessages: function (number, callback) {
            var q = this.db.from('messages');
            var limit = number;
            var messages = [];
            //q.order('id').order('sentAtTimestamp').reverse().list(limit).done(function (objs) {
            q.order('sentAtTimestampAndId').reverse().list(limit).done(function (objs) {
                for (var i = 0; i < objs.length; i++) {
                    var message = new catapush.model.message(this.catapushInstance);
                    message.createFromStorage(objs[i]);
                    messages.push(message);
                }
                callback(messages);
            });
        },
        /**
         * Get stored messages before or after an sentAtTimestampAndId
         * @param number
         * @param previous
         * @param fromSentAtTimestampAndId
         * @param callback
         */
        getMessages: function (number, previous, fromSentAtTimestampAndId, callback) {
            var q = this.db;
            var limit = number;
            var messages = [];
            var kr = null;
            if (previous) {
                kr = new this.catapushInstance.ext.ydn.db.KeyRange.upperBound(fromSentAtTimestampAndId, true);
            } else {
                kr = new this.catapushInstance.ext.ydn.db.KeyRange.lowerBound(fromSentAtTimestampAndId, true);
            }
            q.values('messages', 'sentAtTimestampAndId', kr, number, 0, previous ? true : false).done(function (objs) {
                for (var i = 0; i < objs.length; i++) {
                    var message = new catapush.model.message(this.catapushInstance);
                    message.createFromStorage(objs[i]);
                    messages.push(message);
                }
                callback(messages);
            });
        },
        /**
         * Retrieves a message by id
         * @param id
         * @param callback
         */
        getMessageById: function (id, callback) {
            var m = this.db.get('messages', id);
            m.done(function (record) {
                if (!record) {
                    callback(null);
                    return;
                }
                var message = new catapush.model.message(this.catapushInstance);
                message.createFromStorage(record);
                callback(message);
            });
            m.fail(function () {
                callback(null);
            });
        },
        /**
         * Retriee a message by a custom field
         * @param field
         * @param value
         * @param callback
         */
        getMessageByField: function (field, value, callback) {
            var q = this.db.from('messages');
            q.where(field, '=', value);
            var limit = 1;
            q.list().done(function (objs) {
                if (objs.length) {
                    var message = new catapush.model.message(this.catapushInstance);
                    message.createFromStorage(objs[0]);
                    callback(message);
                } else {
                    callback(null);
                }
            });
        },
        /**
         * Clear all stored data
         */
        clear: function (callback) {
            this.db.clear().done(function() {
                if (callback) {
                    callback();
                }
            });
        }
    };

    catapush.model = catapush.model || {};
    catapush.model.storage = storage;
})(window.Catapush);
/**
 * Xmpp message
 */
(function (catapush) {
    var xmppMessage = function (catapushInstance, xmppMessage) {
        this.catapushInstance = catapushInstance;
        this.xmppMessage = xmppMessage;

    };
    xmppMessage.prototype = {
        catapushInstance: null,
        xmppMessage: null,
        getMessage: function () {
            var message = new catapush.model.message(this.catapushInstance);
            message.setId(this.getId());
            message.setFrom(this.getFrom());
            message.setTo(this.getTo());
            message.setTitle(this.getSubject());
            message.setText(this.getText());
            message.setSentAt(this.getCreationDate());
            return message;
        },
        /**
         * devicesData -> android -> title
         */
        getId: function () {
            return this.catapushInstance.ext.$(this.xmppMessage).attr('id');
        },
        /**
         *
         * @returns {*|jQuery}
         */
        getFrom: function () {
            return this.catapushInstance.ext.$(this.xmppMessage).attr('from');
        },
        /**
         *
         * @returns {*|jQuery}
         */
        getTo: function () {
            return this.catapushInstance.ext.$(this.xmppMessage).attr('to');
        },
        /**
         * devicesData -> android -> title
         */
        getSubject: function () {
            //return this.catapushInstance.ext.$('subject', this.xmppMessage).html();
            return this.catapushInstance.ext.$('subject', this.xmppMessage).length?this.catapushInstance.ext.$('subject', this.xmppMessage)[0].textContent:null;
        },
        /**
         * text
         */
        getText: function () {
            //return this.catapushInstance.ext.$('body', this.xmppMessage).html();
            return this.catapushInstance.ext.$('body', this.xmppMessage).length?this.catapushInstance.ext.$('body', this.xmppMessage)[0].textContent:null;
        },
        /**
         *
         */
        getCreationDate: function () {
            return new Date(this.catapushInstance.ext.$('timeformat', this.xmppMessage).attr('timestamp') * 1000);
        }

    };

    catapush.model = catapush.model || {};
    catapush.model.xmppMessage = xmppMessage;
})(window.Catapush);
/**
 * Interaction with api library
 */
(function (catapush) {
    catapush.service = catapush.service || {};
    catapush.service.api = {
        /**
         * Creates a new session, returning the oauth login information
         * @param config
         * @param appKey
         * @param platform
         * @param externalIdentifier
         * @param password
         * @param device
         * @param token
         * @param callback
         * @param callbackError
         */
        getSession: function (config, appKey, platform, externalIdentifier, password, device, token, callback, callbackError) {
            var data = {
                externalIdentifier: externalIdentifier,
                platform: platform,
                password: password,
                device: device ? device : null,
                token: token ? token : null
            };
            catapush.ext.$.ajax({
                type: 'POST',
                contentType: "application/json",

                url: config.getApiLibraryUrl() + '/v1/apps/' + appKey + '/sessions',
                data: JSON.stringify(data),
                success: function (res) {
                    callback(res);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    if (XMLHttpRequest.readyState == 4) {
                        // HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
                        if (typeof(XMLHttpRequest.responseJSON) == 'object') {
                            if (XMLHttpRequest.responseJSON.title == 'Application Not Found') {
                                callbackError(new catapush.model.error('ApplicationNotFound'));
                                return;
                            }
                            if (XMLHttpRequest.responseJSON.title == 'Mobile User Not Found') {
                                callbackError(new catapush.model.error('WrongAuthentication'));
                                return;
                            }
                            if (XMLHttpRequest.responseJSON.title == 'Wrong Authentication') {
                                callbackError(new catapush.model.error('WrongAuthentication'));
                                return;
                            }
                        }
                    }
                    else if (XMLHttpRequest.readyState == 0) {
                        // Network error (i.e. connection refused, access denied due to CORS, etc.)
                        callbackError(new catapush.model.error(catapush.model.errorCodes['NetworkProblem']));
                        return;
                    }
                    // something weird is happening
                    callbackError(new catapush.model.error(catapush.model.errorCodes['GeneralProblem']));
                },
                dataType: 'json'
            });
        },
        /**
         * Uses oauth clientId and clientSecret to get an oauth token
         * @param config
         * @param clientId
         * @param clientSecret
         * @param callback
         * @param callbackError
         */
        getOauthToken: function (config, clientId, clientSecret, callback, callbackError) {
            var data = {
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials'
            };
            catapush.ext.$.ajax({
                type: 'POST',
                url: config.getApiLibraryUrl() + '/oauth',
                data: data,
                success: function (res) {
                    callback(res);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    if (XMLHttpRequest.readyState == 4) {
                        // HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
                        if (XMLHttpRequest.responseJSON.title == 'invalid_client') {
                            callbackError(new catapush.model.error('WrongAuthenticationClientCredentials'));
                            return;
                        }
                    }
                    else if (XMLHttpRequest.readyState == 0) {
                        // Network error (i.e. connection refused, access denied due to CORS, etc.)
                        callbackError(new catapush.model.error(catapush.model.errorCodes['NetworkProblem']));
                        return;
                    }
                    // something weird is happening
                    callbackError(new catapush.model.error(catapush.model.errorCodes['GeneralProblem']));
                }
            });
        },
        /**
         * Updates the push token of the mobile user
         * @param config
         * @param idUser
         * @param accessToken
         * @param pushToken
         * @param callback
         * @param callbackError
         */
        updateMobileUserToken: function (config, idUser, accessToken, pushToken, callback, callbackError) {
            var data = {
                token: pushToken
            };
            catapush.ext.$.ajax({
                type: 'PATCH',
                url: config.getApiLibraryUrl() + '/users/' + idUser,
                data: JSON.stringify(data),
                contentType: "application/json",
                headers: {"Authorization": "Bearer " + accessToken},
                success: function (res) {
                    callback(res);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    if (XMLHttpRequest.readyState == 4) {
                        // HTTP error (can be checked by XMLHttpRequest.status and XMLHttpRequest.statusText)
                        if (XMLHttpRequest.responseJSON.title == 'invalid_client') {
                            callbackError(new catapush.model.error('WrongAuthenticationClientCredentials'));
                            return;
                        }
                    }
                    else if (XMLHttpRequest.readyState == 0) {
                        // Network error (i.e. connection refused, access denied due to CORS, etc.)
                        callbackError(new catapush.model.error(catapush.model.errorCodes['NetworkProblem']));
                        return;
                    }
                    // something weird is happening
                    callbackError(new catapush.model.error(catapush.model.errorCodes['GeneralProblem']));
                }
            });
        },
    };
})(window.Catapush);
/**
 * A simple subscribe / publish event service, based on jQuery
 */
(function (catapush) {
    catapush.service = catapush.service || {};
    catapush.service.event = {
        // Based on https://github.com/cowboy/jquery-tiny-pubsub
        /**
         * subscribe('foo.baz', createLogger('foo.baz'));
         * publish('foo', [1, 2]);
         */
        o: null,
        init:function(){
            if(!this.o){
                this.o = catapush.ext.$({});
            }
        },

        subscribe: function () {
            this.init();
            this.o.on.apply(this.o, arguments);
        },

        unsubscribe: function () {
            this.init();
            this.o.off.apply(this.o, arguments);
        },

        publish: function () {
            this.init();
            this.o.trigger.apply(this.o, arguments);
        }
    };
})(window.Catapush);
/**
 * Xmpp service
 */
(function (catapush) {
    catapush.service = catapush.service || {};
    catapush.service.xmpp = {
        silentReconnect: false,
        wantConnected : false,
        connect: function (config, mobileUser, sendPresence, messageHandler, callbackConnected, callbackDisconnected, callbackError, callbackReconnected) {
            var that = this;
            that.wantConnected = true;
            that.silentReconnect = false;
            var xmppConnection = new catapush.ext.Strophe.Connection(config.getXmppBoshUrl());
            //var onConnect = null;
            var onConnect = function(status) {
                //console.log('status',status);
                if (status == catapush.ext.Strophe.Status.CONNECTED) {
                    // Connection successfull
                    if (sendPresence) {
                        xmppConnection.send($pres());
                    }
                    if(that.silentReconnect){
                        callbackReconnected();
                    }else{
                        callbackConnected(xmppConnection);
                    }
                    xmppConnection._proto.isConnecting = false;
                    xmppConnection.streamManagement.enable();
                    xmppConnection.streamManagement.sendCountOnEveryIncomingStanza = true;
                    xmppConnection.streamManagement.requestResponseInterval = 1;

                } else if (status == catapush.ext.Strophe.Status.CONNFAIL) {
                    xmppConnection._proto.isConnecting = false;
                    callbackError(new catapush.model.error('NetworkProblem'));
                } else if (status == catapush.ext.Strophe.Status.AUTHFAIL) {
                    xmppConnection._proto.isConnecting = false;
                    callbackError(new catapush.model.error('WrongAuthentication'));
                } else if (status == catapush.ext.Strophe.Status.ERROR) {
                    xmppConnection._proto.isConnecting = false;
                    callbackError(new catapush.model.error('XMPP Error'));
                } else if (status == catapush.ext.Strophe.Status.DISCONNECTED) {
                    xmppConnection._proto.isConnecting = false;
                    if(that.wantConnected){
                        //console.log('reconnect');
                        that.silentReconnect = true;
                        callbackError(new catapush.model.error('NetworkProblem'));
                        // Retry connect
                        if(!xmppConnection._proto.isConnecting) {
                            xmppConnection._proto.isConnecting = true;
                            setTimeout(function () {
                                if(!that.wantConnected || !that.silentReconnect){
                                    return;
                                }
                                xmppConnection._proto._connect();
                                xmppConnection.addHandler(messageHandler, null, 'message', null, null, null);
                            }, 5000);
                        }
                    }
                    callbackDisconnected(xmppConnection);

                } else if (status == catapush.ext.Strophe.Status.CONNTIMEOUT) {
                    xmppConnection._proto.isConnecting = false;
                    callbackDisconnected(xmppConnection);
                }
            };

            if(xmppConnection._proto.isConnecting){
                return false;
            }
            xmppConnection._proto.isConnecting = true;
            xmppConnection.addHandler(messageHandler, null, 'message', null, null, null);
            xmppConnection.connect(mobileUser.getJid() + '/Mobile', mobileUser.getPassword(), onConnect);
            return xmppConnection;
        },
        disconnect: function (config, xmppConnection) {
            this.wantConnected = false;
            this.silentReconnect = false;
            xmppConnection.disconnect();
        },
        /**
         *
         * @param xmppConnection
         * @param message
         */
        sendReceipt: function (xmppConnection, message) {
            var out = $msg({to: message.getFrom(), from: message.getTo(), id: xmppConnection.getUniqueId()}),
                request = catapush.ext.Strophe.xmlElement('received', {
                    'xmlns': 'urn:xmpp:receipts',
                    'id': message.getId(),
                    'ts': catapush.component.util.toIsoStringWithoutMilliseconds(message.getReceivedAt())
                });
            out.tree().appendChild(request);
            xmppConnection.send(out);
            if(!xmppConnection.connected){
                return false;
            }
            return true;
        },
        /**
         *
         * @param xmppConnection
         * @param message
         */
        sendRead: function (xmppConnection, message) {
            var uniqueId = xmppConnection.getUniqueId();
            var out = $msg({to: message.getFrom(), from: message.getTo(), id: uniqueId, 'type': 'normal'}),
                request = catapush.ext.Strophe.xmlElement('read', {
                    'xmlns': 'http://www.catapush.com/extensions/message#read',
                    'id': message.getId(),
                    'ts': catapush.component.util.toIsoStringWithoutMilliseconds(message.getReadAt())
                }),
                request2 = catapush.ext.Strophe.xmlElement('request', {'xmlns': 'urn:xmpp:receipts'});
            out.tree().appendChild(request);
            out.tree().appendChild(request2);
            xmppConnection.send(out);
            if(!xmppConnection.connected){
                return false;
            }
            return uniqueId;
        }
    };
})(window.Catapush);

/**
 * https://github.com/hanicker/openfire-websockets/blob/master/src/ofchat/js/strophejs/plugins/plugin.cm.js
 */


/**
 * StropheJS - Stream Management XEP-0198
 *
 * This plugin implements stream mangemament ACK capabilities of the specs XEP-0198.
 * Note: Resumption is not supported in this current implementation.
 *
 * Reference: http://xmpp.org/extensions/xep-0198.html
 *
 * @class streamManagement
 */
Strophe.addConnectionPlugin('streamManagement', {

    /**
     * @property {Boolean} autoSendCountOnEveryIncomingStanza: Set to true to send an 'a' response after every stanza.
     * @default false
     * @public
     */
    autoSendCountOnEveryIncomingStanza: false,

    /**
     * @property {Integer} requestResponseInterval: Set this value to send a request for counter on very interval
     * number of stanzas sent. Set to 0 to disable.
     * @default 5
     * @public
     */
    requestResponseInterval: 5,

    /**
     * @property {Pointer} _c: Strophe connection instance.
     * @private
     */
    _c: null,

    /**
     * @property {String} _NS XMPP Namespace.
     * @private
     */
    _NS: 'urn:xmpp:sm:3',

    /**
     * @property {Boolean} _isStreamManagementEnabled
     * @private
     */
    _isStreamManagementEnabled: false,

    /**
     * @property {Integer} _serverProcesssedStanzasCounter: Keeps count of stanzas confirmed processed by the server.
     * The server is the source of truth of this value. It is the 'h' attribute on the latest 'a' element received
     * from the server.
     * @private
     */
    _serverProcesssedStanzasCounter: null,

    /**
     * @property {Integer} _clientProcessedStanzasCounter: Counter of stanzas received by the client from the server.
     * Client is the source of truth of this value. It is the 'h' attribute in the 'a' sent from the client to
     * the server.
     * @private
     */
    _clientProcessedStanzasCounter: null,

    /**
     * @property {Integer} _clientSentStanzasCounter
     * @private
     */
    _clientSentStanzasCounter: null,

    /**
     * Stores a reference to Strophe connection send function to wrap counting functionality.
     * @method _originalSend
     * @type {Handler}
     * @private
     */
    _originalSend: null,

    /**
     * @property {Handler} _requestHandler: Stores reference to handler that process count request from server.
     * @private
     */
    _requestHandler: null,

    /**
     * @property {Handler} _incomingHanlder: Stores reference to hanlder that processes incoming stanzas count.
     * @private
     */
    _incomingHandler: null,

    /**
     * @property {Integer} _requestResponseIntervalCount: Counts sent stanzas since last response request.
     */
    _requestResponseIntervalCount: 0,

    init: function(conn) {
        this._c = conn;
        Strophe.addNamespace('SM', this._NS);

        // Storing origina send function to use additional logic
        this._originalSend = this._c.send;
        this._c.send = this.send.bind(this);
    },

    statusChanged: function (status) {
        if (status === Strophe.Status.CONNECTED || status === Strophe.Status.DISCONNECTED) {

            this._serverProcesssedStanzasCounter = 0;
            this._clientProcessedStanzasCounter = 0;

            this._clientSentStanzasCounter = 0;

            this._isStreamManagementEnabled = false;
            this._requestResponseIntervalCount = 0;

            if (this._requestHandler) {
                this._c.deleteHandler(this._requestHandler);
            }

            if (this._incomingHandler) {
                this._c.deleteHandler(this._incomingHandler);
            }

            this._requestHandler = this._c.addHandler(this._handleServerRequestHandler.bind(this), this._NS, 'r');
            this._incomingHandler = this._c.addHandler(this._incomingStanzaHandler.bind(this));
        }
    },

    enable: function() {
        this._c.send($build('enable', {xmlns: this._NS, resume: false}));
    },

    /**
     * This method overrides the send method implemented by Strophe.Connection
     * to count outgoing stanzas
     *
     * @method Send
     * @public
     */
    send: function(elem) {
        if (Strophe.isTagEqual(elem, 'iq') ||
            Strophe.isTagEqual(elem, 'presence') ||
            (elem.node && elem.node.tagName === 'message')) {
            this._increaseSentStanzasCounter();
        }

        return this._originalSend.call(this._c, elem);
    },

    _incomingStanzaHandler: function(elem) {
        if (Strophe.isTagEqual(elem, 'enabled') && elem.getAttribute('xmlns') === this._NS) {
            this._isStreamManagementEnabled = true;
        }

        if (Strophe.isTagEqual(elem, 'iq') || Strophe.isTagEqual(elem, 'presence') || Strophe.isTagEqual(elem, 'message'))  {
            this._increaseReceivedStanzasCounter();

            if (this.autoSendCountOnEveryIncomingStanza) {
                this._answerProcessedStanzas();
            }
        }

        if (Strophe.isTagEqual(elem, 'a')) {
            this._setSentStanzasCounter(parseInt(elem.getAttribute('h')));

            if (this.requestResponseInterval > 0) {
                this._requestResponseIntervalCount = 0;
            }
        }

        return true;
    },

    getClientSentStanzasCounter: function() {
        return this._clientSentStanzasCounter;
    },

    _setSentStanzasCounter: function(count) {
        this._serverProcesssedStanzasCounter = count;

        if (this._clientSentStanzasCounter !== this._serverProcesssedStanzasCounter) {
            console.error('Stream Management stanzas counter mismatch. Client value: ' + this._clientSentStanzasCounter + ' - Server value: ' + this._serverProcesssedStanzasCounter);
        }
    },

    _handleServerRequestHandler: function() {
        this._answerProcessedStanzas();
        return true;
    },

    _answerProcessedStanzas: function() {
        if (this._isStreamManagementEnabled) {
            this._c.send($build('a', { xmlns: this._NS, h: this._clientProcessedStanzasCounter }));
        }
    },

    _increaseSentStanzasCounter: function() {
        if (this._isStreamManagementEnabled) {

            this._clientSentStanzasCounter++;

            if (this.requestResponseInterval > 0) {
                this._requestResponseIntervalCount++;

                if (this._requestResponseIntervalCount === this.requestResponseInterval) {
                    this._requestResponseIntervalCount = 0;
                    setTimeout(function(){
                        this._originalSend.call(this._c, $build('r', { xmlns: this._NS }));
                    }.bind(this), 100);
                }
            }
        }
    },

    _increaseReceivedStanzasCounter: function() {
        if (this._isStreamManagementEnabled) {
            this._clientProcessedStanzasCounter++;
        }
    }

});
/**
 * Expose get only as a Catapush global variable
 */
(function (catapush) {
    /**
     * If CATAPUSH_DEBUG constant is set, library exposes:
     * window.CatapushDebug containing the Catapush internal library
     * window.CatapushInstanceDebug containing the last Catapush internal library instance
     */
    if (typeof(CATAPUSH_DEBUG) !== 'undefined') {
        window.CatapushDebug = catapush;
    }
    window.Catapush = {
        get: function () {
            var newInstance = catapush.ext.$.extend(true, {}, catapush); //instance._.snapshot(catapush);
            //newInstance.setConfig(new catapush.model.config('dev'));
            newInstance.setConfig(new catapush.model.config('prod'));
            var instance = newInstance;
            if (typeof(CATAPUSH_DEBUG) !== 'undefined') {
                window.CatapushInstanceDebug = instance;
            }
            instance.setUp();
            return { // Public interface
                PLATFORM: {
                    'ANDROID': 1,
                    'IOS': 2,
                    'WINDOWS': 3,
                    'WEB': 4
                },
                setApp: function (appKey, platform) {
                    instance.setMobileApp(new instance.model.mobileApp(instance, appKey, platform));
                    return this;
                },
                setUser: function (user, password) {
                    instance.setMobileUser(new instance.model.mobileUser(instance, user, password));
                    return this;
                },
                connect: function () {
                    instance.connect();
                    return this;
                },
                getLastMessages: function (limit, callback) {
                    var messages = instance.storage.getLastMessages(limit, function (messages) {
                        var ret = [];
                        for (var i = 0; i < messages.length; i++) {
                            ret.push(messages[i].getExternal());
                        }
                        callback(ret);
                    });
                },
                getMessagesFromMessageId: function (limit, previous, fromMessageId, callback) {
                    instance.storage.getMessageById(fromMessageId, function (message) {
                        if (!message) {
                            callback();
                        } else {
                            instance.storage.getMessages(limit, previous, message.getSentAtTimestampAndId(), function (messages) {
                                var ret = [];
                                for (var i = 0; i < messages.length; i++) {
                                    ret.push(messages[i].getExternal());
                                }
                                callback(ret);
                            });
                        }
                    });
                },
                /*getConfig:function(){
                 return instance.getConfig();
                 },*/
                onConnecting: function (callback) {
                    instance.service.event.subscribe('catapush.connecting', function () {
                        callback(); // prevent args
                    });
                },
                onConnected: function (callback) {
                    instance.service.event.subscribe('catapush.connected', function () {
                        callback(); // prevent args
                    });
                },
                onDisconnected: function (callback) {
                    instance.service.event.subscribe('catapush.disconnected', function () {
                        callback(); // prevent args
                    });
                },
                onUserSet: function (callback) {
                    instance.service.event.subscribe('catapush.userset', function () {
                        callback(); // prevent args
                    });
                },
                setMessageRead: function (messageId, callback) {
                    instance.setMessageRead(messageId).then(function (message) {
                        callback(message.getExternal());
                    });
                },
                onMessageReceived: function (callback) {
                    instance.service.event.subscribe('catapush.messagereceived', function (event, message) {
                        callback(message.getExternal());
                    });
                },
                onConnectError: function (callback) {
                    instance.service.event.subscribe('catapush.connecterror', function (event, err) {
                        callback(err); // prevent args
                    });
                },
                onReconnected: function (callback) {
                    instance.service.event.subscribe('catapush.reconnected', function (event) {
                        callback(); // prevent args
                    });
                },
                resetStorage: function () {
                    return instance.resetStorage();
                },
                resetConnection: function () {
                    instance.resetConnection();
                },
                updatePushToken: function (pushToken, callback, callbackError) {
                    instance.mobileUser.setPushToken(pushToken);
                    instance.service.api.updateMobileUserToken(instance.getConfig(), instance.mobileUser.getId(), instance.mobileUser.getAccessToken(), instance.mobileUser.getPushToken(), callback, callbackError);
                }
            };
        }
    }
})(window.Catapush);