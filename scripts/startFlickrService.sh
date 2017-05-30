currenthour=`/bin/date +%H` 
echo $currenthour 
if [ $currenthour == 00 ] 
then 
currentdate=`/bin/date --date="1 days ago" +%Y-%m-%d` 
else 
currentdate=`/bin/date +%Y-%m-%d` 
fi 
fdate="$currentdate" 
echo $fdate
node /opt/nodeprojects/GrosvenorLocation/flickr/flickrsample.js $fdate
