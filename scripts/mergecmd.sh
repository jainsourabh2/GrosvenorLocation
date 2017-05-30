#startdate=`/bin/date +%Y-%m-%d` 
currenthour=`/bin/date +%H` 
echo $currenthour 
if [ $currenthour -ge 00 ] && [ $currenthour -le 03 ] 
then 
currentdate=`/bin/date --date="1 days ago" +%Y-%m-%d` 
else 
currentdate=`/bin/date +%Y-%m-%d` 
fi 
startdate="$currentdate" 
echo "$startdate"

FB_BASE_PATH="/grosvenor/facebook/facebooktopic/current" 
FILES=$(hdfs dfs -ls "$FB_BASE_PATH/FacebookData.*" | awk '{print $8}' | grep -v "$FB_BASE_PATH/FacebookData.*.tmp")
for FILENAME in $FILES
do 
echo "For file $FILENAME"
HDFS_CMD_MERGE="hdfs dfs -cat $FILENAME | hdfs dfs -appendToFile - $FB_BASE_PATH/fb_$startdate.txt" 
HDFS_CMD_PURGE="hdfs dfs -rm $FILENAME" 
echo "Merge command : $HDFS_CMD_MERGE"
eval $HDFS_CMD_MERGE 
echo "MERGE DONE"
echo "Purge command : $HDFS_CMD_PURGE "
eval $HDFS_CMD_PURGE 
echo "PURGE DONE"
done
