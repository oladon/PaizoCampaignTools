window['pctUtils'] = (function(window) {
    function pmLink() {
        const link = document.querySelector('#lower-nav-row li.dropdown-personal > a[href*="/pm"], #lower-nav-row li.dropdown-personal-has-notifications > a[href*="/pm"]');
        return link;
    }

    return {
        pmLink
    };
})(window);
