Components.utils.import("resource://gre/modules/Services.jsm");

const
  warnSuffix = ' is already in use\nchanges apply to future simulations';

var
  opnr = window.opener,
  pref_branch = "extensions.pct.",
  useArranger = Services.prefs.getBranch(pref_branch).getBoolPref("useArranger"),
  useBlacklist = Services.prefs.getBranch(pref_branch).getBoolPref("useBlacklist"),
  blacklist = blacklistToArray(),
  blacklistNormal = Services.prefs.getBranch(pref_branch).getBoolPref("blacklistNormal"),
  blacklistRecruit = Services.prefs.getBranch(pref_branch).getBoolPref("blacklistRecruit"),
  blacklistOOC = Services.prefs.getBranch(pref_branch).getBoolPref("blacklistOOC"),
  blacklistIC = Services.prefs.getBranch(pref_branch).getBoolPref("blacklistIC"),
  useHighlighter = Services.prefs.getBranch(pref_branch).getBoolPref("useHighlighter"),
  highlightColor = Services.prefs.getBranch(pref_branch).getCharPref("highlightColor"),
  tmp;

/* This part sets up the dialog with the existing options */
document.getElementById('pct-use-arranger').setAttribute('checked', useArranger);
document.getElementById('pct-use-blacklist').setAttribute('checked', useBlacklist);
document.getElementById('pct-bl-normal').setAttribute('checked', blacklistNormal);
document.getElementById('pct-bl-rec').setAttribute('checked', blacklistRecruit);
document.getElementById('pct-bl-ooc').setAttribute('checked', blacklistOOC);
document.getElementById('pct-bl-ic').setAttribute('checked', blacklistIC);
document.getElementById('pct-use-highlighter').setAttribute('checked', useHighlighter);
document.getElementById('pct-highlight-color').color = highlightColor;

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
  var blacklistNormal = document.getElementById('pct-bl-normal').getAttribute('checked');
  var blacklistRecruit = document.getElementById('pct-bl-rec').getAttribute('checked');
  var blacklistOOC = document.getElementById('pct-bl-ooc').getAttribute('checked');
  var blacklistIC = document.getElementById('pct-bl-ic').getAttribute('checked');
  var useHighlighter = document.getElementById('pct-use-highlighter').getAttribute('checked');
  var highlightColor = document.getElementById('pct-highlight-color').color;

  var blacklist = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
  blacklist.data = JSON.stringify(blacklistArray);

  Services.prefs.getBranch(pref_branch).setBoolPref("useArranger", useArranger);
  Services.prefs.getBranch(pref_branch).setBoolPref("useBlacklist", useBlacklist);
  Services.prefs.getBranch(pref_branch).setComplexValue("blacklist", Components.interfaces.nsISupportsString, blacklist);
  Services.prefs.getBranch(pref_branch).setBoolPref("blacklistNormal", blacklistNormal);
  Services.prefs.getBranch(pref_branch).setBoolPref("blacklistRecruit", blacklistRecruit);
  Services.prefs.getBranch(pref_branch).setBoolPref("blacklistOOC", blacklistOOC);
  Services.prefs.getBranch(pref_branch).setBoolPref("blacklistIC", blacklistIC);
  Services.prefs.getBranch(pref_branch).setBoolPref("useHighlighter", useHighlighter);
  Services.prefs.getBranch(pref_branch).setCharPref("highlightColor", highlightColor);
}

function addListitem (listbox, text) {
  var newItem = document.createElement("listitem");
  newItem.textContent = text;
  listbox.appendChild(newItem);
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

