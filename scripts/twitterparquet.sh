#!/bin/sh

startdate=`/bin/date  +16-11-28`
currentdate=`/bin/date  +%y-%m-%d`

echo $startdate $currentdate
cd /opt/nodeprojects/apache-drill-1.9.0/bin/
echo "Drop Table parquetwitterdata"
echo 'DROP TABLE `dfs`.`default`.`parquetwitterdata`;' | ./sqlline -u jdbc:drill:zk=localhost:2181
echo "Firing query to create parquet files"
echo 'CREATE TABLE `dfs`.`default`.`parquetwitterdata` AS SELECT * FROM `hive_social_media`.`default`.`newtwittercategorystream` where create_date  between '"'"''$startdate''"'"' and  '"'"''$currentdate''"'"';' | ./sqlline -u jdbc:drill:zk=localhost:2181
echo "Parquet table created"
