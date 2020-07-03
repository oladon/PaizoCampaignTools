window['pctCampaigns'] = function(window) {
    const pctUtils = window.pctUtils;
    const newPostCount = new RegExp(/(\d+) new/);

    let dragElement;
    let ownCampaigns;
    let pageCampaigns = get();
    let pageHash;

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

    const sorters = {
        character: {
            prop: function(campaign) {
                var aliases = getAliases(campaign);
                var alias = aliases && aliases[0] && aliases[0].name;
                return alias;
            },
            reverseTitle: 'Primary Character: Z to A',
            title: 'Primary Character'
        },
        custom: {
            prop: function(campaign) {
                var order = campaign.getAttribute('data-order');
                return Number(order);
            },
            title: 'Custom'
        },
        name: {
            prop: function(campaign) {
                var nameNode = campaign && campaign.querySelector('h3 > a');
                return nameNode && nameNode.textContent;
            },
            reverseTitle: 'Name: Z to A',
            title: 'Name'
        },
        newPosts: {
            comp: function(a, b) {
                return a < b;
            },
            prop: function(campaign) {
                const newPostBox = getNewPosts(campaign);
                const newPosts = newPostBox.textContent.match(newPostCount);
                return newPosts && newPosts[1];
            },
            reverseTitle: 'New Posts: Descending',
            title: 'New Posts'
        },
        paizoDefault: {
            prop: function(campaign) {
                var order = campaign.getAttribute('pct-default-order');
                return Number(order);
            },
            title: 'Paizo Default'
        },
    };

    function addFun(ownPage) {
        fun.forEach(function({start, end, run}) {
            if (pctUtils.betweenDates(start, end)) {
                run(ownPage);
            }
        });
    }

    function addDropDown(container, defaultSort) {
        var selectBox = document.createElement('div');
        var label = document.createElement('span');
        label.appendChild(document.createTextNode('Sort By: '));

        var select = makeDropDown(defaultSort);
        label.appendChild(select);

        container.appendChild(label);

        return select;
    }

    function addRightBox(campaigns, defaultSort = 'paizoDefault') {
        const container = campaigns[0].parentNode;
        const grandparent = pctUtils.findParentNode(container, 'bb-content');
        const header = grandparent && grandparent.getElementsByTagName('H2')[0];

        var newBox = document.createElement('div');
        newBox.classList.add('pct-section-header', 'pct-campaigns-header');

        header.parentNode.insertBefore(newBox, header);
        newBox.appendChild(header);

        var rightBox = document.createElement('div');

        var select = addDropDown(rightBox, defaultSort);
        select.addEventListener('change', function() {
            triggerSort(container);
        });

        grandparent.classList.add('pct-sort-' + defaultSort);

        var toggle = makeButton(container);
        rightBox.appendChild(toggle);

        newBox.appendChild(rightBox);

        triggerSort(container);
    }

    function arrange(campaigns, useMobile) {
        const firstCampaign = campaigns[0];

        for (var i=0; i<campaigns.length; i++) {
            var row = campaigns[i];
            row.classList.add('pct-campaign');

            if (useMobile) {
                row.classList.add('pct-mobile');
            }
        }

        if (campaigns.length > 8) {
            var firstColumn = firstCampaign.parentNode;

            for (var i=0; i<campaigns.length; i++) {
                firstColumn.appendChild(campaigns[i]);
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

        deleteEmptyRows(firstCampaign.parentNode);
    }

    function deleteEmptyRows(container) {
        const rows = container.querySelectorAll('tr:not(.pct-campaign)');

        for (let row of rows) {
            if (row.parentNode == container) {
                row.parentNode.removeChild(row);
            }
        }
    }

    function disableEdit() {
        const container = pageCampaigns[0].parentNode.parentNode;
        const checkbox = document.querySelector('.pct-toggle > input');
        checkbox.checked = false;

        for (var node of pageCampaigns) {
            node.removeAttribute('draggable');
            node.removeEventListener('dragenter', dragEnter);
            node.removeEventListener('dragleave', dragLeave);
            node.removeEventListener('dragover', dragOver);
        }

        container.classList.remove('pct-edit-mode');
        container.removeEventListener('drop', handleDrop);
        container.removeEventListener('dragstart', dragStart);
    }

    function dragEnter(e) {
        oldTargetCampaign = findParentCampaign(e.target);
        e.dataTransfer || (e.dataTransfer = e.originalEvent.dataTransfer);
        e.dataTransfer.dropEffect = 'move';

        if (oldTargetCampaign && oldTargetCampaign != dragElement) {
            var side = eSide(oldTargetCampaign, e.clientX);
            oldTargetCampaign.classList.add('pct-drag-target-' + side);
        }

        e.preventDefault();
    }

    function dragLeave(e) {
        var targetCampaign = findParentCampaign(e.target);

        if (e.currentTarget == oldTargetCampaign) {
            return;
        }

        if (targetCampaign) {
            targetCampaign.classList.remove('pct-drag-target-left');
            targetCampaign.classList.remove('pct-drag-target-right');
        }
    }

    function dragOver(e) {
        if (oldTargetCampaign && e.currentTarget != dragElement) {
            //        var rect = oldTargetCampaign.getBoundingClientRect();
            //        var half = rect.left + (oldTargetCampaign.offsetWidth / 2);
            var side = eSide(oldTargetCampaign, e.clientX);

            if (side == 'right') {
                oldTargetCampaign.classList.add('pct-drag-target-right');
                oldTargetCampaign.classList.remove('pct-drag-target-left');
            } else {
                oldTargetCampaign.classList.add('pct-drag-target-left');
                oldTargetCampaign.classList.remove('pct-drag-target-right');
            }
        }

        e.preventDefault();
    }

    function dragStart(e) {
        dragElement = findParentCampaign(e.target);

        if (!dragElement.classList.contains('pct-campaign')) {
            return;
        }

        e.dataTransfer || (e.dataTransfer = e.originalEvent.dataTransfer);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', dragElement);
        dragElement.classList.add('pct-dragging');
    }

    function enableEdit() {
        var container = pageCampaigns[0].parentNode.parentNode;

        for (var node of pageCampaigns) {
            node.setAttribute('draggable', 'true');
            node.addEventListener('dragenter', dragEnter);
            node.addEventListener('dragleave', dragLeave);
            node.addEventListener('dragover', dragOver);
        }

        container.classList.add('pct-edit-mode');
        container.addEventListener('drop', handleDrop);
        container.addEventListener('dragstart', dragStart);
    }

    function eSide(campaign, x) {
        var rect = campaign.getBoundingClientRect();
        var half = rect.left + (campaign.offsetWidth / 2);
        return x > half ? 'right' : 'left';
    }

    function findDragging() {
        var item = document.getElementsByClassName('pct-dragging')[0];
        return item;
    }

    function findParentCampaign(node) {
        return pctUtils.findParentNode(node, 'pct-campaign');
    }

    function get() {
        var myCampaigns = [],
            activeCampaigns = document.querySelectorAll('table > tbody > tr > td > table > tbody > tr > td > blockquote > h3 > a');

            for (var i=0; i<activeCampaigns.length; i++) {
                let campaign = activeCampaigns[i].parentNode.parentNode.parentNode.parentNode;
                myCampaigns.push(campaign);
                campaign.setAttribute('data-order', myCampaigns.length);

                if (!campaign.hasAttribute('pct-default-order')) {
                    campaign.setAttribute('pct-default-order', myCampaigns.length);
                }
            }

        return myCampaigns;
    }

    function getAliases(campaign, username) {
        var aliasNodes = campaign.querySelectorAll('p.tiny > b > a');
        var aliases = [];

        for (var alias of [].slice.call(aliasNodes)) {
            aliases.push({ name: alias.textContent.trim(),
                           url: alias.href });
        }

        if (!aliasNodes || aliasNodes.length <= 0) {
            aliases = username && [{ name: username }];
        }

        return aliases;
    }

    function getGameplayId(campaign) {
        const gameplayAnchor = campaign.querySelector('[id^=xnew_thread_gameplay_]');
        const gameplayId = gameplayAnchor && gameplayAnchor.id.replace('xnew_thread_gameplay_', '');
        return gameplayId;
    }

    function getNewPosts(campaign) {
        let xNewContainer = campaign.querySelector('li > .tiny');
        return xNewContainer.firstChild;
    }

    function getOrder(campaign) {
        const order = campaign.getAttribute('data-order');
        return order;
    }

    function handleDrop(e) {
        var item = dragElement;
        e.dataTransfer || (e.dataTransfer = e.originalEvent.dataTransfer);
        var parentCampaign = findParentCampaign(e.target);

        if (item && (item != parentCampaign)) {
            item.parentNode.removeChild(item);

            if (!parentCampaign) {
                return;
            }

            if (parentCampaign.classList.contains('pct-drag-target-left')) {
                parentCampaign.parentNode.insertBefore(item, parentCampaign);
            } else {
                parentCampaign.parentNode.insertBefore(item, parentCampaign.nextElementSibling);
            }
        }

        dragElement.classList.remove('pct-dragging');
        dragElement = null;

        for (let node of pageCampaigns) {
            node.classList.remove('pct-drag-target-left');
            node.classList.remove('pct-drag-target-right');
        }

        e.preventDefault();
    }

    function hasNew(node) {
        let newContainer = getNewPosts(node);
        return newContainer.children.length;
    }

    function initialize(campaigns) {
        ownCampaigns = campaigns;
    }

    function initializeReorder(hash, campaigns, campaignSort, campaignOrder) {
        pageHash = hash;
        restoreOrder(campaigns, campaignOrder);
        addRightBox(campaigns, campaignSort);
    }

    function makeButton(container) {
        var label = document.createElement('label');
        label.classList.add('pct-toggle');

        var input = document.createElement('input');
        input.type = 'checkbox';
        label.appendChild(input);

        var indicator = document.createElement('div');
        indicator.classList.add('pct-indicator');
        label.appendChild(indicator);

        label.addEventListener('change', function(e) {
            if (input.checked) {
                enableEdit();
                sorters.custom.setSelected();
            } else {
                saveOrder();
                disableEdit();
            }
        });

        return label;
    }

    function makeDropDown(defaultSort) {
        var options = Object.keys(sorters);
        var select = document.createElement('select');
        select.classList.add('pct-campaign-sort');

        options.forEach(function(name) {
            var option = document.createElement('option');
            var revOption = document.createElement('option');
            var sorter = sorters[name];

            if (name == defaultSort) {
                option.selected = true;
            }

            option.textContent = sorter.title;
            option.value = name;
            select.appendChild(option);
            sorter.setSelected = setSelected(option);

            if (sorter.reverseTitle) {
                revOption.textContent = sorter.reverseTitle;
                revOption.value = name + '-r';

                if (name + '-r' == defaultSort) {
                    revOption.selected = true;
                }

                select.appendChild(revOption);
            }
        });

        return select;
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

    function restoreOrder(campaigns, order) {
        if (!order) {
            return;
        }

        for (let i=0; i<campaigns.length; i++) {
            let campaign = campaigns[i];
            let campaignId = getGameplayId(campaign);
            let targetOrder = order[campaignId];

            targetOrder && campaign.setAttribute('data-order', targetOrder);
        }
    }

    function save(campaigns) {
        if (campaigns &&
            campaigns.length > 0) {
            var activeCampaigns = JSON.stringify(campaigns);
            chrome.runtime.sendMessage({ storage: "campaigns", value: activeCampaigns});
            ownCampaigns = campaigns;
        }
    }

    function saveOrder() {
        const campaigns = get();
        pageCampaigns = campaigns;
        const campaignOrder = {};

        for (let i=0; i<pageCampaigns.length; i++) {
            let campaign = pageCampaigns[i];
            let order = i + 1;
            let campaignId = getGameplayId(campaign);

            campaign.setAttribute('data-order', order);
            campaignId && (campaignOrder[campaignId] = order);
        }

        chrome.runtime.sendMessage({
            storage: 'customCampaignOrder-' + pageHash,
            value: JSON.stringify(campaignOrder)
        });
    }


    function saveSort(sort) {
        chrome.runtime.sendMessage({
            storage: 'campaignSort-' + pageHash,
            value: sort
        });
    }

    function setSelected(option) {
        const section = pageCampaigns[0].parentNode;

        return function() {
            const options = option.parentNode.children;

            for (let opt of options) {
                opt.selected = false;
            }

            option.selected = true;
            triggerSort(section);
        };
    }

    function toArray(campaigns, username) {
        var campaignsArray = campaigns.map(function(campaign) {
            var id = getGameplayId(campaign);
            var userDMNode = campaign.querySelector('blockquote > p.tiny > b');
            var userDM = userDMNode && (userDMNode.textContent.trim() == "GameMaster");
            var title = campaign.querySelector('blockquote > h3 > a[title]').title;
            var URL = campaign.querySelector('blockquote > h3 > a[title]').href;
            var userAliases = getAliases(campaign, username);

            var campaignObject = {
                id,
                title,
                url: URL,
                user_aliases: userAliases,
                user_dm: userDM
            };

            return campaignObject;
        });

        return campaignsArray;
    }

    function triggerSort(section, sortName) {
        let headerParent = pctUtils.findParentNode(section, 'bb-content');
        let select;
        let selection = sortName;

        if (!sortName) {
            select = headerParent.querySelector('.pct-section-header select');
            selection = select.value;
        }

        if (selection != 'custom') {
            disableEdit();
        }

        var [sorter, reverse] = selection.split('-');
        pctUtils.sortNodes(pageCampaigns, sorters[sorter], reverse);
        headerParent.classList.add('pct-sort-' + sorter);
        saveSort(selection);
    }

    return {
        addFun,
        arrange,
        get,
        hasNew,
        initialize,
        initializeReorder,
        ownCampaigns,
        ownP,
        pageCampaigns,
        save,
        toArray
    };
}(window);
