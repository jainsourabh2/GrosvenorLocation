/*
https://code.google.com/p/gmaps-api-issues/issues/detail?can=2&start=0&num=100&q=&colspec=ID%20Type%20Status%20Introduced%20Fixed%20Summary%20Stars%20ApiType%20Internal&groupby=&sort=&id=8581
http://stackoverflow.com/questions/32462853/google-places-api-popular-times
*/
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
	//Location boundary coordinate for London (-0.5103, 51.2868, 0.3340, 51.6923)
	client.stream('statuses/filter', {follow: twitterIdList,locations:'-0.5103, 51.2868, 0.3340, 51.6923',track:'Grosvenor,Mayfair,Belgravia'}, function(stream) {
	//client.stream('statuses/filter', {follow: twitterIdList}, function(stream) {
		stream.on('data', function(tweet) {
			if(tweet.text){
				tweetString = jsonparsing.getParsedString(JSON.stringify(tweet));
				if(tweetString!=''){
					payloads = [{	 topic: 'grosvenorkafkaflume', messages: tweetString, partition: 0 }];
					producer.send(payloads, function (err, data) {
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

/*
client.stream('statuses/filter', {locations: '18.89,72.77,19.27,72.98'}, function(stream) {
	stream.on('data', function(tweet) {
		console.log(tweet);
	});

	stream.on('error', function(error) {
		console.log(error);
	});
});
*/
