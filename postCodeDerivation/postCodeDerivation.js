//node --trace-sync-io postCodeDerivation.js
"use strict";

const request = require('request');
const mysql = require('mysql');
const config = require('../config/config');
const constants = config.constants;
const logger = require('../config/log.js');
const options = {
  headers: {'user-agent': 'chrome'}
};

let arrayLatLong = [[],[]];
let notFound=0;

const connection = mysql.createConnection({
  host     : constants.mysql_host,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});
connection.connect();

function processComplete(){
  logger.info(notFound);
  connection.end();
  process.exit();
}

function IterateOver(list, iterator, callback) {
    // this is the function that will start all the jobs
    // list is the collections of item we want to iterate over
    // iterator is a function representing the job when want done on each item
    // callback is the function we want to call when all iterations are over
    let doneCount = 0;  // here we'll keep track of how many reports we've got

    function report() {
        // this function resembles the phone number in the analogy above
        // given to each call of the iterator so it can report its completion

        doneCount++;
        logger.info(doneCount + '_' + list.length);
        // if doneCount equals the number of items in list, then we're done
        if(doneCount === list.length)
            callback();
    }

    // here we give each iteration its job
    for(let i = 0; i < list.length; i++) {
        // iterator takes 2 arguments, an item to work on and report function
        let path = 'http://api.postcodes.io/postcodes?lon='+list[i][1]+'&lat='+list[i][0]+';';
        //logger.debug(path);
        iterator(path,list[i][0],list[i][1], report);
    }
}

connection.query('SELECT distinct fblatitude,fblongitude FROM facebooklist WHERE  fblatitude IS NOT NULL AND fblongitude IS NOT NULL AND fbpostcode IS NULL LIMIT 500', function(err, rows, fields) {
  if(err){
    logger.error(err);
  }else{
    logger.debug(rows);
    for(let i=0;i<rows.length;i++){
      arrayLatLong[i] = [];
      arrayLatLong[i][0] = rows[i].fblatitude;
      arrayLatLong[i][1] = rows[i].fblongitude;
    }
    logger.debug(arrayLatLong);
    IterateOver(arrayLatLong, function(path,latitude,longitude, report) {
      request(path,options, function (error, response, body) {
        if (!error && response.statusCode == 200){
          let res = JSON.parse(body);
          if (res.status === 200) {
            if (res.result !== constants.null && res.result !== constants.undefined) {
              logger.debug('latitude : ' + latitude + ' ,longitude : ' + longitude + ' ,postcode : ' + res.result[0].postcode);
              connection.query('UPDATE facebooklist SET fbpostcode = "'+res.result[0].postcode+'" WHERE fblatitude = '+latitude+' AND fblongitude = '+longitude+';',function(err, rows, fields){
                report();
              });
            } else {
              notFound++;
              logger.info('No Post Code derived for latitude : ' + latitude + ' and longitude : ' + longitude + ' .');
              report();
            }
          } else {
            logger.error(res.status);
            logger.error(error);
            report();
          }
        }else{
          logger.error(response.statusCode);
          logger.error(error);
        }
        // we must call report to report back iteration completion
        //report();
      });
    }, processComplete);
  }
});
