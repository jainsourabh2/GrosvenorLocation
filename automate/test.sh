
energytype=$1

echo "Tyep : $energytype"
if [ $energytype == "domestic" ]
then
echo "Domestic"
else
echo "No"
fi
files=$(hadoop fs -ls /tmp/tmp_Energy | awk  '!/^d/ {print $8}')
for f in $files;
do
echo "og file is $f"
#filename= $(echo $f | cut -d '.' -f 1;) >> /dev/null
read -ra arr -d '.' <<< "$f"
for filename in "${arr[@]}"; 
do 
echo $a; 
#echo $filename
echo "Filename is $filename"
currdate=`/bin/date +%Y-%m-%d`
underscore="_"
parqformat=".parquet"
newfilename=$filename$underscore$currdate$parqformat
echo $newfilename
done
done

