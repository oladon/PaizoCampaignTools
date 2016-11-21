window['pctAliases'] = function(window) {
    var inactiveNames = [];
    var sorters = {
        faction: {
            prop: function(alias) {
                var factionNode = alias && 
                    alias.querySelector('a > img:not([height])');
                return factionNode && factionNode.alt;
            },
            reverseTitle: 'Faction: Z to A',
            title: 'Faction'
        },
        name: {
            prop: function(alias) {
                var nameNode = alias && alias.querySelector('a > b');
                return nameNode && nameNode.textContent;
            },
            reverseTitle: 'Name: Z to A',
            title: 'Name'
        },
        postCount: {
            prop: function(alias) {
                var posts = alias && alias.querySelector('.tiny > .unlink > nobr');
                var countStr = posts && posts.textContent.trim();
                var count = countStr && countStr.replace(/[,() post]+/g,'');
                return Number(count);
            },
            reverseTitle: 'Post Count: High to Low',
            title: 'Post Count: Low to High'
        },
        status: {
            prop: function(alias) {
                var br = alias && alias.querySelector('.tiny > br');
                var statusNode = br && br.nextSibling;
                var status = statusNode && statusNode.textContent.trim();
                return status || '';
            },
            reverseTitle: 'Status Line: Z to A',
            title: 'Status Line'
        }
    }
    
    function addDeactivator(alias) {
        var box = document.createElement('div');
        box.classList.add('pct-deactivator');
        box.title = (alias.inactive ? 'Make Active' : 'Make Inactive');

        box.addEventListener('click', function() {
            toggleActive(alias);
            box.title = (alias.inactive ? 'Make Active' : 'Make Inactive');
        });
        
        alias.appendChild(box);
    }
    
    function addDropDown(container, isPFS, defaultSort) {
        var selectBox = document.createElement('div');
        var label = document.createElement('span');
        label.appendChild(document.createTextNode('Sort By: '));

        var select = makeDropDown(isPFS, defaultSort);
        label.appendChild(select);

        container.appendChild(label);
        
        return select;
    }
    
    function addInactiveSection(container) {
        var table = document.createElement('table');
        table.cellpadding = 12;

        var tbody = document.createElement('tbody');
        tbody.classList.add('pct-alias-set', 'inactive');

        table.appendChild(tbody);
        container.appendChild(table);

        addRightBox([], 'name', tbody);
        
        return tbody;
    }

    function addRightBox(aliases, defaultSort, container) {
        var container = container || aliases[0].parentNode;
        var header = container.parentNode &&
                     container.parentNode.previousElementSibling.previousElementSibling;

        var newBox = document.createElement('div');
        newBox.classList.add('pct-alias-header');

        if (header && header.tagName == 'H2') {
            header.parentNode.insertBefore(newBox, header);
        } else {
            var hr = document.createElement('hr');
            header = makeHeader('Inactive Aliases');
            container.parentNode.parentNode.insertBefore(newBox, container.parentNode);
            container.parentNode.parentNode.insertBefore(hr, container.parentNode);
        }

        newBox.appendChild(header);
        
        var rightBox = document.createElement('div');

        var select = addDropDown(rightBox, aliases.PFS, defaultSort);
        select.addEventListener('change', function() {
            triggerSort(container);
        });

        var toggle = makeButton(container);
        rightBox.appendChild(toggle);

        newBox.appendChild(rightBox);
    }

    function deactivateAlias(name, inactives, cb) {
        var newList;

        inactives.push(name);
        newList = JSON.stringify(inactives);
        chrome.runtime.sendMessage({storage: 'inactiveAliases', value: newList}, cb);
    }

    function getAliases(section) {
        var aliases;
        var qs = 'td[align="center"]';
        aliases = section.querySelectorAll(qs);

        return aliases;
    }
    
    function getInactiveSection() {
        var section = document.querySelector('.pct-alias-set.inactive');
        return section;
    }
    
    function getSections() {
        var sections = document.querySelectorAll('table[cellpadding="12"]');

        if (sections.length == 0) {
            return [];
        }
        
        return sections;
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
            container.classList.toggle('pct-data-view');
        });
        
        return label;
    }
    
    function makeDropDown(isPFS, defaultSort) {
        var options = Object.keys(sorters);
        var select = document.createElement('select');
        select.classList.add('pct-alias-sort');

        options.forEach(function(name) {
            var option = document.createElement('option');
            var revOption = document.createElement('option');
            var sorter = sorters[name];

            if (name == 'faction' && !isPFS) {
                return;
            }

            if (name == defaultSort) {
                option.selected = true;
            }

            option.textContent = sorter.title;
            option.value = name;
            select.appendChild(option);

            revOption.textContent = sorter.reverseTitle;
            revOption.value = name + '-r';
            select.appendChild(revOption);
        });
        
        return select;
    }
    
    function makeHeader(text) {
        var header = document.createElement('h2');
        header.textContent = text;
        
        return header;
    }
    
    function parseInactives(list) {
        if (!list) {
            list = localStorage["inactiveAliases"];
        }

        if (list) {
            return JSON.parse(list);
        }
        
        return [];
    }

    function reactivateAlias(name, inactives, cb) {
        var newList,
            index = inactives.indexOf(name);

        inactives.splice(index, 1);
        newList = JSON.stringify(inactives);
        chrome.runtime.sendMessage({storage: 'inactiveAliases', value: newList}, cb);
    }
    
    function reorder(section, by, reverse) {
        var aliases = getAliases(section);
        var arr;
        var newIndices = {};
        var ordered = [];
        var parent = aliases[0].parentNode;
        
        arr = [].slice.call(aliases).map(function(item, index) {
            return {
                by: by.prop(item),
                index: index
            };
        });

        arr.sort(function(a, b) {
            if ((by.comp && by.comp(a.by, b.by)) ||
                (a.by > b.by)) {
                return 1;
            } else {
                return -1;
            }
        });
        
        arr.map(function(item) {
            var node = aliases[item.index];
            
            if (reverse) {
                parent.insertBefore(node, parent.firstChild);
            } else {
                parent.appendChild(node);
            }
        });
    }

    function run(useInactives) {
        var sections = getSections();

        chrome.runtime.sendMessage({storage: 'inactiveAliases'}, function(response) {
            inactiveNames = parseInactives(response && response.storage);
            var inactiveSection;

            sections.forEach(function(section, index) {
                var aliases = getAliases(section);
                var sectionTitle = section.previousElementSibling.previousElementSibling;

                if (sectionTitle && 
                    sectionTitle.textContent == 'Pathfinder Society Characters') {
                    aliases.PFS = true;
                }

                unrowify(aliases);
                addRightBox(aliases, 'name');
                
                if (useInactives) {
                    aliases.forEach(function(item) {
                        var name = sorters.name.prop(item);

                        if (inactiveNames && inactiveNames.indexOf(name) > -1) {
                            if (!inactiveSection) {
                                inactiveSection = addInactiveSection(item.parentNode.parentNode.parentNode);
                            }

                            item.inactive = true;
                            inactiveSection.appendChild(item);
                        }

                        addDeactivator(item);
                    });
                }

                // Sort aliases
                triggerSort(section, 'name');
            });
        });
    }
    
    function shuffle(section) {
        var aliases = getAliases(section);
        var tbody = aliases[0].parentNode;
        for (i = aliases.length; i >= 0; i--) {
            tbody.appendChild(aliases[Math.random() * i | 0]);
        }
    }
    
    function toggleActive(alias) {
        var inactiveSection = getInactiveSection() || 
            addInactiveSection(alias.parentNode.parentNode.parentNode);
        var name = sorters.name.prop(alias);

        if (alias.inactive) {
            reactivateAlias(name, inactiveNames, function() {
                alias.originalSection.appendChild(alias);
                triggerSort(alias.originalSection);
            });
        } else {
            deactivateAlias(name, inactiveNames, function() {
                alias.originalSection = alias.parentNode;
                inactiveSection.appendChild(alias);
                triggerSort(inactiveSection);
            });
        }

        alias.inactive = !alias.inactive;
    }
    
    function triggerSort(section, sortName) {
        var select;
        var selection = sortName;
    
        if (!sortName) {
            select = section.parentNode.previousElementSibling
                            .previousElementSibling.querySelector('select');
            selection = select.value;
        }

        var [sorter, reverse] = selection.split('-');
        reorder(section, sorters[sorter], reverse);
    }

    function unrowify(aliases) {
        var tbody;
        var trs = [];

        for (var item of aliases) {
            var parent = item.parentNode;
            if (!tbody) {
                tbody = parent.parentNode;
                tbody.classList.add('pct-alias-set');
            }

            if (trs.indexOf(parent) < 0) {
                trs.push(parent);
            }

            tbody.appendChild(item);
        }
        
        for (var row of trs) {
            tbody.removeChild(row);
        }
    }

    return {
        run: run
    };
}(window);
