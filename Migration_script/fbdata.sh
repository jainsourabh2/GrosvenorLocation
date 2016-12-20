#!/bin/sh


startdate=`/bin/date --date="1 weeks ago" +%y-%m-%d`
#echo $startdate
currentdate=`/bin/date +%y-%m-%d`

#echo $currentdate 
#mainfolder=/data/backup
#mainftp=/ftp/upload/ftpsystem1

foldate="$startdate"
until [ "$foldate" == "$currentdate" ]
do
    echo $foldate
 #  mkdir $mainfolder/$foldate/system1
  # mv $mainftp/*$foldate* $mainfolder/$foldate/system1
 foldate=`/bin/date --date="$foldate 1 day" +%y-%m-%d`

#check if folder exists in hadoop
     hadoop fs -test -d /grosvenor/facebook/facebooktopic/$foldate
     if [ $? != 0 ]
     then
echo "yes"
          hadoop fs -mkdir /grosvenor/facebook/facebooktopic/$foldate
     echo "created directory in hadoop"
         pig -param date=$foldate hdfs:/grosvenor/facebook/facebooktopic/migration.pig 
     fi


done
