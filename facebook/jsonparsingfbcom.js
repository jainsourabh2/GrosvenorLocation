'use strict'
var checkLocalFile = require('./createLocalFile');
const sanitizeHtml = require('sanitize-html');
var sentiment = require('sentiment');
const config = require('../config/config');
const constants = config.middlewareconstants;
const jsonParsing = {};
var fs = require('fs');
var abusiveflag = false;
var commentFilename= "/opt/nodeprojects/GrosvenorLocation/facebook/output/comments.txt";
var Q = require('q');
var defered = Q.defer();
var exec = require('child_process').exec;
var child;

(function(jsonParsing){

  jsonParsing.getParsedString = function(inputString,abusivelist){
	
	var idList = ["time","name","innerId","message","outId"];
	

	inputString = inputString.replace(/<3/g,'').trim();
	inputString = inputString.replace(/(\r\n|\n|\r)/gm,"").trim();
	
	//console.log("inputString ",inputString);
	
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

		console.log("got parsed json as input ");
		var parsedJSON = JSON.parse(input);
		
		if(parsedJSON != undefined)
		{
			var output="";
			var temp ="";	
			var evalVal="";
		console.log("start loop to parse json");
		for(var d =0; d < parsedJSON.length; d++)
		{
			//console.log("got parsed json");
			var varTime="";
			var varName="";
			var varInnerid="";
			var varMessage="";
			var varOutid="";
			var sentimentscore = '0';
			var varReplaceMsg ="";
			var abusiveScore = "";
                        var varPostid="";
			
			for(var i=0;i<idList.length;i++)
			{
	
					if(idList[i] === 'time'){
						val = 'parsedJSON['+[d]+'].'+idList[i];
						varTime = eval(val);
						
						var createdtime="";
						var createddate="";
						var day="";
						var hour="";
						var timeframe="";
						var onlytime="";
						if(varTime != null || varTime != undefined)
						{
							createdtime = new Date(Date.parse(varTime)).toISOString().replace(/T/, ' ').replace(/\..+/, '');
							createddate = createdtime.split(' ')[0];
							onlytime = createdtime.split(' ')[1];
							var dt = new Date(createdtime);
							//Get Day, Get Hours in 24H format, Get TimeFrame - Morning/Afternoon/Evening
							//var intday = d.getDay();
							var weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
							day = weekdays[dt.getDay()];
					 
							hour = dt.getHours();
					 
							if(8 <= hour && hour < 12 )
							{
					 			timeframe = "Morning";
							}
							else if( 12 <= hour && hour < 16)
							{
								timeframe = "Afternoon";
							}
							else if(16 <= hour && hour < 20)
							{
								timeframe = "Evening";
							}
							else if(20 <= hour && hour < 24)
							{
								timeframe = "Night";
							}
							else
							{
								timeframe = "MidNight";	
							}
				 
						}
					}
					
					if(idList[i] === 'name'){
						val = 'parsedJSON['+[d]+'].'+idList[i];
						varName = eval(val);
					}
					
					if(idList[i] === 'innerId'){
						val = 'parsedJSON['+[d]+'].'+idList[i];
						varInnerid = eval(val);
					}
					
					if(idList[i] === 'message'){
						val = 'parsedJSON['+[d]+'].'+idList[i];
						varMessage = eval(val);
						
						if(varMessage != null || varMessage !=undefined )
						{
							varReplaceMsg = varMessage.replace(/(\r\n|\n|\r)/gm,"").trim();
							sentimentscore = sentiment(varReplaceMsg);
							sentimentscore = sentimentscore.score;
							
								for(var al = 0; al < abusivelist.length ; al++)
			            		{
			            			if(varReplaceMsg.split(' ').indexOf(abusivelist[al]) > -1)
			            			{
			            				abusiveflag = true;
			            					break;
			            			}
			            		}
			            		
			            		if(abusiveflag)
								{
									abusiveScore = "1";
									abusiveflag = false;
								}else
								{
									abusiveScore = 0 ;
								}
							
						}
					}
					
					if(idList[i] === 'outId'){
						val = 'parsedJSON['+[d]+'].'+idList[i];
						varOutid = eval(val);
                                                varPostid = varOutid.split('_')[0];
					}
				
			}//end of IdList loop

                        evalVal = varName+constants.fieldDelimter+varInnerid+constants.fieldDelimter+varReplaceMsg+constants.fieldDelimter+varPostid+constants.fieldDelimter+varOutid+constants.fieldDelimter+createddate+constants.fieldDelimter+onlytime+constants.fieldDelimter+day+constants.fieldDelimter+hour+constants.fieldDelimter+timeframe+constants.fieldDelimter+sentimentscore+constants.fieldDelimter+abusiveScore+"\n";
	
			temp = temp+evalVal
			
		}//end of parsedJson loop
		 console.log("end loop to parse json... got Output");
		output= temp; //get another copy of output

               checkLocalFile.removeExistingLocalfile(commentFilename).then(function(r){
                            
        if(r == 0)
        {
            //console.log("writing file output is: ",output);
            fs.appendFile(commentFilename,output,'utf-8',function(err,res){
                if(err)
                {
		console.log("Error " + err);
                    defered.reject(new Error(err));
                }
                else
                {
                    defered.resolve(0);
		console.log("Writing file");
                    //Run Hadoop append file command to merge the content to HDFS
                    let hadoopcomm = "hadoop fs -appendToFile " + commentFilename + " " + "/grosvenor/facebook/fbcommentstopic/liverpoolone/comments.txt";
                    
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
    	        //console.log("writing file");
		//fs.appendFile(commentFilename,output,'utf-8',function(err,res){
                  //if(err)
                 //{
                   //console.log(new Error(err));
                 //}
		//});
			
	}

}catch(ex){
	console.log(ex);
	
		fs.appendFile("errfile.txt",input,function(err){
		console.log(err);	
	});
	
	
}

	
  };

}(jsonParsing));

module.exports = jsonParsing;
