#!/bin/sh
startdate=`/bin/date  +2016-01-01`
#echo $startdate $startmonth

currentdate=`/bin/date +2017-02-22`
#echo $currentdate $currentmonth

foldate="$startdate"

while [ $(date -d "$foldate" +%Y%m%d) -le $(date -d "$currentdate" +%Y%m%d) ]
do
  echo $foldate
          new_command=$" hive -e \"ALTER TABLE facebookdata ADD PARTITION(fb_date='$foldate') location '/grosvenor/facebook/facebooktopic/$foldate';\" "    
          printf "New command %s\n" "$new_command"
          eval $new_command
foldate=`/bin/date --date="$foldate 1 day" +%Y-%m-%d`
done
