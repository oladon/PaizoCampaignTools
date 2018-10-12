(function() {
    function initHeaderHider(hidden) {
        const header = document.getElementById('nav-wrapper');

        const hider = document.createElement('div');
        hider.classList.add('pct-header-hider');

        function toggleHeaderDisplay() {
            chrome.runtime.sendMessage({
                storage: 'hideHeader',
                value: !hider.classList.contains('expand')}, function() {
                    header.classList.toggle('pct-hide');
                    hider.classList.toggle('expand');
                });
        }

        hider.addEventListener('click', toggleHeaderDisplay);

        if (hidden) {
            toggleHeaderDisplay();
        }

        header.appendChild(hider);
    }

    chrome.runtime.sendMessage({storage: ['useHeaderHider', 'hideHeader']}, function(response) {
        const useHeaderHider = response && response.storage.useHeaderHider == 'true';
        const hideHeader = response && response.storage.hideHeader == 'true';

        if (useHeaderHider) {
            document.addEventListener('DOMContentLoaded', function() {
                initHeaderHider(hideHeader);
            });
        }
    });
})();
