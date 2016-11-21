/**
 * @fileOverview A protocol is a defined set of messages that can be
 * exchanged between a set of participants.
 *
 * The messages are encapsulated into an envelope format for transport
 * between the participants. The payload is specified by the sender
 * and delivered to the recipient; the other properties are for
 * internal use only.
 *
 * @author Daniel Brooks <daniel.brooks@ask.com>
 * @version 0.2
 * @requires lib/browser-shim.js
 */

/**
 * @class Instantiate a new message passing protocol object.
 *
 * @param {Array} declarations List of messages that this protocol must support.
 * @param {String} identity The identity of this particular component.
 * @param {String} prefix
 * @param {String} id
 */
const USE_CONTENT = false;

var Protocol = (function (window) {
    var rwebkit = /(webkit)[ \/]([\w.]+)/,
        ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
        rmsie = /(msie) ([\w.]+)/,
        rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/;
    /** @ignore */
    function uaMatch() {
        var nav = USE_CONTENT ? content.navigator : navigator;
        var ua = nav.userAgent.toLowerCase();
        var match = rwebkit.exec(ua) ||
                ropera.exec(ua) ||
                rmsie.exec(ua) ||
                ua.indexOf("compatible") < 0 && rmozilla.exec(ua) ||
                [];
        return { browser: match[1] || "", version: match[2] || "0" };
    }
    var browser = {};
    browser[uaMatch().browser] = true;

    /** @ignore */
    function Protocol(declarations, identity, prefix, id) {
        var self = this;

        for (var i = 0; i < declarations.length; i++) {
            (declarations[i][2] == "all" ? broadcast : message).apply(this, declarations[i]);
        }

        /**
         * tokens are unique strings that identify messages; used for sending replies
         * @ignore
         */
        function token() { return prefix + ":" + identity +"-"+ n++; }
        /** @ignore */
        function addToken(callback) {
            var t = token();
            tokenMap[t] = callback;
            return t;
        }
        var n = 0;
        var tokenMap = {};

        /**
         * Process a message declaration by creating two methods, one for
         * sending the declared message and one for receiving it. The
         * sending method is tasked with constructing the object to send
         * from its arguments and with holding on to the callback that is
         * called when a reply to this message is received.
         *
         * @param {String} msg The name of the message to declare
         * @param {String|Array} from The component or components that may send
         *         this message
         * @param {String} to The component that may listen for this message
         */
        function message(msg, from, to, type) {
            var s, r;
            type = validateType(type);
            if (isAllowed(identity, from)) {
                /** @ignore */
                s = function (payload, callback, pid, destTab) {
                    send({ msg: msg,
                           type: type,
                           from: identity,
                           to: to,
                           id: id || pid,
                           payload: payload,
                           token: addToken(callback)
                         },
                         destTab);
                };
            }
            if (isAllowed(identity, to)) {
                /** @ignore */
                r = function (func) {
                    receive(msg, func);
                };
            }
            addSender(msg, type + msg, s);
            addReceiver(msg, "receive" + msg, r);
        }

        /**
         * Process a broadcast message declaration by creating two
         * methods, one for sending the declared message and one for
         * receiving it. The sending method is tasked with constructing
         * the object to send from its arguments and with holding on to
         * the callback that is called when a reply to this message is
         * received.
         *
         * @param {String} msg The name of the message to declare
         * @param {String|Array} from The component or components that may send
         *         this message
         * @param {String} to The component that may listen for this message
         */
        function broadcast(msg, from, to) {
            message(msg, from, to, "broadcast");
        }

        /**
         * Send a message. This assumes that the envelope object is
         * fully constructed, so it can be sent as-is.
         *
         * @param {Object} envelope A complete message object ready to be delivered
         */
        function send(envelope, destination) {
            log(envelope, 'sending message');
            logDebug(envelope, "Message", 'send');
            _send(envelope, destination);
        }

        /**
         * Register a listener that calls a callback when a specific
         * message is received. The callback will receive a callback
         * argument that it can use to send a reply.
         *
         * @param {String}   msg  name of the message you want to listen for
         * @param {Function} func callback that is to be called when the specified
         *        message arrives for you
         */
        function receive(msg, func) {
            if (typeof func != "function")
                console.error(new Error("You must pass in a function to receive."));

            // register a listener for all messages
            _receive(function (envelope, sender) {
                // IE uses a crazy hack that replaces the widget protocol
                // stuff with core Protocol instances. As a result, we
                // will see some messages that we don't actually care
                // about, and must ignore. Once the hack is removed we
                // can remove this condition.
                var we_care = !browser.msie || (envelope.to == "all" || !id || envelope.id == id);
                if ((envelope.to == identity || envelope.to == "all") && envelope.msg == msg && we_care) {
                    log(envelope, 'received message');
                    logDebug(envelope, "Message", 'recv');
                    // but we only do anything with it when it's for the
                    // proper recipient
                    func(envelope.payload,
                         function (payload) {
                             // allow the recipient to send a response (encoded
                             // as a reply message with the token from the
                             // original message)
                             var replyEnvelope = { msg: "Reply",
                                                   from: identity,
                                                   to: envelope.from,
                                                   id: envelope.id,
                                                   payload: payload,
                                                   token: envelope.token
                                                 };
                             logDebug(envelope, "Message", 'sendreply', [replyEnvelope]);
                             send(replyEnvelope, sender, id);
                         },
                         sender,
                         envelope.id);
                }
            },
                     msg);
        };

        var logDebug = function() {};
        if (browser.mozilla) {
            try {
                Components.utils["import"]("chrome://" + ATB.CONSTANT.EXT_PKG_ID + "/content/devtools/logtrace/Tracer.jsm");
                logDebug = function(envelope, protocolType, logKey, details) {
                    Tracer.log(envelope, protocolType, identity, logKey, details);
                };
            } catch (e) { }
        }

        var _send, _receive;
        if (browser.webkit || browser.mozilla) {
            /** @inner */
            _send = function (envelope, dest) {
                if (identity == "background") {
                    if (envelope.type == "broadcast"){
                        chrome.windows
                            .getAll({ populate: true },
                                    function (windows) {
                                        windows.forEach(function (win) {
                                            win.tabs.forEach(function (tab) {
                                                chrome.tabs.sendMessage(tab.id, envelope);
                                            });
                                        });
                                    });
                    }
                    else {
                        if (dest && dest.tab && (dest.tab.id == -1))
                            chrome.runtime.sendMessage(envelope);
                        else
                            chrome.tabs.sendMessage(dest && (dest.tab ? dest.tab.id : dest), envelope);
                    }

                } else {
                    chrome.runtime.sendMessage(envelope);
                }
            };

            /** @inner */
            _receive = function (func) {
                chrome.runtime.onMessage.addListener(func);
            };
        }
        else if (browser.msie) {
            // IE follows the same API, except where it doesn't
            /** @inner */
            _send = function (envelope, dest) {
                if (identity == "background") {
                    if (envelope.type == "broadcast" || envelope.from.indexOf("widget") != -1) {
                        try {
                            chrome.windows.getAll({ populate: true },
                                                  function (windows) {
                                                      var tabs = eval(windows.toJSONString()); // ugh
                                                      for (var t = 0; t < tabs.length; t++){
                                                          chrome.tabs.sendMessage(parseInt(tabs[t]), envelope, null, envelope.msg);
                                                      }
                                                  });
                        } catch (e) {
                            console.warn(e);
                        }
                    } else {
                        if (typeof dest == "object" && dest.tab && dest.tab.id) {
                            chrome.tabs.sendMessage(dest.tab.id, envelope, null, envelope.msg);
                        } else {
                            chrome.runtime.sendMessage(envelope, null, envelope.msg);
                        }
                    }
                } else {
                    chrome.runtime.sendMessage(envelope, null, envelope.msg);
                }
            };

            /** @inner */
            _receive = function (func, msg) {
                chrome.runtime.onMessage.addListener(func, msg);
            };
        }
        else
            throw new Error("Cool, a new browser ("+ navigator.vendor +")");

        /**
         * Listen for replies to messages sent to this module, and
         * call their reply callback. Also, handle messages that were
         * delivered to us but need to be forwarded to the actual
         * recipient.
         */
        _receive(function (envelope, sender) {
            if (envelope.from != identity) {
                if (envelope.to != identity && ((browser.mozilla && identity == "injector") || identity == "background")) {
                    log(envelope, 'forwarding message', 'sender', sender);
                    logDebug(envelope, "Message", 'forward');
                    send(envelope, sender);
                } else if ((envelope.to == identity || envelope.to == "all") && envelope.msg == "Reply" && ((id && envelope.id == id) || !id)) {
                    log(envelope, 'received reply for');
                    logDebug(envelope, "Message", 'recvreply');
                    var callback = tokenMap[envelope.token];
                    delete tokenMap[envelope.token];
                    callback && typeof callback == "function" && callback(envelope.payload);
                }
            }
        },
                 "forward-message");

        /** @ignore */
        function isAllowed(identity, allowedComponents) {
            if (allowedComponents == "all")
                return true;
            if (!Array.isArray(allowedComponents))
                allowedComponents = [allowedComponents];
            return allowedComponents.indexOf(identity) != -1;
        }

        /** @ignore */
        function validateType(type) {
            if (!type)
                return "send";
            if (!(type == "broadcast" || type == "send"))
                throw new Error("Invalid message type: "+ type);
            return type;
        }

        /** @ignore */
        function addMethod(msg, name, func, error) {
            self[name] = func || function () {
                throw new Error(error);
            };
        }

        /** @ignore */
        function addSender(msg, name, func) {
            addMethod(msg, name, func,
                      "You cannot send this message ("+ msg +") from this part of the code ("+ identity +").");
        }

        /** @ignore */
        function addReceiver(msg, name, func) {
            addMethod(msg, name, func,
                      "You cannot receive this message ("+ msg +") from this part of the code ("+ identity +").");
        }

        /**
         * Print out a message to the console describing a message that
         * we are sending or have just received.
         * @ignore
         */
        function log(envelope, m1)
        {
            if (!MSG_LOGGING)
                return;

            console.groupCollapsed || (console.groupCollapsed = console.log);
            console.groupEnd || (console.groupEnd = function () { });

            var beginning = padafter(identity +' '+ m1, 33);
            var token = padbefore(envelope.token || "(no token)", 22);
            console.groupCollapsed(beginning +' '+ token +': ' + envelope.msg);
            console.dir(window.location.href);
            console.dir(envelope);
            console.groupEnd();
        }

        var padding = "                                                       ";
        /** @ignore */
        function padbefore(str, n) { return pad(str, n) + str; }
        /** @ignore */
        function padafter(str, n) { return str + pad(str, n); }
        /** @ignore */
        function pad(str, n)
        {
            var diff = n - (str ? str.length : 0);
            while (diff > padding.length)
                padding += padding;
            return padding.substr(0, diff);
        }

        return self;
    };

    var MSG_LOGGING = false;
    return Protocol;
})(USE_CONTENT ? content.window : window);

function ChatProtocol(identity) {
    var CHAT = "chat",
        BG = "background",
        ALL = "all";

    var decls = [
        /**
         * @method sendConnect
         * (CHAT -> BG) The chat sends this message in order
         * to initiate a chat connection. No reply.
         */
        ["Connect", CHAT, BG],
        /**
         * @method sendJoinRoom
         * (CHAT -> BG) Chat tabs can use this to request
         * that the background join a room.
         * @param nick {String} The nickname to use.
         * @param room {String} The room to join.
         */
        ["JoinRoom", CHAT, BG],
        /**
         * @method sendGetHistory
         * (CHAT -> BG) Chat tabs can use this to request
         * n lines of history for a given room.
         * @param room {String} The room to join.
         * @param n {Integer} The number of messages to return.
         */
        ["GetHistory", CHAT, BG],
        /**
         * @method broadcastConnectFail
         * (BG -> ALL) The background uses this to broadcast a 
         * notification when the connection has failed.
         */
        ["ConnectFail", BG, ALL],
        /**
         * @method broadcastDisconnected
         * (BG -> ALL) The background uses this to broadcast a 
         * disconnect notification to the chats.
         */
        ["Disconnected", BG, ALL],
        /**
         * @method broadcastLastReadUpdate
         * (BG -> ALL) The background uses this to broadcast a 
         * notification when the last read time for a room has changed.
         * @param room {String} The room that changed.
         * @param timestamp {String} The new timestamp for that room.
         */
        ["LastReadUpdate", BG, ALL],
        /**
         * @method broadcastMessageReceived
         * (BG -> ALL) The background uses this to broadcast XMPP 
         * chat messages to the tabs.
         */
        ["MessageReceived", BG, ALL],
        /**
         * @method broadcastPresenceReceived
         * (BG -> ALL) The background uses this to broadcast XMPP 
         * presence notifications to the tabs.
         */
        ["PresenceReceived", BG, ALL],
        /**
         * @method sendMessage
         * (CHAT -> BG) Chat tabs can use this to send an 
         * XMPP chat message.
         * @param to {String} The recipient of the message.
         * @param message {String} The message to send.
         */
        ["Message", CHAT, BG],
        /**
         * @method sendRoomMessage
         * (CHAT -> BG) Chat tabs can use this to send an 
         * XMPP chat message to a room (conference).
         * @param to {String} The recipient of the message (a room name).
         * @param message {String} The message to send.
         */
        ["RoomMessage", CHAT, BG],
        /**
         * @method sendRosterRequest
         * (CHAT -> BG) Chat tabs can use this to request
         * the current roster of a room or rooms from the background.
         * @param rooms {Object} The rooms in question (room names).
         */
        ["RosterRequest", CHAT, BG],
        /**
         * @method sendUpdateLastRead
         * (CHAT -> BG) Chat tabs can use this to notify the 
         * background (which in turn notifies all the chats) of a 
         * changed lastRead timestamp.
         * @param room {String} The room that changed (a room name).
         * @param timestamp {String} The new timestamp for that room.
         */
        ["UpdateLastRead", CHAT, BG]
    ];
    return new Protocol(decls, identity);
};
