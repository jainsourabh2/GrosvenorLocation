#!/bin/sh
startdate=`/bin/date --date="52 weeks ago" +%Y-%m-%d`
#echo $startdate
currentdate=`/bin/date +%Y-%m-%d`

#echo $currentdate 
#mainfolder=/data/backup
#mainftp=/ftp/upload/ftpsystem1

foldate="$startdate"
until [ "$foldate" == "$currentdate" ]
do
  echo $foldate
#check if folder exists in hadoop
     hadoop fs -test -d /grosvenor/facebook/facebooktopic/$foldate
     if [ $? != 0 ]
     then
          #hadoop fs -mkdir /grosvenor/facebook/facebooktopic/$foldate
          #echo "created directory in hadoop"
          pig -param date=$foldate   hdfs:/grosvenor/facebook/facebooktopic/migration.pig
     else
          hadoop fs -rmr /grosvenor/facebook/facebooktopic/$foldate
          pig -param date=$foldate   hdfs:/grosvenor/facebook/facebooktopic/migration.pig
    
     fi
foldate=`/bin/date --date="$foldate 1 day" +%Y-%m-%d`

done
