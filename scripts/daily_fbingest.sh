#!/bin/sh
#echo $startdate
currenthour=`/bin/date +%H`
echo $currenthour

#At 12 in morning run
if [ $currenthour == 0 ]
then
currentdate=`/bin/date --date="1 days ago" +%Y-%m-%d`
else 
currentdate=`/bin/date +%Y-%m-%d`
fi
fdate="$currentdate"
echo $fdate
#check if folder exists in hadoop

hadoop fs -test -d /grosvenor/facebook/facebooktopic/$fdate
if [ $? != 0 ]
then 
nohup node /opt/nodeprojects/GrosvenorLocation/facebooksearch/facebookgraphapi.js $fdate &
else 
hadoop fs -rm /grosvenor/facebook/facebooktopic/$fdate/FacebookData.* 
nohup node /opt/nodeprojects/GrosvenorLocation/facebooksearch/facebookgraphapi.js $fdate &   
fi


