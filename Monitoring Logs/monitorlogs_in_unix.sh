#!/bin/bash
# Set the config variables

# *************************************************Configuration********************************************************
errorList="Error|Warning|error|fatal|critical"
EMAIL_SUBJECT="Kafka Error"
EMAIL_TO="ashwini.patil@mastek.com"
# **********************************************************************************************************************


# Set the Log File path

logfile=""
logfile="/var/log/kafka/server.log"
echo "$logfile"

if [ ! -s $logfile ]; then 
echo "ERROR- Log File Not Found , Please set the config properly"
exit
fi

# Get the first line
#linestart=$(awk 'NR>1{exit} ;1' $logfile  | cut -c1-30)

# Never ending loop that will parse the server.log file every 10 sec
#echo $logfile

count=1
lastline=""
while true ; 
do
  if [ ! -s "$logfile" ];
 then
      echo "Log File Not Found .. Waiting for the next iteration ..."
 else
          lineend=$(awk 'END{print}' "$logfile" ) 
                 
          #echo "lineend  is " $lineend
          #echo "lastline is " $lastline  
          
          #tail -1 $logfile | egrep -i 'error|warning'
          #if [  -z != 0  ]  && [ $count == 1 ];
     
          if tail -1 $logfile | egrep -i 'error|warning' && [ "$lastline" != "$lineend" ] ;
          then
	      printf "$lineend" | /bin/mailx -s "$EMAIL_SUBJECT"  "$EMAIL_TO"
              echo "Mail sent"        
              count=$((count+1))
          fi
          lastline=$lineend
 fi
 done
