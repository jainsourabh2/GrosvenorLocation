
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
	consumer_key: constants.twitter_consumer_key_2,
	consumer_secret: constants.twitter_consumer_secret_2,
	access_token_key: constants.twitter_access_token_key_2,
	access_token_secret: constants.twitter_access_token_secret_2
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
	
	
	connection.query('SELECT twitterid FROM twitterlist WHERE twitterid IS NOT null limit 1000', function(err, rows, fields) {
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
        
	var keywords_to_track = "Grosvenor,Mayfair,Belgravia,LiverpoolONE,North Mayfair,North Audley Street,Duke Street,Mount Street,South Audley Street,Carlos Place,Davies Street,Grosvenor Hill,South Molton Street,Grosvenor Street,Brook Street,Grosvenor Square,Brown Hart Gardens,Mount Street Gardens,summer in the square,scotts mount street,balenciaga mount street,celine mount street,mount street mayfair,mount street gardens,christian louboutin mount street,mount street restaurants,mount street shops,georg jensen mount street,marc jacobs mount street,the audley mount street,lanvin mount street,christopher kane mount street,gianvito rossi mount street,mount street cafe,linda farrow mount street,sophia webster mount street,roksanda mount street,carolina herrera mount street,oscar de la renta mount street,simone rocha mount street,8 mount street london,stephen webster mount street,creed mount street,pringle of scotland mount street,mount street celine,george mount street,mayfair shops,mount street mayfair,mayfair shopping,mayfair boutiques,mayfair property,mayfair office,mayfair apartments london,mayfair flats,property in mayfair,mayfair property prices,apartments in mayfair,mayfair real estate,property mayfair,mayfair property management,commercial property mayfair,houses mayfair,mayfair residential,mayfair london properties,mayfair restaurants,restaurants mayfair,mayfair bar,bars in mayfair,pubs in mayfair,clubs in mayfair,cafe mayfair,mayfair dining,hotel mayfair,5 star hotels mayfair,Motcomb Street,West Halkin Street,Lowndes Street,Kinnerton Street,Elizabeth Street,Ebury Street,Eccleston Yards,Eccleston Street,Pimlico Road,Belgrave Square Garden,Belgrave Square Garden,Eaton Square,Eaton Square Garden,Orange Square,Grosvenor Place,Grosvenor Gardens,Chester Square,belgravia christmas market,belgravia living,belgravia shops,belgravia coffee shop,belgravia market,belgravia shopping,christmas market belgravia,pimlico road farmers market,daylesford pimlico road,pimlico road antiques,orange pimlico road,pimlico road furniture,pimlico road market,pimlico road christmas fair,pimlico road restaurants,restaurants pimlico road,antique shops pimlico road,belgravia property,houses in belgravia,belgravia apartments,belgravia homes,belgravia flats,belgravia townhouse,boisdale belgravia,pubs in belgravia,bars in belgravia,restaurants belgravia,cafe belgravia,hotel belgravia";

	/* Location boundary coordinate for London (-0.5103, 51.2868, 0.3340, 51.6923), for liverpool(-3.022091,53.377726,-2.876204,53.447641), for HK - (113.8142, 22.0875, 114.5119, 22.4732) */
         
	var location_to_track = "-0.5103, 51.2868, 0.3340, 51.6923,-3.022091,53.377726,-2.876204,53.447641, 113.8142, 22.0875, 114.5119, 22.4732"

 //Note: follow:twitterIdList giving error as twitterlist is huge so limitng to 1000 for now. Resp error of 431 

	client.stream('statuses/filter', { follow:twitterIdList ,locations: location_to_track ,track:keywords_to_track }, function(stream) {
	//client.stream('statuses/filter', {follow: twitterIdList}, function(stream) {
		stream.on('data', function(tweet) {
			if(tweet.text){
				//tweetString = jsonparsing.getParsedString(JSON.stringify(tweet),abusivelist,false);
				categorisedtweetstring = jsonparsing.getParsedString(JSON.stringify(tweet),abusivelist,true);
				/*
				if(tweetString!=''){
					//console.log("Inside 1st topic");
					payloads = [{	 topic: 'grosvenorkafkaflume', messages: tweetString, partition: 0 }];
					producer.send(payloads, function (err, data) {
						//console.log('Pushed Successfully');
					});
				}
				*/	
				if(categorisedtweetstring!==''){
					newpayloads =  [{	 topic: 'newtwittercategoryflume', messages: categorisedtweetstring, partition: 0 }];
						producer.send(newpayloads, function (err, data) {
						//console.log(data);
						//console.log('Pushed Successfully');
					});
				}
			}
		});

		stream.on('error', function(error) {
			console.log("Error in streaming :" + error);
		});
	});
}
});

