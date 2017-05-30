#!/bin/sh

startdate=`/bin/date  +%y-%m-01`
currentdate=`/bin/date  +%y-%m-%d`
curryear=`/bin/date +%Y`
currmonth=`/bin/date +%m`
currdate=`/bin/date +%d`

#startdate=`/bin/date +17-04-01`
#currentdate=`/bin/date +17-04-31`
#curryear=`/bin/date +2017`
#currmonth=`/bin/date +04`

echo $startdate $currentdate $curryear $currmonth $currdate
cd /opt/nodeprojects/apache-drill-1.9.0/bin/
echo "Dropping intermediate table "
echo 'DROP TABLE `dfs`.`default`.`testparquetfiles`;' | ./sqlline -u jdbc:drill:zk=localhost:2181
echo "Firing query to create parquet files"
echo 'CREATE TABLE `dfs`.`default`.`testparquetfiles` AS SELECT * FROM `hive_social_media`.`default`.`newtwittercategorystream` where create_date  between '"'"''$startdate''"'"' and  '"'"''$currentdate''"'"';' | ./sqlline -u jdbc:drill:zk=localhost:2181
echo "Parquet table created"

#Check if year and month folder exist
HDFS_YEAR_PATH="/grosvenor/ParquetTest/$curryear"
HDFS_MONTH_PATH="/grosvenor/ParquetTest/$curryear/$currmonth"
SOURCE_FILE_PATH="/grosvenor/testparquetfiles/*"
DEST_FILE_PATH="/grosvenor/ParquetTest/$curryear/$currmonth"

HDFS_YEAR_CHECK="hdfs dfs -ls $HDFS_YEAR_PATH"
HDFS_MONTH_CHECK="hdfs dfs -ls $HDFS_MONTH_PATH"
MOVE_FILES="hdfs dfs -mv $SOURCE_FILE_PATH $DEST_FILE_PATH"
CLEAN_EXISTING_FILES="hdfs dfs -rm $DEST_FILE_PATH/*"

# Check Year folder
eval $HDFS_YEAR_CHECK
if [ $? -gt 0 ]
then
echo "Making Directory for Year"
HDFS_YEAR_MKDIR="hdfs dfs -mkdir $HDFS_YEAR_PATH"
eval $HDFS_YEAR_MKDIR
else
echo "Year Directory already exist"
fi

#CHeck Month Folder
eval $HDFS_MONTH_CHECK

if [ $? -gt 0 ]
then
HDFS_MONTH_MKDIR="hdfs dfs -mkdir $HDFS_MONTH_PATH"
eval $HDFS_MONTH_MKDIR
else
echo "Month Directory already exist"
fi

echo "Clean and Move files from source to dest"
eval $CLEAN_EXISTING_FILES
eval $MOVE_FILES
echo "File transferred to month folder"
