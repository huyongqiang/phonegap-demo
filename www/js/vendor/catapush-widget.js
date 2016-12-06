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
/** js-sha1 **/
(function(x,F){"undefined"!=typeof module&&(x=global);var k="0123456789abcdef".split(""),C=[-2147483648,8388608,32768,128],v=[24,16,8,0],b=[],D=function(w){var x="string"!=typeof w;x&&w.constructor==ArrayBuffer&&(w=new Uint8Array(w));var n,p,q,r,t,m=0,y=!1,a,l,h,u=0,z=0,B=0,A=w.length;n=1732584193;p=4023233417;q=2562383102;r=271733878;t=3285377520;do{b[0]=m;b[16]=b[1]=b[2]=b[3]=b[4]=b[5]=b[6]=b[7]=b[8]=b[9]=b[10]=b[11]=b[12]=b[13]=b[14]=b[15]=0;if(x)for(a=z;u<A&&64>a;++u)b[a>>2]|=w[u]<<v[a++&3];else for(a=
z;u<A&&64>a;++u)m=w.charCodeAt(u),128>m?b[a>>2]|=m<<v[a++&3]:(2048>m?b[a>>2]|=(192|m>>6)<<v[a++&3]:(55296>m||57344<=m?b[a>>2]|=(224|m>>12)<<v[a++&3]:(m=65536+((m&1023)<<10|w.charCodeAt(++u)&1023),b[a>>2]|=(240|m>>18)<<v[a++&3],b[a>>2]|=(128|m>>12&63)<<v[a++&3]),b[a>>2]|=(128|m>>6&63)<<v[a++&3]),b[a>>2]|=(128|m&63)<<v[a++&3]);B+=a-z;z=a-64;u==A&&(b[a>>2]|=C[a&3],++u);m=b[16];u>A&&56>a&&(b[15]=B<<3,y=!0);for(h=16;80>h;++h)a=b[h-3]^b[h-8]^b[h-14]^b[h-16],b[h]=a<<1|a>>>31;var c=n,d=p,e=q,f=r,g=t;for(h=
0;20>h;h+=5)l=d&e|~d&f,a=c<<5|c>>>27,g=a+l+g+1518500249+b[h]<<0,d=d<<30|d>>>2,l=c&d|~c&e,a=g<<5|g>>>27,f=a+l+f+1518500249+b[h+1]<<0,c=c<<30|c>>>2,l=g&c|~g&d,a=f<<5|f>>>27,e=a+l+e+1518500249+b[h+2]<<0,g=g<<30|g>>>2,l=f&g|~f&c,a=e<<5|e>>>27,d=a+l+d+1518500249+b[h+3]<<0,f=f<<30|f>>>2,l=e&f|~e&g,a=d<<5|d>>>27,c=a+l+c+1518500249+b[h+4]<<0,e=e<<30|e>>>2;for(;40>h;h+=5)l=d^e^f,a=c<<5|c>>>27,g=a+l+g+1859775393+b[h]<<0,d=d<<30|d>>>2,l=c^d^e,a=g<<5|g>>>27,f=a+l+f+1859775393+b[h+1]<<0,c=c<<30|c>>>2,l=g^c^d,
a=f<<5|f>>>27,e=a+l+e+1859775393+b[h+2]<<0,g=g<<30|g>>>2,l=f^g^c,a=e<<5|e>>>27,d=a+l+d+1859775393+b[h+3]<<0,f=f<<30|f>>>2,l=e^f^g,a=d<<5|d>>>27,c=a+l+c+1859775393+b[h+4]<<0,e=e<<30|e>>>2;for(;60>h;h+=5)l=d&e|d&f|e&f,a=c<<5|c>>>27,g=a+l+g-1894007588+b[h]<<0,d=d<<30|d>>>2,l=c&d|c&e|d&e,a=g<<5|g>>>27,f=a+l+f-1894007588+b[h+1]<<0,c=c<<30|c>>>2,l=g&c|g&d|c&d,a=f<<5|f>>>27,e=a+l+e-1894007588+b[h+2]<<0,g=g<<30|g>>>2,l=f&g|f&c|g&c,a=e<<5|e>>>27,d=a+l+d-1894007588+b[h+3]<<0,f=f<<30|f>>>2,l=e&f|e&g|f&g,a=d<<
5|d>>>27,c=a+l+c-1894007588+b[h+4]<<0,e=e<<30|e>>>2;for(;80>h;h+=5)l=d^e^f,a=c<<5|c>>>27,g=a+l+g-899497514+b[h]<<0,d=d<<30|d>>>2,l=c^d^e,a=g<<5|g>>>27,f=a+l+f-899497514+b[h+1]<<0,c=c<<30|c>>>2,l=g^c^d,a=f<<5|f>>>27,e=a+l+e-899497514+b[h+2]<<0,g=g<<30|g>>>2,l=f^g^c,a=e<<5|e>>>27,d=a+l+d-899497514+b[h+3]<<0,f=f<<30|f>>>2,l=e^f^g,a=d<<5|d>>>27,c=a+l+c-899497514+b[h+4]<<0,e=e<<30|e>>>2;n=n+c<<0;p=p+d<<0;q=q+e<<0;r=r+f<<0;t=t+g<<0}while(!y);return k[n>>28&15]+k[n>>24&15]+k[n>>20&15]+k[n>>16&15]+k[n>>12&
15]+k[n>>8&15]+k[n>>4&15]+k[n&15]+k[p>>28&15]+k[p>>24&15]+k[p>>20&15]+k[p>>16&15]+k[p>>12&15]+k[p>>8&15]+k[p>>4&15]+k[p&15]+k[q>>28&15]+k[q>>24&15]+k[q>>20&15]+k[q>>16&15]+k[q>>12&15]+k[q>>8&15]+k[q>>4&15]+k[q&15]+k[r>>28&15]+k[r>>24&15]+k[r>>20&15]+k[r>>16&15]+k[r>>12&15]+k[r>>8&15]+k[r>>4&15]+k[r&15]+k[t>>28&15]+k[t>>24&15]+k[t>>20&15]+k[t>>16&15]+k[t>>12&15]+k[t>>8&15]+k[t>>4&15]+k[t&15]};if(x.JS_SHA1_TEST||"undefined"==typeof module)x&&(x.sha1=D);else{var y=require("crypto"),E=require("buffer").Buffer;
module.exports=function(b){if("string"==typeof b)return y.createHash("sha1").update(b,"utf8").digest("hex");b.constructor==ArrayBuffer&&(b=new Uint8Array(b));return y.createHash("sha1").update(new E(b)).digest("hex")}}})(this);

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
                'enable2Way':false
            },
            'event':{
                'beforeSendRead':null
            },
            'strings': {
                'en-us': {
                    'today': 'today',
                    'noMessages': 'no messages to show',
                    'resetButton': 'Reset',
                    'message':'Message'
                },
                'it-it': {
                    'today': 'oggi',
                    'noMessages': 'nessun messaggio da visualizzare',
                    'resetButton': 'Reset',
                    'message':'Messaggio'
                }
            },
            'attachments':{
                'storeHandler':null,
                'openHandler':null,
                'enableOpenHandler':null
            }
        },
        strings: null,
        attachmentIcons : {
            image: 'fa-file-image-o',
            pdf: 'fa-file-pdf-o',
            word: 'fa-file-word-o',
            powerpoint: 'fa-file-powerpoint-o',
            excel: 'fa-file-excel-o',
            audio: 'fa-file-audio-o',
            video: 'fa-file-video-o',
            zip: 'fa-file-zip-o',
            code: 'fa-file-code-o',
            file: 'fa-file-o'
        },
        attachmentExtensions : {
            gif: 'image',
            jpeg: 'image',
            jpg: 'image',
            png: 'image',

            pdf: 'pdf',

            doc: 'word',
            docx: 'word',

            ppt: 'powerpoint',
            pptx: 'powerpoint',

            xls: 'excel',
            xlsx: 'excel',

            aac: 'audio',
            mp3: 'audio',
            ogg: 'audio',

            avi: 'video',
            flv: 'video',
            mkv: 'video',
            mp4: 'video',

            gz: 'zip',
            zip: 'zip',

            css: 'code',
            html: 'code',
            js: 'code',

            file: 'file'
        },
        supportedImageAttachmentPreviews : ['image/png', 'image/vnd.wap.wbmp', 'image/x-png', 'image/jpeg', 'image/bmp', 'image/gif'],
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
                if (that.options.display.showDayMark && (!currentDate || !newDate || currentDate.toDateString() != newDate.toDateString())) {
                    this.addDayMark(prepend ? currentDate : newDate, prepend);
                }
                var el =
                        $('<li>')
                            .addClass('message')
                            .attr('message-id', message.id);
                    ;
                if (message.text){
                    el.append(
                        //$('<div>').addClass('text').text(message.text)
                        //$('<div>').addClass('text').html($('<div>').html(message.text).text())
                        $('<div>').addClass('text').html(message.text)
                    );
                }
                if (message.attachment){
                    var attachmentElement = $('<div>').addClass('attachment');

                    var icon = this.attachmentIcons.file;
                    if(message.attachment.filename) {
                        var ext = message.attachment.filename.substr(message.attachment.filename.lastIndexOf('.') + 1).toLowerCase();
                        if (ext in this.attachmentExtensions) {
                            var icon = this.attachmentIcons[this.attachmentExtensions[ext]];
                        }
                    }
                    var iconHtml = '<i class="fa '+icon+' fa-lg"></i>';

                    attachmentElement.append(iconHtml);

                    if(message.attachment.preview && message.attachment.preview.content && $.inArray(message.attachment.preview.mediaType,this.supportedImageAttachmentPreviews)!=-1){
                        var attachmentPreviewImage = $("<img>").addClass('preview').attr('src', 'data:'+message.attachment.preview.mediaType+';base64,'+message.attachment.preview.content);
                        attachmentElement.append(attachmentPreviewImage);
                    }

                    if(message.attachment.filename) {
                        var spanFilename = $('<span>').addClass('filename').text(message.attachment.filename);
                        attachmentElement.append(spanFilename);
                    }

                    if(message.attachment.url){
                        // Check validity based on time
                        var messageSendTime = message.sentAt;
                        var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
                        var diffDays = Math.round(Math.abs(((new Date()).getTime() - messageSendTime.getTime())/(oneDay)));
                        var availabilityDays = 15; // online storage cleaned every ~ 30 days

                        if(diffDays <= availabilityDays) {
                            // If still stored remotely
                            attachmentElement = $('<a>').addClass('attachment-container').attr('target', '_blank').attr('href', message.attachment.url).append(attachmentElement);
                        }

                        // Visualize
                        if(that.options.attachments.enableOpenHandler && that.options.attachments.openHandler){
                            // If storage enabled
                            var saveName = message.id + (message.attachment.filename.split("").reverse().join("").substr(0,150).split("").reverse().join(""));
                            (function(message,saveName,attachmentElement,diffDays,availabilityDays){
                                that.options.attachments.enableOpenHandler(saveName,function(res){
                                    var attachCallback = function(){
                                        attachmentElement.click(function (e) {
                                            e.preventDefault();
                                            that.options.attachments.openHandler(saveName, message.attachment.mediaType);
                                        });
                                    };
                                    // If available locally
                                    if(res) {
                                        attachCallback();
                                    }else{
                                        // Save if not available
                                        if (diffDays <= availabilityDays && that.options.attachments.storeHandler) {
                                            that.options.attachments.storeHandler(message.attachment.url, saveName, message.attachment.mediaType, function(){
                                                attachCallback();
                                            });
                                        }
                                    }
                                });
                            })(message,saveName,attachmentElement,diffDays,availabilityDays);
                        }
                    }
                    el.append(attachmentElement);
                }

                el.append(
                    $('<div>').addClass('date').text(that.dateFormatMessage(message.sentAt))
                );

                if (prepend) {
                    $('>ul', this.element).prepend(el);
                    this.loadedMessages.unshift(message);
                } else {
                    $('>ul', this.element).append(el);
                    this.loadedMessages.push(message);
                }

                if(message.twoWay){
                    el.addClass('twoWay');
                }

                if(message.receivedSendReceiptAt){
                    el.addClass('sent-receipt-received');
                }

                // Attach important handlers
                if (!message.readAt && !message.twoWay) {
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
        },
        add2Way:function(){
            var that = this;
            var element2Way = $('<div>').addClass('twoWay-form');
            var element2WayForm = $('<form>').appendTo(element2Way);
            var textInput = $('<input>').attr('type','text').attr('placeholder',that.strings['message']).appendTo(element2WayForm);
            var fileInput = $('<input>').attr('type','file').appendTo(element2WayForm);
            var attachButton = $('<div>').addClass('attach').appendTo(element2WayForm);
            var clearInput = $('<button>').text(that.strings['resetButton']).appendTo(element2WayForm);
            var submit = $('<input>').attr('type','submit').prop('disabled',true).appendTo(element2WayForm);

            var sendMessage = function(text,attachment){
                var message = that.catapush.sendMessage(text,attachment);
                catapushWidget.addToList([message], false);
                $('.filename',element2WayForm).remove();
                textInput.val('');
                fileInput.val('');
                submit.prop('disabled',false);
                if (catapushWidget.options.interaction.scrollOnMessage) {
                    catapushWidget.scrollToLastMessage(false);
                }
            };

            element2WayForm.submit(function(e){
                e.preventDefault();
                //alert(textInput.val());
                submit.prop('disabled',true);
                if(fileInput[0].files.length>0){
                    var file =  fileInput[0].files[0];

                    var attachment = {};
                    attachment.filename = file.name;
                    attachment.mediaType = file.type;
                    attachment.size = file.size;
                    //console.log(file);
                    catapushWidget.catapush.uploadFile(file,function(data){
                        //console.log(data);
                        // get sha
                        var reader = new FileReader();
                        reader.onload = function (event) {
                            var file_sha1 = sha1(event.target.result);
                            attachment.hash = file_sha1;
                            attachment.url = data.remoteUrl;
                            //console.log(attachment);
                            sendMessage(textInput.val(),attachment);
                        };
                        reader.readAsArrayBuffer(file);
                    },function(){

                    });
                }else{
                    sendMessage(textInput.val(),null);
                }
            });
            textInput.bind('input',function(){
                if(textInput.val().length>0){
                    submit.prop('disabled',false);
                }else{
                    submit.prop('disabled',true);
                }
            });
            fileInput.change(function(){
                $('.filename',element2WayForm).remove();
               if(fileInput.val()){
                   var file =  fileInput[0].files[0];
                   attachButton.after($('<span>').addClass('filename').text(file.name));
                   submit.prop('disabled',false);
               }else{
                   submit.prop('disabled',true);
               }
            });
            clearInput.click(function(e){
                e.preventDefault();
                $('.filename',element2WayForm).remove();
                textInput.val('');
                fileInput.val('');
                submit.prop('disabled',true);
            });
            attachButton.click(function(e){
                e.preventDefault();
                fileInput.trigger('click');
            });

            this.element.addClass('catapush-widget').append(element2Way);
        }
    };


    var methods = {
        init: function (options) {
            var that = this;
            catapushWidget.element = this;
            catapushWidget.options = $.extend(true,catapushWidget.options, options);
            catapushWidget.init();

            if (options.instance) {
                catapushWidget.catapush = catapushWidget.options.instance;
            } else {
                catapushWidget.catapush = Catapush.get();
                catapushWidget.catapush.setApp(catapushWidget.options.appKey, catapushWidget.catapush.PLATFORM.WEB).setUser(catapushWidget.options.user, catapushWidget.options.password);
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
             * On event twoway receipt received add class to relative message in the list
             */
            catapushWidget.catapush.onMessageSentReceiptReceived(function (message) {
                $('li.message[message-id="'+message.id+'"',this.element).addClass('sent-receipt-received');
            });


            /**
             * Starts everything
             */
            catapushWidget.load();

            /**
             * Eventually enable 2way
             */
            if(catapushWidget.options.interaction.enable2Way){
                catapushWidget.add2Way();
            }
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