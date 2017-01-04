BASE_PATH="/grosvenor/twitter/grosvenorkafkaflume"
DATE_PREV=`date --date="yesterday" +%Y-%m-%d`
HDFS_DATE_FORMAT=${DATE_PREV:2:10}
HDFS_PATH=$BASE_PATH'/'$HDFS_DATE_FORMAT
HDFS_WRITE_PATH=$HDFS_PATH'/FlumeData-'$HDFS_DATE_FORMAT'.txt'
HDFS_COMMAND_MERGE="hdfs dfs -cat $HDFS_PATH/FlumeData.*.txt | hdfs dfs -put - $HDFS_WRITE_PATH"
HDFS_COMMAND_PURGE="hdfs dfs -rmr $HDFS_PATH/FlumeData.*.txt"
eval $HDFS_COMMAND_MERGE
echo $
eval $HDFS_COMMAND_PURGE
echo $

startdate=`/bin/date +%Y-%m-%d`
FB_BASE_PATH="/grosvenor/facebook/facebooktopic/$startdate"
HDFS_CMD_MERGE="hdfs dfs -cat $FB_BASE_PATH/*.* | hdfs dfs -put - $FB_BASE_PATH/fb_$startdate.txt"
HDFS_CMD_PURGE="hdfs dfs -rmr $FB_BASE_PATH/FacebookData.*"
eval $HDFS_CMD_MERGE
echo $
eval $HDFS_CMD_PURGE
echo $
