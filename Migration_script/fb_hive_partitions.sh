#!/bin/sh


startdate=`/bin/date --date="11 month ago" +%Y-%m-%d`
startmonth=`/bin/date --date="11 month ago" +%Y-%m`
#echo $startdate $startmonth

currentdate=`/bin/date +%Y-%m-%d`
currentmonth=`/bin/date +%Y-%m`

#echo $currentdate $currentmonth

foldate="$startdate"
folmonth="$startmonth"
#echo $foldate  $folmonth
#echo $foldate $currentdate
while [ $(date -d "$foldate" +%Y%m%d) -le $(date -d "$currentdate" +%Y%m%d) ]
do
  echo $folmonth
          new_command=$" hive -e \"ALTER TABLE facebookdata ADD PARTITION(fb_date='$folmonth') location '/grosvenor/facebook/facebooktopic/$folmonth';\" "    
          printf "New command %s\n" "$new_command"
          eval $new_command
foldate=`/bin/date --date="$foldate 1 month" +%Y-%m-%d`
folmonth=`/bin/date --date="$foldate" +%Y-%m`
#echo $foldate  $folmonth
#echo $foldate $currentdate
done
