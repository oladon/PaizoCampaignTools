(function(window) {

const PREF_BRANCH = "extensions.pct.";

var document = window.document;

var useArranger = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useArranger");
var useBlacklist = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useBlacklist");
var useHighlighter = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useHighlighter");

/* Arranger Code */
function getCampaigns() {
   var myCampaigns = [], 
       activeCampaigns = document.querySelectorAll('table > tbody > tr > td > table > tbody > tr > td > blockquote > h3 > a');
   for (var i=0; i<activeCampaigns.length; i++) {
     myCampaigns.push(activeCampaigns[i].parentNode.parentNode.parentNode);
//     dump(activeCampaigns[i] + "\n");
   }
   return myCampaigns;
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

    var blacklist = blacklistToArray();
    var posts = getPosts();

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
                if (postDiv.getAttribute("class").indexOf("pct-greyscale") < 0) {
                    postDiv.setAttribute("class", postDiv.getAttribute("class") + " pct-greyscale");
                }
                break;
            }
        }

        if (blacklisted == false) {
            postDiv.setAttribute("class", postDiv.getAttribute("class").replace(" pct-greyscale", ""));
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
        newLink.setAttribute("username", blacklistedUser);
        newLink.setAttribute("href", 'javascript:;');
        newLink.setAttribute("onClick", 'var evt = document.createEvent("Events"); evt.initEvent("RemoveFromBlacklist", true, false); this.dispatchEvent(evt);');
    } else {
        newSpan.className = "pct-icon pct-notAllowedIcon";
        newLink.setAttribute("title", "Blacklist " + rootUser);
        newLink.setAttribute("username", rootUser);
        newLink.setAttribute("href", 'javascript:;');
        newLink.setAttribute("onClick", 'var evt = document.createEvent("Events"); evt.initEvent("AddToBlacklist", true, false); this.dispatchEvent(evt);');
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

function checkBlacklistPrefs() {
  var blacklistNormal = Services.prefs.getBranch(pref_branch).getBoolPref("blacklistNormal"),
      blacklistRecruit = Services.prefs.getBranch(pref_branch).getBoolPref("blacklistRecruit"),
      blacklistOOC = Services.prefs.getBranch(pref_branch).getBoolPref("blacklistOOC"),
      blacklistIC = Services.prefs.getBranch(pref_branch).getBoolPref("blacklistIC");

/*  dump("blacklistNormal: " + blacklistNormal + "\n" + 
       "blacklistRecruit: " + blacklistRecruit + "\n" + 
       "blacklistOOC: " + blacklistOOC + "\n" + 
       "blacklistIC: " + blacklistIC + "\n" + 
       "location: " + document.location.href + "\n"); */

  return (((document.location.href.indexOf("/threads/") >= 0) && blacklistNormal) ||
              ((document.location.href.indexOf("/recruiting") >= 0) && blacklistRecruit) ||
              ((document.location.href.indexOf("/discussion") >= 0) && blacklistOOC) ||
              ((document.location.href.indexOf("/gameplay") >= 0) && blacklistIC));
}


/* Highlighter Code */
function highlightNew() {
    var highlightColor = Services.prefs.getBranch(PREF_BRANCH).getCharPref("highlightColor");
    var newLinks = document.querySelectorAll('table > tbody > tr > td > table > tbody > tr > td > blockquote > ul > li > span.tiny > span > a:not([title^="Stop"])');

    for (var i=0; i<newLinks.length; i++) {
        newLinks[i].style.backgroundColor=highlightColor;
    }
}


if ((useArranger == true) && (document.location.href.indexOf("/campaigns") >= 0)) {
    arrangeCampaigns();
}

if ((useBlacklist == true) && (checkBlacklistPrefs())) {
    blacklistPosts();
}

if ((useHighlighter == true) && (document.location.href.indexOf("/campaigns") >= 0)) {
    highlightNew();
}

document.addEventListener("RemoveFromBlacklist", function(e) { pctBlacklist.blackListener(e); blacklistPosts(); }, false, true);
document.addEventListener("AddToBlacklist", function(e) { pctBlacklist.blackListener(e); blacklistPosts(); }, false, true);

})(content);
