#!/bin/bash
zip -9r -xmake.sh -x*.svn* -x*.git* /tmp/plus-$$.zip .
echo Wrote plus-$$.zip
