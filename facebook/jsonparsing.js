const sanitizeHtml = require('sanitize-html');
var sentiment = require('sentiment');
const config = require('./config');
const constants = config.middlewareconstants;
const jsonParsing = {};
var fs = require('fs');
const kafka  = require('kafka-node');
var Producer 		= kafka.Producer;
var kafkaClient 	= new kafka.Client('localhost:2181');
var producer 		= new Producer(kafkaClient);
	
(function(jsonParsing){

  jsonParsing.getParsedString = function(inputString){
	
	var idList = ["id","about","bio","business","category","category_list","cover.cover_id","cover.offset_x","cover.offset_y",
	"cover.source","description","engagement.count","engagement.social_sentence",
	"fan_count","hours.mon_1_open","hours.mon_1_close","hours.tue_1_open","hours.tue_1_close","hours.wed_1_open","hours.wed_1_close",
	"hours.thu_1_open","hours.thu_1_close","hours.fri_1_open","hours.fri_1_close","hours.sat_1_open","hours.sat_1_close","hours.sun_1_open","hours.sun_1_close",
	"is_always_open","is_verified",
	"is_permanently_closed","is_unclaimed","link","location.city","location.country","location.latitude","location.longitude","location.street","location.zip",
	"name","overall_star_rating","place_type","price_range","rating_count","username","verification_status","website"];
	

	inputString = inputString.replace(/<3/g,'').trim();
	inputString = inputString.replace(/(\r\n|\n|\r)/gm,"").trim();
	
	var input = sanitizeHtml(inputString, {
		allowedTags: [],
		allowedAttributes: []
	});

	input = input.replace(/&amp;/gi,'&').trim();
	input = input.replace(/&lt;/gi,'<').trim();
	input = input.replace(/&gt;/gi,'>').trim();
	input = input.replace(/\|/g,'#').trim();
	input = input.replace(/&quot;/gi,'"').trim();
	input = input.replace(/\t/g,'').trim();
	input = input.replace(/\n/g,'').trim();
	input = input.replace(/\r/g,'').trim();
	input = input.replace(/(?:\r\n|\r|\n)/g,' ').trim();
	
	var val;
try{
	

	var parsedJSON = JSON.parse(input);

	
	if(parsedJSON.feed != undefined)
	{
	for(var d =0; d < parsedJSON.feed.data.length; d++)
	{
		var output="";
			
		for(var i=0;i<idList.length;i++)
		{
				val = 'parsedJSON.'+idList[i];
				
				try{
					
					evalVal = eval(val);
				}
				catch(ex){
					
					evalVal = '';
				}
				if(typeof evalVal == "object")
				{
					var objoutput = "";
					for(var l =0 ; l < evalVal.length; l++)
					{
						if(val == "parsedJSON.category_list")
						{
							objoutput += evalVal[l].id + "," + evalVal[l].name + ",";
						}
						
					}
					objoutput = objoutput.substr(0,objoutput.length -1);	
					output = output + objoutput + constants.fieldDelimter;
				}
				else
				{
					if(evalVal == undefined || evalVal == null) {
						if(val == "parsedJSON.cover.cover_id" || val == "parsedJSON.cover.offset_x" || val == "parsedJSON.cover.offset_y" ||val == "parsedJSON.engagement.count" || val == "parsedJSON.fan_count" || val == "parsedJSON.overall_star_rating" || val == "parsedJSON.rating_count")
						{
						    	output = output + '0' + constants.fieldDelimter;
						}
						else
						{
							output = output + 'null' + constants.fieldDelimter;
						}
					}else{
						if(val == "parsedJSON.description" || val == "parsedJSON.about" || val == "parsedJSON.bio" || val == "parsedJSON.business" || val == "parsedJSON.website")
						{
							
							var sent = evalVal;
							sent = sent.replace(/(\r\n|\n|\r)/gm,"").trim();
							sent = sent.substr(0,7000); // Some messages run past max value for varchar datatype.
							output = output + sent + constants.fieldDelimter;
							//console.log(desc);
						}
						else
						{
						output = output + evalVal + constants.fieldDelimter;
						}
						
					} 
				}
		}
			
			//Get Feed related fields and append it.
			var message = (parsedJSON.feed.data[d].message != undefined ? parsedJSON.feed.data[d].message : null);	//message
			var sentimentscore = '0';
			if(message != null)
			{
				message = message.replace(/(\r\n|\n|\r)/gm,"").trim();
				sentimentscore = sentiment(message);
				message = message.substr(0,7000);
				sentimentscore = sentimentscore.score;
			}
			output = output + message + constants.fieldDelimter;
			output = output + sentimentscore + constants.fieldDelimter;

			var picture = (parsedJSON.feed.data[d].picture != undefined ? parsedJSON.feed.data[d].picture : null);		//picture
			output = output + picture + constants.fieldDelimter;
			
			var videosource = (parsedJSON.feed.data[d].source != undefined ? parsedJSON.feed.data[d].source : null);		//video
			output = output + videosource + constants.fieldDelimter;
			
			var link = (parsedJSON.feed.data[d].link != undefined ? parsedJSON.feed.data[d].link : null);				//link
			output = output + link + constants.fieldDelimter;
			
			// Three obj - Comment, Like, Share
			var action = null;
			if(parsedJSON.feed.data[d].actions != undefined)
			{
					//Comment
				   action = (parsedJSON.feed.data[d].actions[0] != undefined ? parsedJSON.feed.data[d].actions[0].name : null) + "," + 
						   (parsedJSON.feed.data[d].actions[0] != undefined ? parsedJSON.feed.data[d].actions[0].link : null) + "," +  
						   (parsedJSON.feed.data[d].actions[1] != undefined ? parsedJSON.feed.data[d].actions[1].name : null) + "," +  
						   (parsedJSON.feed.data[d].actions[1] != undefined ? parsedJSON.feed.data[d].actions[1].link : null) + "," +  
						   (parsedJSON.feed.data[d].actions[2] != undefined ? parsedJSON.feed.data[d].actions[2].name : null) + "," +  
						   (parsedJSON.feed.data[d].actions[2] != undefined ? parsedJSON.feed.data[d].actions[2].link : null); 
						 
			}
			 	output = output + action + constants.fieldDelimter;
				
			var mess_tags = null;
			if(parsedJSON.feed.data[d].message_tags != undefined)
			{
				if(parsedJSON.feed.data[d].message_tags.length > 0)
				{
					for(var l =0; l < parsedJSON.feed.data[d].message_tags.length; l++ )
					{
						mess_tags = "";
						mess_tags += parsedJSON.feed.data[d].message_tags[l].id + "," + parsedJSON.feed.data[d].message_tags[l].name + "," + parsedJSON.feed.data[d].message_tags[l].type; 
					}
					
				}
			}
			output = output + mess_tags + constants.fieldDelimter;
			
			var scheduledpublishedtime = (parsedJSON.feed.data[d].scheduled_publish_time != undefined ? parsedJSON.feed.data[d].scheduled_publish_time : null);
			output = output + scheduledpublishedtime + constants.fieldDelimter;

			var createdtime = (parsedJSON.feed.data[d].created_time != undefined ? parsedJSON.feed.data[d].created_time : null);
			var day = null;
			var hour = 0;
			var timeframe = null;
			
			if(createdtime != null || createdtime != undefined)
			{
				 createdtime = new Date(Date.parse(createdtime)).toISOString().replace(/T/, ' ').replace(/\..+/, '');
				 var dt = new Date(createdtime);
				 //Get Day, Get Hours in 24H format, Get TimeFrame - Morning/Afternoon/Evening
				 //var intday = dt.getDay();
				 var weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
				 day = weekdays[dt.getDay()];
				 
				 hour = dt.getHours();
				 
				 if(0 < hour && hour < 12 )
				 {
				 	timeframe = "Morning";
				 }
				 else if( 12 < hour && hour < 18)
				{
					timeframe = "Afternoon";
				}
				else if(18 < hour && hour < 24)
				{
					timeframe = "Evening";
				}
			 
			}
			
			output = output + createdtime + constants.fieldDelimter;
			
			output = output + hour + constants.fieldDelimter;
			output = output + day + constants.fieldDelimter;
			output = output + timeframe + constants.fieldDelimter;
			
			output = output.substr(0,output.length-1);
			//output = output + "\n";
			
			payloads = [{topic: 'fbtopics', messages: output, partition: 0 }];
			 
			 producer.send(payloads, function (err, data) {
			    console.log('Pushed Successfully');
    		 });
		}
	}

}catch(ex){
	console.log(ex);
	
		fs.appendFile("op/errfile.txt",input,function(err){
		console.log(err);	
	});
	
	
}

	//output = output.substr(0,output.length-1);
//	return output;	
  };

}(jsonParsing));

module.exports = jsonParsing;
