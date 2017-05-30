#drop table if exist
# BoroughTable
boroughtable=internal_aggregated_borough
validateTable=$(hive --database default -e "SHOW TABLES LIKE '$boroughtable'")
if [[ -z $validateTable ]]; then
echo " $boroughtable cannot be found so create new table"
else
#delete table
echo " Dropping table $boroughtable "
deletecommand=$" hive -e \"drop table $boroughtable ;\" "
eval $deletecommand
echo " Table dropped "
fi
#create internal table for borough,msoa,lsoa,entity
echo "Creating table $boroughtable"
createborough=$" hive -e \"Create table $boroughtable (boroughname string, boroughlatitude double, boroughlongitude double, createddate string,barcount int, casinocount int, cinemacount int, restaurantcount int);\" "
eval $createborough

# MSOATable
msoatable=internal_aggregated_msoa
validateTable=$(hive --database default -e "SHOW TABLES LIKE '$msoatable'")
if [[ -z $validateTable ]]; then
echo " $msoatable cannot be found so create new table"
else
#delete table
echo " Dropping table $msoatable "
deletecommand=$" hive -e \"drop table $msoatable ;\" "
eval $deletecommand
echo " Table dropped "
fi
echo "Creating table $msoatable"
createmsoa=$" hive -e \"Create table $msoatable (msoaname string, msoalatitude double, msoalongitude double, createddate string,postcodelatitude double,postcodelongitude double,barcount int, casinocount int, cinemacount int, restaurantcount int);\" "
eval $createmsoa

# LSOATAble
lsoatable=internal_aggregated_lsoa
validateTable=$(hive --database default -e "SHOW TABLES LIKE '$lsoatable'")
if [[ -z $validateTable ]]; then
echo " $lsoatable cannot be found so create new table"
else
echo " Dropping table $lsoatable "
deletecommand=$" hive -e \"drop table $lsoatable ;\" "
eval $deletecommand
echo " Table dropped "
fi
echo "Creating table $lsoatable"
createlsoa=$" hive -e \"Create table $lsoatable (lsoaname string, lsoalatitude double, lsoalongitude double, createddate string,postcodelatitude double,postcodelongitude double,barcount int, casinocount int, cinemacount int, restaurantcount int);\" "
eval $createlsoa
