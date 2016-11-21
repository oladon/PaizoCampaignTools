window['pctSelector'] = (function(window) {
    function addSetDefault(select) {
        var selectParent = select.parentNode;
        var setDefault;

        if (select) {
            setDefault = document.createElement('div');
            setDefault.classList.add('pct-alias');
            setDefault.classList.add('form-prompt');
            setDefault.title = 'Set as default for this campaign.';
            
            var icon = document.createElement('i');
            icon.classList.add('material-icons');

            setDefault.appendChild(icon);
            selectParent.appendChild(setDefault);

            addStyles(select);
        }
        
        return setDefault;
    }

    function addStyles(select) {
        var selectParent = select.parentNode;
        select.style.marginTop = '0.1em';
        selectParent.style.verticalAlign = 'middle';
    }

    function getAliasSelect() {
        var selectNodes = document.getElementsByName('person');
        return selectNodes && selectNodes[0];
    }

    function getSelected(select) {
        var selected = select.selectedOptions[0];
        return selected;
    }

    function selectAlias(campaigns, campaign) {
        chrome.runtime.sendMessage({storage: ['defaultAliases']}, function(response) {
            var defaultAliases = response.storage && response.storage.defaultAliases && JSON.parse(response.storage.defaultAliases) || {};
            var alias = defaultAliases[campaign.url] || campaign.user_aliases[0];
            alias = alias.name;
            var select = getAliasSelect();
            var setDefault = addSetDefault(select);

            function clickDefault(e) {
                if (!setDefault.classList.contains('inactive')) {
                    var selected = getSelected(select);
                    alias = selected && selected.textContent;
                    updateDefaultAlias(defaultAliases, campaign, alias, setDefault);
                }
            }
            setDefault.onclick = clickDefault;

            select.onchange = function updateIcon() {
                var selected = getSelected(select),
                    newAlias = selected.textContent;

                if (newAlias == alias) {
                    setDefault.title = 'This alias is your default for this campaign.';
                    setDefault.classList.add('inactive');
                } else {
                    setDefault.title = 'Set as default for this campaign.';
                    setDefault.classList.remove('inactive');
                }
            };

            updateSelect(select, alias, setDefault);
        });
    }

    function updateDefaultAlias(defaultAliases, campaign, name, setDefault) {
        var alias = campaign.user_aliases.find(function(item) {
            return item.name == name;
        });

        defaultAliases[campaign.url] = alias || { name: name, url: '' };

        var newDefaults = JSON.stringify(defaultAliases);
        chrome.runtime.sendMessage({storage: 'defaultAliases', value: newDefaults}, function() {
            setDefault.classList.add('inactive');
        });
    }
    
    function updateSelect(select, alias, setDefault) {
        var options = select.options;

        for (var i=0; i<options.length; i++) {
            var option = options[i];

            if (option.textContent == alias) {
                setDefault.classList.add('inactive');
                setDefault.title = 'This alias is your default for this campaign.';
                option.setAttribute("selected", "selected");
            } else if (option.getAttribute("selected")) {
                option.removeAttribute("selected");
            }
        };
    }

    return {
        selectAlias: selectAlias
    };
})(window);
