#startdate=`/bin/date +%Y-%m-%d` 
currenthour=`/bin/date +%H` 
echo $currenthour 
currentdate=`/bin/date +%Y-%m-%d` 
 startdate="$currentdate" 
echo "$startdate"

BASE_PATH="/grosvenor/HongKong/ParkingInfo/vacancy/" 
FILES=$(hdfs dfs -ls "$BASE_PATH/ParkingInfo_*" | awk '{print $8}' | grep -v "$BASE_PATH/ParkingInfo_*")
for FILENAME in $FILES
do 
echo "For file $FILENAME"
HDFS_CMD_MERGE="hdfs dfs -cat $FILENAME | hdfs dfs -appendToFile - $BASE_PATH/ParkingInfoArchive.txt" 
HDFS_CMD_PURGE="hdfs dfs -rm $FILENAME" 
echo "Merge command : $HDFS_CMD_MERGE"
eval $HDFS_CMD_MERGE 
echo "MERGE DONE"
echo "Purge command : $HDFS_CMD_PURGE "
eval $HDFS_CMD_PURGE 
echo "PURGE DONE"
done
