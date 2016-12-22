#!/bin/sh


#startdate=`/bin/date --date="1 weeks ago" +%Y-%m-%d`
startdate=`/bin/date --date="2 month ago" +%Y-%m-%d`
startmonth=`/bin/date --date="2 month ago" +%Y-%m`
#echo $startdate $startmonth

currentdate=`/bin/date +%Y-%m-%d`
currentmonth=`/bin/date +%Y-%m`

echo $currentdate $currentmonth

foldate="$startdate"
folmonth="$startmonth"
echo $foldate  $folmonth
until [ "$foldate" == "$currentdate" ]
do
#  echo $foldate
#check if folder exists in hadoop
     hadoop fs -test -d /grosvenor/facebook/facebooktopic/$folmonth
     if [ $? != 0 ]
     then
          echo "created directory in hadoop"
          pig -param date=$folmonth   hdfs:/grosvenor/facebook/facebooktopic/migration.pig
     else
          hadoop fs -rmr /grosvenor/facebook/facebooktopic/$folmonth
          pig -param date=$folmonth   hdfs:/grosvenor/facebook/facebooktopic/migration.pig
    
     fi
     #merge the files
     hadoop fs -cat /grosvenor/facebook/facebooktopic/$folmonth/part-m-* | hadoop fs -put -  /grosvenor/facebook/facebooktopic/$folmonth/fb_$folmonth.txt

     #purge the files
     hadoop fs -rm /grosvenor/facebook/facebooktopic/$folmonth/part-m-*

foldate=`/bin/date --date="$foldate 1 month" +%Y-%m-%d`
folmonth=`/bin/date --date="$foldate" +%Y-%m`
echo $foldate  $folmonth
done
