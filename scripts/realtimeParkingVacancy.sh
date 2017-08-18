#!/bin/sh
PARKINGVACANCY_PATH="/grosvenor/HongKong/ParkingInfo/vacancy/"
PARKINGFILENAME="ParkingInfo.txt"
TIMESTMP=`/bin/date +%Y-%m-%d_%H%M%s`
PARKINGFILEUPDATENAME="ParkingInfo_"$TIMESTMP.txt
HDFS_FILE_RENAME="hadoop fs -mv $PARKINGVACANCY_PATH$PARKINGFILENAME $PARKINGVACANCY_PATH$PARKINGFILEUPDATENAME"
echo $HDFS_FILE_RENAME
eval $HDFS_FILE_RENAME

nohup node /opt/nodeprojects/GrosvenorLocation/HongKong/RealtimeParking/realtimevacancy.js &  



