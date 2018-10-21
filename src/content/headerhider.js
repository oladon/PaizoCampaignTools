(function() {
    const pctUtils = window.pctUtils;

    function initHeaderBox(hidden, linkPMs) {
        const header = document.getElementById('nav-wrapper');
        const box = document.createElement('div');
        box.classList.add('pct-header', 'pct-header-box');

        if (linkPMs) {
            let pmTab = makePMTab(linkPMs);
            pmTab && box.appendChild(pmTab);
        }

        const hider = document.createElement('div');
        hider.classList.add('pct-header', 'pct-header-tab', 'pct-header-hider');

        function toggleHeaderDisplay() {
            chrome.runtime.sendMessage({
                storage: 'hideHeader',
                value: !box.classList.contains('expand')}, function() {
                    header.classList.toggle('pct-hide');
                    box.classList.toggle('expand');
                });
        }

        hider.addEventListener('click', toggleHeaderDisplay);
        box.appendChild(hider);

        if (hidden) {
            toggleHeaderDisplay();
        }

        header.appendChild(box);
    }

    function makePMTab(linkPMs) {
        const tab = document.createElement('div');
        const link = document.createElement('a');
        const indicator = document.createElement('span');

        const pmLink = pctUtils.pmLink();

        if (!pmLink) {
            return;
        }

        const hasNew = pmLink.parentNode.classList.contains('dropdown-personal-has-notifications')

        tab.classList.add('pct-header', 'pct-header-tab', 'pct-pm');
        linkPMs == 'new' && tab.classList.add('pct-pm-new-only');

        link.classList.add('pct-header');
        link.title = pmLink.textContent;
        link.href = pmLink.href;

        indicator.classList.add('pct-header', 'pct-pm-indicator');
        indicator.textContent = 'message';
        link.appendChild(indicator);

        tab.appendChild(link);

        if (hasNew) {
            tab.classList.add('pct-pm-new');
        }

        return tab;
    }

    chrome.runtime.sendMessage({storage: ['useHeaderHider', 'hideHeader', 'useHeaderPM']}, function(response) {
        const useHeaderHider = response && response.storage.useHeaderHider == 'true';
        const useHeaderPM = response && response.storage.useHeaderPM && response.storage.useHeaderPM != 'false' && response.storage.useHeaderPM;
        const hideHeader = response && response.storage.hideHeader == 'true';

        if (useHeaderHider) {
            document.addEventListener('DOMContentLoaded', function() {
                initHeaderBox(hideHeader, useHeaderPM);
            });
        }
    });
})();
