#!/bin/bash
basePath="/grosvenor/twitter/grosvenorkafkaflume/"
for filePath in $(hdfs dfs -find /grosvenor/twitter/grosvenorkafkaflume/current/*.txt)
do
        epochTime=$(echo $filePath| cut -d'.' -f 2);
        epochDate=${epochTime:0:10};
        epochDateFormat=$(date -d @$epochDate +"%Y%m%d");
        transferFolder=${epochDateFormat:2:2}"-"${epochDateFormat:4:2}"-"${epochDateFormat:6:2}
        fileName="FlumeData-"${epochDateFormat:2:2}"-"${epochDateFormat:4:2}"-"${epochDateFormat:6:2}".txt"
        #transferFolder="testing";
        transferPath=$basePath$transferFolder;
        hdfsFilePath=$transferPath"/"$fileName;
        localBasePath="/opt/nodeprojects/GrosvenorLocation/scripts/moving/"
        localBasePathTxt=localBasePath"*.txt"
        localFilePath=$localBasePath$fileName
        HDFS_COPY_HDFS_LOCAL="hdfs dfs -copyToLocal $filePath $localBasePath;"
        eval $HDFS_COPY_HDFS_LOCAL
        HDFS_MERGE="hdfs dfs -appendToFile $localBasePathTxt $hdfsFilePath"
        HDFS_CHECK="hdfs dfs -ls $hdfsFilePath"
        HDFS_PURGE="hdfs dfs -rmr $filePath;"
        eval $HDFS_CHECK
        if [ $? -gt 0 ]
        then
                HDFS_MKDIR="hdfs dfs -mkdir $transferPath;"
                eval $HDFS_MKDIR
                eval $HDFS_MERGE
                eval $HDFS_PURGE
        else
                eval $HDFS_MERGE
                eval $HDFS_PURGE
        fi
        rm -rf $fileName;
        rm -rf $localBasePathTxt;
done
