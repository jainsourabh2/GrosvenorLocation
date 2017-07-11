#!/bin/sh

prevdate=`/bin/date --date="1 days ago" +%Y-%m-%d`
currentdate=`/bin/date +%Y-%m-%d`
fdate="$currentdate"
echo $fdate
echo $prevdate
#delete hanged process if any
ps -ef | grep facebookstroecommentapi.js | grep -v grep | awk '{print $2}' | xargs kill

nohup node /opt/nodeprojects/GrosvenorLocation/facebook/facebookstroecommentapi.js $prevdate $currentdate &  



