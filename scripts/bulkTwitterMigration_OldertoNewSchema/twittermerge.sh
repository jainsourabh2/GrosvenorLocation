#!/bin/sh

startdate=`/bin/date  +16-11-30`
currentdate=`/bin/date  +17-02-17`

foldate="$startdate"

echo $foldate $currentdate

while [ $(date -d "$foldate" +%y%m%d) -le $(date -d "$currentdate" +%y%m%d) ]
do

#check if folder exists in hadoop
     hadoop fs -test -d /grosvenor/twitter/newtwittercategoryflume/$foldate
     if [ $? != 0 ]
     then
          echo "create $foldate directory in hadoop"
          pig -param date=$foldate  /opt/nodeprojects/GrosvenorLocation/scripts/bulkFBdata/twitter_migration.pig
     else
        echo "folder exist"
          hadoop fs -rmr /grosvenor/twitter/newtwittercategoryflume/$foldate
          pig -param date=$foldate  /opt/nodeprojects/GrosvenorLocation/scripts/bulkFBdata/twitter_migration.pig  
     fi
     #merge the files
     hadoop fs -cat /grosvenor/twitter/newtwittercategoryflume/$foldate/part-m-* | hadoop fs -put -  /grosvenor/twitter/newtwittercategoryflume/$foldate/FlumeData-$foldate.txt

     #purge the files
     hadoop fs -rm /grosvenor/twitter/newtwittercategoryflume/$foldate/part-m-*
     hadoop fs -rm /grosvenor/twitter/newtwittercategoryflume/$foldate/_*
     newdata_command=$" hive -e \"ALTER TABLE newtwittercategorystream ADD PARTITION(create_date='$foldate') location '/grosvenor/twitter/newtwittercategoryflume/$foldate';\" "
     eval $newdata_command
     
     foldate=`/bin/date --date="$foldate 1 day" +%y-%m-%d`
done
