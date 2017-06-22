
'use strict';
var http = require("http"),
   
    url = "http://maps.googleapis.com/maps/api/streetview?size=600x300&location=46.414382,10.013988&heading=151.78&pitch=-0.76&key=<APIKEY>",
    fs = require("fs");
let winnerurllist = []; 
let looserurllist = []; 
let recordlist = [];
let winnerslist = [];
let winnerslat = [];
let winnerslong = [];
let looserslat = [];
let looserslong = [];

    fs.readFile("uk_lat_long.csv",'utf-8',function(req,res){
        
        
        recordlist = res.split('\n');
        
        for(let i= 0; i < recordlist.length; i++)
        {
            let winner = recordlist[i].split(',')[2];
            
            if(winner == "left")
            {
                winnerslat.push(recordlist[i].split(',')[3]);
                winnerslong.push(recordlist[i].split(',')[4]);
                
                looserslat.push(recordlist[i].split(',')[5]);
                looserslong.push(recordlist[i].split(',')[6]);
            }
            else if (winner == "right")
            {
                winnerslat.push(recordlist[i].split(',')[5]);
                winnerslong.push(recordlist[i].split(',')[6]);
                
                looserslat.push(recordlist[i].split(',')[3]);
                looserslong.push(recordlist[i].split(',')[4]);
                
            }
         /*   else{
                
                 winnerslat.push(recordlist[i].split(',')[3]);
                winnerslong.push(recordlist[i].split(',')[4]);
                
                looserslat.push(recordlist[i].split(',')[5]);
                looserslong.push(recordlist[i].split(',')[6]);
                
                winnerslat.push(recordlist[i].split(',')[5]);
                winnerslong.push(recordlist[i].split(',')[6]);
                
                looserslat.push(recordlist[i].split(',')[3]);
                looserslong.push(recordlist[i].split(',')[4]);
                 
            } */
            
        }
       
       for(let u =0; u < winnerslat.length; u++)
        {
            url = "http://maps.googleapis.com/maps/api/streetview?size=600x300&location=" + winnerslat[u] + "," + winnerslong[u] + "&heading=151.78&pitch=-0.76&key=<APIKEY>";
            winnerurllist.push(url);
            console.log("Url is : " + url);
        }
         writeImage(0,winnerurllist,"winner");
         
         for(let u =0; u < looserslat.length; u++)
        {
            url = "http://maps.googleapis.com/maps/api/streetview?size=600x300&location=" + looserslat[u] + "," + looserslong[u] + "&heading=151.78&pitch=-0.76&key=<APIKEY>";
            looserurllist.push(url);
            console.log("Url is : " + url);
        }
         writeImage(0,looserurllist,"looser");
        
    });
    
    
    function writeImage(i,urllink,entity)
    {
        if( i < urllink.length)
        {
            var f= fs.createWriteStream('outputimages/' + entity + "/" + entity + "Image" + i + '.jpeg');
        
            var request = http.get(urllink[i], function (response) {
                var buffer = "", 
                    data,
                    route;
            
                response.on("data", function (chunk) {
                    f.write(chunk);
                }); 
            
                response.on("end", function (err) {
                    f.end();
                    writeImage(i + 1,urllink,entity);
                }); 
            });
        }
    }
    
   

