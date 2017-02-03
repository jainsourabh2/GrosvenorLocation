#!/bin/sh
#echo $startdate
currenthour=`/bin/date +%H`
echo $currenthour

if [ $currenthour == 00 ]
then
currentdate=`/bin/date --date="1 days ago" +%Y-%m-%d`
else 
currentdate=`/bin/date +%Y-%m-%d`
fi
fdate="$currentdate"
echo $fdate
#check if folder exists in hadoop
#delete hanged process if any
ps -ef | grep facebookgraphapi.js | grep -v grep | awk '{print $2}' | xargs kill

hadoop fs -test -d /grosvenor/facebook/facebooktopic/$fdate
if [ $? != 0 ]
then 
nohup node /opt/nodeprojects/GrosvenorLocation/facebook/facebookgraphapi.js $fdate &
else 
hadoop fs -rm /grosvenor/facebook/facebooktopic/$fdate/*.* 
nohup node /opt/nodeprojects/GrosvenorLocation/facebook/facebookgraphapi.js $fdate &   
fi


