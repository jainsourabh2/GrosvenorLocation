"use strict";

const sanitizeHtml = require('sanitize-html');
const config = require('../config/config');
const constants = config.middlewareconstants;
const jsonParsing = {};
const fs = require('fs');
const sentiment = require("sentiment");

var abusiveflag = false;


(function(jsonParsing){

  jsonParsing.getParsedString = function(inputString,abusivelist,iscategorised){
	var idList = ["id_str","created_at","text","source","in_reply_to_status_id_str","in_reply_to_user_id_str","in_reply_to_screen_name","user.id_str","user.name","user.screen_name","user.location","user.description","user.url","user.protected","user.verified","user.followers_count","user.friends_count","user.statuses_count","user.friends_count","user.listed_count","user.favourites_count","user.created_at","user.geo_enabled","user.lang","user.profile_image_url","user.default_profile","user.default_profile_image","coordinates.coordinates[0]","coordinates.coordinates[1]","retweet_count","favorite_count","retweeted","favorited","filter_level","lang","place.place_type","place.name","place.full_name","place.country_code","place.country","place.bounding_box.coordinates[0][0]","place.bounding_box.coordinates[0][1]","place.bounding_box.coordinates[0][2]","place.bounding_box.coordinates[0][3]","entities.hashtags[0].text","entities.user_mentions[0].screen_name","entities.urls[0].url"];
	var input = sanitizeHtml(inputString, {
		allowedTags: [],
		allowedAttributes: []
	});

	input = input.replace(/&amp;/gi,'&').trim();
	input = input.replace(/&lt;/gi,'<').trim();
	input = input.replace(/p&gt;/gi,'>').trim();
	input = input.replace(/\|/g,'#').trim();
	input = input.replace(/&quot;/gi,'"').trim();
	input = input.replace(/\t/g,'').trim();
	input = input.replace(/\\n/g,' ').trim();
	input = input.replace(/\r/g,'').trim();
	input = input.replace(/(?:\r\n|\r|\n)/g,' ').trim();

	try{
		var parsedJSON = JSON.parse(input);
	}catch(ex){
		console.log(ex);
		return '';
	}
	
		var output="";
		var val;
		var evalVal;
	
		
	for(var i=0;i<idList.length;i++){
		
		val = 'parsedJSON.'+idList[i];
		try{
			if(val == "parsedJSON.created_at" || val == "parsedJSON.user.created_at")
			{
				var date = new Date(Date.parse(eval(val))).toISOString().replace(/T/, ' ').replace(/\..+/, '');
				evalVal =date ;
			}
			else{
				
				evalVal = eval(val);
				
				if(val == 'parsedJSON.user.description' || val == 'parsedJSON.text')
				{
					evalVal = evalVal.replace(/(?:\r\n|\r|\n)/g,' ').trim();
					
					if(iscategorised && abusivelist.length > 0)
				
					{
						for(var al = 0; al < abusivelist.length ; al++)
						{
							if(evalVal.split(' ').indexOf(abusivelist[al]) > -1)
							{
								abusiveflag = true;
								break;
							}
						}
					
					}
				}
				
			}
		}catch(ex){
			evalVal = null;
		}
		
			if(val == 'parsedJSON.place.bounding_box.coordinates[0][0]' || val == 'parsedJSON.place.bounding_box.coordinates[0][1]' || val == 'parsedJSON.place.bounding_box.coordinates[0][2]' || val == 'parsedJSON.place.bounding_box.coordinates[0][3]')
				{
					if(evalVal != null || evalVal != undefined)
					{
						//let coordinates = evalVal.split(',');
						output = output + evalVal[0] + constants.fieldDelimter;
						output = output + evalVal[1] + constants.fieldDelimter;
					}
					else
					{
						output = output + 'null' + constants.fieldDelimter;
						output = output + 'null' + constants.fieldDelimter;
					}
				}
				else
				{
					if(evalVal === undefined || evalVal === null) {
						output = output + 'null' + constants.fieldDelimter;
					}
					else
					{
						output = output + evalVal + constants.fieldDelimter;
					}
					
				}
		
		
		// Append sentiment score after tweet text
		if(iscategorised && val == 'parsedJSON.text')
		{
			var sentimentscore = '0';
			if(evalVal != null)
			{
			  sentimentscore = sentiment(evalVal).score;	
			}
			
			output = output + sentimentscore + constants.fieldDelimter;
		}
	}
	
	if(iscategorised)
	{
		if(abusiveflag)
		{
			output = output + "1" + constants.fieldDelimter;	 //Abusive words categorised
		}
		else
		{
			output = output + "0" + constants.fieldDelimter;     //Does not categorised as abusive
		}
		abusiveflag = false;
	}
	
	//Derived columns here - if geo coordinate present it will have lat and long otherwise random coordinates falling between place_coordinates
	try
	{
	var long = eval('parsedJSON.coordinates.coordinates[0]') ;
	var latit = eval('parsedJSON.coordinates.coordinates[1]') ;
	
	}
	catch(ex)
	{
		try
		{
		var pc1 = {};
		pc1.longitude = eval('parsedJSON.place.bounding_box.coordinates[0][0]')[0]; 
		pc1.latitude = eval('parsedJSON.place.bounding_box.coordinates[0][0]')[1]; 
		
		var pc2 = {};
		pc2.longitude = eval('parsedJSON.place.bounding_box.coordinates[0][1]')[0]; 
		pc2.latitude = eval('parsedJSON.place.bounding_box.coordinates[0][1]')[1]; 
		
		var pc3= {};
		pc3.longitude = eval('parsedJSON.place.bounding_box.coordinates[0][2]')[0]; 
		pc3.latitude = eval('parsedJSON.place.bounding_box.coordinates[0][2]')[1]; 
		
		var pc4 = {};
		pc4.longitude = eval('parsedJSON.place.bounding_box.coordinates[0][3]')[0]; 
		pc4.latitude = eval('parsedJSON.place.bounding_box.coordinates[0][3]')[1];
		
		var randomcoord = randomCoordinates(pc1,pc2,pc3,pc4);
		latit = randomcoord.latitude.toFixed(6);
		long = randomcoord.longitude.toFixed(6);
		}
		catch(innerex)
		{
			latit = 'null';
			long = 'null';
		}
		
		
	}
	
	output = output + latit + constants.fieldDelimter;
	output = output + long + constants.fieldDelimter;
	
	output = output.substr(0,output.length-1);
	console.log(output);
	return output;
  };

}(jsonParsing));

function randomCoordinates(pc1,pc2,pc3,pc4)
{
    let randomCoord = {};
    if(pc4.latitude > pc2.latitude)
    {
        randomCoord.latitude =  Math.random().toFixed(2) * (pc4.latitude - pc2.latitude) + pc2.latitude;
        console.log("RV1: " + randomCoord.latitude);
    }
    else
    {
         randomCoord.latitude =  Math.random().toFixed(2) * (pc2.latitude - pc4.latitude) + pc4.latitude;
         
    }   
   
   if(pc3.longitude > pc1.longitude)
   {
    randomCoord.longitude = Math.random().toFixed(2) * (pc3.longitude - pc1.longitude) + pc1.longitude;
   }
   else
    {
    randomCoord.longitude = Math.random().toFixed(2) * (pc1.longitude - pc3.longitude) + pc3.longitude; 
    }


    //console.log(randomCoord);
    return  randomCoord;

}

module.exports = jsonParsing;
