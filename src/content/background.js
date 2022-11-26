const PREFS = {
    useAliasSorter: true,
    useArranger: true,
    useBlacklist: true,
    blacklist: [],
    blacklistMethod: "pct-greyscale",
    blacklistNormal: true,
    blacklistRecruit: true,
    blacklistOOC: true,
    blacklistIC: false,
    blacklistStore: true,
    blacklistBlog: true,
    useCampaignSorter: true,
    useChat: false,
    useCustomAvatars: true,
    useExtendedFormatting: true,
    chatPosition: '["25px","20px"]',
    useHighlighter: true,
    useInactives: true,
    highlightColor: "#ffaa00",
    showOptionsLink: true,
    useMobile: false,
    useNeedToPost: false,
    nTPOn: "#ffaa00",
    nTPOff: "#4d3a98",
    useSelector: true,
    useOldPostIndicator: true,
    oldPostIndicatorAge: 1,
    oldPostIndicatorUnit: 'year',
    useHeaderHider: true,
    hideHeader: false,
    useHeaderPM: "always",
    useFun: true,
    hideInactiveAliases: false
};

function setDefaultPrefs() {
    for (var key in PREFS) {
        var val = PREFS[key];
        switch (typeof val) {
        case "object":
            if (localStorage[key] === undefined) {
                localStorage[key] = JSON.stringify(val);
            }
            break;
        default:
            if (localStorage[key] === undefined) {
                localStorage[key] = val;
            }
        }
    }
}

setDefaultPrefs();

var connection = null;
var lastRead = (localStorage.lastRead && JSON.parse(localStorage.lastRead)) || {};
var Messaging = new ChatProtocol("background");
var roster = {};
const WEBSOCKET_SERVICE = 'ws://countbuggula.net:5280/xmpp';

function logMessage(store, msg) {
    if (msg.delayed === false) {
        addRecord(store, msg);
        Messaging.broadcastMessageReceived(msg);
    }
}

function onMessage(msg) {
    var to = msg.getAttribute("to"),
        from = msg.getAttribute("from"),
        type = msg.getAttribute("type"),
        elems = msg.getElementsByTagName("body"),
        delay = msg.getElementsByTagName("delay")[0],
        delayStamp = delay && delay.getAttribute("stamp"),
        date = delayStamp || timestamp(delayStamp, true),
        room;
    var messageObject;

    //    console.log("Received message from " + from);
    //    console.log(msg);
    if (type == "chat" && elems.length > 0) {
        var body = elems[0] && Strophe.getText(elems[0]);
        from = Strophe.getNodeFromJid(from);
        messageObject = makeMessage(date, to, from, body, null, delayStamp);

    } else if (type == "groupchat" && elems.length > 0) {
        var body = elems[0] && Strophe.getText(elems[0]);
        room = Strophe.getNodeFromJid(from);
        from = Strophe.getResourceFromJid(from);
        messageObject = makeMessage(date, to, from, body, room, delayStamp);
    }
    logMessage(room || from, messageObject);
    // we must return true to keep the handler alive.
    // returning false would remove it after it finishes.
    return true;
}

function onPresence(presence) {
    var x = presence.getElementsByTagName("x"),
        xmlns = x && x.length > 0 && x[0].getAttribute("xmlns");
    if (xmlns && xmlns == 'http://jabber.org/protocol/muc#user') {
        var from = presence.getAttribute("from"),
            nick = from && Strophe.getResourceFromJid(from),
            room = from && Strophe.getNodeFromJid(from),
            status = x[0].getElementsByTagName("status"),
            statusCode = status && status.length > 0 && status[0].getAttribute("code"),
            type = presence.getAttribute("type");
        var params = { nick: nick, room: room, type: type, status: statusCode }

        //        console.log(nick + " has appeared in " + room + "!");
        updateRoster(params);
        Messaging.broadcastPresenceReceived(params);
    }

    return true;
}

function onConnect(status, sendResponse) {
    if (status == Strophe.Status.CONNECTING) {
        console.log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
        console.log('Strophe failed to connect.');
        Messaging.broadcastConnectFail();
    } else if (status == Strophe.Status.DISCONNECTING) {
        console.log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
        console.log('Strophe is disconnected.');
        Messaging.broadcastDisconnected();
        connection = null;
    } else if (status == Strophe.Status.CONNECTED) {
        console.log('Strophe is connected.');

        connection.addHandler(onMessage, null, 'message', null, null,  null);
        connection.addHandler(onPresence, null, 'presence', null, null,  null);
        connection.send($pres().tree());
        sendResponse();
    }
}

function openOptions() {
    browser.tabs.create({
        url: 'content/options.html',
    });
}

Messaging.receiveConnect(function (params, sendResponse) {
    var user = params.user,
        rooms = params.rooms;
    //    console.log("Received Connect request...");
    DBConnect(rooms, function () {
        //        console.log("Connection: ", connection);
        if (!connection || !connection.connected) {
            connection = new Strophe.Connection(WEBSOCKET_SERVICE);
            //            connection.rawInput = function (data) { console.log('RECV: ' + data); };
            connection.connect(user + '@pbp.countbuggula.net',
                               "",
                               function(status) { onConnect(status, sendResponse); });
        } else {
            sendResponse();
        }
    });
});

Messaging.receiveGetHistory(function (params, sendResponse) {
    var room = params.room,
        n = params.n;

    retrieveRecords(room, n, sendResponse);
});

Messaging.receiveJoinRoom(function (params, sendResponse) {
    var nick = params.nick,
        room = params.room;
    var request = $pres({to: room + '@conference.pbp.countbuggula.net/' + nick}).c("x", { xmlns: 'http://jabber.org/protocol/muc'});
    //    console.log("Joining room " + room + " as " + nick);
    connection.send(request.tree());
    sendResponse();
});

Messaging.receiveRoomMessage(function (params, sendResponse) {
    var to = params.to,
        text = params.text;
    var message = $msg({to: to + '@conference.pbp.countbuggula.net', type: 'groupchat'}).c("body", text);
    connection.send(message.tree());
});

Messaging.receiveRosterRequest(function (params, sendResponse) {
    var rooms = params.rooms;

    var roomRosters = rooms.map(function(roomName) {
        return { room: roomName, roster: roster[roomName] };
    });

    sendResponse(roomRosters);
});

Messaging.receiveUpdateLastRead(function(params, sendResponse) {
    var room = params.room,
        timestamp = params.timestamp;
    //    console.log("Updating " + room + " last read with " + timestamp + " (currently " + lastRead[room] + ")");
    if (tsgt(timestamp, lastRead[room])) {
        lastRead[room] = timestamp;
        var lastReadJSON = JSON.stringify(lastRead);
        localStorage.lastRead = lastReadJSON;
        Messaging.broadcastLastReadUpdate(params, sendResponse);
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.storage) {
        if (typeof request.value != 'undefined') {
            // Set single value
            localStorage[request.storage] = request.value;
            sendResponse({storage: localStorage[request.storage]});
        } else if (request.storage && typeof request.storage == 'object') {
            // Get multiple values
            var results = {};

            for (var i = 0; i < request.storage.length; i++) {
                results[request.storage[i]] = localStorage[request.storage[i]];
            }

            sendResponse({storage: results});
        } else {
            // Get single value
            sendResponse({storage: localStorage[request.storage]});
        }
    } else if (request.options) {
        openOptions();
    } else {
        sendResponse({});
    }
});

function makeMessage(timestamp, to, from, body, room, delay) {
    var msg = {};
    msg.to = to;
    msg.from = from;
    msg.time = timestamp;
    msg.body = body;
    msg.room = room;
    msg.id = timestamp + from;
    msg.delayed = delay || false;

    return msg;
}

function timestamp(date, iso) {
    date = date || new Date();
    if (iso) {
        return date.toISOString();
    } else {
        var str = "";
        var hours = date.getHours();
        var minutes = date.getMinutes();

        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        str = hours + ":" + minutes + " ";
        return str;
    }
}

function tsgt(ts1, ts2) {
    if (!ts1 ||
        ts1 == "") {
        return null;
    } else if (!ts2 ||
               ts2 == "") {
        return true;
    } else {
        var date1 = new Date(ts1),
            date2 = new Date(ts2);
        return date1 instanceof Date &&
            date2 instanceof Date &&
            date1 > date2;
    }
}

function updateRoster(params) {
    var nick = params.nick,
        room = params.room,
        status = params.status,
        type = params.type;
    var nickIndex = roster[room] && roster[room].indexOf(nick);

    if (!roster[room] || nickIndex == -1) {
        roster[room] = roster[room] || [];
        roster[room].push(nick);
    } else if (type == "unavailable") {
        roster[room].splice(nickIndex, 1);
    }
}
