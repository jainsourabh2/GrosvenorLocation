'use strict'
let geocoder = require("google-geocoder");
//let geocoder = require("geocoder");
let Q = require("q");
let updatedarray = [];
let apikeys = ['AIzaSyD89uiMrEnbUrc6wj7mMttTIdWBdD6MzgQ'];

module.exports.getGeoCodeFunction = function(placearray){
    
    let placearr = placearray.data;
    let town = placearray.town;
     let defer = Q.defer();
     function getGeocode(i,town)
     {
       
         var geo = geocoder({
          key: apikeys[Math.floor(Math.random() * apikeys.length)]
        }); 
        
         if(i < placearr.length)
         {
           let twn_name = town.replace(/\-/g, ' ');
 	       let propertyname = placearr[i].split("|")[2];
 	       let place2search = propertyname + " " + twn_name + " " + "Hong Kong";
 	         
               geo.find( place2search , function ( err, data ) {
            //   geocoder.geocode( place2search , function ( err, data ) {          
                    let latitude = "";
                    let longitude = "";
                    if(err)
                    {
                        console.log("Error in Geocoder response")
                    }
                    
                    if(data != undefined && data.length > 0 && data[0].location != undefined)
                    {
                        
                         latitude = data[0].location.lat;
                         longitude = data[0].location.lng;
                    }
                    
                    
                  /*   if(data.results != undefined && data.results[0].geometry != undefined && data.results[0].geometry.location != undefined)
                    {
                        latitude = data.results[0].geometry.location.lat;
                         longitude = data.results[0].geometry.location.lng; 
                    }
                    */
                    
                     let newrec = placearr[i] + "|" + twn_name + "|" + latitude + "|" + longitude;
                     updatedarray.push(newrec);
                     console.log("Total length : " + placearr.length);
                     console.log(i + " record  : " + newrec);
                    getGeocode(i + 1, town);
                   
                 });
         }
         else{
             
              defer.resolve(updatedarray);
         }
           
     }
     
     getGeocode(0,town);
     return defer.promise;
}
 
 
 