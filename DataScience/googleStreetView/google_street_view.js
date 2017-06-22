// get walking directions from central park to the empire state building
'use strict';
var http = require("http"),
   //url = "http://maps.googleapis.com/maps/api/directions/json?origin=Central Park&destination=Empire State Building&sensor=false&mode=walking",
    url = "http://maps.googleapis.com/maps/api/streetview?size=600x300&location=46.414382,10.013988&heading=151.78&pitch=-0.76&key=<APIKEY>",
    fs = require("fs");
let recordlist = [];
let lat = [];
let long = [];
let areacode = [];
let urllist = [];

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
            url = "http://maps.googleapis.com/maps/api/streetview?size=600x300&location=" + lat[u] + "," + long[u] + "&heading=151.78&pitch=-0.76&key=<APIKEY>";  //Pass API Key here
            urllist.push(url);
            console.log("Url is : " + url);
        }
         writeImage(0,urllist);
        
    });
    
    
    function writeImage(i,urllink)
    {
        if( i < urllink.length)
        {
            var f= fs.createWriteStream('outputimages/LiverpoolImage/' + areacode[i] + '.jpeg');
        
            var request = http.get(urllink[i], function (response) {
                var buffer = "", 
                    data,
                    route;
            
                response.on("data", function (chunk) {
                    f.write(chunk);
                }); 
            
                response.on("end", function (err) {
                    f.end();
                    writeImage(i + 1,urllink);
                }); 
            });
        }
    }
    
   

