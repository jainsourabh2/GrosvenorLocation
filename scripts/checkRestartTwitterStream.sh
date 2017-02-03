#!/bin/sh
now=$(date)
SERVICE='twitterstream.js'

if ps ax | grep -v grep | grep $SERVICE > /dev/null
then
    echo "$SERVICE service running, everything is fine @ $now"
else
    echo "$SERVICE is not running and hence restarting the service @ $now"
    nohup node /opt/nodeprojects/GrosvenorLocation/twitter/twitterstream.js > /var/log/GrosvenorLocation/twitterstream.log &
    echo "$SERVICE restarted!"
fi
