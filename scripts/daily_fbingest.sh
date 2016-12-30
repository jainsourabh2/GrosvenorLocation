#!/bin/sh
#echo $startdate
currentdate=`/bin/date +%Y-%m-%d`
fdate="$currentdate"
echo $fdate
#check if folder exists in hadoop

hadoop fs -test -d /grosvenor/facebook/facebooktopic/$fdate
if [ $? != 0 ]
then nohup node /opt/nodeprojects/facebooksearch/facebookgraphapi.js $fdate &
else 
hadoop fs -rm /grosvenor/facebook/facebooktopic/$fdate/fb_* 
nohup node /opt/nodeprojects/facebooksearch/facebookgraphapi.js $fdate &   
fi

#merge files
hadoop fs -cat /grosvenor/facebook/facebooktopic/$fdate/*.* | hadoop fs -put - /grosvenor/facebook/facebooktopic/$fdate/fb_$fdate.txt
#purge files
hadoop fs -rm /grosvenor/facebook/facebooktopic/$fdate/FacebookData.*
