Components.utils.import("resource://gre/modules/Services.jsm");

var
  opnr = window.opener,
  PREF_BRANCH = "extensions.pct.",
  useArranger = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useArranger"),
  useBlacklist = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useBlacklist"),
  blacklist = blacklistToArray(),
  blacklistMethod = Services.prefs.getBranch(PREF_BRANCH).getIntPref("blacklistMethod"),
  blacklistNormal = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("blacklistNormal"),
  blacklistRecruit = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("blacklistRecruit"),
  blacklistOOC = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("blacklistOOC"),
  blacklistIC = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("blacklistIC"),
  useHighlighter = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useHighlighter"),
  highlightColor = Services.prefs.getBranch(PREF_BRANCH).getCharPref("highlightColor"),
  useSelector = Services.prefs.getBranch(PREF_BRANCH).getBoolPref("useSelector"),
  tmp;

/* This part sets up the dialog with the existing options */
if (useArranger) { document.getElementById('pct-use-arranger').setAttribute('checked', true); }
if (useBlacklist) { document.getElementById('pct-use-blacklist').setAttribute('checked', true); }
document.getElementById('pct-blacklist-method').selectedIndex = blacklistMethod;
if (blacklistNormal) { document.getElementById('pct-bl-normal').setAttribute('checked', true); }
if (blacklistRecruit) { document.getElementById('pct-bl-rec').setAttribute('checked', true); }
if (blacklistOOC) { document.getElementById('pct-bl-ooc').setAttribute('checked', true); }
if (blacklistIC) { document.getElementById('pct-bl-ic').setAttribute('checked', true); }
if (useHighlighter) { document.getElementById('pct-use-highlighter').setAttribute('checked', true); }
document.getElementById('pct-highlight-color').color = highlightColor;
if (useSelector) { document.getElementById('pct-use-selector').setAttribute('checked', true); }

(function (myArray) {
    var listbox = document.getElementById("pct-blacklist");

    for(i=0; i<myArray.length; i++) {
      addListitem(listbox, myArray[i]);
    }
})(blacklist);

function closedOk() {
  var useArranger = document.getElementById('pct-use-arranger').getAttribute('checked');
  var useBlacklist = document.getElementById('pct-use-blacklist').getAttribute('checked');
  var blacklistArray = getListitems(document.getElementById('pct-blacklist'));
  var blacklistMethod = document.getElementById('pct-blacklist-method').selectedIndex;
  var blacklistNormal = document.getElementById('pct-bl-normal').getAttribute('checked');
  var blacklistRecruit = document.getElementById('pct-bl-rec').getAttribute('checked');
  var blacklistOOC = document.getElementById('pct-bl-ooc').getAttribute('checked');
  var blacklistIC = document.getElementById('pct-bl-ic').getAttribute('checked');
  var useHighlighter = document.getElementById('pct-use-highlighter').getAttribute('checked');
  var highlightColor = document.getElementById('pct-highlight-color').color;
  var useSelector = document.getElementById('pct-use-selector').getAttribute('checked');

  var blacklist = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
  blacklist.data = JSON.stringify(blacklistArray);

  Services.prefs.getBranch(PREF_BRANCH).setBoolPref("useArranger", useArranger);
  Services.prefs.getBranch(PREF_BRANCH).setBoolPref("useBlacklist", useBlacklist);
  Services.prefs.getBranch(PREF_BRANCH).setComplexValue("blacklist", Components.interfaces.nsISupportsString, blacklist);
  Services.prefs.getBranch(PREF_BRANCH).setIntPref("blacklistMethod", blacklistMethod);
  Services.prefs.getBranch(PREF_BRANCH).setBoolPref("blacklistNormal", blacklistNormal);
  Services.prefs.getBranch(PREF_BRANCH).setBoolPref("blacklistRecruit", blacklistRecruit);
  Services.prefs.getBranch(PREF_BRANCH).setBoolPref("blacklistOOC", blacklistOOC);
  Services.prefs.getBranch(PREF_BRANCH).setBoolPref("blacklistIC", blacklistIC);
  Services.prefs.getBranch(PREF_BRANCH).setBoolPref("useHighlighter", useHighlighter);
  Services.prefs.getBranch(PREF_BRANCH).setCharPref("highlightColor", highlightColor);
  Services.prefs.getBranch(PREF_BRANCH).setBoolPref("useSelector", useSelector);
}

function addListitem (listbox, text) {
  var newItem = document.createElement("listitem");
  newItem.textContent = text;
  listbox.appendChild(newItem);
}

function blacklistToArray() {
  var blacklist = Services.prefs.getBranch(PREF_BRANCH).getComplexValue("blacklist", Components.interfaces.nsISupportsString).data;

  return JSON.parse(blacklist);
}

function getListitems (listbox) {
  var myArray = [];
  var items = listbox.children;

  for (i=0; i<items.length; i++) {
    myArray.push(items[i].textContent);
  }
  return myArray;
}

function addItemByDialog () {
  var listbox = document.getElementById('pct-blacklist');
  var name = prompt("Enter a username to blacklist:");

  if (name) {
    addListitem(listbox, name);
  }
}

function deleteItems () {
  var listbox = document.getElementById('pct-blacklist');
  var allItems = listbox.children;

  for (i=0; i<allItems.length; i++) {
    if (allItems[i].selected) {
      listbox.removeChild(allItems[i]);
    }
  }
}

