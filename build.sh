#!/bin/bash

cd src

UNTRACKED=`git status -s | grep '??' | grep -v 'manifest.json' | grep -v 'fonts.css' | awk -F'\?\? ' '{ print $2; }'`;

## Firefox
VERSION=`grep '"version"' manifest.json.firefox | grep -oE '[0-9.]+'`;
FILENAME=pct-firefox-${VERSION}.xpi
rm $FILENAME
cp manifest.json.firefox manifest.json
cp skin/fonts.css.firefox skin/fonts.css
zip -r $FILENAME content/ skin/ manifest.json
zip -d $FILENAME skin/fonts.css.firefox skin/fonts.css.chrome $UNTRACKED

## Chrome
VERSION=`grep '"version"' manifest.json.chrome | grep -oE '[0-9.]+'`;
FILENAME=pct-chrome-${VERSION}.zip
rm $FILENAME
cp manifest.json.chrome manifest.json
cp skin/fonts.css.chrome skin/fonts.css
zip -r $FILENAME content/ skin/ manifest.json
zip -d $FILENAME skin/fonts.css.firefox skin/fonts.css.chrome $UNTRACKED

echo 'Done!'
