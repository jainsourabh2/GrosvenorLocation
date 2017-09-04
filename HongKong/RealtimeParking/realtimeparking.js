'use strict';
let request = require('request');
//http://api.eventful.com/json/events/search?app_key=58DzFPNGM4FphBWC&location=liverpool%20UK%20&within=5&date=2014010100-2017123100&page_size=100
let Q = require('q');
const sanitizeHtml = require('sanitize-html');
let fs = require("fs");

let filename = "outputfile/ParkingInfo.txt";

let apiurl = "https://api.data.gov.hk/v1/carpark-info-vacancy";


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
    let properies = ["park_Id","name","nature","carpark_Type","address.region","address.dcDistrict","address.subDistrict",
    "address.buildingNo","address.streetName","displayAddress","district","latitude","longitude","contactNo","website","renditionUrls.carpark_photo","opening_status",
    "heightLimits[0].height",
    "facilities","privateCar.spaceUNL","privateCar.spaceEV","privateCar.spaceDIS","privateCar.space",
    "LGV.spaceUNL","LGV.spaceEV","LGV.spaceDIS","HGV.space","HGV.spaceUNL","HGV.spaceEV","HGV.spaceDIS","HGV.space","coach.spaceUNL","coach.spaceEV",
    "coach.spaceDIS","coach.space","motorCycle.spaceUNL","motorCycle.spaceEV",
    "motorCycle.spaceDIS","motorCycle.space","creationDate"];
      
    
      let res = data.results;
      
      for(let g =0 ; g < res.length; g++)
      {
            let eachrow = "";
            
        for(let p =0 ; p < properies.length; p++)
        {
            try{
                
               if(properies[p] == "facilities")
                {
                    if(eval("data[" + g + "]" + "." + properies[p]) != null)
                    {
                        let facilityarray = eval("data[" + g + "]" + "." + properies[p]);
                         let eachval ="";
                        for(let y=0; y < facilityarray.length; y++)
                        {
                           eachval = facilityarray[y] + ",";
                        }
                        eachval = eachval.substring(0,eachval.length -1);
                         eachrow +=  eachval + "|";
                    }
                    
                }
                else
                {
                 let val = eval("res[" + g + "]" + "." + properies[p]);
                    val = (val == null || val == "") ? null : val.toString().replace(/\|/g,'#').trim();
                    eachrow +=  val + "|"; 
                }
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

realTimeParkingIngest().then(function(resultdata){
    let resultarray = resultdata;
   
    parseData(resultarray).then(function(data){
       if(data == 0)
       {
           console.log("File Written");
       }
    })
});

