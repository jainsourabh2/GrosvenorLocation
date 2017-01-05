startdate=`/bin/date --date="1 days ago" +%Y-%m-%d`
FB_BASE_PATH="/grosvenor/facebook/facebooktopic/$startdate"
HDFS_CMD_MERGE="hdfs dfs -cat $FB_BASE_PATH/*.* | hdfs dfs -put - $FB_BASE_PATH/fb_$startdate.txt"
HDFS_CMD_PURGE="hdfs dfs -rmr $FB_BASE_PATH/FacebookData.*"
eval $HDFS_CMD_MERGE
echo $
eval $HDFS_CMD_PURGE
echo $
