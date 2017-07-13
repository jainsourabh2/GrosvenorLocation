#Remove previous day data from localpath also clean out the drill profiles

prevdate=`/bin/date --date="1 days ago" +%Y-%m-%d` 
filename="flickrdata_$prevdate.txt" 
echo $filename
echo "`date` :  Removing previous day Flickr data \n" 
rm -f /opt/nodeprojects/GrosvenorLocation/flickr/op/$filename
echo "`date` : Removing drill profiles \n"
rm -f /opt/nodeprojects/apache-drill-1.9.0/log/profiles/*
echo "`date` : Removing drill log \n"
rm -f /opt/nodeprojects/apache-drill-1.9.0/log/*.log



