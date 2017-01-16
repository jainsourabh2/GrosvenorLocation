"use strict";

const Twitter   = require('twitter');
const GoogleSearch = require('google-search');
const config = require('../config/config');
//const fs = require('fs');
const mysql      = require('mysql');
var gs = require('./gs');
const constants = config.constants;
const log = true;
const googleDerivation = true;
const fieldDelimiter = '|';


var places = [];
var originalPlaces = [];

const client = new Twitter({
  consumer_key: constants.twitter_consumer_key,
  consumer_secret: constants.twitter_consumer_secret,
  access_token_key: constants.twitter_access_token_key,
  access_token_secret: constants.twitter_access_token_secret
});

const googleSearch = new GoogleSearch({
  key: constants.google_search_key,
    cx: constants.google_search_cx
    });

const connection = mysql.createConnection({
  host     : constants.mysql_host,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});

connection.connect();

connection.query("SELECT name FROM twitterbusinesslist WHERE twitterhandle IS NULL OR twitterhandle = '' LIMIT 5", function(err, rows, fields) {
  if (err){
    throw err;
  } else {
    for(let i=0;i<rows.length;i++){
      places[i] = rows[i].name;
      originalPlaces[i] = rows[i].name;
    }
    deriveTwitterId(0);
  }
});

/*
//fs.readFile('./input/testfile.txt', 'utf8', function (err,data) {
fs.readFile('./input/businesslist.txt', 'utf8', function (err,data) {
    if (err) {
      console.error(err);
      return;
    }
    places = data.split("\n");
    originalPlaces = places.concat();
    deriveTwitterId(0);
});
*/

function deriveTwitterId(n){

  if (n<places.length) {

    client.get('users/search', {q:places[n]} ,function(error, tweets, response) {

      if (error){
        console.error(error);
        process.exit(1);
      }

      if (tweets.length === 0) {
        if (log===true) {
          console.log("No Twitter Account retrieved for " + places[n]);
          console.log("Searching again by removing the last word");
        }
        let lastIndex = places[n].lastIndexOf(" ");
        let placesSubString = places[n].substring(0,lastIndex);
        if (placesSubString !== "") {
          places[n] = placesSubString;
          deriveTwitterId(n);
        } else {
          console.log("Handle output to file for nothing found");
          deriveTwitterId(n+1);
        }
      } else {
        if (tweets.length === 1) {
          console.log("Found Twitter Handle : " + tweets[0].screen_name + " for search criteria " + places[n]);
          //let deriveMember = originalPlaces[n].trim() + fieldDelimiter + tweets[0].screen_name.trim();
          writeOutput(originalPlaces[n].trim(),tweets[0].screen_name.trim());
          deriveTwitterId(n+1);
        } else {
          let twitterHandles =[[],[]];
          let qarray = places[n].split(" ");
          let initialsTwitterSearch ="";
          for(let j=0;j<qarray.length;j++){
            initialsTwitterSearch = initialsTwitterSearch + qarray[j].substring(0,1);
          }

          for(let i=0,j=0;i<tweets.length;i++){
            twitterHandles[j] = [];
            twitterHandles[j][0] = tweets[i].screen_name;
            twitterHandles[j][1] = 0;
            twitterHandles[j][2] = places[n];

            if (tweets[i].entities.hasOwnProperty('url')) {
              if (tweets[i].entities.url.hasOwnProperty('urls')) {
                //console.log(tweets[i].entities.url.urls[0].expanded_url);
                twitterHandles[j][3] = tweets[i].entities.url.urls[0].expanded_url;
              } else {
                //console.log("");
                twitterHandles[j][3] = "";
              }
            } else {
              twitterHandles[j][3] = "";
            }

            //console.log(tweets[i].time_zone + '__' + tweets[i].screen_name);
            //if(tweets[i].time_zone === null || tweets[i].time_zone === 'London' || tweets[i].time_zone === 'UK'){
              //twitterHandles[i][1] = [];
              //console.log(tweets);
              if (log === true)
                console.log('Name - ' + tweets[i].screen_name);
              //console.log('Name - ' + tweets[i].name);

              // Check for exact match
              //console.log('Screen Name - ' + tweets[i].screen_name);
              if (places[n] === tweets[i].screen_name) {
                twitterHandles[j][1] =  twitterHandles[j][1] + 1;
                if (log === true)
                  console.log("Name Exact Match");
              }

              // Check for occurence of any word in the twitter handle.
              //console.log('Screen Name - ' + tweets[i].screen_name);
              for(let k=0;k<qarray.length;k++){
                //console.log(qarray[k].toLowerCase());
                //console.log(qarray[k].toLowerCase().trim().length);
                let qmember = qarray[k].replace("'","");
                if (tweets[i].screen_name.toLowerCase().trim().includes(qmember.toLowerCase().trim())) {
                  twitterHandles[j][1] =  twitterHandles[j][1] + 1;
                  if (log === true)
                    console.log("Substring Match");
                  //break;
                }
              }

              //Check for initials presence in the handle
              //console.log('Initials - ' + initialsTwitterSearch);
              if (tweets[i].screen_name.toLowerCase().includes(initialsTwitterSearch.toLowerCase()) && initialsTwitterSearch.length >= 2) {
                twitterHandles[j][1] =  twitterHandles[j][1] + 1;
                if (log === true)
                  console.log("Initials Match");
              }

              //Check for London and UK location
              //console.log('Location - ' + tweets[i].location);
              let locationLowerCase = tweets[i].location.toLowerCase();
              if (locationLowerCase.includes('London'.toLowerCase()) || locationLowerCase.includes('UK'.toLowerCase()) || locationLowerCase.includes('England'.toLowerCase())) {
                twitterHandles[j][1] =  twitterHandles[j][1] + 1;
                if (log === true)
                  console.log("location Match");
              }

              /*
              //Check for London and UK location in screen name
              //console.log('Location - ' + tweets[i].location);
              if (tweets[i].screen_name.includes('London') || tweets[i].screen_name.includes('UK')) {
                twitterHandles[j][1] =  twitterHandles[j][1] + 1;
                //console.log("location Match");
              }
              */
              //Check for Verified flag
              //console.log('verified - ' + tweets[i].verified );
              if (tweets[i].verified === true) {
                twitterHandles[j][1] =  twitterHandles[j][1] + 1;
                if (log === true)
                  console.log("Verified Match");
              }
              j++;
              //console.log('Still Processing ###############################');
            //}
          }
          twitterHandles.sort(sortFunction);
          //console.log(twitterHandles);
          displayTwitterHandle(twitterHandles,n,qarray);

          if ((n+1) < places.length) {
            if (log === true)
              console.log("Searching Next for " + places[n+1]);
            deriveTwitterId(n+1);
          } else {
              if (log === true)
                console.log("Processing Completed!!");
              setTimeout(function () {
                process.exit(0);
              }, 5000);
          }
        }
      }
    });
  }else{
    if (log === true)
      console.log("Processing completed!!");
      setTimeout(function () {
        process.exit(0);
      }, 5000);
  }
}

function sortFunction(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? 1 : -1;
    }
}

function displayTwitterHandle(twitterHandles,index,qarray){
  let derivedTwitterHandle = twitterHandles[0][0];
  let derivedTwitterHandlePoints = twitterHandles[0][1];
  for(let i=1;i<twitterHandles.length;i++){
  if (twitterHandles[i][1] === derivedTwitterHandlePoints) {
    //if (log === true)
      console.log("Need further processing for : " + originalPlaces[index]);
    checkLocation(twitterHandles,index,qarray);
    break;
  } else {
    //if (log === true) {
      console.log("Derivation Complete");
      console.log("Twitter Handle : " + derivedTwitterHandle + " for member :" + originalPlaces[index]);
    //}
    //let deriveMember = originalPlaces[index].trim() + fieldDelimiter + derivedTwitterHandle.trim();
    writeOutput(originalPlaces[index].trim(),derivedTwitterHandle.trim());
    break;
  }
  }
  return;
}

function checkLocation(twitterHandles,index,qarray){
  //let derivedTwitterHandlePoints = twitterHandles[0][1];
  for(let i=0;i<twitterHandles.length;i++){
    if (twitterHandles[i][0].toLowerCase().includes('London'.toLowerCase()) || twitterHandles[i][0].toLowerCase().includes('UK'.toLowerCase()) || twitterHandles[i][0].toLowerCase().includes('England'.toLowerCase())) {
      twitterHandles[i][1] =  twitterHandles[i][1] + 1;
    }
    if (twitterHandles[i][3] !== "" && twitterHandles[i][3] !== null && twitterHandles[i][3] !== undefined) {
      if (twitterHandles[i][3].toLowerCase().includes('London'.toLowerCase()) || twitterHandles[i][3].toLowerCase().includes('UK'.toLowerCase()) || twitterHandles[i][3].toLowerCase().includes('England'.toLowerCase())) {
        twitterHandles[i][1] =  twitterHandles[i][1] + 1;
      }
    }
  }
  twitterHandles.sort(sortFunction);
  //console.log(twitterHandles);
  if (twitterHandles[0][1] === twitterHandles[1][1]) {
    //if (log === true)
      console.log("Not able to derive twitter handle.Calling Google Custom Search Engine now.");
      if (googleDerivation === true) {
        gs.getGoogleCustomSearchTwitterHandle(googleSearch,originalPlaces[index],function(err,twitObj){
          if(!err && twitObj.length>=1){
            //let deriveMember = originalPlaces[index].trim() + fieldDelimiter + twitObj[0][0];
            writeOutput(originalPlaces[index].trim(),twitObj[0][0]);
            return;
          }
        });
      }
      return;
    //console.log(twitterHandles);
  } else {
      if (log === true)
        console.log(twitterHandles);
      displayTwitterHandle(twitterHandles,index);
      return;
  }
}

function writeOutput(name,twitterhandle){
    //let member = name + fieldDelimiter + twitterhandle + '\n';
    //fs.appendFileSync("output/twitterids.csv", member);
    //connection.query("UPDATE twitterbusinesslist SET twitterhandle = :th WHERE name =:n", { th: twitterhandle,n: name });
    connection.query('UPDATE twitterbusinesslist SET twitterhandle = "'+twitterhandle+'" WHERE name = "'+name+'";');
    console.log("Updated");
    return;
    /*
    connection.query('UPDATE twitterbusinesslist SET twitterhandle = "'+twitterhandle+'" WHERE name = "'+name+'";', function(err, rows, fields) {
      if (err)
        throw err;
      return;
    });
    */
}
