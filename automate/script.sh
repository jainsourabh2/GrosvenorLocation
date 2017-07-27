removefilepath="/resource1/energydataset/removeFiles/removefilescript.js"
stagingfolder="/resource1/energydataset/staging"
energystagingfile="/resource1/energydataset/staging/energyrecords.csv"
hdfstmpfolder="/tmp/energy"
basedir="/resource1/energydataset/automate"
hive_file_name=""
parquet_filepath=""
drill_script_name=""
drill_script_concat_name=""
energy_logfile="/var/log/GrosvenorLocation/energy_ingestion.log"

HORIZONTALLINE="========================================================================"
clear
echo -e "\n$HORIZONTALLINE"
echo "		ENERGY DATASET INGESTION	"
echo $HORIZONTALLINE
echo "1) All Display Energy records in UK"
echo "2) All NonDomestic Energy records in UK"
echo "3) Domestic Energy records in London"
echo "4) Domestic Energy records in Liverpool"
echo -e "$HORIZONTALLINE\n"

echo -e "\e[1;31mNote: Before running the script make sure the relevant folder is present in staging area.( /resource1/energydataset/staging ). In case of Display and NonDomestic Energy just dump the entire folder as is into staging directory. In case of Domestic Energy, run the script segregatedir.js present in D:/Energy/segregate/ in Local machine which will create London and Liverpool directories with relevant files within it. In case of London, it will create 3 directories London1, London2 and London3 with 11 files in each, move the folder one at a time into staging path before running this script.\e[0m \n "

read -p  "Type the option number : " choice

if [ "$choice" -eq "$choice" 2> /dev/null ]; then
	if [ $choice -lt 1 -o $choice -gt 4 ]; then
		echo -e "\n ==> Enter number between 1 and 4 <== "
		exit
	elif [ $choice -eq 1 ]; then
		hive_file_name="ext_hive_display.sql"
		parquet_filepath="/grosvenor/DisplayEnergy"
		drill_script_name="ctas_drill_display.sql"
		drill_script_concat_name="ctas_drill_display_concat.sql"		
	elif [ $choice -eq 2 ]; then
		#NonDomestic energy details here
		hive_file_name="ext_hive_nondomestic.sql"
		parquet_filepath="/grosvenor/NonDomesticEnergy"
		drill_script_name="ctas_drill_nondomestic.sql"
		drill_script_concat_name="ctas_drill_nondomestic_concat.sql"
	elif [ $choice -eq 3 ]; then
		#Domestic London details here
		hive_file_name="ext_hive_domestic_london.sql"
		parquet_filepath="/grosvenor/DomesticEnergy_London"
		drill_script_name="ctas_drill_domestic_london.sql"
		drill_script_concat_name="ctas_drill_domestic_london_concat.sql" 
	elif [ $choice -eq 4 ]; then
		#Domestic Liverpool details here
		hive_file_name="ext_hive_domestic_liverpool.sql"
		parquet_filepath="/grosvenor/DomesticEnergy_Liverpool"
		drill_script_name="ctas_drill_domestic_liverpool.sql"
		drill_script_concat_name="ctas_drill_domestic_liverpool_concat.sql"
	fi
else
	echo "\n This is not a number "
	exit
fi


# Step 1 - Remove all recommendation.csv from staging dir
echo -e  $"Step 1 started: Starting node script to remove recommendation.csv file from folder \n" >> $energy_logfile
node $removefilepath
echo -e $"Step 1 completed : recommendation.csv files has been removed now. \n" >> $energy_logfile

#Step 2 - Concat all files into one single chunk
echo -e $"Step 2 started : Concat all records from folders into one single file. \n" >> $energy_logfile
cat $stagingfolder/*/*/* > $energystagingfile
echo -e $"Step 2 completed : All records written to energyrecords.csv file. \n" >> $energy_logfile

#Step 3 - Move this file to hdfs
echo -e $"Step 3 started : Checking if energy folder exists in HDFS temp dir. \n" >> $energy_logfile
hadoop fs -test -d $hdfstmpfolder
if [ $? != 0 ]
then
echo -e $"Creating folder energy in HDFS tmp directory. \n" >> $energy_logfile
hadoop fs -mkdir $hdfstmpfolder
echo -e $"Folder created. \n" >> $energy_logfile
else
echo -e $"Folder energy already exists in HDFS tmp directory.\n" >> $energy_logfile
echo -e $"Removing any files present within.\n" >> $energy_logfile
hadoop fs -rm -skipTrash $hdfstmpfolder/*
fi

echo -e $"Copying file from local path to tmp directory HDFS.\n" >> $energy_logfile
hadoop fs -put $energystagingfile $hdfstmpfolder/ 
echo -e $"Step 3 completed : Copying file complete.\n" >> $energy_logfile

#Step 4 - Create External Hive table on top of this data
echo -e $"Step 4 started : Running hive script... \n" >> $energy_logfile
hive -f $basedir/$hive_file_name
echo -e $"Step 4 completed : Hive external table created. \n" >> $energy_logfile

#Step 5 - Run Drill CTAS command to create parquet files from hive external table.
echo -e $"Step 5 started : Running Drill CTAS Command ... \n" >> $energy_logfile
echo -e $"Checking if HDFS folder exists ?\n" >> $energy_logfile 
hadoop fs -test -d $parquet_filepath
if [ $? != 0 ]
then
/opt/nodeprojects/apache-drill-1.9.0/bin/sqlline -u jdbc:drill:zk=localhost:2181 --run=$basedir/$drill_script_name
else
echo -e $"Parquet folder already exists so append new parquet files into this folder. \n" >> $energy_logfile
/opt/nodeprojects/apache-drill-1.9.0/bin/sqlline -u jdbc:drill:zk=localhost:2181 --run=$basedir/$drill_script_concat_name
echo -e $"Rename files in tmp dir and move to original parquet folder \n" >> $energy_logfile 

files=$(hadoop fs -ls /tmp/tmp_Energy | awk  '!/^d/ {print $8}')

for f in $files;

do
echo "og file is $f"
#filename= $(echo $f | cut -d '.' -f 1;) >> /dev/null
read -ra arr -d '.' <<< "$f"

for filename in "${arr[@]}";
do
echo "Filename is $filename"

currdate=`/bin/date +%Y-%m-%d_%H%M%S%N`
underscore="_"
parqformat=".parquet"
newfilename=$filename$underscore$currdate$parqformat
echo $newfilename

completefilename=$filename$parqformat
hadoop fs -mv $completefilename  $newfilename
hadoop fs -mv $newfilename $parquet_filepath

done
done

fi
echo -e $"Step 5 completed : Parquet files created.\n" >> $energy_logfile
echo -e $"Process completed\n" >> $energy_logfile

