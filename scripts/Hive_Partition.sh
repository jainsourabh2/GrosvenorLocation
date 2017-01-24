#!/bin/bash
new_date=$(date -d "+1 days" +'%y-%m-%d')
next_dt=$(date -d "+1 days" +'%Y-%m-%d')
printf "Next Date in YY-MM-DD format %s\n" "$new_date"
new_command=$" hive -e \"ALTER TABLE twittercategorystream ADD PARTITION(create_date='$new_date') location '/grosvenor/twitter/twittercategoryflume/$new_date';\" "
printf "New command %s\n" "$new_command"
fb_command=$" hive -e \"ALTER TABLE facebookdata ADD PARTITION(fb_date='$next_dt') location '/grosvenor/facebook/facebooktopic/$next_dt' ;\" "
eval $new_command
eval $fb_command
