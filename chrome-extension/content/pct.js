(function() {

const PCT_GREYSCALE = "pct-greyscale";
const PCT_DISPLAYNONE = "pct-display-none";

/* Arranger Code */
function getCampaigns() {
	var myCampaigns = [], 
		activeCampaigns = document.querySelectorAll('table > tbody > tr > td > table > tbody > tr > td > blockquote > h3 > a');
	for (var i=0; i<activeCampaigns.length; i++) {
		myCampaigns.push(activeCampaigns[i].parentNode.parentNode.parentNode);
	}
	return myCampaigns;
}

function arrangeCampaigns() {
	var campaigns = getCampaigns();
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
		blacklistIC = blacklistPrefs.blacklistIC;

	return (((document.location.href.indexOf("/threads/") >= 0) && blacklistNormal) ||
			((document.location.href.indexOf("/recruiting") >= 0) && blacklistRecruit) ||
			((document.location.href.indexOf("/discussion") >= 0) && blacklistOOC) ||
			((document.location.href.indexOf("/gameplay") >= 0) && blacklistIC));
}

function updateBlacklist(evt) {
	pctBlacklist.blackListener(evt, function() {
		chrome.extension.sendRequest({storage: ['blacklistNormal', 'blacklistRecruit', 'blacklistOOC', 'blacklistIC', 'blacklistMethod', 'blacklist']}, function(response) {
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

chrome.extension.sendRequest({storage: 'useArranger'}, function(response) {
	var useArranger = response.storage;

	if ((useArranger == "true") && (document.location.href.indexOf("/campaigns") >= 0)) {
		arrangeCampaigns();
	}
});

chrome.extension.sendRequest({storage: ['useBlacklist', 'blacklistNormal', 'blacklistRecruit', 'blacklistOOC', 'blacklistIC', 'blacklistMethod', 'blacklist']}, function(response) {
	var useBlacklist = response.storage.useBlacklist,
		blacklistMethod = response.storage.blacklistMethod,
		blacklistPrefs = response.storage;

	if ((useBlacklist == "true") && (checkBlacklistPrefs(blacklistPrefs))) {
		blacklistPosts(blacklistPrefs);
	}
});

chrome.extension.sendRequest({storage: ['useHighlighter', 'highlightColor']}, function(response) {
	var useHighlighter = response.storage.useHighlighter,
		highlightColor = response.storage.highlightColor;

	if ((useHighlighter == "true") && (document.location.href.indexOf("/campaigns") >= 0)) {
		highlightNew(highlightColor);
	}
});

})();
