window['pctNeedToPost'] = function(window) {
    let postCampaigns;

    // Add an indicator to the given campaign (with the given value)
    function addIndicator(node, active, hasNew) {
        var button = document.createElement('div');
        button.classList.add('pct-notify');

        var icon = document.createElement('i');
        icon.classList.add('material-icons');

        button.appendChild(icon);
        node.insertBefore(button, node.firstChild);

        if (!active && hasNew) {
            toggle(button);
        } else {
            set(button, active);
        }
    }

    // Add indicators to all campaigns
    function addIndicators(campaigns) {
        for (var i=0; i<campaigns.length; i++) {
            let title = campaigns[i].querySelector('blockquote > h3');
            let url = getURL(title);
            let {campaign} = pctCampaigns.ownP(url);

            if (campaign) {
                addIndicator(title, postCampaigns[url], pctCampaigns.hasNew(campaigns[i]));
            }
        }
    }

    function addStyleRule(active, inactive) {
        const rules = `.pct-notify > i {
            color: ${inactive};
        }

        .pct-notify.pct-active > i {
            color: ${active};
        }

        .pct-notify:hover {
            color: ${inactive};
            filter: drop-shadow(${shadow(inactive)} 0px 0px 5px);
        }

        .pct-notify.pct-active:hover {
            filter: drop-shadow(${shadow(active)} 0px 0px 5px);
        }`;
        const style = document.createElement('style');

        if (style.styleSheet) {
            style.styleSheet.cssText = rules;
        } else {
            style.appendChild(document.createTextNode(rules));
        }

        document.getElementsByTagName('head')[0].appendChild(style);
    }

    function getURL(title) {
        const anchor = title.querySelector('a[href]');
        return anchor.href;
    }

    function initialize(campPage) {
        chrome.runtime.sendMessage({storage: ['nTPCampaigns', 'nTPOn', 'nTPOff']}, function(response) {
            let {nTPOn: active, nTPOff: inactive} = response.storage;

            postCampaigns = response.storage &&
                response.storage.nTPCampaigns &&
                JSON.parse(response.storage.nTPCampaigns) || {};

            if (!campPage) {
                return;
            }

            addStyleRule(active, inactive);
            addIndicators(pctCampaigns.pageCampaigns);

            document.addEventListener('click', function(e) {
                var target = e.target;
                var parent = target.parentNode;

                if (parent.classList.contains('pct-notify')) {
                    toggle(parent);
                    e.preventDefault();
                }
            });
        });
    }

    function posted(url) {
        if (postCampaigns[url]) {
            save(url, false);
        }
    }

    function save(url, active) {
        postCampaigns[url] = active;
        var asJSON = JSON.stringify(postCampaigns);
        chrome.runtime.sendMessage({ storage: 'nTPCampaigns', value: asJSON});
    }

    function set(indicator, active) {
        if (active) {
            indicator.classList.add('pct-active');
            indicator.title = 'You need to post in this game!';
        } else {
            indicator.classList.remove('pct-active');
            indicator.title = 'Click to remind yourself to post';
        }
    }

    function shadow(color) {
        let r, g, b, newColor;

        function extractAndModify(a, b) {
            let intForm = parseInt(color.substr(a, 2), 16);
            let value = Math.min(255, intForm + b);
            return value.toString(16);
        }

        r = extractAndModify(1, 23);
        g = extractAndModify(3, 91);
        b = extractAndModify(5, 85);

        newColor = '#' + r + g + b;

        return newColor;
    }

    function toggle(item) {
        const campaignURL = getURL(item.parentNode);
        const active = !item.classList.contains('pct-active');

        set(item, active);
        save(campaignURL, active);
    }

    return {
        initialize,
        posted
    };
}(window);
