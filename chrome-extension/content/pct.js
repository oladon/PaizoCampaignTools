// Thanks to Chris Reiner for your strong support of my work!
// https://www.patreon.com/oladon
(function() {
    const PCT_GREYSCALE = "pct-greyscale";
    const PCT_DISPLAYNONE = "pct-display-none";

    var pctChat = window.pctChat;
    var pctFormatter = window.pctFormatter;
    var pctSelector = window.pctSelector;

    var username = pctChat.getUsername() || undefined;

    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }

    function loadFont(callback) {
        var head = document.getElementsByTagName('head')[0],
            id = 'pct-font';

        if (!document.getElementById(id)) {
            var link = document.createElement('link');

            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            link.rel = 'stylesheet';
            link.type = 'text/css';

            head.appendChild(link);

            link.onload = callback;
        }
    }

    /* Arranger Code */
    function getCampaigns() {
        var myCampaigns = [],
            activeCampaigns = document.querySelectorAll('table > tbody > tr > td > table > tbody > tr > td > blockquote > h3 > a');
        for (var i=0; i<activeCampaigns.length; i++) {
            myCampaigns.push(activeCampaigns[i].parentNode.parentNode.parentNode);
        }
        return myCampaigns;
    }

    function campaignsToArray(campaigns) {
        var campaignsArray = campaigns.map(function(campaign) {
            var userDM = (campaign.querySelector('blockquote > p.tiny > b').textContent.trim() == "GameMaster");
            var title = campaign.querySelector('blockquote > h3 > a[title]').title;
            var URL = campaign.querySelector('blockquote > h3 > a[title]').href;
            var userAliases = campaign.querySelectorAll('p.tiny > b > a');
            var userAliasesArray = [];

            for (var alias of [].slice.call(userAliases)) {
                userAliasesArray.push({ name: alias.textContent.trim(),
                                        url: alias.href });
            }
            if (!userAliases || userAliases.length <= 0) {
                userAliasesArray = username && [{ name: username }];
            }

            var campaignObject = { title: title,
                                   url: URL,
                                   user_dm: userDM,
                                   user_aliases: userAliasesArray
                                 };

            return campaignObject;
        });

        return campaignsArray;
    }

    function saveCampaigns(campaigns) {
        if (campaigns &&
            campaigns.length > 0) {
            var activeCampaigns = JSON.stringify(campaigns);
            chrome.runtime.sendMessage({ storage: "campaigns", value: activeCampaigns});
        }
    }

    function arrangeCampaigns(campaigns) {
        if (campaigns.length > 8) {
            var firstCampaign = campaigns[0],
                firstColumn = firstCampaign.parentNode.parentNode;

            for (var i=0; i<campaigns.length; i++) {
                var row = document.createElement('tr');
                row.appendChild(campaigns[i]);
                firstColumn.appendChild(row);
            }

            var rows = firstColumn.querySelectorAll('tr');
            for (var i=0; i<rows.length; i++) {
                if (rows[i].children.length === 0) {
                    rows[i].parentNode.removeChild(rows[i]);
                }
            }

            var secondColumn = firstColumn.parentNode.parentNode.nextSibling.nextSibling;
            if (secondColumn) {
                secondColumn.parentNode.removeChild(secondColumn);
            }
        }
    }


    /* Blacklist Code */
    function getPosts() {
        var myPosts = [ ],
            allPosts = document.querySelectorAll('itemscope');
        for (var i = 0; i < allPosts.length; i++) {
            myPosts.push(allPosts[i]);
        }
        return myPosts;
    }

    function blacklistPosts(blacklistPrefs) {
        if (checkBlacklistPrefs(blacklistPrefs) == "false") { return; }

        var blacklist = blacklistToArray(blacklistPrefs.blacklist);
        var posts = getPosts();
        var blacklistMethod = blacklistPrefs.blacklistMethod;

        for (var i=0; i<posts.length; i++) {
            var postDiv = posts[i].querySelector('div');
            var nameAndTitle = posts[i].querySelector('span > a[title]');
            var name = nameAndTitle.textContent.trim();
            var title = nameAndTitle.title;
            var blacklisted = false;

            if (blacklist) {
                for (var j=0; j<blacklist.length; j++) {
                    if ((name.indexOf(blacklist[j]) >= 0) ||
                        (title.indexOf(blacklist[j]) >= 0)) {
                        blacklisted = blacklist[j];
                        if (blacklistMethod == PCT_GREYSCALE) {
                            if (postDiv.getAttribute("class").indexOf("pct-greyscale") < 0) {
                                postDiv.setAttribute("class", postDiv.getAttribute("class") + " pct-greyscale");
                            }
                        } else if (blacklistMethod == PCT_DISPLAYNONE) {
                            if (postDiv.style.display != "none") {
                                postDiv.style.display = "none";
                            }
                        }
                        break;
                    }
                }
            }

            if (blacklisted == false) {
                if (blacklistMethod == PCT_GREYSCALE) {
                    postDiv.setAttribute("class", postDiv.getAttribute("class").replace(" pct-greyscale", ""));
                } else if (blacklistMethod == PCT_DISPLAYNONE) {
                    postDiv.style.display = "";
                }
            }
            addSpan(nameAndTitle, blacklisted);
        }
    }

    function addSpan(nameNode, blacklistedUser) {
        var oldLink = nameNode.parentNode.parentNode.querySelector("a#pct-link"),
            rootUser = getRootUser(nameNode.title),
            newSpan, newLink;

        if (oldLink) {
            newLink = oldLink;
            newSpan = oldLink.firstChild;
        } else {
            newSpan = document.createElement("span");
            newLink = document.createElement("a");

            newLink.id = "pct-link";
            newLink.appendChild(newSpan);
            nameNode.parentNode.parentNode.appendChild(newLink);
        }

        if (blacklistedUser) {
            newSpan.className = "pct-icon pct-allowedIcon";
            newLink.setAttribute("title", "Remove " + blacklistedUser + " from the Blacklist");
            newLink.setAttribute("action", "remove");
            newLink.setAttribute("username", blacklistedUser);
            newLink.setAttribute("href", 'javascript:;');
            newLink.removeEventListener("click", updateBlacklist);
            newLink.addEventListener("click", updateBlacklist);
        } else {
            newSpan.className = "pct-icon pct-notAllowedIcon pct-greyscale";
            newLink.setAttribute("title", "Blacklist " + rootUser);
            newLink.setAttribute("action", "add");
            newLink.setAttribute("username", rootUser);
            newLink.setAttribute("href", 'javascript:;');
            newLink.removeEventListener("click", updateBlacklist);
            newLink.addEventListener("click", updateBlacklist);
        }
    }

    function getRootUser(title) {
        possibleUsers = title.match("(Alias of (.+?)|Pathfinder Society character of (.+?)|(.+?))( aka .*|\$)");
        /* Array.prototype.forEach.call(possibleUsers, function(thing) { dump(thing + "\n"); }) */
        switch (true) {
        case typeof possibleUsers[4] !== 'undefined':
            return possibleUsers[4];
        case typeof possibleUsers[2] !== 'undefined':
            return possibleUsers[2];
        case typeof possibleUsers[3] !== 'undefined':
            return possibleUsers[3];
        }
    }

    function checkBlacklistPrefs(blacklistPrefs) {
        var blacklistNormal = blacklistPrefs.blacklistNormal,
            blacklistRecruit = blacklistPrefs.blacklistRecruit,
            blacklistOOC = blacklistPrefs.blacklistOOC,
            blacklistIC = blacklistPrefs.blacklistIC,
            blacklistStore = blacklistPrefs.blacklistStore,
            blacklistBlog = blacklistPrefs.blacklistBlog;

        return (((document.location.href.indexOf("/threads/") >= 0) && blacklistNormal) ||
                ((document.location.href.indexOf("/recruiting") >= 0) && blacklistRecruit) ||
                ((document.location.href.indexOf("/discussion") >= 0) && blacklistOOC) ||
                ((document.location.href.indexOf("/gameplay") >= 0) && blacklistIC) ||
                ((document.location.href.indexOf("/products") >= 0) && blacklistStore) ||
                ((document.location.href.indexOf("/blog") >= 0) && blacklistBlog));
    }

    function updateBlacklist(evt) {
        pctBlacklist.blackListener(evt, function() {
            chrome.runtime.sendMessage({storage: ['blacklistNormal', 'blacklistRecruit', 'blacklistOOC', 'blacklistIC', 'blacklistStore', 'blacklistBlog', 'blacklistMethod', 'blacklist']}, function(response) {
                var blacklistPrefs = response.storage;
                blacklistPosts(blacklistPrefs);
            });
        });
    }

    /* Highlighter Code */
    function highlightNew(highlightColor) {
        var newLinks = document.querySelectorAll('table > tbody > tr > td > table > tbody > tr > td > blockquote > ul > li > span.tiny > span > a:not([title^="Stop"])');

        for (var i=0; i<newLinks.length; i++) {
            newLinks[i].style.backgroundColor=highlightColor;
        }
    }

    function run() {
        var campaigns = getCampaigns();
        var currentHref = document.location.href;
        var titleNode = document.querySelector('table td > h1');
        var pageTitle = titleNode && titleNode.textContent;

        if ((currentHref.indexOf(username + "/campaigns") == (currentHref.length - 10)) ||
            ((currentHref.indexOf("/campaigns") == (currentHref.length - 10)) &&
             pageTitle &&
             pageTitle == username + "'s page")) {
            var campaignsArray = campaignsToArray(campaigns);
            saveCampaigns(campaignsArray);
        }

        chrome.runtime.sendMessage({storage: 'useArranger'}, function(response) {
            var useArranger = response.storage;

            if ((useArranger == "true") && (document.location.href.indexOf("/campaigns") >= 0)) {
                arrangeCampaigns(campaigns);
            }
        });

        chrome.runtime.sendMessage({storage: ['useBlacklist', 'blacklistNormal', 'blacklistRecruit', 'blacklistOOC', 'blacklistIC', 'blacklistStore', 'blacklistMethod', 'blacklist']}, function(response) {
            var useBlacklist = response.storage.useBlacklist,
                blacklistMethod = response.storage.blacklistMethod,
                blacklistPrefs = response.storage;

            if ((useBlacklist == "true") && (checkBlacklistPrefs(blacklistPrefs))) {
                blacklistPosts(blacklistPrefs);
            }
        });

        chrome.runtime.sendMessage({storage: ['useChat', 'useExtendedFormatting', 'useSelector', 'campaigns']}, function(response) {
            var useChat = response.storage.useChat;
            var useExtendedFormatting = response.storage.useExtendedFormatting;
            var useSelector = response.storage.useSelector;
            var currentCampaign, storedCampaigns, storedCampaignsArray;

            pctFormatter.replaceTags(useExtendedFormatting);

            if (((useChat == "true") ||
                 (useSelector == "true")) &&
                username &&
                currentHref.indexOf("/campaigns") >= 0) {

                if (!campaigns || campaigns.length == 0) {
                    storedCampaigns = response.storage.campaigns;
                    if (storedCampaigns && storedCampaigns != "") {
                        storedCampaignsArray = JSON.parse(storedCampaigns);
                        currentCampaign = storedCampaignsArray.find(function(campaign) {
                            return currentHref.indexOf(campaign.url) >= 0;
                        });
                    } else {
                        console.log("Error loading chat: campaigns is not populated. Have you visited your base user's campaigns page yet?");
                    }

                    if (currentCampaign && useSelector == "true") {
                        var selectorCampaigns = campaigns && campaigns.length > 0 || storedCampaignsArray;
                        pctSelector.selectAlias(selectorCampaigns, currentCampaign);
                    }
                }

                if ((currentHref.indexOf(username + "/campaigns") == (currentHref.length - 10)) ||
                    currentCampaign ||
                    ((currentHref.indexOf("/campaigns") == (currentHref.length - 10)) &&
                     pageTitle &&
                     pageTitle == username + "'s page") &&
                    useChat == "true") {

                    if (currentCampaign) {
                        pctChat.initializeChat(username, [ currentCampaign ], true);
                    } else {
                        pctChat.initializeChat(username, campaignsArray);
                    }
                }
            }
        });

        chrome.runtime.sendMessage({storage: ['useHighlighter', 'highlightColor']}, function(response) {
            var useHighlighter = response.storage.useHighlighter,
                highlightColor = response.storage.highlightColor;

            if ((useHighlighter == "true") && (document.location.href.indexOf("/campaigns") >= 0)) {
                highlightNew(highlightColor);
            }
        });
    }

    loadFont(run);

})();
