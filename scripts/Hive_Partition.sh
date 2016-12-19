#!/bin/bash
new_date=$(date -d "+1 days" +'%y-%m-%d')
printf "Next Date in YY-MM-DD format %s\n" "$new_date"
new_command=$" hive -e \"ALTER TABLE twitterstream ADD PARTITION(create_date='$new_date') location '/grosvenor/twitter/grosvenorkafkaflume/$new_date';\" "
printf "New command %s\n" "$new_command"

eval $new_command
