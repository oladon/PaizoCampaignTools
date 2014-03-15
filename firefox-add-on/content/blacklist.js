var pctBlacklist = {
  blackListener: function(evt) {
    var target = evt.currentTarget;
    var username = target.getAttribute("username");
    var action = target.getAttribute("action");

    dump("Received from web page: " + 
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
  }
}

var pref_branch = "extensions.pct.";

function addNameToBlacklist(name) {
  var blacklist = Services.prefs.getBranch(pref_branch).getComplexValue("blacklist", Components.interfaces.nsISupportsString).data;
  var blacklistArray = JSON.parse(blacklist);
  var newBlacklist = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);

  blacklistArray.push(name);
  newBlacklist.data = JSON.stringify(blacklistArray);
  Services.prefs.getBranch(pref_branch).setComplexValue("blacklist", Components.interfaces.nsISupportsString, newBlacklist);
}

function removeNameFromBlacklist(name) {
  var blacklist = Services.prefs.getBranch(pref_branch).getComplexValue("blacklist", Components.interfaces.nsISupportsString).data;
  var blacklistArray = JSON.parse(blacklist);
  var newBlacklist = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
  var index = blacklistArray.indexOf(name);

  blacklistArray.splice(index, 1);
  newBlacklist.data = JSON.stringify(blacklistArray);
  Services.prefs.getBranch(pref_branch).setComplexValue("blacklist", Components.interfaces.nsISupportsString, newBlacklist);
}

function blacklistToArray() {
  var blacklist = Services.prefs.getBranch(pref_branch).getComplexValue("blacklist", Components.interfaces.nsISupportsString).data;

  return JSON.parse(blacklist);
}
