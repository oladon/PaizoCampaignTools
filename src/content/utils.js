window['pctUtils'] = (function(window) {
    function betweenDates(start, end) {
        const today = new Date();
        const year = today.getFullYear();
        const startDate = makeDate(start);
        const endDate = makeDate(end);

        return today <= endDate && today >= startDate;
    }

    function makeDate({year = (new Date()).getFullYear(),
                       month = '01', day = '01',
                       hour = '00', minute = '00', second = '00'}) {
        const timestamp = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        return new Date(timestamp);
    }

    function pmLink() {
        const link = document.querySelector('#lower-nav-row li.dropdown-personal > a[href*="/pm"], #lower-nav-row li.dropdown-personal-has-notifications > a[href*="/pm"]');
        return link;
    }

    return {
        betweenDates,
        pmLink
    };
})(window);
