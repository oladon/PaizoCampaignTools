window['pctCampaigns'] = function(window) {
    const pctUtils = window.pctUtils;
    let ownCampaigns;
    let pageCampaigns = get();

    const fun = [{
        end: {
            day: 26,
            month: 12
        },
        name: 'Christmas',
        run: function(ownPage) {
            if (ownPage) {
                const title = document.querySelector('table td > h1');
                title.classList.add('pct-merry-christmas');
            }

            const dms = document.querySelectorAll('blockquote p.tiny > b:first-child:not(:last-child)');

            for (var i=0; i<dms.length; i++) {
                dms[i].classList.add('pct-merry-christmas', 'pct-merry-christmas-dm');
            }
        },
        start: {
            day: 20,
            month: 12
        },
    }];

    function addFun(ownPage) {
        fun.forEach(function({start, end, run}) {
            if (pctUtils.betweenDates(start, end)) {
                run(ownPage);
            }
        });
    }

    function arrange(campaigns, useMobile) {
        for (var i=0; i<campaigns.length; i++) {
            var row = campaigns[i].parentNode;
            row.classList.add('pct-campaign');

            if (useMobile) {
                row.classList.add('pct-mobile');
            }
        }

        if (campaigns.length > 8) {
            var firstCampaign = campaigns[0],
                firstColumn = firstCampaign.parentNode.parentNode;

            for (var i=0; i<campaigns.length; i++) {
                var row = document.createElement('tr');
                row.classList = campaigns[i].parentNode.classList;

                row.appendChild(campaigns[i]);
                firstColumn.appendChild(row);
            }

            var rows = firstColumn.querySelectorAll('tr');
            for (var i=0; i<rows.length; i++) {
                if (rows[i].children.length === 0) {
                    rows[i].parentNode.removeChild(rows[i]);
                }
            }

            var columnParent = firstColumn.parentNode.parentNode;
            var nextColumn;

            while (nextColumn = columnParent.nextElementSibling) {
                nextColumn.parentNode.removeChild(nextColumn);
            }
        }
    }

    function get() {
        var myCampaigns = [],
            activeCampaigns = document.querySelectorAll('table > tbody > tr > td > table > tbody > tr > td > blockquote > h3 > a');

            for (var i=0; i<activeCampaigns.length; i++) {
            myCampaigns.push(activeCampaigns[i].parentNode.parentNode.parentNode);
        }

        return myCampaigns;
    }

    function hasNew(node) {
        let xNewContainer = node.querySelector('li > .tiny');
        return xNewContainer.firstChild.children.length;
    }

    function initialize(campaigns) {
        ownCampaigns = campaigns;
    }

    function ownP(url) {
        let foundIndex;

        let found = ownCampaigns.find(function(campaign, index) {
            if (campaign.url == url) {
                foundIndex = index;
                return true;
            }
        });

        return {
            campaign: found,
            index: foundIndex,
        };
    }

    function save(campaigns) {
        if (campaigns &&
            campaigns.length > 0) {
            var activeCampaigns = JSON.stringify(campaigns);
            chrome.runtime.sendMessage({ storage: "campaigns", value: activeCampaigns});
            ownCampaigns = campaigns;
        }
    }

    function toArray(campaigns, username) {
        var campaignsArray = campaigns.map(function(campaign) {
            var userDMNode = campaign.querySelector('blockquote > p.tiny > b');
            var userDM = userDMNode && (userDMNode.textContent.trim() == "GameMaster");
            var title = campaign.querySelector('blockquote > h3 > a[title]').title;
            var URL = campaign.querySelector('blockquote > h3 > a[title]').href;
            var userAliases = campaign.querySelectorAll('p.tiny > b > a');
            var userAliasesArray = [];

            for (var alias of [].slice.call(userAliases)) {
                userAliasesArray.push({ name: alias.textContent.trim(),
                                        url: alias.href });
            }

            if (!userAliases || userAliases.length <= 0) {
                userAliasesArray = username && [{ name: username }];
            }

            var campaignObject = { title: title,
                                   url: URL,
                                   user_dm: userDM,
                                   user_aliases: userAliasesArray
                                 };

            return campaignObject;
        });

        return campaignsArray;
    }

    return {
        addFun,
        arrange,
        get,
        hasNew,
        initialize,
        ownCampaigns,
        ownP,
        pageCampaigns,
        save,
        toArray
    };
}(window);
