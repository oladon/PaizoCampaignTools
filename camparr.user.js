// ==UserScript==
// @name                Paizo Campaign Arranger
// @namespace           http://www.oladon.com
// @description         A script to rearrange Paizo.com campaigns
// @include             http://paizo.com/people/*/campaigns
// @include             http://www.paizo.com/people/*/campaigns
// ==/UserScript==

// This part does the rearranging
GM_addStyle("blockquote > table > tbody > tr > td > table > tbody > tr { \
             display: inline-block; \
             min-width: 250px; \
             max-width: 32%; \
             vertical-align: top; \
             border-spacing: 15px 7px ! important }");

// This part highlights the new post notification link
GM_addStyle("blockquote > table > tbody > tr > td > table > tbody > tr > \
              td > ul > li > span.tiny > span > nobr > a:not([title^="Stop"]) {	\
             background-color: #ffaa00 ! important }");
