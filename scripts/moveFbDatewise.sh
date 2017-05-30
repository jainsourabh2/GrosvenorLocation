#startdate=`/bin/date +%Y-%m-%d` 
currenthour=`/bin/date +%H` 
#echo $currenthour 
if [ $currenthour -ge 00 ] && [ $currenthour -le 03 ] 
then 
currentdate=`/bin/date --date="1 days ago" +%Y-%m-%d` 
else 
currentdate=`/bin/date +%Y-%m-%d` 
fi 
startdate="$currentdate" 
echo "$startdate"

FB_BASE_PATH="/grosvenor/facebook/facebooktopic/current"
FB_DEST_PATH="/grosvenor/facebook/facebooktopic/$startdate"
 
read ts <<< $(echo "`hadoop fs -ls /grosvenor/facebook/facebooktopic/current/fb_$startdate.txt`" | awk '{timestamp= $7;print timestamp}')
#Find Timestamp of hadoop file
t=$(date -d $ts +%s)
#Find Timestamp of current datetime
t1=$(date '+%s')
#Difference between two time stamp > 1000 sec than move to startdate folder
result=$(expr $t1 - $t)
echo "Time stamp difference : $result"
if [ $result -ge 1000 ]
then
echo "Move Command starting"
HDFS_REMOVE_CMD="hadoop fs -rm $FB_DEST_PATH/*.*"
echo "Remove Command : $HDFS_REMOVE_CMD"
eval $HDFS_REMOVE_CMD
HDFS_MOVE_CMD="hadoop fs -mv $FB_BASE_PATH/fb_$startdate.txt $FB_DEST_PATH/"
echo "Move Command : $HDFS_MOVE_CMD"
eval $HDFS_MOVE_CMD
echo "Move Command End"
fi

