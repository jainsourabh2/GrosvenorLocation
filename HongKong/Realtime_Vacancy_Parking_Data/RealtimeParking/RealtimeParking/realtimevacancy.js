'use strict';
let request = require('request');
//http://api.eventful.com/json/events/search?app_key=58DzFPNGM4FphBWC&location=liverpool%20UK%20&within=5&date=2014010100-2017123100&page_size=100
let Q = require('q');
const sanitizeHtml = require('sanitize-html');
let fs = require("fs");
let exec = require('child_process').exec;
let child;
let filename = "outputfile/ParkingVacancyInfo.txt";

let apiurl = "https://api.data.gov.hk/v1/carpark-info-vacancy?data=vacancy";
let basefolderpath = "outputfile/";
var checkHDFS = require("./checkHDFSFolderexists");
var checkLocalFile = require('./createLocalFile');

let totalparking = [];
 var defered = Q.defer();
 
function realTimeParkingIngest()
{
   
        let reqoptions = {
              uri : apiurl,
              method : "GET"
    };
            
 
    request(reqoptions,function(err,response,data){
        if(err)
        {
            console.log("Eror in requesting API: " + err);
        }
        
        if(!err && response.statusCode ==200)
        {
             let eventdata = JSON.parse(data);
             for(let c =0; c < eventdata.results.length; c++)
            {
               totalparking.push(eventdata.results[c]); 
            }
             defered.resolve(eventdata);
           
        }
    });
    
    return defered.promise;
}



function parseData(data)
{
    let defered = Q.defer();
    let properies = ["park_Id","privateCar[0].vacancy_type","privateCar[0].vacancyEV","privateCar[0].vacancyDIS","privateCar[0].vacancy","privateCar[0].category",
    "privateCar[0].lastupdate","LGV[0].vacancy_type","LGV[0].vacancy_type","LGV[0].vacancyEV","LGV[0].vacancyDIS","LGV[0].vacancy","LGV[0].lastupdate",
    "HGV[0].vacancy_type","HGV[0].vacancy_type","HGV[0].vacancyEV","HGV[0].vacancyDIS","HGV[0].vacancy","HGV[0].lastupdate",
    "motorCycle[0].vacancy_type","motorCycle[0].vacancy_type","motorCycle[0].vacancyEV","motorCycle[0].vacancyDIS","motorCycle[0].vacancy","motorCycle[0].lastupdate"];
      
    
      let res = data.results;
      
      for(let g =0 ; g < res.length; g++)
      {
            let eachrow = "";
            
        for(let p =0 ; p < properies.length; p++)
        {
            try{
              
                 let val = eval("res[" + g + "]" + "." + properies[p]);
                    val = (val == null || val == "") ? null : val.toString().replace(/\|/g,'#').trim();
                    eachrow +=  val + "|"; 
            }
            catch(ex)
            {
               eachrow +=  null + "|";  
            }
        }
        
         eachrow = eachrow.substr(0,eachrow.length - 1);
       
        
        //Check for new line and special characters.
        
        	var eachline = sanitizeHtml(eachrow, {
                		allowedTags: [],
                		allowedAttributes: []
                	});

        
        eachline = eachline.replace(/<3/g,'').trim();
	    eachline = eachline.replace(/(\r\n|\n|\r)/gm,"").trim();
	    eachline = eachline.replace(/&amp;/gi,'&').trim();
    	eachline = eachline.replace(/&lt;/gi,'<').trim();
    	eachline = eachline.replace(/&gt;/gi,'>').trim();
    	eachline = eachline.replace(/&quot;/gi,'"').trim();
    	eachline = eachline.replace(/\t/g,'').trim();
    	eachline = eachline.replace(/\n/g,'').trim();
    	eachline = eachline.replace(/\r/g,'').trim();
    	eachline = eachline.replace(/(?:\r\n|\r|\n)/g,' ').trim();
	    eachline += '\n';
        
                fs.appendFile(filename,eachline,'UTF-8',function(err,wres){
                  if(!err)
                  {
                     // defered.resolve(0);
                  }
            
                 });
                    
            console.log(eachline);
           
      }
      
      defered.resolve(0);
    
    return defered.promise;
}

 checkLocalFile.removeExistingLocalfile(filename).then(function(r){
    if(r == 0)
    {
        realTimeParkingIngest().then(function(resultdata){
        let resultarray = resultdata;
       
        parseData(resultarray).then(function(data){
           if(data == 0)
           {
               console.log("File Written");
               // Put the output file into Hadoop path
                 var hdfsfolder = "/grosvenor/HongKong/ParkingInfo/vacancy";
                 var CheckFolderCommand = "hadoop fs -ls " + hdfsfolder;
                 let updatedfilename = filename + "_" + new Date().getTime().toString();
                 let FScommand = "hadoop fs -put " + filename  + " " + hdfsfolder + "; hadoop fs -mv " + hdfsfolder + "/" + filename + " " + hdfsfolder + "/" + updatedfilename;
                 
                 child = exec(FScommand, function (error, stdout, stderr) {
                              
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
        })
    });
    }
});

