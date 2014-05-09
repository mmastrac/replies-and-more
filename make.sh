#!/bin/bash
rm -rf output
mkdir output
zip -9r -xmake.sh -x*.svn* -x*.git* -xoutput output/plus.zip .
echo Wrote `pwd`/output/plus.zip
