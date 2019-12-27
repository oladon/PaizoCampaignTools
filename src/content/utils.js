window['pctUtils'] = (function(window) {
    function betweenDates(start, end) {
        const today = new Date();
        const year = today.getFullYear();
        const startDate = makeDate(start);
        const endDate = makeDate(end);

        return today <= endDate && today >= startDate;
    }

    function findParentNode(node, parentClass) {
        if (!node.parentNode ||
            node.parentNode == document.body) {
            return;
        }

        if (node.classList &&
            node.classList.contains(parentClass)) {
            return node;
        }

        return findParentNode(node.parentNode, parentClass);
    }

    // From https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
    function hash(str) {
        var hash = 0, i, chr;

        if (str.length === 0) return hash;

        for (i = 0; i < str.length; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }

        return hash;
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

    function sortNodes(nodes, by, reverse) {
        var arr;
        var newIndices = {};
        var ordered = [];
        var parent = nodes[0].parentNode;

        arr = [].slice.call(nodes).map(function(item, index) {
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
            var node = nodes[item.index];

            if (reverse) {
                parent.insertBefore(node, parent.firstChild);
            } else {
                parent.appendChild(node);
            }
        });
    }

    return {
        betweenDates,
        findParentNode,
        hash,
        pmLink,
        sortNodes
    };
})(window);
