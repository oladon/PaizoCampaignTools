Components.utils.import("resource://gre/modules/Services.jsm");

const Cc = Components.classes;
const Ci = Components.interfaces;
const PREF_BRANCH = "extensions.pct.";
const PREFS = {
  useArranger: true,
  useBlacklist: true,
  blacklist: [],
  blacklistNormal: true,
  blacklistRecruit: true,
  blacklistOOC: true,
  blacklistIC: false,
  useHighlighter: true,
  highlightColor: "#ffaa00"
};

const hideSheetUri = Services.io.newURI("chrome://pct/skin/pct.css", null, null);

function setDefaultPrefs() {
  let branch = Services.prefs.getDefaultBranch(PREF_BRANCH);
  for (let [key, val] in Iterator(PREFS)) {
    switch (typeof val) {
      case "boolean":
        branch.setBoolPref(key, val);
        break;
      case "number":
        branch.setIntPref(key, val);
        break;
      case "string":
        branch.setCharPref(key, val);
        break;
      case "object":
        var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
        str.data = JSON.stringify(val);
        branch.setComplexValue(key, Components.interfaces.nsISupportsString, str);
    }
  }
}

function handlePaizo(b) {
    var useArranger = Services.prefs.getDefaultBranch(PREF_BRANCH).getBoolPref("useArranger");

    b.messageManager.loadFrameScript("chrome://pct/content/blacklist.js", true);
    b.messageManager.loadFrameScript("chrome://pct/content/pct.js", true);
    if (useArranger == true) {
        let winUtils = b.contentWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
        winUtils.loadSheet(hideSheetUri, 1);
    }
}

var WindowListener = {
  setupBrowserUI: function(window) {
    let document = window.document;

    window.gBrowser.addTabsProgressListener({
      onLocationChange: function (browser, webProgress, request, location) {  },
      onProgressChange: function (webProgress, request, location) {  },
      onSecurityChange: function (webProgress, request, location) {  },
      onStateChange: function (browser, webProgress, request, stateflags, status) {
          if ((request.name.indexOf("paizo.com") >= 0) && (stateflags & 0x00000010)) {
              dump("Request name: " + request.name + "\n");
              handlePaizo(window.gBrowser.getBrowserForDocument(webProgress.DOMWindow.document));
          }
      },
      onStatusChange: function (webProgress, request, location) {  }});

    // Take any steps to add UI or anything to the browser window
    // document.getElementById() etc. will work here
    dump(document.location.href + "\n");
    dump(Services.prefs.getDefaultBranch(PREF_BRANCH).getCharPref("highlightColor") + "\n");
    var num = window.gBrowser.browsers.length;
    for (var i = 0; i < num; i++) {
      var b = window.gBrowser.getBrowserAtIndex(i);
      try {
	if (b.currentURI.spec.indexOf('paizo.com') >= 0) {
//            dump(b.currentURI.spec + "\n"); // dump URLs of all open tabs to console
            handlePaizo(b);
        }
      } catch(e) {
       Components.utils.reportError(e);
      }
      // Listened here for load - no dice
    }
  },

  tearDownBrowserUI: function(window) {
    let document = window.document;

    // Take any steps to remove UI or anything from the browser window
    // document.getElementById() etc. will work here
  },

  // nsIWindowMediatorListener functions
  onOpenWindow: function(xulWindow) {
    // A new window has opened
    let domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsIDOMWindow);

    // Wait for it to finish loading
    domWindow.addEventListener("load", function listener() {
      domWindow.removeEventListener("load", listener, false);

      // If this is a browser window then setup its UI
      if (domWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser")
        WindowListener.setupBrowserUI(domWindow);
    }, false);
  },

  onCloseWindow: function(xulWindow) {
  },

  onWindowTitleChange: function(xulWindow, newTitle) {
  }
};

function startup(data, reason) {
  setDefaultPrefs();
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].
           getService(Ci.nsIWindowMediator);

  // Get the list of browser windows already open
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);

    WindowListener.setupBrowserUI(domWindow);
  }

  // Wait for any new browser windows to open
  wm.addListener(WindowListener);

}

function shutdown(data, reason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (reason == APP_SHUTDOWN)
    return;

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].
           getService(Ci.nsIWindowMediator);

  // Get the list of browser windows already open
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    // Listened here for load on domWindow and windows.getNext() - no dice

    WindowListener.tearDownBrowserUI(domWindow);
  }

  // Stop listening for any new browser windows to open
  wm.removeListener(WindowListener);
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
