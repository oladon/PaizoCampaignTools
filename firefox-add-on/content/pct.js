(function(window) {
    const PREF_BRANCH = "extensions.pct.";

    const PCT_GREYSCALE = 0;
    const PCT_DISPLAYNONE = 1;

    var document = window.document;
    var preferences = Services.prefs.getBranch(PREF_BRANCH);

    var pctBlacklist = (function(window) {
        function addNameToBlacklist(name) {
          var blacklist = preferences.getComplexValue("blacklist", Components.interfaces.nsISupportsString).data;
          var blacklistArray = JSON.parse(blacklist);
          var newBlacklist = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);

          blacklistArray.push(name);
          newBlacklist.data = JSON.stringify(blacklistArray);
          preferences.setComplexValue("blacklist", Components.interfaces.nsISupportsString, newBlacklist);
        }

        function removeNameFromBlacklist(name) {
          var blacklist = preferences.getComplexValue("blacklist", Components.interfaces.nsISupportsString).data;
          var blacklistArray = JSON.parse(blacklist);
          var newBlacklist = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
          var index = blacklistArray.indexOf(name);

          blacklistArray.splice(index, 1);
          newBlacklist.data = JSON.stringify(blacklistArray);
          preferences.setComplexValue("blacklist", Components.interfaces.nsISupportsString, newBlacklist);
        }

        function blacklistToArray() {
          var blacklist = preferences.getComplexValue("blacklist", Components.interfaces.nsISupportsString).data;

          return JSON.parse(blacklist);
        }

        return {
          blackListener: function(evt) {
            var target = evt.currentTarget;
            var username = target.getAttribute("username");
            var action = target.getAttribute("action");

            console.log("Received from web page: " +
                  evt.type + "/" +
                  target.id + "/" +
                  username + "\n");

            if (target.id == "pct-link") {
              if (action == "add") {
                addNameToBlacklist(username);
              } else if (action == "remove") {
                removeNameFromBlacklist(username);
              }
            }
          },
          blacklistToArray: blacklistToArray
        };
    })(window);

    var pctFormatter = (function(window) {
        var helpText = {
            color: function(helpParent) {
                var p = document.createElement('p');
                p.classList.add('tiny');
                var span1 = document.createElement('span');
                span1.classList.add('unlink');
                span1.appendChild(document.createTextNode('(PCT) This text has '));
                var span2 = document.createElement('span');
                span2.classList.add('unlink');
                span2.appendChild(document.createTextNode('red'));
                var span3 = document.createElement('span');
                span3.classList.add('unlink');
                span3.appendChild(document.createTextNode(' and '));
                var span4 = document.createElement('span');
                span4.classList.add('unlink');
                span4.appendChild(document.createTextNode('blue'));
                var span5 = document.createElement('span');
                span5.classList.add('unlink');
                span5.appendChild(document.createTextNode(' text.'));

                p.appendChild(span1);
                p.appendChild(document.createTextNode('[color=red]'));
                p.appendChild(span2);
                p.appendChild(document.createTextNode('[/color]'));
                p.appendChild(span3);
                p.appendChild(document.createTextNode('[color=#0000ff]'));
                p.appendChild(span4);
                p.appendChild(document.createTextNode('[/color]'));
                p.appendChild(span5);

                helpParent.appendChild(p);
            },
            u: function(helpParent) {
                var second = helpParent.children[1];
                var period = second.lastElementChild;

                var and = document.createElement('span');
                and.classList.add('unlink');
                and.appendChild(document.createTextNode(' and (PCT) '));

                var underline = document.createElement('span');
                underline.classList.add('unlink');
                underline.appendChild(document.createTextNode('underline'));

                second.insertBefore(and, period);
                second.insertBefore(document.createTextNode('[u]'), period);
                second.insertBefore(underline, period);
                second.insertBefore(document.createTextNode('[/u]'), period);
            }
        };

        var supportedTags = [
            'color',
            'u'
        ];

        function addHelpText(tag) {
            var postForm = document.getElementById('postPreviewForm');
            var help = postForm && postForm.querySelector('.bordered-box > .bb-content .unlink'),
                helpParent = help && help.parentNode.parentNode;
            helpParent && helpText[tag](helpParent);
        }

        function convertTag(tag, tags) {
            if (!tag || !tag.close || !tags || !(tags.length > 0)) {
                return null;
            }

            var openNode = tag.node;
            var newNode = document.createElement('span');

            var style = getStyle(tag.name, tag.value);
            if ((supportedTags.indexOf(tag.name) >= 0) && style) {
                (newNode.style[style[0]]) = style[1];
            } else {
                return null;
            }

            var newChild = openNode.splitText(tag.location + tag.fullMatch.length);
            updateRefs(tags, openNode, newChild);
            openNode.textContent = openNode.textContent.slice(0, tag.location);

            while (newChild != tag.close.node) {
                var nextSibling = newChild.nextSibling;
                newNode.appendChild(newChild);
                newChild = nextSibling;
            }

            var closeNode = tag.close.node;
            var rightSide = closeNode.splitText(tag.close.location + tag.close.fullMatch.length);

            newNode.appendChild(closeNode);
            updateRefs(tags, closeNode, rightSide);
            closeNode.textContent = closeNode.textContent.slice(0, tag.close.location);

            openNode.parentNode.insertBefore(newNode, rightSide);

            return newNode;
        }

        function getPosts() {
            var posts = document.querySelectorAll('.post-contents');
            return posts;
        }

        function findTags(str) {
            var regex = new RegExp(/\[(\/|)([a-z]+)(?:\=([a-z]+|#[a-f0-9]+)|)\]/gi);
            var tags = [];
            var match;

            while (match = regex.exec(str)) {
                var [fullMatch, close, tagName, value] = match;
                var newObj = {
                    fullMatch: fullMatch,
                    location: regex.lastIndex - fullMatch.length,
                    name: tagName
                };

                if (!close || close == '') {
                    newObj.value = value;
                } else {
                    newObj.close = true;
                }

                tags.push(newObj);
            }

            return tags;
        }

        function replaceTags(use) {
            var postContents = getPosts();

            if (use) {
                supportedTags.forEach(function(tag) {
                    addHelpText(tag);
                });
            }

            if (postContents && postContents.length > 0) {
                for (var i=0; i<postContents.length; i++) {
                    tagRecursor(postContents[i], use);
                }
            }
        }

        function stripTags(content, tag) {
            var regexp = new RegExp('\\[\\/?' + tag +
                                    '(?:=(?:[a-z]+|#[a-f0-9]+))?\\]', 'gi');
            return content.replace(regexp, '');
        }

        function tagRecursor(parent, use) {
            var children = parent.childNodes;
            var tags = [];

            for (var i=0; i<children.length; i++) {
                var node = children[i];

                // 3 is Node.TEXT_NODE.
                // For some reason, "Node" isn't available.
                if (node.nodeType == 3) {
                    if (use) {
                        var text = node.textContent;
                        var strTags = findTags(text);

                        if (strTags && strTags.length) {
                            strTags.forEach(function(newTag) {
                                newTag.node = node;

                                if (!newTag.close) {
                                    tags.push(newTag);
                                } else {
                                    for (var i=tags.length - 1; i>=0; i--) {
                                        var openTag = tags[i];

                                        if ((newTag.name == openTag.name) &&
                                            !openTag.close) {
                                            openTag.close = newTag;
                                            break;
                                        }
                                    }
                                }
                            });
                        }
                    } else {
                        supportedTags.forEach(function(tag) {
                            node.textContent = stripTags(node.textContent, tag);
                        });
                    }
                } else {
                    tagRecursor(node, use);
                }
            }

            if (tags && tags.length) {
                tags.forEach(function(tag) {
                    convertTag(tag, tags);
                });
            }
        }

        function updateRefs(tags, oldNode, newNode) {
            tags && tags.forEach(function(tag) {
                if (tag.node == oldNode) {
                    var newLoc = (tag.location - oldNode.textContent.length);

                    if (newLoc >= 0) {
                        tag.node = newNode;
                        tag.location = newLoc;
                    }
                }

                if (tag.close && tag.close.node == oldNode) {
                    var newCloseLoc = (tag.close.location - oldNode.textContent.length)

                    if (newCloseLoc >= 0) {
                        tag.close.node = newNode;
                        tag.close.location = newCloseLoc;
                    }
                }
            });
        }

        return {
            replaceTags: replaceTags
        };
    })(window);

    var pctSelector = (function(window) {
        function addSetDefault(select) {
            var selectParent = select.parentNode;
            var setDefault = selectParent.querySelector('.pct-alias');

            if (!setDefault) {
                console.log('Adding set default.');

                if (select) {
                    setDefault = document.createElement('div');
                    setDefault.classList.add('pct-alias');
                    setDefault.classList.add('form-prompt');
                    setDefault.title = 'Set as default for this campaign.';

                    var icon = document.createElement('i');
                    icon.classList.add('material-icons');

                    setDefault.appendChild(icon);
                    selectParent.appendChild(setDefault);

                    addStyles(select);
                }
            }
            return setDefault;
        }

        function addStyles(select) {
            var selectParent = select.parentNode;
            select.style.marginTop = '0.1em';
            selectParent.style.verticalAlign = 'middle';
        }

        function getAliasSelect() {
            var selectNodes = document.getElementsByName('person');
            return selectNodes && selectNodes[0];
        }

        function getSelected(select) {
            var selected = select.selectedOptions[0];
            return selected;
        }

        function selectAlias(campaigns, campaign) {
            var defaults = preferences.getComplexValue("defaultAliases", Components.interfaces.nsISupportsString);
            var defaultAliases = defaults && defaults.data && JSON.parse(defaults.data) || {};
            var alias = defaultAliases[campaign.url] || campaign.user_aliases[0];
            alias = alias.name;
            var select = getAliasSelect();
            if (select) {
                var setDefault = addSetDefault(select);

                function clickDefault(e) {
                    if (!setDefault.classList.contains('inactive')) {
                        var selected = getSelected(select);
                        alias = selected && selected.textContent;
                        updateDefaultAlias(defaultAliases, campaign, alias, setDefault);
                    }
                }
                setDefault.onclick = clickDefault;

                select.onchange = function updateIcon() {
                    var selected = getSelected(select),
                        newAlias = selected.textContent;

                    if (newAlias == alias) {
                        console.log('Setting title, adding inactive.');
                        setDefault.title = 'This alias is your default for this campaign.';
                        setDefault.classList.add('inactive');
                    } else {
                        setDefault.title = 'Set as default for this campaign.';
                        setDefault.classList.remove('inactive');
                    }
                };

                updateSelect(select, alias, setDefault);
            }
        }

        function updateDefaultAlias(defaultAliases, campaign, name, setDefault) {
            var alias = campaign.user_aliases.find(function(item) {
                return item.name == name;
            });

            defaultAliases[campaign.url] = alias || { name: name, url: '' };

            var newDefaults = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
            newDefaults.data = JSON.stringify(defaultAliases);
            preferences.setComplexValue("defaultAliases", Components.interfaces.nsISupportsString, newDefaults);
            setDefault.classList.add('inactive');
            setDefault.title = 'This alias is your default for this campaign.';
        }

        function updateSelect(select, alias, setDefault) {
            var options = select.options;

            for (var i=0; i<options.length; i++) {
                var option = options[i];

                if (option.textContent == alias) {
                    setDefault.classList.add('inactive');
                    setDefault.title = 'This alias is your default for this campaign.';
                    option.setAttribute("selected", "selected");
                } else if (option.getAttribute("selected")) {
                    option.removeAttribute("selected");
                }
            };
        }

        return {
            selectAlias: selectAlias
        };
    })(window);

    var useArranger = preferences.getBoolPref("useArranger");
    var useBlacklist = preferences.getBoolPref("useBlacklist");
    var useExtendedFormatting = preferences.getBoolPref("useExtendedFormatting");
    var useHighlighter = preferences.getBoolPref("useHighlighter");
    var useSelector = preferences.getBoolPref("useSelector");
    var username = getUsername();

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
                    title = title.substring(0, aka);
                }
                return title;
            }
        }
        return null;
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
        var campaignsArray = campaigns.map( function(campaign, index, array) {
            var currentCampaign = campaign;
            var userDM = (currentCampaign.querySelector('blockquote > p[class=tiny] > b').textContent.trim() == "GameMaster");
            var title = currentCampaign.querySelector('blockquote > h3 > a[title]').title;
            var URL = currentCampaign.querySelector('blockquote > h3 > a[title]').href;
            var userAliases = currentCampaign.querySelectorAll('p.tiny > b > a');
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
            var activeCampaigns = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
            activeCampaigns.data = JSON.stringify(campaigns);
            preferences.setComplexValue("campaigns", Components.interfaces.nsISupportsString, activeCampaigns);
        }
    }

    function arrangeCampaigns() {
        var campaigns = getCampaigns();
        if (campaigns.length > 8) {
            var firstCampaign = campaigns[0];
            var firstColumn = firstCampaign.parentNode.parentNode;
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

    function onCampaignsPage(name) {
        var currentHref = document.location.href;
        var titleNode = document.querySelector('table td > h1');
        var pageTitle = titleNode && titleNode.textContent;

        function normalURL(str) {
            if (str) {
                return (currentHref.indexOf(str + '/campaigns') == (currentHref.length - 10 - str.length));
            } else {
                return (currentHref.indexOf("/campaigns") == (currentHref.length - 10));
            }
        }

        function wonkyURL(str) {
            if (str) {
                return (currentHref.indexOf(str + '%2Fcampaigns') == (currentHref.length - 12 - str.length));
            } else {
                return (currentHref.indexOf("%2Fcampaigns") == (currentHref.length - 12));
            }
        }

        return (normalURL(name) || wonkyURL(name)) ||
            ((normalURL() || wonkyURL()) &&
                pageTitle &&
             (pageTitle == name + "'s page"));
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

    function blacklistPosts() {
        if (!checkBlacklistPrefs()) { return; }

        var blacklist = pctBlacklist.blacklistToArray();
        var posts = getPosts();
        var blacklistMethod = preferences.getIntPref("blacklistMethod");

        for (var i=0; i<posts.length; i++) {
            var postDiv = posts[i].querySelector('div');
            var nameAndTitle = posts[i].querySelector('span > a[title]');
            var name = nameAndTitle.textContent.trim();
            var title = nameAndTitle.title;
            var blacklisted = false;

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
        var oldLink = nameNode.parentNode.parentNode.querySelector("a#pct-link");
        var rootUser = getRootUser(nameNode.title);
        var newSpan, newLink;

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
        switch (true) {
        case typeof possibleUsers[4] !== 'undefined':
            return possibleUsers[4];
        case typeof possibleUsers[2] !== 'undefined':
            return possibleUsers[2];
        case typeof possibleUsers[3] !== 'undefined':
            return possibleUsers[3];
        }
    }

    function checkBlacklistPrefs() {
        var blacklistNormal = preferences.getBoolPref("blacklistNormal"),
            blacklistRecruit = preferences.getBoolPref("blacklistRecruit"),
            blacklistOOC = preferences.getBoolPref("blacklistOOC"),
            blacklistIC = preferences.getBoolPref("blacklistIC");

        return (((document.location.href.indexOf("/threads/") >= 0) && blacklistNormal) ||
                ((document.location.href.indexOf("/recruiting") >= 0) && blacklistRecruit) ||
                ((document.location.href.indexOf("/discussion") >= 0) && blacklistOOC) ||
                ((document.location.href.indexOf("/gameplay") >= 0) && blacklistIC));
    }

    function updateBlacklist(evt) {
        pctBlacklist.blackListener(evt);
        blacklistPosts();
    }


    /* Highlighter Code */
    function highlightNew() {
        var highlightColor = preferences.getCharPref("highlightColor");
        var newLinks = document.querySelectorAll('table > tbody > tr > td > table > tbody > tr > td > blockquote > ul > li > span.tiny > span > a:not([title^="Stop"])');

        for (var i=0; i<newLinks.length; i++) {
            newLinks[i].style.backgroundColor=highlightColor;
        }
    }

    function run() {
        var currentHref = document.location.href;
        var ownCampPage = username && onCampaignsPage(username);
        var anyCampPage = onCampaignsPage();

        pctFormatter.replaceTags(useExtendedFormatting);

        if ((useArranger == true) && anyCampPage) {
            if (ownCampPage) {
                var campaigns = getCampaigns();
                saveCampaigns(campaignsToArray(campaigns));
            }

            arrangeCampaigns();
        }

        if ((useBlacklist == true) && (checkBlacklistPrefs())) {
            blacklistPosts();
        }

        if ((useHighlighter == true) && anyCampPage) {
            highlightNew();
        }

        if ((useSelector == true) && currentHref.indexOf('/campaigns') > 0) {
            var storedCampaigns = preferences
                .getComplexValue("campaigns",
                                 Components.interfaces.nsISupportsString).data,
                storedCampaignsArray = (storedCampaigns &&
                                        JSON.parse(storedCampaigns));
            var currentCampaign = storedCampaignsArray.find(function(campaign) {
                return currentHref.indexOf(campaign.url) >= 0;
            });

            if (currentCampaign) {
                pctSelector.selectAlias(storedCampaignsArray, currentCampaign);
            }
        }
    }

    run();
})(content);
