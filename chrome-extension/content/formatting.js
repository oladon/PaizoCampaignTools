window['pctFormatter'] = (function(window) {
    var helpText = {
        color: function(helpParent) {
            var p = document.createElement('p');
            p.classList.add('tiny');
            var span1 = document.createElement('span');
            span1.classList.add('unlink');
            span1.appendChild(document.createTextNode('(PCT) This text has '));
            var span2 = document.createElement('span');
            span2.classList.add('unlink');
            span2.appendChild(document.createTextNode('red'));
            var span3 = document.createElement('span');
            span3.classList.add('unlink');
            span3.appendChild(document.createTextNode(' and '));
            var span4 = document.createElement('span');
            span4.classList.add('unlink');
            span4.appendChild(document.createTextNode('blue'));
            var span5 = document.createElement('span');
            span5.classList.add('unlink');
            span5.appendChild(document.createTextNode(' text.'));

            p.appendChild(span1);
            p.appendChild(document.createTextNode('[color=red]'));
            p.appendChild(span2);
            p.appendChild(document.createTextNode('[/color]'));
            p.appendChild(span3);
            p.appendChild(document.createTextNode('[color=#0000ff]'));
            p.appendChild(span4);
            p.appendChild(document.createTextNode('[/color]'));
            p.appendChild(span5);

            helpParent.appendChild(p);
        },
        u: function(helpParent) {
            var second = helpParent.children[1];
            var period = second.children.lastElementChild;
            var and = document.createElement('span');
            and.classList.add('unlink');
            and.appendChild(document.createTextNode(' and (PCT) '));
            var underline = document.createElement('span');
            underline.classList.add('unlink');
            underline.appendChild(document.createTextNode('underline'));

            second.insertBefore(and, period);
            second.insertBefore(document.createTextNode('[u]'), period);
            second.insertBefore(underline, period);
            second.insertBefore(document.createTextNode('[/u]'), period);
        }
    };

    var supportedTags = [
        'color',
        'u'
    ];

    function addHelpText(tag) {
        var help = document.querySelector('.bb-content .unlink'),
            helpParent = help && help.parentNode.parentNode;
        helpParent && helpText[tag](helpParent);
    }

    function getPosts() {
        var posts = document.querySelectorAll('.post-contents');
        return posts;
    }

    function getStyle(tag, arg) {
        // For now, we assume that there's only one argument.
        var styles = {
            'color': ['color', arg],
            'u': ['text-decoration', 'underline']
        };

        return styles[tag];
    }

    function matchTags(string, tag) {
        var regexp = new RegExp('\\[' + tag +
                                '(?:=(?:[A-Za-z]+|#[A-Fa-f0-9]+))?\\].*?\\[\\/' +
                                tag + '\\]', 'gi');
        return string.match(regexp);
    }

    function replaceTag(string, tag) {
        var regexp = new RegExp('\\[' + tag +
                                '(?:=([A-Za-z]+|#[A-Fa-f0-9]+|)|)\\](.*?)\\[\\/' +
                                tag + '\\]'),
            matches = string.match(regexp),
            argString = matches[1],
            inside = matches[2];

        var node = document.createElement('span');
        var style = getStyle(tag, argString);
        node.style[style[0]] = style[1];
        node.innerHTML = inside;

        return node.outerHTML;
    }

    function replaceTags(use) {
        var postContents = getPosts();

        if (use && use == "true") {
            supportedTags.forEach(function(tag) {
                addHelpText(tag);
            });
        }

        [].slice.call(postContents).forEach(function(post) {
            var html = post.innerHTML;
            if (use && use == "true") {
                supportedTags.forEach(function(tag) {
                    var matches = matchTags(html, tag);

                    matches && matches.forEach(function(match) {
                        var replacement = replaceTag(match, tag);
                        html = html.replace(match, replacement);
                    });
                });
            } else {
                supportedTags.forEach(function(tag) {
                    var replacement = stripTags(html, tag);
                    html = replacement;
                });
            }
                
            post.innerHTML = html;
        });
    }

    function stripTags(content, tag) {
        var regexp = new RegExp('\\[\\/?' + tag +
                                '(?:=(?:[A-Za-z]+|#[A-Fa-f0-9]+))?\\]', 'gi');
        return content.replace(regexp, '');
    }

    return {
        replaceTags: replaceTags
    };
})(window);
