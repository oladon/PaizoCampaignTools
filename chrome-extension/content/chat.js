window['pctChat'] = (function(window) {
    const HISTORY_COUNT = 50;
    const STATUS_HIDDEN = 0;
    const STATUS_MINIMIZED = 1;
    const STATUS_VISIBLE = 2;
    
    var autolinker = new Autolinker({ truncate: 25, newWindow: true });
    var document = window.document;
    var lastRead;
    var Messaging;
    //    var username = getUsername();
    var widgetPosition;
    
    function getActiveRoom() {
        var rooms = getRooms();
        for (var room of [].slice.call(rooms)) {
            if (!room.classList.contains("disabled")) {
                return room;
            }
        }
        return null;
    }
    
    function getActiveRoster() {
        var rosters = getRosters();
        var activeRoster = [].slice.call(rosters).find(function(roster) {
            if (!roster.classList.contains("disabled")) {
                return roster;
            }
        });
        
        return activeRoster;
    }
    
    function getCampaignNode(campaign, in_thread) {
        var node;
        if (!in_thread) {
            var URL = campaign.url.substring(16);
            var link = document.querySelector('blockquote > h3 > a[href="' + URL + '"]');
            if (link) {
                node = link.parentNode.parentNode;
                return node;
            }
        } else {
            var title = document.querySelector('div.tiny + div h1');
            node = title.parentNode;
            return node;
        }
    }
    
    function getChatWidget() {
        var widget = document.getElementById('pct-chat-widget');
        return widget;
    }
    
    function getLastRead(room) {
        var roomLastRead = lastRead && lastRead[room];
        return roomLastRead;
    }
    
    function getRoomAlias(campaign) {
        var roomAlias = campaign.getAttribute('data-alias');
        return roomAlias;
    }
    
    function getRoomName(campaign) {
        var roomName = campaign.url.substring(27).toLowerCase();
        return roomName;
    }
    
    function getRoomNode(room) {
        var roomNode = document.getElementById(room);
        return roomNode;
    }
    
    function getRooms() {
        var rooms = document.querySelectorAll(".pct-chatMessages");
        return [].slice.call(rooms);
    }
    
    function getRoster(room) {
        var roster = document.querySelector('#pct-roster-container #pct-roster-' + room);
        return roster;
    }
    
    function getRosters() {
        var rosterContainer = getRosterContainer(),
            rosters = rosterContainer && rosterContainer.getElementsByClassName('pct-roster');
        
        return rosters;
    }
    
    function getRosterContainer() {
        var rosterContainer = document.getElementById('pct-roster-container');
        return rosterContainer;
    }
    
    function getUnreadMessages(room) {
        var roomNode = getRoomNode(room);
        var messages = roomNode && roomNode.getElementsByClassName('pct-chatMessage unread');
        
        return messages;
    }
    
    function getUsername(url) {
        var nameDiv = document.querySelector('#functional-nav > li > a');
        if (nameDiv) {
            if (url) {
                var href = nameDiv.href;
                
                return href.substring(24);
            } else {
                var title = nameDiv.title;
                var aka = title.indexOf(" aka");
                if (aka >= 0) {
                    title = title.substring(0,aka);
                }
                return title;
            }
        }
        return false;
    }
    
    function getWidgetStatus() {
        var widget = getChatWidget();
        var hidden = widget.style.display == "none" ||
                widget.style.display == "";
        var minimized = widget.classList.contains("minimized");
        return (hidden ? STATUS_HIDDEN : (minimized ? STATUS_MINIMIZED : STATUS_VISIBLE));
    }
    
    function updateChatWidget(event) {
        var target = event.currentTarget;
        var activeRoom;
        var activeRoster = getActiveRoster();
        if (activeRoster) {
            toggleRoster();
            //            hideRosters();
            activeRoom = activeRoster.getAttribute('data-room');
        } else {
            activeRoom = getActiveRoom().id;
        }
        
        var room = target.getAttribute("data-room");
        var title = target.previousElementSibling && 
                target.previousElementSibling.title;
        var widget = getChatWidget();
        var widgetStatus = getWidgetStatus();
        
        if (widgetStatus == STATUS_MINIMIZED) {
            minimizeChat();
        }
        
        hideRooms();
        updateTitle(title);
        showChat();
        showRoom(room);
        
        if (widgetStatus == STATUS_VISIBLE && 
            room == activeRoom && 
            !activeRoster) {
            minimizeChat();
        }
    }
    
    function updateIcon(room) {
        var activeRoster = getActiveRoster();
        var activeRoom = (activeRoster ? activeRoster.getAttribute('data-room') : getActiveRoom().id);
        var widgetStatus = getWidgetStatus();
        var icon = document.getElementById('pct-chat-' + room);
        var unreadMessages = getUnreadMessages(room);
        
        if (unreadMessages && 
            unreadMessages.length > 0) {
            icon && icon.classList.add("pct-newMessageIcon");
        } else {
            icon && icon.classList.remove("pct-newMessageIcon");
        }
    }
    
    function updateLastRead(room, timestamp) {
        var roomNode = getRoomNode(room);
        var widgetStatus = getWidgetStatus();
        //        console.log(lastRead);
        
        // if room is visible, update last read for room
        if (widgetStatus == STATUS_VISIBLE && 
            roomNode && 
            !roomNode.classList.contains("disabled") &&
            tsgt(timestamp, lastRead[room])) {
            //            console.log("Updating last read for " + room + " with " + timestamp);
            
            Messaging.sendUpdateLastRead({room: room, timestamp: timestamp}, function() {
                lastRead[room] = timestamp;
            });
            // if room is hidden/invisible, update icon
        } else {
            updateIcon(room);
        }
        
    }
    
    function updateRoster(params) {
        var nick = params.nick,
            room = params.room,
            status = params.status,
            type = params.type;
        var roster = getRoster(room),
            oldDivs = roster && roster.getElementsByClassName('user'); // should only ever have one element
        var userPresent = oldDivs && 
                oldDivs.length > 0 && 
                [].slice.call(oldDivs).find(function(it) {
                    return it.textContent == nick; 
                });
        
        if (selfPresent(room)) {
            if (!type && !userPresent) {
                formatInfo(nick + " has joined.", room);
            } else if (type == "unavailable") {
                formatInfo(nick + " has left.", room);
            }
        }
        if (!userPresent) {
            var userDiv = document.createElement("div");
            userDiv.classList.add("user");
            status && userDiv.classList.add("self");
            var newLink = document.createElement("a");

            newLink.href = 'http://paizo.com/search?q=' + escape(nick) + '&what=users&includeUnrated=true&includeUnavailable=true';
            newLink.title = nick;
            newLink.appendChild(document.createTextNode(nick));
            
            userDiv.appendChild(newLink);
            roster && roster.appendChild(userDiv);
        } else if (type == "unavailable") {
            roster.removeChild(userPresent);
        }
    }
    
    function updateTitle(title) {
        var titleDiv = document.getElementById('pct-chat-title');
        if (title && titleDiv) {
            titleDiv.innerHTML = title;
            titleDiv.title = title;
        }
    }
    
    function updateUnreadMessages(room, msgList) {
        var newLastRead;
        var unreadMessages = msgList || getUnreadMessages(room);
        
        [].slice.call(unreadMessages).forEach(function(node) {
            var nodeTime = node.getElementsByTagName("time"),
                nodeTimestamp = nodeTime && 
                    nodeTime.length > 0 && 
                    nodeTime[0].getAttribute("time");
            newLastRead = tsgt(nodeTimestamp, newLastRead) && nodeTimestamp;
            node.classList.remove("unread");
        });
        
        newLastRead && updateLastRead(room, newLastRead);
    }
    
    function populateRoster(room, roster) {        
        roster && roster.forEach(function(nick) {
            updateRoster({ nick: nick, room: room});
        });
    }
    
    function hideRooms() {
        var rooms = document.querySelectorAll(".pct-chatMessages");
        for (var room of [].slice.call(rooms)) {
            room.classList.add("disabled");
        }
    }
    
    function showRoom(room) {
        var roomDiv = document.querySelector("#" + room + ".pct-chatMessages");
        
        roomDiv.classList.remove("disabled");
        roomDiv.scrollTop = roomDiv.scrollHeight;
        
        updateUnreadMessages(room);
        updateIcon(room);
        focusInput();
    }
    
    function hideChat() {
        var widget = getChatWidget();
        var widgetStatus = getWidgetStatus();
        (widgetStatus == STATUS_MINIMIZED) && minimizeChat();
        widget.style.display = "none";
    }
    
    function showChat() {
        var widget = getChatWidget();
        widget.style.display = "block";
        if (widgetPosition) {
            //            console.log(widgetPosition);
            //            console.log("Setting position to " + widgetPosition[0], widgetPosition[1]);
            widget.style.right = widgetPosition[0];
            widget.style.bottom = widgetPosition[1];
        }
        focusInput();
    }
    
    function hideRosters() {
        var rosterContainer = getRosterContainer();
        rosterContainer.classList.add("disabled");
        var children = rosterContainer.getElementsByClassName('pct-roster');
        [].slice.call(children).forEach(function(it) {
            it.classList.add("disabled");
        });
    }
    
    function showRoster(room) {
        var rosterContainer = getRosterContainer(),
            roomRoster = getRoster(room);
        
        roomRoster.classList.remove("disabled");
        rosterContainer.classList.remove("disabled");
    }
    
    function minimizeChat() {
        var activeRoster = getActiveRoster();
        activeRoster && toggleRoster();
        var roomNode = getActiveRoom();
        var activeRoom = (activeRoster ? activeRoster.getAttribute('data-room') : roomNode.id);
        var minimizeButton = document.querySelector('#pct-chat-titlebar .pct-minimize') ||
                document.querySelector('#pct-chat-titlebar .pct-restore');
        var widget = getChatWidget();
        
        widget.classList.toggle("minimized");
        minimizeButton.classList.toggle("pct-minimize");
        minimizeButton.classList.toggle("pct-restore");
        
        if (minimizeButton.title == "Minimize") {
            minimizeButton.title = "Restore";
        } else {
            minimizeButton.title = "Minimize";
            updateUnreadMessages(activeRoom);
            updateIcon(activeRoom);
            roomNode.scrollTop = roomNode.scrollHeight;
            focusInput();
        }
    }
    
    function togglePositionLock(e) {
        var widget = getChatWidget();
        var widgetStyle = getComputedStyle(widget);
        var docDragOverHandler;
        var globX,
            globY;
        e.target.classList.toggle("pct-lockIcon");
        e.target.classList.toggle("pct-unlockIcon");
        if (e.target.title == "Lock Position") {
            var newRight = widgetStyle.right,
                newBottom = widgetStyle.bottom;
            widgetPosition = [newRight, newBottom];
            var newPosition = JSON.stringify(widgetPosition);
            chrome.runtime.sendMessage({storage: "chatPosition", value: newPosition}, function(response) {
                e.target.title = "Unlock Position";
                widget.draggable = false;
            });
        } else {
            e.target.title = "Lock Position";
            widget.draggable = true;
            widget.ondragstart = function(e) {
                docDragOverHandler = function(e) {
                    if (e.target.classList.contains("pct-dragging")) {
                        e.preventDefault();
                    }
                };
                document.addEventListener("dragover", docDragOverHandler);
                widget.classList.add("pct-dragging");
                e.dataTransfer.setData('application/x-moz-node', widget);
                e.dataTransfer.effectAllowed = "move";
                globX = e.screenX;
                globY = e.screenY;
            };
            
            widget.ondragend = function(e) {
                document.removeEventListener('dragover', docDragOverHandler);
                widget.classList.remove("pct-dragging");
                var dX = -1*(e.screenX - globX), 
                    dY = -1*(e.screenY - globY);
                widget.style.right = addPx(widgetStyle.right, dX);
                widget.style.bottom = addPx(widgetStyle.bottom, dY);
            };
        }
    }
    
    function toggleRoster() {
        var rosterButton = document.querySelector('#pct-chat-titlebar .pct-rosterIcon');
        var widgetStatus = getWidgetStatus();
        
        rosterButton.classList.toggle("pct-roster");
        rosterButton.classList.toggle("pct-back");
        
        if (rosterButton.title == "Who's Online") {
            var activeRoom = getActiveRoom().id;
            // swap the button
            rosterButton.title = "Back to Chat";
            if (widgetStatus == STATUS_MINIMIZED) {
                minimizeChat();
            }
            // hide the chat messages
            hideRooms();
            // show the (correct) roster
            showRoster(activeRoom);
        } else {
            var roomRoster = getActiveRoster();
            var activeRoom = roomRoster && roomRoster.getAttribute('data-room');
            // swap the button
            rosterButton.title = "Who's Online";
            // hide the roster(s)
            hideRosters();
            // show the (correct) chat messages
            showRoom(activeRoom);
        }
    }
    
    function addChatIcons(campaigns, defaultAliases, in_thread) {
        campaigns.map( function(campaign, index, array) {
            var roomName = getRoomName(campaign);
            var campaignNode = getCampaignNode(campaign, in_thread);
            var headerNode = campaignNode.querySelector(in_thread ? 'h1' : 'h3');
            var oldLink = headerNode.querySelector('a.pct-chatIcon');
            var newLink;
            
            if (!oldLink) {
                newLink = document.createElement("a");
                newLink.id = "pct-chat-" + roomName;
                if (in_thread) {
                    headerNode.insertBefore(newLink, headerNode.firstChild.nextElementSibling);
                } else {
                    headerNode.appendChild(newLink);
                }
                newLink.className = "pct-icon pct-chatIcon";
                newLink.setAttribute("title", "Chat about this campaign");
                newLink.setAttribute("action", "show");
                newLink.setAttribute("data-room", roomName);
                newLink.setAttribute("data-alias", pickAlias(defaultAliases, campaign));
                newLink.setAttribute("href", 'javascript:;');
                newLink.addEventListener("click", updateChatWidget);
            }
        });
    }
    
    function addChatWidget() {
        var widget = getChatWidget();
        if (!widget) {
            var newDiv = document.createElement('div');
            newDiv.id = 'pct-chat-widget';
            
            var newInnerDiv = document.createElement('div');
            newInnerDiv.classList.add("innards");
            
            var newRosterDiv = document.createElement('div');
            newRosterDiv.classList.add("disabled");
            newRosterDiv.id = "pct-roster-container";
            
            var newTitleBar = document.createElement('div');
            newTitleBar.id = "pct-chat-titlebar";
            
            var newPositionLockButton = document.createElement('span');
            newPositionLockButton.classList.add("pct-lockIcon", "pct-button", "pct-greyscale");
            newPositionLockButton.title = "Unlock Position";
            newPositionLockButton.addEventListener("click", togglePositionLock);
            
            var newTitle = document.createElement('div');
            newTitle.id = "pct-chat-title";
            newTitle.addEventListener("click", minimizeChat);
            
            var newRosterButton = document.createElement('span');
            newRosterButton.classList.add("pct-rosterIcon", "pct-button", "pct-icon", "pct-greyscale");
            newRosterButton.title = "Who's Online";
            newRosterButton.addEventListener("click", toggleRoster);
            
            var newMinimizeButton = document.createElement('span');
            newMinimizeButton.classList.add("pct-minimize", "pct-button", "pct-icon", "pct-greyscale");
            newMinimizeButton.title = "Minimize";
            newMinimizeButton.addEventListener("click", minimizeChat);
            
            var newCloseButton = document.createElement('span');
            newCloseButton.classList.add("pct-close", "pct-button", "pct-icon", "pct-greyscale");
            newCloseButton.title = "Hide the Chat";
            newCloseButton.addEventListener("click", hideChat);
            
            newTitleBar.appendChild(newPositionLockButton);
            newTitleBar.appendChild(newTitle);
            newTitleBar.appendChild(newCloseButton);
            newTitleBar.appendChild(newMinimizeButton);
            newTitleBar.appendChild(newRosterButton);
            
            widget = document.body.appendChild(newDiv);
            
            widget.appendChild(newTitleBar);
            widget.appendChild(newRosterDiv);
            
            var innards = widget.appendChild(newInnerDiv);
            
            var newInput = document.createElement('textarea');
            newInput.id = 'pct-chat-input';
            
            innards.appendChild(newInput);
            trapScroll(newInput);
            newInput.addEventListener('keydown', function(event) { 
                if (event.keyCode == 13) { 
                    handleInput(event); 
                }
            });
        }
        return widget;
    }
    
    function addRoomLogs(widget, rooms, alias) {
        var input = document.getElementById('pct-chat-input');
        rooms.map(function(room) {
            var oldDiv = widget.querySelector('#' + room);
            var oldRoster = getRoster(room);
            if (!oldDiv) {
                var roomDiv = document.createElement('div');
                
                roomDiv.id = room;
                roomDiv.classList.add('pct-chatMessages');
                alias && roomDiv.setAttribute('data-alias', alias);
                widget.querySelector('.innards').insertBefore(roomDiv, input);
                trapScroll(roomDiv);
            }
            
            if (!oldRoster) {
                var rosterDiv = document.createElement('div');
                
                rosterDiv.id = 'pct-roster-' + room;
                rosterDiv.classList.add('pct-roster', 'disabled');
                rosterDiv.setAttribute('data-room', room);
                document.getElementById('pct-roster-container').appendChild(rosterDiv);
            }
        });
    }

    function initializeChat(user, campaigns, in_thread) {
        chrome.runtime.sendMessage({ storage: ['chatPosition', 'lastRead', 'defaultAliases']}, function(response) {
            var nick;
            lastRead = (response.storage.lastRead && JSON.parse(response.storage.lastRead)) || {};
            Messaging = new ChatProtocol("chat");
            var defaultAliases = response.storage.defaultAliases && JSON.parse(response.storage.defaultAliases) || {};
            var position = response.storage.chatPosition && JSON.parse(response.storage.chatPosition);
            var rooms = campaigns.map(getRoomName);
            var widget = addChatWidget();
            
            Messaging.receiveConnectFail(function () {
                var msg = "Connection could not be established. Refresh the page to try again; if the problem persists, contact Oladon.";
                formatInfo(msg);
                // disable the chat window input box
                disableInput();
            });
            
            Messaging.receiveDisconnected(function () {
                var msg = "Connection lost. Refresh to reconnect.";
                formatInfo(msg);
            });
            
            Messaging.receiveMessageReceived(function (params) {
                formatMessage(params);
            });
            
            Messaging.receivePresenceReceived(function (params) {        
                // if we haven't gotten the self-presence yet, populate the roster
                // if status isn't null, we just got self-presence (but still populate the roster)
                updateRoster(params);
            });
            
            Messaging.receiveLastReadUpdate(function (params) {
                var room = params.room,
                    timestamp = params.timestamp;
                
                if (tsgt(timestamp, lastRead[room])) {
                    lastRead[room] = timestamp;
                }
            });
            
            widgetPosition = position;

            addChatIcons(campaigns, defaultAliases, in_thread);
            if (in_thread) {
                var campaign = campaigns[0];
                nick = pickAlias(defaultAliases, campaign);
                updateTitle(campaign.title);
                showChat();
            }
            addRoomLogs(widget, rooms, nick);
            hideRosters();
            if (in_thread) {
                showRoom(getRoomName(campaign));
                minimizeChat();
            }
            
            if (user && user.indexOf(" ") >= 0) {
                user = getUsername(true);
            }
            Messaging.sendConnect({ user: user, rooms: rooms }, function () {
                Messaging.sendRosterRequest({ rooms: rooms }, function(rosters) {
                    rosters.forEach(function(params) {
                        var room = params.room,
                            roster = params.roster;
                        populateRoster(room, roster);
                    });
                });
                campaigns.map(function(campaign) {
                    var alias = pickAlias(defaultAliases, campaign);
                    var roomName = getRoomName(campaign);
                    
                    joinRoom(alias, roomName);
                });
            });
            console.log("Chat initiated.");
        });
    }
    
    function formatInfo(message, room) {
        if (!room) {
            var rooms = getRooms();
            rooms.forEach(function(roomNode) { formatInfo(message, roomNode.id); });
        } else {
            var msgBody = document.createElement("span");
            msgBody.classList.add("body");
            msgBody.innerHTML = message;
            var msgDiv = document.createElement("div");
            msgDiv.classList.add("pct-chatMessage", "pct-info");
            var msgList = document.querySelector("#" + room + ".pct-chatMessages");
            
            msgDiv.appendChild(msgBody);
            
            if (msgList) { // If msgList is null, the room doesn't exist in the current tab
                msgList.appendChild(msgDiv);
                msgList.scrollTop = msgList.scrollHeight;
            }
        }
    }

    function formatMessage(message, history) {
        var body = message.body && autolinker.link(message.body),
            from = message.from,
            room = message.room,
            time = message.time && new Date(Date.parse(message.time));
        var roomNode = getRoomNode(room);
        var roomLastRead = lastRead && lastRead[room];
        var smote = body.indexOf("/me") == 0;
        var widgetStatus = getWidgetStatus();
        
        if (smote) {
            body = body.substring(3);
            if (body.substring(3).trim() == "") { return; }
        }
        
        updateLastRead(room, message.time);
        
        //        console.log("Formatting message from " + from + " (room is " + room + ")");
        var msgBody = document.createElement("span");
        msgBody.classList.add("body");
        msgBody.innerHTML = body;

        var stamp = document.createElement("time");
        stamp.classList.add("datetime");
        stamp.setAttribute("time", message.time);
        stamp.title = time;
        stamp.appendChild(document.createTextNode(timestamp(time)));

        var userSpan = document.createElement("span");
        userSpan.classList.add("user");
        userSpan.appendChild(document.createTextNode(from));

        var campaign = document.querySelector('#pct-chat-' + room);
        var roomAlias = (campaign && getRoomAlias(campaign)) || 
                (roomNode && getRoomAlias(roomNode));
        
        if (roomAlias == from) {
            userSpan.classList.add("self");
        } else if ((from.indexOf("DM") >= 0) || 
                   (from.indexOf("GM") >= 0)) {
            userSpan.classList.add("DM");
        }

        var msgDiv = document.createElement("div");

        msgDiv.className = "pct-chatMessage";
        history && msgDiv.classList.add("history");
        smote && msgDiv.classList.add("smote");
        
        if ((widgetStatus != STATUS_VISIBLE || 
             (roomNode && 
              roomNode.classList.contains("disabled"))) && 
            tsgt(time, roomLastRead)) {
            msgDiv.classList.add("unread");
            // update icon?
        }
        msgDiv.appendChild(stamp);
        msgDiv.appendChild(userSpan);
        if (!smote) {
            msgDiv.appendChild(document.createTextNode(": "));
        }
        msgDiv.appendChild(msgBody);
        
        if (roomNode) { // If roomNode is null, the room doesn't exist in the current tab
            roomNode.appendChild(msgDiv);
            roomNode.scrollTop = roomNode.scrollHeight;
            updateIcon(room);
        }
    }
    
    function joinRoom(nick, room) {
        var params = { nick: nick, room: room };
        Messaging.sendJoinRoom(params, 
                               function () { 
                                   setTimeout(function () {
                                       Messaging.sendGetHistory({ room: room, n: HISTORY_COUNT }, function(items) {
                                           if (items && items.length > 0) {
                                               items.forEach(function (item) {
                                                   formatMessage(item, true);
                                               });
                                           } else {
                                               formatInfo("No message history to display.", room);
                                           }
                                       }); }, 1500); });
    }
    
    function sendMessage(to, text) {
        var params = { to: to, text: text };
        Messaging.sendMessage(params);
    }
    
    function sendRoomMessage(to, text) {
        var params = { to: to, text: text };
        Messaging.sendRoomMessage(params);
    }
    
    function addPx(x, y) {
        var xNum = (typeof(x) == "number" ? x : parseInt(x.replace(/px/,"")));
        var yNum = (typeof(y) == "number" ? y : parseInt(y.replace(/px/,"")));
        var result = xNum + yNum + "px";
        
        return result;
    }
    
    function disableInput() {
        var input = document.getElementById('pct-chat-input');
        input && (input.disabled = true);
    }
    
    function focusInput() {
        var input = document.getElementById('pct-chat-input');
        input.focus();
    }
    
    function handleInput(evt) {
        var target = evt.currentTarget;
        var message = target.value;
        var room = getActiveRoom().id;
        
        if (evt.shiftKey) { return; }
        if (message && 
            message.trim() != '' ||
            (message.substring(0,3) == "/me" &&
             message.substring(0,3).trim() != '')) {
            if (message == "disconnect") { 
                connection.disconnect(); 
            } else {
                sendRoomMessage(room, message);
                //            console.log(username + " sent " + message + " to " + room);
                target.value = '';
            }
        }
        evt.preventDefault();
    }
    
    function pickAlias(defaultAliases, campaign) {
        var alias = defaultAliases[campaign.url] && defaultAliases[campaign.url].name || campaign.user_aliases[0].name;
        return alias;
    }

    function selfPresent(room) {
        var roster = getRoster(room),
            oldDivs = roster && roster.getElementsByClassName('user self'); // should only ever have one element
        var userPresent = oldDivs && oldDivs.length > 0 && oldDivs[0];
        
        return userPresent;
    }
    
    function timestamp(date) {
        date = date || new Date();
        var str = "";
        var hours = date.getHours();
        var minutes = date.getMinutes();

        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        str = hours + ":" + minutes + " ";
        return str;
    }
    
    function trapScroll(obj) {
        var scrollableDist;
        var trapClassName = 'trapScroll-enabled';
        
        function trapWheel(e) {
            if (document.body.classList.contains(trapClassName)) {
                
                var curScrollPos = obj.scrollTop;
                var dY = e.deltaY;
                //                console.log(curScrollPos + " and " + dY + " and " + scrollableDist);

                if ((dY>0 && curScrollPos >= (scrollableDist - 1)) ||
                    (dY<0 && curScrollPos <= 0)) {
                    return false;
                }
            }
        }
        
        obj.onwheel = trapWheel;
        obj.onmouseleave = function(e) {
            document.body.classList.remove(trapClassName);
        };
        obj.onmouseenter = function(e) {
            var containerHeight = obj.offsetHeight;
            var contentHeight = obj.scrollHeight;
            scrollableDist = contentHeight - containerHeight;
            
            if (contentHeight > containerHeight) {
                document.body.classList.add(trapClassName);
            }
        };
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

    return {
        getUsername: getUsername,
        initializeChat: initializeChat
    };
})(window);
