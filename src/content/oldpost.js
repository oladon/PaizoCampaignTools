window['pctOldPost'] = (function(window) {
    function getLastPostDate() {
        var lastDateTime = document.querySelector('div.bb-content > div > div:last-child time');
        if (lastDateTime) {
            return new Date(lastDateTime.getAttribute('datetime'));
        }
    }

    function isMoreThanOneYearAgo(date) {
        var oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return date < oneYearAgo;
    }

    function formatDate(date) {
        return date.toLocaleDateString();
    }

    function getPostBody() {
        return document.getElementById('postBody');
    }

    function addIndicator(postBody, text) {
        var indicator;

        if (postBody) {
            indicator = document.createElement('p');
            indicator.innerHTML = text;
            indicator.classList.add('tiny');
            indicator.style.color = 'red';

            var selectParent = postBody.parentNode;
            selectParent.appendChild(indicator);
        }

        return indicator;
    }

    function addOldPostIndicator() {
        chrome.runtime.sendMessage({}, function(response) {
            var lastPostDate = getLastPostDate();
            var postBody = getPostBody();
            if (postBody && lastPostDate && isMoreThanOneYearAgo(lastPostDate)) {
                var text =
                    'Note: Last post in thread was ' +
                    formatDate(lastPostDate) +
                    ', more than 1 year ago.';
                addIndicator(postBody, text);
            }
        });
    }

    return {
        addOldPostIndicator: addOldPostIndicator
    };
})(window);
