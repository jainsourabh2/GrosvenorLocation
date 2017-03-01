#!/bin/bash                                                                                                                                          
new_date=$(date -d "+1 days" +'%y-%m-%d')                                                                                                            
next_dt=$(date -d "+1 days" +'%Y-%m-%d')                                                                                                             
printf "Next Date in YY-MM-DD format %s\n" "$new_date"                                                                                               
newdata_command=$" hive -e \"ALTER TABLE newtwittercategorystream ADD PARTITION(create_date='$new_date') location '/grosvenor/twitter/newtwittercateg
oryflume/$new_date';\" "                                                                                                                             
printf "New command %s\n" "$newdata_command"                                                                                                         
fb_command=$" hive -e \"ALTER TABLE facebookdata ADD PARTITION(fb_date='$next_dt') location '/grosvenor/facebook/facebooktopic/$next_dt' ;\" "       
printf "Fb command %s\n" "$fb_command"                                                                                                               
flickr_command=$" hive -e \"ALTER TABLE flickrstream  ADD PARTITION(create_date='$next_dt') location '/grosvenor/flickr/$next_dt' ;\" "              
printf "Flickr command %s\n" "$flickr_command"                                                                                                       
eval $newdata_command                                                                                                                                
eval $fb_command                                                                                                                                     
eval $flickr_command