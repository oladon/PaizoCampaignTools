#!/bin/bash

cd src

## Chrome
VERSION=`grep '"version"' manifest.json.chrome | grep -oE '[0-9.]+'`;
cp manifest.json.chrome manifest.json
cp skin/fonts.css.chrome skin/fonts.css
zip -r pct-chrome-${VERSION}.zip content/ skin/ manifest.json
zip -d pct-chrome-${VERSION}.zip skin/fonts.css.firefox skin/fonts.css.chrome

## Firefox
VERSION=`grep '"version"' manifest.json.firefox | grep -oE '[0-9.]+'`;
cp manifest.json.firefox manifest.json
cp skin/fonts.css.firefox skin/fonts.css
zip -r pct-firefox-${VERSION}.xpi content/ skin/ manifest.json
zip -d pct-firefox-${VERSION}.xpi skin/fonts.css.firefox skin/fonts.css.chrome

echo 'Done!'
