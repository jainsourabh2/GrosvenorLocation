#!/bin/sh
#echo $startdate

prevdate=`/bin/date --date="1 days ago" +%Y-%m-%d`
currentdate=`/bin/date +%Y-%m-%d`
#prevdate=2017-01-01
#currentdate=2017-06-06
fdate="$currentdate"
echo $fdate
echo $prevdate
#check if folder exists in hadoop
#delete hanged process if any
ps -ef | grep fbEventsDetails.js | grep -v grep | awk '{print $2}' | xargs kill

nohup node /opt/nodeprojects/GrosvenorLocation/facebook/fbEventsDetails.js $prevdate $currentdate &   



