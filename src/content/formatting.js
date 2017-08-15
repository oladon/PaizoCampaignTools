window['pctFormatter'] = (function(window) {
    var helpText = {
        code: function(helpParent) {
            var p = document.createElement('p');
            p.classList.add('tiny');
            var span1 = document.createElement('span');
            span1.classList.add('unlink');
            span1.textContent = '(PCT) This text uses ';
            var span2 = document.createElement('span');
            span2.classList.add('unlink');
            span2.textContent = 'code';
            var span3 = document.createElement('span');
            span3.classList.add('unlink');
            span3.textContent = ' formatting.';

            p.appendChild(span1);
            p.appendChild(document.createTextNode('[code]'));
            p.appendChild(span2);
            p.appendChild(document.createTextNode('[/code]'));
            p.appendChild(span3);

            helpParent.appendChild(p);
        },
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
            var period = second.lastElementChild;

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
        'code',
        'color',
        'u'
    ];

    function addHelpText(tag) {
        var postForm = document.getElementById('postPreviewForm');
        var help = postForm &&
            postForm.querySelector('.bordered-box > .bb-content .unlink'),
            helpParent = help && help.parentNode.parentNode;
        helpParent && helpText[tag](helpParent);
    }

    function convertTag(tag, tags) {
        if (!tag || !tag.close || !tags || !(tags.length > 0)) {
            return null;
        }

        var openNode = tag.node;
        var newNode = document.createElement('span');
        var style = getStyle(tag.name, tag.value);

        var newChild = openNode.splitText(tag.location + tag.fullMatch.length);
        updateRefs(tags, openNode, newChild);
        openNode.textContent = openNode.textContent.slice(0, tag.location);

        while (newChild != tag.close.node) {
            var nextSibling = newChild.nextSibling;
            newNode.appendChild(newChild);
            newChild = nextSibling;
        }

        var closeNode = tag.close.node;
        var rightSide = closeNode.splitText(tag.close.location + tag.close.fullMatch.length);

        newNode.appendChild(closeNode);
        updateRefs(tags, closeNode, rightSide);
        closeNode.textContent = closeNode.textContent.slice(0, tag.close.location);

        openNode.parentNode.insertBefore(newNode, rightSide);

        if ((supportedTags.indexOf(tag.name) >= 0) && style) {
            let properties = Object.keys(style);
            properties.forEach(function(prop) {
                let value = style[prop];

                if (typeof value == 'function') {
                    value(newNode);
                } else {
                    (newNode.style[prop]) = style[prop];
                }
            });
        } else {
            return null;
        }

        return newNode;
    }

    function getPosts() {
        var posts = document.querySelectorAll('.post-contents');
        return posts;
    }

    function getStyle(tag, arg) {
        // For now, we assume that there's only one argument.
        var styles = {
            'code': {
                'extra': function(node) {
                    let breaks = node.getElementsByTagName('BR');
                    let item;

                    while (item = breaks[0]) {
                        let sib = item.previousSibling;
                        sib.textContent = sib.textContent.replace(/\r?\n$/, '');
                        node.removeChild(item);
                    }
                },
                'font-family': 'Courier',
                'white-space': 'pre'},
            'color': {'color': arg},
            'u': {'text-decoration': 'underline'}
        };

        return styles[tag];
    }

    function findTags(str) {
        var regex = new RegExp(/\[(\/|)([a-z]+)(?:\=([a-z]+|#[a-f0-9]+)|)\]/gi);
        var tags = [];
        var match;

        while (match = regex.exec(str)) {
            var fullMatch = match[0],
                close = match[1],
                tagName = match[2],
                value = match[3];
            var newObj = {
                fullMatch: fullMatch,
                location: regex.lastIndex - fullMatch.length,
                name: tagName
            };

            if (!close || close == '') {
                newObj.value = value;
            } else {
                newObj.close = true;
            }

          tags.push(newObj);
        }

        return tags;
    }

    function replaceTags(use) {
        var postContents = getPosts();

        if (use) {
            supportedTags.forEach(function(tag) {
                addHelpText(tag);
            });
        }

        if (postContents && postContents.length > 0) {
            for (var i=0; i<postContents.length; i++) {
                tagRecursor(postContents[i], use);
            }
        }
    }

    function stripTags(content, tag) {
        var regexp = new RegExp('\\[\\/?' + tag +
                                '(?:=(?:[a-z]+|#[a-f0-9]+))?\\]', 'gi');
        return content.replace(regexp, '');
    }

    function tagRecursor(parent, use) {
        var children = parent.childNodes;
        var tags = [];

        for (var i=0; i<children.length; i++) {
            var node = children[i];

            // 3 is Node.TEXT_NODE.
            // For some reason, "Node" isn't available.
            if (node.nodeType == 3) {
                if (use) {
                    var text = node.textContent;
                    var strTags = findTags(text);

                    if (strTags && strTags.length) {
                        strTags.forEach(function(newTag) {
                            newTag.node = node;

                            if (!newTag.close) {
                                tags.push(newTag);
                            } else {
                                for (var i=tags.length - 1; i>=0; i--) {
                                    var openTag = tags[i];

                                    if ((newTag.name == openTag.name) &&
                                        !openTag.close) {
                                        openTag.close = newTag;
                                        break;
                                    }
                                }
                            }
                        });
                    }
                } else {
                    supportedTags.forEach(function(tag) {
                        node.textContent = stripTags(node.textContent, tag);
                    });
                }
            } else {
                tagRecursor(node, use);
            }
        }

        if (tags && tags.length) {
            tags.forEach(function(tag) {
                convertTag(tag, tags);
            });
        }
    }

    function updateRefs(tags, oldNode, newNode) {
        tags && tags.forEach(function(tag) {
            if (tag.node == oldNode) {
                var newLoc = (tag.location - oldNode.textContent.length);

                if (newLoc >= 0) {
                    tag.node = newNode;
                    tag.location = newLoc;
                }
            }

            if (tag.close && tag.close.node == oldNode) {
                var newCloseLoc = (tag.close.location - oldNode.textContent.length)

                if (newCloseLoc >= 0) {
                    tag.close.node = newNode;
                    tag.close.location = newCloseLoc;
                }
            }
        });
    }

    return {
        replaceTags: replaceTags
    };
})(window);
