
"use strict";

const Twitter 	= require('twitter');
const kafka 		= require('kafka-node'),
Producer 		= kafka.Producer,
kafkaClient 			= new kafka.Client('localhost:2181'),
producer 		= new Producer(kafkaClient);
const mysql      	= require('mysql');
const config = require('../config/config');
const jsonparsing = require('./jsonparsing');
const constants = config.constants;
let twitterIdList = "";
var tweetString;
var categorisedtweetstring;
var fs = require('fs');
var Q = require('q');
var abusivelist = [];

const connection = mysql.createConnection({
  host     : constants.mysql_host,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});
connection.connect();

const client = new Twitter({
	consumer_key: constants.twitter_consumer_key,
	consumer_secret: constants.twitter_consumer_secret,
	access_token_key: constants.twitter_access_token_key,
	access_token_secret: constants.twitter_access_token_secret
});

//async.series()
function readFileFunc(filename)
{
	var deferred = Q.defer();
	
	fs.readFile(filename,'utf8',function(err,data){
		if(err)
		{
			deferred.reject(new Error(err));	
		}
		else{
			deferred.resolve(data);
		}
		
	});

return deferred.promise;
	
}

 
readFileFunc('/opt/nodeprojects/GrosvenorLocation/config/abusivewords').then(function(data){
   abusivelist = data.split('\n');
	
	
	connection.query('SELECT twitterid FROM twitterlist WHERE twitterid IS NOT null', function(err, rows, fields) {
	if (err){
		throw err;
	}
	for(let i=0;i<rows.length;i++){
		twitterIdList = twitterIdList + rows[i].twitterid + ',';
	};
	twitterIdList = twitterIdList.substr(0,twitterIdList.length-1);
	startstreaming();
});

function startstreaming(){
	var payloads;
	var newpayloads;
	//Location boundary coordinate for London (-0.5103, 51.2868, 0.3340, 51.6923)
	client.stream('statuses/filter', {follow: twitterIdList,locations:'-0.5103, 51.2868, 0.3340, 51.6923',track:'Grosvenor,Mayfair,Belgravia'}, function(stream) {
	//client.stream('statuses/filter', {follow: twitterIdList}, function(stream) {
		stream.on('data', function(tweet) {
			if(tweet.text){
				//tweetString = jsonparsing.getParsedString(JSON.stringify(tweet),abusivelist,false);
				categorisedtweetstring = jsonparsing.getParsedString(JSON.stringify(tweet),abusivelist,true);
				/*if(tweetString!=''){
					//console.log("Inside 1st topic");
					payloads = [{	 topic: 'grosvenorkafkaflume', messages: tweetString, partition: 0 }];
					producer.send(payloads, function (err, data) {
						//console.log('Pushed Successfully');
					});
				} */
				if(categorisedtweetstring!==''){
					newpayloads =  [{	 topic: 'twittercategoryflume', messages: categorisedtweetstring, partition: 0 }];
						producer.send(newpayloads, function (err, data) {
						console.log(data);
						//console.log('Pushed Successfully');
					});
				}
			}
		});

		stream.on('error', function(error) {
			console.log(error);
		});
	});
}
});

