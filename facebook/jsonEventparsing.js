'use strict'
const sanitizeHtml = require('sanitize-html');
const config = require('../config/config');
const constants = config.middlewareconstants;
const jsonParsing = {};
var fs = require('fs');
const kafka  = require('kafka-node');
var Producer 		= kafka.Producer;
var kafkaClient 	= new kafka.Client('localhost:2181');
var producer 		= new Producer(kafkaClient);
var checkLocalFile = require('./createLocalFile');
var filename = "/opt/nodeprojects/GrosvenorLocation/facebook/output/Eventdata.txt";
var Q = require('q');
var exec = require('child_process').exec;
var child;
var evalVal;

(function(jsonParsing){
	
  jsonParsing.getParsedString = function(inputString){
	
	var defered = Q.defer();
	var idList = ["id","name","description","updated_time","start_time","end_time","place.name","place.location.city","place.location.country","place.location.latitude","place.location.longitude","place.location.street","place.location.zip"];
	

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
try
{
	var parsedJSON = JSON.parse(input);
	var output="";
	
	if(parsedJSON.events != undefined)
	{
	for(var d =0; d < parsedJSON.events.data.length; d++)
	{
		for(var i=0;i<idList.length;i++)
		{
			val = 'parsedJSON.events.data['+d+'].'+idList[i];
			
			try{
				
				evalVal = eval(val);
			}
			catch(ex){
				
				evalVal = 'null';
			}
			
			if(val == 'parsedJSON.events.data['+d+'].description' )
			{
				
				var sent = evalVal;
				sent = sent.replace(/(\r\n|\n|\r)/gm,"").trim();
				sent = sent.replace(/\|/g,'#').trim();
				output = output + sent + constants.fieldDelimter;
				//console.log(desc);
			}
			else if(val == 'parsedJSON.events.data['+d+'].updated_time' || val == 'parsedJSON.events.data['+d+'].start_time' || val == 'parsedJSON.events.data['+d+'].end_time')
			{
				var datetm = evalVal;
				var dt = "";
				var tm = "";
				
				if(datetm == undefined)
				{
					dt = 'null';
					tm = 'null';
				}
				else
				{
					datetm = new Date(Date.parse(datetm)).toISOString().replace(/T/, ' ').replace(/\..+/, '');
					dt = datetm.split(' ')[0];
					tm = datetm.split(' ')[1];	
				}
			
				output = output + dt + constants.fieldDelimter;
				output = output + tm + constants.fieldDelimter;
			}
			else
			{
				output = output + evalVal + constants.fieldDelimter;	
			}
						
		} 
		
			output = output.substr(0,output.length-1);
			output = output + "\n";
			console.log(output);
	}
		
	}
		//	payloads = [{topic: 'fbeventstopic', messages: output, partition: 0 }];
			 
		/*	 producer.send(payloads, function (err, data) {
			    console.log('Pushed Successfully');
    		 }); */
    		 
    		  checkLocalFile.removeExistingLocalfile(filename).then(function(r){
                            
                    if(r == 0)
                    {
                        fs.appendFile(filename,output,'utf-8',function(err,res){
                            if(err)
                            {
                                defered.reject(new Error(err));
                            }
                            else
                            {
                                defered.resolve(0);
                                //Run Hadoop append file command to merge the content to HDFS
                               // let HDFSpath = "/grosvenor/facebook/fbeventstopic/events/FacebookEvent.txt";
                                let hadoopcomm = "hadoop fs -appendToFile " + filename + " /grosvenor/facebook/fbeventstopic/events/FacebookEvent.txt";
                                
                               child = exec(hadoopcomm, function (error, stdout, stderr) {
                          
		                          if (error !== null) {
		                            console.log('exec error: ' + error);
		                          }
		                          else
		                          {
		                              console.log("File successfully uploaded ");
		                              process.exit(0);
		                          }
		               	}); 
                                
                            }
                    
                         }); 
                        
                    }
                             
                });
    		 
		}
	catch(ex){
		console.log(ex);
	
		fs.appendFile("op/errfile.txt",input,function(err){
		console.log(err);	
	});
	
	
}

  };

}(jsonParsing));

module.exports = jsonParsing;