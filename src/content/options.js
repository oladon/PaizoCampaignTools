function loadOptions() {
    var ownPage = (window == window.top);

    if (!ownPage &&
        (window.innerWidth == 300 && window.innerHeight == 150)) {
        document.body.classList.add('pct-link-body');
    }

    var useAliasSorter = localStorage["useAliasSorter"],
        useArranger = localStorage["useArranger"],
        showOptionsLink = localStorage["showOptionsLink"],
        useMobile = localStorage["useMobile"],
        useHighlighter = localStorage["useHighlighter"],
        highlightColor = localStorage["highlightColor"],
        useBlacklist = localStorage["useBlacklist"],
        blacklistMethod = localStorage["blacklistMethod"],
        blacklistNormal = localStorage["blacklistNormal"],
        blacklistRecruit = localStorage["blacklistRecruit"],
        blacklistOOC = localStorage["blacklistOOC"],
        blacklistIC = localStorage["blacklistIC"],
        blacklistStore = localStorage["blacklistStore"],
        blacklistBlog = localStorage["blacklistBlog"],
        blacklist = blacklistToArray(),
        useCampaignSorter = localStorage["useCampaignSorter"],
        useChat = localStorage["useChat"],
        useCustomAvatars = localStorage["useCustomAvatars"],
        useExtendedFormatting = localStorage["useExtendedFormatting"],
        useFun = localStorage["useFun"],
        useInactives = localStorage["useInactives"],
        useNeedToPost = localStorage["useNeedToPost"],
        nTPOn = localStorage["nTPOn"],
        nTPOff = localStorage["nTPOff"],
        useSelector = localStorage["useSelector"],
        useOldPostIndicator = localStorage["useOldPostIndicator"],
        oldPostIndicatorAge = localStorage["oldPostIndicatorAge"],
        oldPostIndicatorUnit = localStorage["oldPostIndicatorUnit"],
        useHeaderHider = localStorage["useHeaderHider"],
        useHeaderPM = localStorage["useHeaderPM"],
        hideInactiveAliases = localStorage["hideInactiveAliases"];

    /* This part sets up the dialog with the existing options */
    if (useArranger == "true") { document.getElementById('pct-use-arranger').setAttribute('checked', true); }
    if (showOptionsLink == "true") { document.getElementById('pct-show-options-link').setAttribute('checked', true); }
    if (useMobile == "true") { document.getElementById('pct-use-mobile').setAttribute('checked', true); }
    if (useBlacklist == "true") { document.getElementById('pct-use-blacklist').setAttribute('checked', true); }
    if (blacklistMethod) { document.querySelector('input[value='+blacklistMethod+']').setAttribute('checked', true); }
    if (blacklistNormal == "true") { document.getElementById('pct-bl-normal').setAttribute('checked', true); }
    if (blacklistRecruit == "true") { document.getElementById('pct-bl-rec').setAttribute('checked', true); }
    if (blacklistOOC == "true") { document.getElementById('pct-bl-ooc').setAttribute('checked', true); }
    if (blacklistIC == "true") { document.getElementById('pct-bl-ic').setAttribute('checked', true); }
    if (blacklistStore == "true") { document.getElementById('pct-bl-store').setAttribute('checked', true); }
    if (blacklistBlog == "true") { document.getElementById('pct-bl-blog').setAttribute('checked', true); }
    if (useChat == "true") { document.getElementById('pct-use-chat').setAttribute('checked', true); }
    if (useCustomAvatars == "true") { document.getElementById('pct-use-custom-avatars').setAttribute('checked', true); }
    if (useFun == "true") { document.getElementById('pct-use-fun').setAttribute('checked', true); }
    if (useHeaderHider == "true") { document.getElementById('pct-use-header-hider').setAttribute('checked', true); }
    if (useHeaderPM) { document.querySelector('input[name=useHeaderPM][value='+useHeaderPM+']').setAttribute('checked', true); }
    if (useExtendedFormatting == "true") { document.getElementById('pct-use-extended-formatting').setAttribute('checked', true); }
    if (useHighlighter == "true") { document.getElementById('pct-use-highlighter').setAttribute('checked', true); }
    document.getElementById('pct-highlight-color').value = highlightColor;
    if (useSelector == "true") { document.getElementById('pct-use-selector').setAttribute('checked', true); }
    if (useOldPostIndicator == "true") { document.getElementById('pct-use-old-post-indicator').setAttribute('checked', true); }
    document.getElementById('pct-old-post-indicator-age').value = oldPostIndicatorAge;
    document.getElementById('pct-old-post-indicator-unit').value = oldPostIndicatorUnit;
    if (useInactives == "true") { document.getElementById('pct-use-inactives').setAttribute('checked', true); }
    if (useNeedToPost == "true") { document.getElementById('pct-use-need-to-post').setAttribute('checked', true); }
    document.getElementById('pct-ntp-active-color').value = nTPOn;
    document.getElementById('pct-ntp-inactive-color').value = nTPOff;
    if (useAliasSorter == "true") { document.getElementById('pct-use-alias-sorter').setAttribute('checked', true); }
    if (useCampaignSorter == "true") { document.getElementById('pct-use-campaign-sorter').setAttribute('checked', true); }
    if (hideInactiveAliases == "true") { document.getElementById('pct-hide-inactive-aliases').setAttribute('checked', true); }

    (function (myArray) {
        var listbox = document.getElementById("pct-blacklist");

        if (!myArray) { return false; }

        listbox.size = Math.min(myArray.length + 1, 12);

        for(i=0; i<myArray.length; i++) {
            addListitem(listbox, myArray[i]);
        }
    })(blacklist);

    document.getElementById('pct-blacklist-add').addEventListener('click', addItemByDialog);
    document.getElementById('pct-blacklist-remove').addEventListener('click', deleteItems);
    document.getElementById('pct-clear-custom-avatars').addEventListener('click', clearCustomAvatars);
    document.getElementById('pct-old-post-indicator-unit').addEventListener('change', saveOption);

    var inputs = document.getElementsByTagName('input');
    for (var i = 0; i<inputs.length; i++) {
        inputs[i].addEventListener('change', saveOption);
    }
}

function clearCustomAvatars() {
    var confirmed = confirm('This will clear all custom avatars! Continue?');

    if (confirmed) {
        localStorage["customAvatars"] = '';
        confirmSaved();
    }
}

function confirmSaved() {
    var savedFlag = document.getElementById('saved');

    savedFlag.style.opacity = 100;
    setTimeout( function() { savedFlag.style.opacity = 0; }, 1250);
}

function saveOption(evt) {
    var target = evt.currentTarget,
        oldValue = localStorage[target.name],
        newValue;

    if (target.type == "checkbox") {
        newValue = target.checked;
    } else if ((target.type == "radio") || (target.type == "color") || (target.tagName.toLowerCase() == "select")) {
        newValue = target.value;
    }

    if (oldValue != newValue) {
        localStorage[target.name] = newValue;
        confirmSaved();
    }
}

function saveBlacklist() {
    var blacklistArray = getListitems(document.getElementById('pct-blacklist')),
        blacklist = JSON.stringify(blacklistArray);

    localStorage["blacklist"] = blacklist;
    confirmSaved();
}

function addListitem(listbox, text) {
    var newItem = document.createElement("option");
    newItem.textContent = text;
    listbox.appendChild(newItem);
}

function getListitems(listbox) {
    var myArray = [],
        items = listbox.children;

    for (i=0; i<items.length; i++) {
        myArray.push(items[i].textContent);
    }
    return myArray;
}

function addItemByDialog() {
    var listbox = document.getElementById('pct-blacklist'),
        name = prompt("Enter a username to blacklist:");

    if (name) {
        addListitem(listbox, name);
        saveBlacklist();
    }
}

function deleteItems() {
    var listbox = document.getElementById('pct-blacklist'),
        allItems = listbox.children;

    for (i=0; i<allItems.length; i++) {
        if (allItems[i].selected) {
            listbox.removeChild(allItems[i]);
        }
    }
    saveBlacklist();
}

document.addEventListener('DOMContentLoaded', loadOptions);
