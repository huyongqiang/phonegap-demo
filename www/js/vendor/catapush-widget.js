/*! catapush widget v1.0.4 | (c) Catapush | catapush.com */
/*
 * jQuery appear plugin
 *
 * Copyright (c) 2012 Andrey Sidorov
 * licensed under MIT license.
 *
 * https://github.com/morr/jquery.appear/
 *
 * Version: 0.3.6
 */
(function($) {
    var selectors = [];

    var check_binded = false;
    var check_lock = false;
    var defaults = {
        interval: 250,
        force_process: false
    };
    var $window = $(window);

    var $prior_appeared = [];

    function appeared(selector) {
        return $(selector).filter(function() {
            return $(this).is(':appeared');
        });
    }

    function process() {
        check_lock = false;
        for (var index = 0, selectorsLength = selectors.length; index < selectorsLength; index++) {
            var $appeared = appeared(selectors[index]);

            $appeared.trigger('appear', [$appeared]);

            if ($prior_appeared[index]) {
                var $disappeared = $prior_appeared[index].not($appeared);
                $disappeared.trigger('disappear', [$disappeared]);
            }
            $prior_appeared[index] = $appeared;
        }
    }

    function add_selector(selector) {
        selectors.push(selector);
        $prior_appeared.push();
    }

    // "appeared" custom filter
    $.expr[':'].appeared = function(element) {
        var $element = $(element);
        if (!$element.is(':visible')) {
            return false;
        }

        var window_left = $window.scrollLeft();
        var window_top = $window.scrollTop();
        var offset = $element.offset();
        var left = offset.left;
        var top = offset.top;

        if (top + $element.height() >= window_top &&
            top - ($element.data('appear-top-offset') || 0) <= window_top + $window.height() &&
            left + $element.width() >= window_left &&
            left - ($element.data('appear-left-offset') || 0) <= window_left + $window.width()) {
            return true;
        } else {
            return false;
        }
    };

    $.fn.extend({
        // watching for element's appearance in browser viewport
        appear: function(options) {
            var opts = $.extend({}, defaults, options || {});
            var selector = this.selector || this;
            if (!check_binded) {
                var on_check = function() {
                    if (check_lock) {
                        return;
                    }
                    check_lock = true;

                    setTimeout(process, opts.interval);
                };

                $(window).scroll(on_check).resize(on_check);
                check_binded = true;
            }

            if (opts.force_process) {
                setTimeout(process, opts.interval);
            }
            add_selector(selector);
            return $(selector);
        }
    });

    $.extend({
        // force elements's appearance check
        force_appear: function() {
            if (check_binded) {
                process();
                return true;
            }
            return false;
        }
    });
})(function() {
    if (typeof module !== 'undefined') {
        // Node
        return require('jquery');
    } else {
        return jQuery;
    }
}());
(function ($) {

    var catapushWidget = {
        catapush: null,
        element: null,
        loadedMessages: [],
        allPreviousLoaded: false,
        waitMessagesLoading: false,
        autoScrolling: false,
        options: {
            'instance': null,
            'connect': true,
            'display': {
                'overflow': false,
                'showDayMark': true
            },
            'interaction': {
                'scrollOnMessage': true,
                'scrollOnLoad': true,
            },
            'event':{
                'beforeSendRead':null
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
        },
        strings: null,
        init: function () {
            var userLang = (navigator.language || navigator.userLanguage).toLowerCase();
            this.strings = typeof(this.options.strings[userLang]) !== 'undefined' ? this.options.strings[userLang] : this.options.strings['en-us'];

        },
        load: function () {
            var that = this;
            that.element.addClass('catapush-widget').html('').append($('<ul>'));
            if (that.options.display.overflow) {
                that.element.addClass('catapush-widget-overflow');
            }

            that.loadList().then(function () {

                var scrollToLastMessageDeferred = null;
                // Scroll to bottom
                if (that.options.interaction.scrollOnLoad) {
                    scrollToLastMessageDeferred = that.scrollToLastMessage(true);
                }

                // Check for scroll
                if (scrollToLastMessageDeferred) {
                    scrollToLastMessageDeferred.then(that.checkScroll);
                } else {
                    that.checkScroll();
                }

            });

            // Check for date change to update datemarks if necessary
            if (that.options.display.showDayMark) {
                that.updateDayMarksOnDayChangeTimer();
            }
        },
        /**
         * Pad number with a custom number of 0
         * @param number
         * @param digits
         * @returns integer
         */
        padDigits: function (number, digits) {
            return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
        },
        /**
         * Print date inserted on day mark (before a group messages in the same day)
         * @param d
         * @returns {string}
         */
        dateFormatDayMark: function (d) {
            return d.toLocaleDateString('nu', {year: 'numeric', month: 'short', day: 'numeric'});
        },
        /**
         * Print time inserted on every message
         * @param d
         * @returns {string}
         */
        dateFormatMessage: function (d) {
            //return d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear() + " " + d.getHours() + ":" + padDigits(d.getMinutes(),2);
            return d.getHours() + ":" + this.padDigits(d.getMinutes(), 2);
        },
        /**
         * Check scroll and performs updated based on it
         */
        checkScroll: function () {
            var that = this;
            var waitScrollLoading = false;
            var container = catapushWidget.options.display.overflow ? catapushWidget.element : $(window);
            container.scroll(function () {
                // Check scroll top to load messages
                var container = catapushWidget.options.display.overflow ? catapushWidget.element : $(window);
                if ($(container).scrollTop() == 0) {
                    if (!catapushWidget.waitMessagesLoading && !catapushWidget.allPreviousLoaded && !catapushWidget.autoScrolling) {
                        catapushWidget.waitMessagesLoading = true;
                        if (waitScrollLoading) {
                            console.log('WaitScroll');
                            return;
                        }
                        waitScrollLoading = true;
                        setTimeout(function () { // Prevent multiple loads in short time
                            waitScrollLoading = false;
                        }, 100);
                        if (catapushWidget.loadedMessages.length) {
                            var numberToLoad = 50;
                            catapushWidget.catapush.getMessagesFromMessageId(numberToLoad, true, catapushWidget.loadedMessages[0].id, function (messages) {
                                if (messages.length < numberToLoad) {
                                    catapushWidget.allPreviousLoaded = true;
                                }
                                var currentFirst = $('li.message', catapushWidget.element).first();
                                catapushWidget.addToList(messages, true);
                                // Scroll to previous first minus some space :)
                                if (catapushWidget.options.display.overflow) {
                                    catapushWidget.element.scrollTop(catapushWidget.element.scrollTop() - catapushWidget.element.offset().top + currentFirst.offset().top - 200);
                                } else {
                                    $("body, html").scrollTop(currentFirst.offset().top - 200);
                                }

                            });
                        } else {
                            // do nothing, wait for loadList!
                        }
                    }
                }
            });
        },
        /**
         * Add the day mark (before a group messages in the same day)
         * @param date
         * @param prepend
         */
        addDayMark: function (date, prepend) {
            var that = this;
            var isToday = new Date().toDateString() == date.toDateString();
            var el =
                    $('<li>')
                        .addClass('day-mark' + (isToday ? ' today' : ''))
                        .data('date', date)
                        .append(
                            $('<div>').addClass('date').text(isToday ? that.strings['today'] : this.dateFormatDayMark(date))
                        )
                ;
            if (prepend) {
                $('>ul', this.element).prepend(el);
            } else {
                $('>ul', this.element).append(el);
            }
        },
        /**
         * When day change we may need to update "today" in day marks
         */
        updateDayMarksOnDayChange: function () {
            var that = this;
            $('li.day-mark.today,li.day-mark:last', this.element).each(function () {
                var isToday = new Date().toDateString() == $(this).data('date').toDateString();
                $('.date', this).text(isToday ? that.strings['today'] : that.dateFormatDayMark($(this).data('date')));
            });
        },
        /**
         * Check for day change to update day marks
         */
        updateDayMarksOnDayChangeTimer: function () {
            var midnight = new Date();
            midnight.setHours(24);
            midnight.setMinutes(0);
            midnight.setSeconds(0);
            midnight.setMilliseconds(0);
            var milliseconds = midnight.getTime() - new Date().getTime();
            setTimeout(function () {
                this.updateDayMarksOnDayChange();
                this.updateDayMarksOnDayChangeTimer(); // set next
            }, milliseconds + 1000); // Add 1 second for security
        },
        /**
         * Add multiple messages to the list
         * @param messages
         * @param prepend
         */
        addToList: function (messages, prepend) {
            var that = this;
            if (messages.length) {
                this.hideNoMessagesToShow();
            }
            var currentDate = this.loadedMessages.length ? this.loadedMessages[prepend ? 0 : this.loadedMessages.length - 1].sentAt : null;
            if (prepend) {
                // remove top date mark
                $('li.day-mark:first', that.element).remove();
            }
            for (var i = 0; i < messages.length; i++) {
                var message = messages[i];
                var newDate = message.sentAt;
                // Check for day change
                if (that.options.display.showDayMark && (!currentDate || currentDate.toDateString() != newDate.toDateString())) {
                    this.addDayMark(prepend ? currentDate : newDate, prepend);
                }
                var el =
                        $('<li>')
                            .addClass('message')
                            .attr('message-id', message.id)
                            .append(
                                //$('<div>').addClass('text').text(message.text)
                                //$('<div>').addClass('text').html($('<div>').html(message.text).text())
                                $('<div>').addClass('text').html(message.text)
                            )
                            .append(
                                $('<div>').addClass('date').text(that.dateFormatMessage(message.sentAt))
                            )
                    ;
                if (prepend) {
                    $('>ul', this.element).prepend(el);
                    this.loadedMessages.unshift(message);
                } else {
                    $('>ul', this.element).append(el);
                    this.loadedMessages.push(message);
                }

                // Attach important handlers
                if (!message.readAt) {
                    el.appear({'force_process': true}).on('appear', function (event, $all_appeared_elements) {
                        // IMPROVEMENT check if tab currently viewed - http://stackoverflow.com/questions/1760250/how-to-tell-if-browser-tab-is-active
                        if (message.readAt) {
                            return;
                        }
                        // this element is now inside browser viewport
                        setTimeout(function () {
                            if (message.readAt) {
                                return;
                            }
                            var sendRead = !that.options.event.beforeSendRead || that.options.event.beforeSendRead(message);
                            if(sendRead) {
                                message.readAt = true; // temporarily prevent new read
                                that.catapush.setMessageRead(message.id, function (messageUpdated) {
                                    message = messageUpdated;
                                });
                            }
                        }, 500); // 1 second to actually read it, if visible
                    });
                }

                currentDate = newDate;
            }
            if (prepend && currentDate) {
                this.addDayMark(currentDate, prepend);
            }
            this.waitMessagesLoading = false;
        },
        /**
         * Load initial list con last messages
         * @returns {*}
         */
        loadList: function () {
            var that = this;
            this.waitMessagesLoading = true;
            var deferred = $.Deferred();
            var numberToLoad = 50;
            this.catapush.getLastMessages(numberToLoad, function (lastMessages) {
                if (lastMessages.length < numberToLoad) {
                    that.allPreviousLoaded = true;
                }
                var messages = lastMessages.reverse();
                that.addToList(messages, false);
                if (!lastMessages.length) {
                    that.showNoMessagesToShow();
                }
                deferred.resolve();
            });
            return deferred.promise();
        },
        /**
         * Soft scroll to last message in the list
         * @returns {*}
         */
        scrollToLastMessage: function (immediate) {
            var that = this;
            that.autoScrolling = true;
            var deferred = $.Deferred();
            var last = $('li', that.element).last();
            if (!last.length) {
                that.autoScrolling = false;
                deferred.resolve();
                return deferred.promise();
            }
            if (this.options.display.overflow) {
                that.element.stop().animate({
                    scrollTop: that.element.scrollTop() - that.element.offset().top + last.offset().top
                }, immediate ? 0 : 600, 'swing', function () {
                    that.autoScrolling = false;
                    deferred.resolve();
                });
            } else {
                $("body, html").stop().animate({
                    scrollTop: last.offset().top
                }, immediate ? 0 : 600, 'swing', function () {
                    that.autoScrolling = false;
                    deferred.resolve();
                });
            }
            return deferred.promise();
        },
        hideNoMessagesToShow: function () {
            $('> .no-messages', this.element).remove();
        },
        showNoMessagesToShow: function () {
            var el = $('<div>').attr('class', 'no-messages').text(this.strings.noMessages);
            this.element.prepend(el);
        }
    };


    var methods = {
        init: function (options) {
            var that = this;
            catapushWidget.element = this;
            catapushWidget.options = $.extend(catapushWidget.options, options);
            catapushWidget.init();

            if (options.instance) {
                catapushWidget.catapush = catapushWidget.options.instance;
            } else {
                catapushWidget.catapush = Catapush.get();
                catapushWidget.catapush.setApp(catapushWidget.options.appKey, catapush.PLATFORM.WEB).setUser(catapushWidget.options.user, catapushWidget.options.password);
            }
            that.data('catapush', catapushWidget.catapush);
            if (catapushWidget.options.connect) {
                catapushWidget.catapush.connect();
            }


            /**
             * On event message received update the list and scroll it
             */
            catapushWidget.catapush.onMessageReceived(function (message) {
                catapushWidget.addToList([message], false);
                // Eventually scroll
                if (catapushWidget.options.interaction.scrollOnMessage) {
                    catapushWidget.scrollToLastMessage(false);
                }
            });

            /**
             * Starts everything
             */
            catapushWidget.load();
        },
        /**
         * Scroll to last message
         * @param immediate
         */
        scrollToLastMessage: function (immediate) {
            catapushWidget.scrollToLastMessage(immediate);
        },
        /**
         * Force read check in case the div has been hidden
         */
        checkRead:function(){
            $.force_appear();
        },
        /**
         * Reset all messages and data
         */
        clear: function () {
            var that = this;
            if (!catapushWidget.catapush) {
                $.error('Catapush not loaded');
            }
            catapushWidget.catapush.resetStorage();
            catapushWidget.loadedMessages = [];
            catapushWidget.allPreviousLoaded = false;

            catapushWidget.load();
        }/*,
         destroy:function(){
         this._destroy(); //or this.delete; depends on jQuery version
         this.element.unbind( this.eventNamespace )
         this.bindings.unbind( this.eventNamespace );
         }*/
        /*hide : function( ) {
         var that = this;
         console.log(that.data('catapush'));
         },// GOOD
         update : function( content ) {  }// !!! */
    };

    $.fn.catapushWidget = function (methodOrOptions) {
        if (methods[methodOrOptions]) {
            return methods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            // Default to "init"
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + methodOrOptions + ' does not exist on jQuery.catapushWidget');
        }
    };
}(jQuery));