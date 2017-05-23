#!/bin/sh

startdate=`/bin/date  +16-11-28`
currentdate=`/bin/date  +17-02-17`

foldate="$startdate"

echo $foldate $currentdate

while [ $(date -d "$foldate" +%y%m%d) -le $(date -d "$currentdate" +%y%m%d) ]
do

     newdata_command=$" hive -e \"ALTER TABLE testnewtwittercategorystream ADD PARTITION(create_date='$foldate') location '/grosvenor/twitter/newtwittercategoryflume/$foldate';\" "
     eval $newdata_command
     
     foldate=`/bin/date --date="$foldate 1 day" +%y-%m-%d`
done
