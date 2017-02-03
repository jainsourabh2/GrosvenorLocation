#!/bin/sh

startdate=`/bin/date  +2016-10-01`
currentdate=`/bin/date  +2017-01-05`

foldate="$startdate"

echo $foldate $currentdate

while [ $(date -d "$foldate" +%Y%m%d) -le $(date -d "$currentdate" +%Y%m%d) ]
do

#check if folder exists in hadoop
     hadoop fs -test -d /grosvenor/facebook/facebooktopic/$foldate
     if [ $? != 0 ]
     then
          echo "create $foldate directory in hadoop"
          pig -param date=$foldate  /opt/nodeprojects/GrosvenorLocation/facebooksearch/shellscript/pigscript.pig
     else
          hadoop fs -rmr /grosvenor/facebook/facebooktopic/$foldate
          pig -param date=$foldate  /opt/nodeprojects/GrosvenorLocation/facebooksearch/shellscript/pigscript.pig
    
     fi
     #merge the files
     hadoop fs -cat /grosvenor/facebook/facebooktopic/$foldate/part-m-* | hadoop fs -put -  /grosvenor/facebook/facebooktopic/$foldate/fb_$foldate.txt

     #purge the files
     hadoop fs -rm /grosvenor/facebook/facebooktopic/$foldate/part-m-*
     hadoop fs -rm /grosvenor/facebook/facebooktopic/$foldate/_*
foldate=`/bin/date --date="$foldate 1 day" +%Y-%m-%d`
done
