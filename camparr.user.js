// ==UserScript==
// @name Paizo Campaign Arranger
// @namespace http://www.oladon.com
// @description A script to rearrange Paizo.com campaigns
// @include http://paizo.com/people/*/campaigns
// @include http://www.paizo.com/people/*/campaigns
// ==/UserScript==

function getCampaigns() {
   var myCampaigns = [], 
       activeCampaigns = document.querySelectorAll('table > tbody > tr > td > table > tbody > tr > td > blockquote > h3 > a');
   for (var i=0; i<activeCampaigns.length; i++) {
     myCampaigns.push(activeCampaigns[i].parentNode.parentNode.parentNode);
   }
   return myCampaigns;
}

var campaigns = getCampaigns();
if (campaigns.length > 8) {
    var firstCampaign = campaigns[0];
    var firstColumn = firstCampaign.parentNode.parentNode;
    for (var i=0; i<campaigns.length; i++) {
        var row = document.createElement('tr');
        row.appendChild(campaigns[i]);
        firstColumn.appendChild(row);
    }

    var rows = firstColumn.querySelectorAll('tr');
    for (var i=0; i<rows.length; i++) {
        if (rows[i].children.length === 0) {
            rows[i].parentNode.removeChild(rows[i]);
        }
    }
    
    var secondColumn = firstColumn.parentNode.parentNode.nextSibling.nextSibling;
    console.log(secondColumn);
    secondColumn.parentNode.removeChild(secondColumn);
}

GM_addStyle('table > tbody > tr > td > table > tbody > tr { display: inline-block; width: 100%; vertical-align: top; border-spacing: 15px 7px ! important }');

GM_addStyle('@media (min-width: 635px) and (max-width: 935px) { table > tbody > tr > td > table > tbody > tr { width: 49%; } }');

GM_addStyle('@media (min-width: 935px) and (max-width: 1585px) { table > tbody > tr > td > table > tbody > tr { width: 32%; } }');

GM_addStyle('@media (min-width: 1585px) { table > tbody > tr > td > table > tbody > tr { width: 24%; } }');

// This part highlights the new posts link
GM_addStyle("table > tbody > tr > td > table > tbody > tr > td > blockquote > p > span.tiny > span > a:not([title^='Stop']) { background-color: #ffaa00 ! important }")
