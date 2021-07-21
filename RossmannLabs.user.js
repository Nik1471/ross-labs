// ==UserScript==
// @name         RossmannLabs
// @namespace    Nik1471
// @version      0.6
// @description  Streamlabs Alerts userscript for Louis Rossmann
// @author       Nik1471
// @icon         https://streamlabs.com/images/favicons/favicon.svg
// @match        https://streamlabs.com/alert-box/v*
// @match        https://streamlabs.com/widgets/frame/alertbox/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/timeago.js/4.0.2/timeago.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/micromodal/0.4.6/micromodal.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/timer.jquery/0.9.0/timer.jquery.min.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

/* global jQuery, $, _, timeago, MicroModal */

// New message sound
var alertUrl = 'https://raw.githubusercontent.com/Nik1471/RossmannLabs/master/whoosh-01.wav';
// Currency rates for US dollar
var ratesUrl = 'https://www.floatrates.com/daily/usd.json';
// Main button (logo) image
var logoUrl = 'https://raw.githubusercontent.com/Nik1471/RossmannLabs/master/rossmann-logo.png';

// Prevent conflicts with page's jQuery library
this.$ = jQuery.noConflict(true);

$(function () {
    if ($('#shield').length) {
        /**
         *  Parent page: hide divs that block clicks
         */
        GM_addStyle('#shield, #boombox, #gif, #attachments { display: none !important; }');
    } else {
        /**
         *  Iframe page: main action
         */
        var alertAudio = new Audio(alertUrl);

        // Adding custom styles with GM_addStyle
        var cssCode = [
            // Rewrite some default styles
            '#wrap { display: none !important; }',
            '#widget { right: 11vw !important; animation-duration: 0s !important; -webkit-animation-duration: 0s !important; }',
            '#alert-text { vertical-align: bottom !important; }',
            '.hidden { opacity: 1 !important; }',
            // Icon button styles
            '.my-button { font-size: 3.5vw; line-height: 1; color: white; background-color: transparent; border: 0; padding: 0; opacity: 0; z-index: 10; transition: opacity 0.2s; }',
            '.my-button:hover { opacity: 0.9; }',
            '.my-button:active { opacity: 0.6; }',
            '.my-button:focus { outline: 0; }',
            // Wrap block styles
            '#wrap-copy { position: relative; height: 100%; width: 100%; display: flex; align-items: flex-end; justify-content: center; }',
            '.wrap-block { position: fixed; top: 0; bottom: 0; right: 0; z-index: 9999; width: 11vw; padding: 0 1.5vw 1.5vw 0; box-sizing: border-box; display: flex; align-items: center; justify-content: flex-end; flex-direction: column; }',
            // Main (logo) button and Hide message button
            '.wrap-button { width: 100%; position: relative; text-align: center; }',
            '.wrap-button > .my-button { position: absolute; top: -4.2vw; left: -4.2vw; }',
            '.my-logo { width: 90%; height: auto; }',
            '.my-logo:hover { cursor: pointer; opacity: 0.9 }',
            '@keyframes spin { 100% { transform: rotate(360deg); -webkit-transform: rotate(360deg);  } }',
            '.spin { animation: spin 0.5s ease-in-out; -webkit-animation: spin 0.5s ease-in-out; }',
            // Message counter block and Remove messages button
            '.alert-counter, .alert-timer { width: 100%; padding: 0.2vw; text-align: center; background-color: #6b5f58; border: 1px solid #424242; box-sizing: border-box; font-size: 2vw; line-height: 1; }',
            '.alert-counter { color: #bdbdbd; position: relative; margin-bottom: 1vw; }',
            '.alert-counter > .my-button { position: absolute; top: -0.2vw; left: -4.2vw; font-size: 2.8vw; }',
            '#message-curr, #message-all { color: #dedbda; }',
            '#message-all { font-weight: 600; color: white; }',
            '.new { background-color: #3e7867; }',
            // Alert timer styles
            '.alert-timer { margin-bottom: 1.2vw; color: #e0e0e0; font-family: Consolas, monospace; font-size: 2.3vw; padding: 0.1vw; }',
            // Previous and next message buttons
            '.alert-nav { width: 100%; margin-bottom: 0.5vw; z-index: 100; }',
            '.alert-nav > .my-button { width: 50%; }',
            // Time ago line in message block
            '.time { margin-left: 0.5em; font-size: 1.8vw; color: #e0e0e0; }',
            // Modal styles for Remove messages button
            '.modal { display: none; position: fixed; z-index: 10000; }',
            '.modal.is-open { display: block; }',
            '.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; }',
            '.modal-container { background-color: #fff; padding: 1.1vw; max-width: 30vw; max-height: 100vh; border-radius: 1vw; overflow-y: auto; box-sizing: border-box; }',
            '.modal-header { display: flex; justify-content: space-between; align-items: center; }',
            '.modal-title { margin-top: 0; margin-bottom: 0; font-weight: bold; line-height: 1.25; color: #00449e; box-sizing: border-box; font-size: 1.7vw; }',
            '.modal-close { background: transparent; border: 0; font-size: 1.7vw; margin-left: 1vw; }',
            '.modal-header .modal-close::before { content: "✕"; font-weight: bold; }',
            '.modal-header .modal-close:hover, .modal-btn:hover { opacity: 0.7; }',
            '.modal-footer { margin-top: 1vw; }',
            '.modal-btn { margin-right: 1vw; padding: 0.5vw 1vw; background-color: rgba(255,0,0,0.1); border: 1px solid #9e9e9e; font-size: 1.3vw; }',
            '.btn-primary { background-color: rgba(255,0,0,0.3); }',
            // Envelope icon styles and animation
            '.plus-sign { position: absolute; top: -3.5vw; left: calc(50% - 3vw); width: 6vw; font-size: 6vw; line-height: 0.7; color: rgb(50, 195, 166); display: none; }',
            '.plus-sign.animated { animation-duration: 2s; -webkit-animation-duration: 2s; }',
            // Converted currency styles
            '#converted { text-align: center; color: #e0e0e0 !important; font-size: 1.8vw !important; }',
            '.dollars { color: rgb(50, 195, 166); }'
        ].join('\n');
        GM_addStyle(cssCode);

        // Load saved messages in memory
        var database = GM_getValue('database');
        if (!database) {
            database = [];
            GM_setValue('database', database);
        }

        // HTML for the main block
        var blockHtml = '<div class="wrap-block">' +
            '<div class="alert-nav"><button id="prev-button" class="my-button">🡄</button><button id="next-button" class="my-button">🡆</button></div>' +
            '<div class="alert-counter"><span id="message-curr">0</span> / <span id="message-all">0</span><button id="erase-button" class="my-button" data-micromodal-trigger="modal-1">⌦</button><div class="plus-sign animated">✉</div></div>' +
            '<div id="alert-timer" class="alert-timer">00:00</div>' +
            '<div class="wrap-button"><img id="alert-button" class="my-logo" src="' + logoUrl + '"><button id="toggle-button" class="my-button">👁</button></div>' +
            '</div>';

        // HTML for the modal window (Remove messages)
        var modalHtml = '<div id="modal-1" class="modal" aria-hidden="true">' +
            '<div tabindex="-1" class="modal-overlay" data-micromodal-close>' +
            '<div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-1-title">' +
            '<header class="modal-header"><h2 id="modal-1-title" class="modal-title">Remove saved messages</h2>' +
            '<button class="modal-close" aria-label="Close" data-micromodal-close></button></header>' +
            '<footer class="modal-footer"><button id="remove-old" class="modal-btn">All except today</button>' +
            '<button id="remove-all" class="modal-btn btn-primary">All messages</button></footer>' +
            '</div></div></div>';

        // Append two HTML blocks to the page
        var $widget = $('#widget');
        $widget.after(blockHtml).before(modalHtml);
        $('#wrap').after('<div id="wrap-copy">');

        // jQuery variables to optimize DOM edits
        var $wrapCopy = $('#wrap-copy');
        var $timer = $('#alert-timer');
        var $counter = $('.alert-counter');
        var $msgAll = $('#message-all');
        var $plusSign = $('.plus-sign');

        /**
         * Update total messages number
         */
        var updateCount = function () {
            if (database.length > 0) {
                $msgAll.text(database.length);
            }
        };

        updateCount();

        /**
         * Update current message number
         */
        var updateCurr = function () {
            $('#message-curr').text(lastIndex);
        };

        var lastIndex = GM_getValue('last_index');
        if (lastIndex) {
            updateCurr();
        }

        /**
         * Catch new messages by listening to class changes
         */
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === 'class') {
                    var $target = $(mutation.target);
                    var attr = $target.prop(mutation.attributeName);
                    if (attr === 'widget-AlertBox') {
                        // Caught a new message, extract its HTML
                        var message = $target.find('#wrap').html();

                        // Save time when message arrived
                        var time = new Date().getTime();

                        // Push new message to the database
                        // "s" means shown/seen, 0 by default
                        database.push({
                            't': time,
                            'm': message,
                            's': 0
                        });

                        // Update total messages number
                        updateCount();

                        // Change background of Alert counter to green
                        $counter.addClass('new');

                        // Display envelope animation
                        $plusSign.show().addClass('fadeOutUp');
                        setTimeout(function () {
                            $plusSign.removeClass('fadeOutUp').hide();
                        }, 2000);

                        // Store messages to a local DB
                        GM_setValue('database', database);
                    }
                }
            });
        });

        // Initialize the observer for catching new messages
        observer.observe($widget[0], {
            attributes: true
        });

        // Get current USD rates for different currencies
        var currRates = {};
        $.getJSON(ratesUrl, function (data) {
            if (data) {
                currRates = data;
            }
        });

        // Convert 1-2 letter dollar strings (like MX$50) to ISO
        var dollarCodes = {'a': 'aud', 'ar': 'ars', 'au': 'aud', 'b': 'bnd', 'bd': 'bmd', 'bds': 'bbd', 'bs': 'bsd', 'bz': 'bzd', 'c': 'cad', 'ca': 'cad', 'cl': 'clp', 'col': 'cop', 'cu': 'cup', 'cuc': 'cuc', 'ec': 'xcd', 'fj': 'fjd', 'g': 'gyd', 'gy': 'gyd', 'hk': 'hkd', 'j': 'jmd', 'jm': 'jmd', 'l': 'lrd', 'ld': 'lrd', 'mop': 'mop', 'mx': 'mxn', 'n': 'nad', 'nt': 'twd', 'nz': 'nzd', 'r': 'brl', 'rd': 'dop', 's': 'sgd', 'sg': 'sgd', 'si': 'sbd', 'sr': 'srd', 't': 'top', 'tt': 'ttd', 'ws': 'wst'};

        // Convert currency symbols to ISO
        var currSymbols = [['€', 'eur'], ['£', 'gbp'], ['₹', 'inr'], ['₽', 'rub'], ['₩', 'krw'], ['¥', 'jpy'], ['₪', 'ils'], ['kč', 'czk'], ['฿', 'thb'], ['₺', 'try'], ['zł', 'pln'], ['₱', 'php'], ['৳', 'bdt'], ['₡', 'crc'], ['₮', 'mnt'], ['₫', 'vnd'], ['₸', 'kzt'], ['₭', 'lak'], ['₦', 'ngn'], ['֏', 'amd'], ['₲', 'pyg'], ['₴', 'uah'], ['₾', 'gel'], ['лв', 'bgn'], ['₼', 'azn'], ['៛', 'khr']];

        /**
         * Parse money string that came from Streamlabs alert
         * @param amount - Money string
         */
        var parseAmount = function (amount) {
            var sumCode, sumValue, parsed, abbr;

            // If rates not received, don't proceed
            if ($.isEmptyObject(currRates)) {
                return false;
            }

            // Remove formatting: 10,000 => 10000
            amount = amount.replace(',', '');

            // If received US dollars, no need to convert
            if (/^\$[\d.]+$/.test(amount)) {
                return false;
            }

            if (amount.indexOf('$') !== -1) {
                // Received a string with a dollar sign
                parsed = amount.split('$');
                // Extract code before $
                abbr = parsed[0].toLowerCase();
                if (dollarCodes.hasOwnProperty(abbr)) {
                    // Found a known dollar code, get ISO and value
                    sumCode = dollarCodes[abbr];
                    sumValue = parsed[1] * 1;
                } else {
                    // Found something else with $, exit
                    return false;
                }
            } else if (/^[A-Za-z]{3} [\d.]+$/.test(amount)) {
                // Received a string with ISO currency, like SEK 200
                parsed = amount.split(' ');
                sumCode = parsed[0].toLowerCase();
                sumValue = parsed[1] * 1;
            } else {
                // Check if the amount has currency symbols
                for (var i = 0; i < currSymbols.length; i++) {
                    var sign = currSymbols[i][0];
                    if (amount.indexOf(sign) !== -1) {
                        // Found a common currency symbol, get ISO and value
                        sumCode = currSymbols[i][1];
                        sumValue = amount.split(sign)[1] * 1;
                        break;
                    }
                }
            }

            if (sumCode && sumValue) {
                // If ISO code and value extracted
                if (currRates.hasOwnProperty(sumCode)) {
                    // Get current rate of the currency
                    var rate = currRates[sumCode].inverseRate;
                    // Get name of the currency
                    var name = currRates[sumCode].name.trim();
                    // Convert local money to dollars, round to 2 digits
                    var converted = _.round(sumValue * rate, 2);

                    return ['$' + converted, name];
                }
            }

            return false;
        };

        /**
         * Show saved message function
         * @param ind  - Message index
         * @param fast - Show immediately or fade in
         */
        var showMessage = function (ind, fast) {
            var speed = 400;
            if (fast) {
                speed = 0;
            }

            // Remove old time counters
            timeago.cancel();
            // Empty message block
            $wrapCopy.empty();

            // Append HTML and show message with index
            $wrapCopy.append(database[ind].m).hide(0).fadeIn(speed);
            // Append time ago line and start the counter
            $wrapCopy.find('#alert-message').append('<time class="time" datetime="' + database[ind].t + '">');
            timeago.render(document.querySelectorAll('.time'));

            // Extract money amount and check if conversion is needed
            var amount = $wrapCopy.find('[data-token="amount"]').text();
            var parsed = parseAmount(amount);
            if (parsed) {
                // Got conversion data, construct and add HTML
                var msgStyle = $wrapCopy.find('#alert-message').attr('style');
                var amountHtml = '<div id="converted">[ ' + parsed[1] + ', <span class="dollars">' + parsed[0] + '</span> ]</div>';
                $wrapCopy.find('#alert-message').after(amountHtml);
                // Copy font styles from default message above
                $('#converted').attr('style', msgStyle);
            }

            // Update and save last shown message number
            lastIndex = ind + 1;
            updateCurr();
            GM_setValue('last_index', lastIndex);

            // Reset the stopwatch timer
            $timer.timer('remove').text('00:00');

            // If that's the last message, remove green background
            if (lastIndex === database.length) {
                $counter.removeClass('new');
            }
        };

        /**
         * Main (logo) button action
         */
        $('#alert-button').click(function () {
            // Find the first message that hasn't been shown
            var next = _.findIndex(database, ['s', 0]);
            var $this = $(this);
            if (next !== -1) {
                // If message found, play the audio
                alertAudio.pause();
                alertAudio.currentTime = 0;
                alertAudio.play();

                // Rotate the logo button
                $this.addClass('spin');
                setTimeout(function () {
                    $this.removeClass('spin');
                }, 500);

                // Show the message
                showMessage(next);

                // Set "shown" attribute to 1
                database[next].s = 1;
                GM_setValue('database', database);

                // Restart the stopwatch timer
                $timer.timer('remove').timer({format: '%M:%S'});
            }
        });

        /**
         * Previous message button action
         */
        $('#prev-button').click(function () {
            if (lastIndex) {
                if ($wrapCopy.children().length === 0) {
                    showMessage(lastIndex - 1, true);
                } else if (lastIndex > 1) {
                    showMessage(lastIndex - 2, true);
                }
            }
        });

        /**
         * Next message button action
         */
        $('#next-button').click(function () {
            if (lastIndex) {
                if ($wrapCopy.children().length === 0) {
                    showMessage(lastIndex - 1, true);
                } else if (database[lastIndex] && database[lastIndex].s === 1) {
                    showMessage(lastIndex, true);
                }
            }
        });

        /**
         * Toggle message visibility button
         */
        $('#toggle-button').click(function () {
            $wrapCopy.find('#alert-text-wrap').toggle();
            $timer.timer('remove').text('00:00');
        });

        /**
         * Remove messages action and modal
         */

        // Initialize the modal
        MicroModal.init();

        // Helper function for both Today and All actions
        var updateValues = function (all) {
            updateCurr();
            GM_setValue('last_index', lastIndex);

            $wrapCopy.empty();
            $msgAll.text(all);
            $timer.timer('remove').text('00:00');
        };

        // Remove all messages action
        $('#remove-all').click(function () {
            database = [];
            GM_setValue('database', database);

            lastIndex = 0;
            updateValues(0);
            $counter.removeClass('new');

            MicroModal.close('modal-1');
        });

        // Remove only old (not today) messages
        $('#remove-old').click(function () {
            if (database.length > 0) {
                var today = new Date().setHours(0, 0, 0, 0);
                database = _.filter(database, function (o) {
                    return (o.t >= today) || (o.s === 0)
                });
                GM_setValue('database', database);

                if (database.length) {
                    lastIndex = 1;
                } else {
                    lastIndex = 0;
                }

                updateValues(database.length);
            }

            MicroModal.close('modal-1');
        });
    }
});
