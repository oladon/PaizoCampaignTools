window['pctAvatars'] = function(window) {
    var avatars = {};
    var onAliasPage, onPeoplePage;
    const peopleRegexp = new RegExp(/\/people\/[^\/]+/);

    function addAvatarControl(avatar) {
        var overlay = getOverlay(avatar);

        if (overlay) {
            return overlay;
        }

        var aliasURL = getHref(avatar);
        var reader = new FileReader();

        reader.addEventListener('load', function() {
            var dataURI = reader.result;
            saveAvatar(aliasURL, dataURI);
        });

        function importFile(e) {
            var input = e.target;
            var file = input.files[0];
            file && reader.readAsDataURL(file);
        }

        var originalAvatar = getOriginalAvatar(avatar);

        if (!originalAvatar) {
            return;
        }

        avatar.classList.add('pct-avatar');

        overlay = document.createElement('div');
        overlay.classList.add('pct-customize-avatar');
        overlay.setAttribute('pct-src', originalAvatar.src);

        var input = makeFileInput(importFile);
        input.setAttribute('data-icon', 'portrait');
        input.title = 'Import Custom Avatar';
        overlay.appendChild(input);

        var reset = document.createElement('i');
        reset.classList.add('pct-button', 'pct-reset');
        reset.setAttribute('data-icon', 'delete');
        reset.title = 'Clear Custom Avatar';
        overlay.appendChild(reset);

        avatar.appendChild(overlay);
    }

    function appendBackground(element, url) {
        var defaultBackground = getComputedStyle(element).backgroundImage;
        return defaultBackground + ', url(' + url + ')';
    }

    function getAvatars(url) {
        var results, selector;

        if (onAliasPage) {
            selector = '.bb-content td > a:first-child';
        } else {
            selector = '.messageboard-post > a';
        }

        if (url) {
            selector += '[href="' + url + '"]';
        }

        results = document.querySelectorAll(selector);

        return results;
    }

    function getAvatarContainer(post) {
        return post && post.querySelector('.messageboard-post > a[title]');
    }

    function getHref(element) {
        return element && element.getAttribute('href');
    }

    function getOriginalAvatar(element) {
        return element.querySelector('img:not([border])');
    }

    function getOverlay(element) {
        return element.getElementsByClassName('pct-customize-avatar')[0];
    }

    function getProfileAvatar() {
        return document.querySelector('#main-slot td');
    }

    function loadAvatars(callback) {
        chrome.runtime.sendMessage({ storage: 'customAvatars' }, function(response) {
            var results = response && response.storage;
            callback && callback(results && JSON.parse(results) || {});
        });
    }

    function makeFileInput(handler) {
        var label = document.createElement('label');
        label.classList.add('pct-button');

        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = handler;

        label.appendChild(input);

        return label;
    }

    function prepAvatarContainer(item) {
        var originalAvatar = getOriginalAvatar(item);

        if (item.firstElementChild.tagName == 'SPAN') {
            return item.firstElementChild;
        }

        if (originalAvatar) {
            var newContainer = document.createElement('span');

            newContainer.setAttribute('href', item.getAttribute('href'));
            item.insertBefore(newContainer, originalAvatar);
            newContainer.appendChild(originalAvatar);

            return newContainer;
        }
    }

    function prepProfileAvatar(item) {
        var currentHref = document.location.href;
        var [href] = peopleRegexp.exec(currentHref);

        if (href) {
            item.setAttribute('href', href);
            var prepped = prepAvatarContainer(item);
            return prepped;
        }
    }

    function resetAvatar(e) {
        var target = e.target;
        var overlay = target.parentNode;
        var container = overlay.parentNode;
        var input = overlay.querySelector('.pct-button > input');
        var originalAvatar = getOriginalAvatar(container);
        var aliasURL = getHref(container);

        input.value = null;
        saveAvatar(aliasURL);
    }

    function resetBackground(element) {
        element.style.background = null;
    }

    function saveAvatar(aliasURL, imageURI) {
        avatars[aliasURL] = imageURI;
        save();
        updateAvatars(aliasURL, imageURI);
    }

    function save() {
        var avatarsJSON = JSON.stringify(avatars);
        chrome.runtime.sendMessage({ storage: 'customAvatars', value: avatarsJSON});
    }

    function setAvatar(container, newSrc) {
        var aliasURL = getHref(container);
        var originalAvatar = getOriginalAvatar(container);
        var overlay = getOverlay(container);
        var pctSrc = overlay.getAttribute('pct-src');

        if (!newSrc ||
            (pctSrc == originalAvatar.src)) {
            toggleButtonTitle(overlay);
        }

        if (newSrc) {
            overlay.style.background = appendBackground(overlay, originalAvatar.src);
            originalAvatar.src = newSrc;
        } else {
            resetBackground(overlay);
            originalAvatar.src = overlay.getAttribute('pct-src');
        }
    }

    function toggleButtonTitle(overlay) {
        var button = overlay.getElementsByClassName('pct-button')[0];

        if (button.title == 'Change Custom Avatar') {
            button.title = 'Import Custom Avatar';
        } else {
            button.title = 'Change Custom Avatar';
        }
    }

    function updateAvatars(aliasURL, newSrc) {
        withAvatars(function(avatar) {
            setAvatar(avatar, newSrc);
        }, aliasURL);
    }

    function withAvatars(fn, aliasURL) {
        var items = getAvatars(aliasURL);
        var profileAvatar;

        for (var item of items) {
            var avatar = item;

            if (onAliasPage) {
                avatar = prepAvatarContainer(item);
            }

            avatar && fn(avatar);
        }

        if (onPeoplePage) {
            profileAvatar = getProfileAvatar();
            avatar = prepProfileAvatar(profileAvatar);
            avatar && fn(avatar);
        }
    }

    /*
     * For each alias on page:
     * Add an avatar import button (input + label)
     * If a custom avatar is set for the alias, load it and change the button to clear
     * Show old (Paizo default) avatar on hover
     */
    function initialize(postCount, aliasPage, peoplePage) {
        if (!postCount &&
            !aliasPage &&
            !peoplePage) {
            return null;
        }

        onAliasPage = aliasPage;
        onPeoplePage = peoplePage;

        loadAvatars(function(savedAvatars) {
            avatars = savedAvatars;

            withAvatars(function(avatar) {
                var aliasURL = getHref(avatar);
                var customAvatar = avatars[aliasURL];

                addAvatarControl(avatar);
                customAvatar && setAvatar(avatar, customAvatar);
            });

            // Add a global event listener for avatar reset
            document.addEventListener('click', function(e) {
                var target = e.target;

                if (target.classList.contains('pct-reset')) {
                    resetAvatar(e);
                    e.preventDefault();
                }
            });
        });
    }

    return {
        initialize: initialize
    };
}(window);
