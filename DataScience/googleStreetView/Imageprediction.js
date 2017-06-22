
'use strict';
var request = require("request"),
   
    url = "http://maps.googleapis.com/maps/api/streetview?size=600x300&location=46.414382,10.013988&heading=151.78&pitch=-0.76&key=<APIKEY>",
    fs = require("fs");
let recordlist = [];
let lat = [];
let long = [];
let areacode = [];
let urllist = [];

let projectid = "<CustomVision ProjectID here>";
let iterationId = "<CustomVision Iterationid here>";
let predictionkey = "<CustomVision Prediction here>";

let customvisionapiurl = "https://southcentralus.api.cognitive.microsoft.com/customvision/v1.0/Prediction/" + projectid + "/url?iterationId=" + iterationId;

    fs.readFile("liverpool_lat_long_cp.csv",'utf-8',function(req,res){
        
        
        recordlist = res.split('\n');
        
        for(let i= 0; i < recordlist.length; i++)
        {
            areacode.push(recordlist[i].split(',')[0]);
            lat.push(recordlist[i].split(',')[1]);
            long.push(recordlist[i].split(',')[2]);
        }
        console.log("Lat length : " + lat.length);
        console.log("Long length : " + long.length);
        
        for(let u =0; u < lat.length; u++)
        {
            url = "http://maps.googleapis.com/maps/api/streetview?size=600x300&location=" + lat[u] + "," + long[u] + "&heading=151.78&pitch=-0.76&key=<APIKEY>";
            urllist.push(url);
            console.log("Url is : " + url);
        }
         predictScore(0,urllist,recordlist);
        
    });
    
    
    function predictScore(i,urllink,recordlist)
    {
        if( i < urllink.length)
        {
           
        let reqoptions = {
                      uri : customvisionapiurl,
                      headers:{'Prediction-Key' : predictionkey, 'Content-Type':'application/json'},
                      method : "POST",
                      body: JSON.stringify({Url : urllink[i]})
                      
              };

        
        request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err)
              {
                  console.log("Err: " + err);
                   
              }
              if (!err && response.statusCode ==200)
              {
                  let obj = JSON.parse(data);
                  let safescore = 0;
                  let unsafescore = 0;
                  let recordarray = recordlist[i].split(',');
                  
                  if(obj.Predictions != undefined)
                  {
                      safescore = obj.Predictions.find(x => x.Tag == "safe").Probability;
                      unsafescore = obj.Predictions.find(x => x.Tag == "unsafe").Probability;
                  }
                  
                  let areacode = recordarray[0].trim();
                  let latitude = recordarray[1].trim();
                  let longitude = recordarray[2].trim(); 
                  let safe_score = safescore;
                  let unsafe_score = unsafescore;
                  
                  let outputrec = areacode + "|" + latitude + "|" + longitude + "|" + safe_score + "|" + unsafe_score + "\n";
                  
                  fs.appendFile("output/liverpool_predicted_result.txt",outputrec,'utf-8',function(err,res){
                     if(err)
                     {
                         console.log(err);
                     }
                     else
                     {
                         console.log("Record written : " + (i + 1)  );
                         predictScore((i + 1),urllink,recordlist);
                     }
                  });
                  
              }
        });
            
            
        }
    }
    
   

