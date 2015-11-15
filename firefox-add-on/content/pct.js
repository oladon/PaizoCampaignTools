(function(window) {
    const PREF_BRANCH = "extensions.pct.";

    const PCT_GREYSCALE = 0;
    const PCT_DISPLAYNONE = 1;

    var document = window.document;
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
            var defaults = Services.prefs.getBranch(PREF_BRANCH).getComplexValue("defaultAliases", Components.interfaces.nsISupportsString);
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
            Services.prefs.getBranch(PREF_BRANCH).setComplexValue("defaultAliases", Components.interfaces.nsISupportsString, newDefaults);
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
    
    var pctBlacklist = (function(window) {
        function addNameToBlacklist(name) {
          var blacklist = Services.prefs.getBranch(PREF_BRANCH).getComplexValue("blacklist", Components.interfaces.nsISupportsString).data;
          var blacklistArray = JSON.parse(blacklist);
          var newBlacklist = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);

          blacklistArray.push(name);
          newBlacklist.data = JSON.stringify(blacklistArray);
          Services.prefs.getBranch(PREF_BRANCH).setComplexValue("blacklist", Components.interfaces.nsISupportsString, newBlacklist);
        }

        function removeNameFromBlacklist(name) {
          var blacklist = Services.prefs.getBranch(PREF_BRANCH).getComplexValue("blacklist", Components.interfaces.nsISupportsString).data;
          var blacklistArray = JSON.parse(blacklist);
          var newBlacklist = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
          var index = blacklistArray.indexOf(name);

          blacklistArray.splice(index, 1);
          newBlacklist.data = JSON.stringify(blacklistArray);
          Services.prefs.getBranch(PREF_BRANCH).setComplexValue("blacklist", Components.interfaces.nsISupportsString, newBlacklist);
        }

        function blacklistToArray() {
          var blacklist = Services.prefs.getBranch(PREF_BRANCH).getComplexValue("blacklist", Components.interfaces.nsISupportsString).data;

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
        }
    })(window);

    var useArranger = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useArranger");
    var useBlacklist = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useBlacklist");
    var useHighlighter = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useHighlighter");
    var useSelector = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useSelector");

    function loadFont(callback) {
        var head = document.getElementsByTagName('head')[0],
            id = 'pct-font';

        if (!document.getElementById(id)) {
            var link = document.createElement('link');

            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            link.id = id;
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
        var activeCampaigns = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        activeCampaigns.data = JSON.stringify(campaigns);
        Services.prefs.getBranch(PREF_BRANCH).setComplexValue("campaigns", Components.interfaces.nsISupportsString, activeCampaigns);

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
        var blacklistMethod = Services.prefs.getBranch(PREF_BRANCH).getIntPref("blacklistMethod");

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
        var blacklistNormal = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("blacklistNormal"),
            blacklistRecruit = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("blacklistRecruit"),
            blacklistOOC = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("blacklistOOC"),
            blacklistIC = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("blacklistIC");

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
        var highlightColor = Services.prefs.getBranch(PREF_BRANCH).getCharPref("highlightColor");
        var newLinks = document.querySelectorAll('table > tbody > tr > td > table > tbody > tr > td > blockquote > ul > li > span.tiny > span > a:not([title^="Stop"])');

        for (var i=0; i<newLinks.length; i++) {
            newLinks[i].style.backgroundColor=highlightColor;
        }
    }

    function run() {
        var currentHref = document.location.href;

        if ((useArranger == true) && (currentHref.indexOf("/campaigns") == (currentHref.length - 10))) {
            var campaigns = getCampaigns();
            saveCampaigns(campaignsToArray(campaigns));
            arrangeCampaigns();
        }

        if ((useBlacklist == true) && (checkBlacklistPrefs())) {
            blacklistPosts();
        }

        if ((useHighlighter == true) && (currentHref.indexOf("/campaigns") >= 0)) {
            highlightNew();
        }

        if ((useSelector == true) && (currentHref.indexOf("/campaigns") >= 0)) {
            var storedCampaigns = Services.prefs.getBranch(PREF_BRANCH).getComplexValue("campaigns", Components.interfaces.nsISupportsString).data,
                storedCampaignsArray = storedCampaigns && JSON.parse(storedCampaigns);
            var currentCampaign = storedCampaignsArray.find(function(campaign) {
                return currentHref.indexOf(campaign.url) >= 0;
            });

            if (currentCampaign) {
                pctSelector.selectAlias(storedCampaignsArray, currentCampaign);
            }
        }
    }

    loadFont(run);

})(content);
