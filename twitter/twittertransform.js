var fs = require("fs");
var gracefulFs = require('graceful-fs');
var Q = require("q");
var sentiment = require("sentiment");
var abusivelist = [];
var abusiveflag = false;
var newrecordlist = [];
var ipdirectorypath = "/home/GvAdmin/twitterdata/";
var opdirectorypath = "/home/GvAdmin/twitterdataOp/";
gracefulFs.gracefulify(fs);

console.log("Start");
function readDir(path)
{
    var d = Q.defer();
    fs.readdir(path,function(err,files)
    {
        if(err)
        {
            d.rejec(new Error(err));
        }
        else
        {
            d.resolve(files);
        }
    });
    
    return d.promise;
}


function readFilePath(path)
{
    var deferred = Q.defer();
    fs.readFile(path,'utf-8',function(err,data)
    {
        if(err)
        {
            deferred.reject(new Error(err));
        }
        else
        {
            deferred.resolve(data);
        }
        
    });
          return deferred.promise;
}


   readDir(ipdirectorypath).then(function(files){
       files.forEach(file => {
        console.log("File to process :" +  file);    
	processEachFile(file);
          });
   });
   
   function processEachFile(filename)
   {
	console.log("Inside pr");
       readFilePath('/opt/nodeprojects/GrosvenorLocation/config/abusivewords').then(function(data){
          abusivelist = data.split('\n');
	  //console.log("Abusive " + abusivelist);
          return readFilePath(ipdirectorypath + filename);
        }).then(function(data){
	   console.log("Processing for " + filename);            
            var records = data.split('\n');
	   //console.log("Dtat : " + records);
	   console.log("Total record to process " + records.length);
            for(var ir = 0; ir < records.length; ir++)
            {
                    var eachrecord = records[ir].replace('\r','').split('|');
                   // console.log(eachrecord);
                    var tweet = eachrecord[2];
                    var sentimentscore = sentiment(tweet).score;
                    
                    	for(var al = 0; al < abusivelist.length ; al++)
            			{
            				if(tweet.split(' ').indexOf(abusivelist[al]) > -1)
            				{
            					abusiveflag = true;
            					break;
            				}
            			}
            	        
            	        eachrecord.splice(3,0,sentimentscore);
            	       
            	        if(abusiveflag)
            	        {
            	            eachrecord.push("1");
            	        }
            	        else
            	        {
            	            eachrecord.push("0");
            	        }
            	        abusiveflag = false;
            	        // console.log(eachrecord);
            	        var newrecord = eachrecord.join('|');
            	        // console.log(newrecord);
			var finalrecord = newrecord + '\r\n';
            		console.log(finalrecord);
            
            	        //newrecordlist.push(newrecord);
			console.log("Processed record " + ir);
			fs.appendFile(opdirectorypath + filename,finalrecord,function(err,d)
           	 	{	
				if(err)
				{
				console.log("Error wyhile writing : " + err);
				}
                		//console.log("File Written for record " + ir + " in file " + filename);
            		});
			
            }
          
            
    					
        }).fail(function(error){console.log("Error occured : " + error)});
   }

