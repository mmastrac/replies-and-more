#!/bin/bash
rm -rf build

mkdir -p build/tmp
mkdir -p build/zip

cp -R extension/* build/tmp/
if [ "$TRAVIS_BUILD_NUMBER" == "" ] 
then
	export TRAVIS_BUILD_NUMBER="0"
fi
VERSION=2.$TRAVIS_BUILD_NUMBER
cat extension/manifest.json | sed s/__BUILD_VERSION__/$VERSION/ > build/tmp/manifest.json
cd build/tmp
zip -9r ../zip/plus.zip .
cd ../..
echo Wrote version $VERSION to `pwd`/build/zip/plus.zip
