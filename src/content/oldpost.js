window['pctOldPost'] = (function(window) {
    function getLastPostDate() {
        var lastDateTime = document.querySelector('div.bb-content > div > div:last-child time');
        if (lastDateTime) {
            return new Date(lastDateTime.getAttribute('datetime'));
        }
    }

    function isMoreThanSpecifiedTimeAgo(date, age, unit) {
        var specifiedTimeAgo = new Date();
        switch (unit) {
            case 'day':
                specifiedTimeAgo.setDate(specifiedTimeAgo.getDate() - age);
                break;
            case 'month':
                specifiedTimeAgo.setMonth(specifiedTimeAgo.getMonth() - age);
                break;
            case 'year':
            default:
                specifiedTimeAgo.setFullYear(specifiedTimeAgo.getFullYear() - age);
                break;
        }

        return date < specifiedTimeAgo;
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

    function addOldPostIndicator(age, unit) {
        chrome.runtime.sendMessage({}, function(response) {
            var lastPostDate = getLastPostDate();
            var postBody = getPostBody();
            if (postBody && lastPostDate &&
                isMoreThanSpecifiedTimeAgo(lastPostDate, age, unit)) {
                var text =
                    'Note: Last post in thread was ' +
                    formatDate(lastPostDate) +
                    ', more than ' + age + ' ' + unit + '(s) ago.';
                addIndicator(postBody, text);
            }
        });
    }

    return {
        addOldPostIndicator: addOldPostIndicator
    };
})(window);
