"use strict";

const FB = require('fb');
const config = require('../config/config');
const mysql      = require('mysql');
const fs = require('fs');
const parse = require('csv-parse');

const constants = config.constants;
const middlewareconstants = config.middlewareconstants;

const connection = mysql.createConnection({
  host     : constants.mysql_host,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});

connection.connect();

const type = middlewareconstants.facebooksearchtype;
const inputFile=middlewareconstants.facebooklocations;
var csvData=[];

FB.options({version:"v2.8"});


function IterateOver(list, iterator, callback) {

    var doneCount = 0;  // here we'll keep track of how many reports we've got

    function report() {
        doneCount++;
        console.log(list.length + '__' + doneCount);
        if(doneCount === list.length)
            callback();
    }
    for(var i = 0; i < list.length; i++) {
        
        iterator(list[i], report);
    }
}

fs.createReadStream(inputFile)
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow) {
        csvData.push(csvrow);
    })
    .on('end',function() {
        
            IterateOver(csvData, function(path, report) {
                let search = "search?q="+type+"&type=place&center="+path[1]+","+path[2]+"&limit=500&distance=16000";
                facebook(search,path)
                .then(function() {
                    // log the details to the user
                    console.log('Completed '+search+' Processing');
                });
                report();
            }, processComplete);
    });

function processComplete(){
    //process.exit(0);
}

function facebook(searchQuery,location){
    let place = location;
    let deferred = Promise.defer();
    FB.setAccessToken(constants.access_token[Math.floor(Math.random()*constants.access_token.length)]);
    FB.api(searchQuery,
        function (response) {
          if (response && !response.error) {
            for(let i=0;i<response.data.length;i++){
                let name = response.data[i].name;
                name = name.replace(/"/gi,'$').trim();
                connection.query('INSERT INTO facebooklist (id,name,type,location,latitude,longitude,url) values("'+response.data[i].id+'","'+name+'","'+type+'","'+place[0]+'","'+place[1]+'","'+place[2]+'","www.facebook.com/'+response.data[i].id+'")', function(err, rows, fields) {
                 
                    if (err){
                    console.log("Error in insert");
                    }
                });
            }
            try{
                if(response.hasOwnProperty('paging')){
                    if(response.paging.hasOwnProperty('cursors')){
                        let position = searchQuery.search("after");
                        if(position!==-1){
                            searchQuery = searchQuery.substring(0,position-1);
                        }
                        facebook(searchQuery+"&after="+response.paging.cursors.after,location).then(function() {
                            deferred.resolve();
                        });
                    }
                }else{
                    deferred.resolve();
                    return;
                }
            }catch(ex){
                console.error(ex);
            }
          }else{
            console.log(response);
          }

        }
    );
    return deferred.promise;
}
