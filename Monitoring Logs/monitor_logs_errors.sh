#!/bin/bash -x

#To if log file to check has been given as argument when running the script

if [ $# -eq 0 ] ; then
   printf "%s: Need the name of the log that needs to be checked\n" $0
   printf $0 "\tis the name of the script you are running" #Just to display what is the script name
   printf $1 "\tis the name of the log file you want to scan" #Just to display what is the argument
   exit 1
fi

# script to check for string to search
SEARCH=`egrep -i 'error|warning' $1`  #search for strings error or warning in any form
echo $SEARCH
SUBJECT="kafka logs for errors" # email subject
RECIPIENT="ashwini.patil@mastek.com" # Email To ?
#EMAILMESSAGE="$SCAN_LOG" # Email text/message
EMAILMESSAGE="$SEARCH" # Email text/message

if [ $# -ne 0 ] ;    #To check if log file to be scanned has been given as argument when running the script
then
    printf "%s is the log file that will be read \n" $1
    if [ -f $1 ];       #check if log file to be scanned exists
    then
    printf "File exists \n"
    if [ -f ./tmp_log ];     #To check if current log file was scanned for the first time
    then
         diff -b $1 ./tmp_log > ./diff_result #Resource that contains only updated entries of the current log file
         SEARCH_UPDATES_ONLY=`egrep -i 'error|warning' ./diff_result`
         rm ./diff_result
         EMAILMESSAGE="$SEARCH_UPDATES_ONLY" # Email text/message Contains log entries from diff_result
         if [ -z "$SEARCH_UPDATES_ONLY" ];
         then
              printf "There is no message to send \n"
         else
              printf "%s\n" "$EMAILMESSAGE" | /bin/mailx -s "$SUBJECT" "$RECIPIENT"  #sends email of updated log entries that match the pattern
              printf "Mail sent to %s" $RECIPIENT
         fi
         else
              EMAILMESSAGE="$SEARCH" # Email text/message #Contains log entries from actual log file
              if [ -z "$SEARCH" ];
              then
                   printf "There is no message to send \n"
              else
                   printf "%s\n" "$EMAILMESSAGE" | /bin/mailx -s "$SUBJECT" "$RECIPIENT"  #send email with all log entries  that matche the search pattern
                   printf "Mail sent to %s" $RECIPIENT
              fi
    fi
    cp $1 ./tmp_log # To keep track of what is updated when this log file is scanned again
else
    printf "File %s  does not exist \n" $1
    printf "Please place log file to be scanned in the above mentioned path \n"
fi
else
        printf "Script %s: needs the absolute path of the log that needs to be checked\n" $0
fi
