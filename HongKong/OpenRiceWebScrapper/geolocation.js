'use strict'
let geocoder = require("google-geocoder");
let Q = require("q");

let apikeys = ['AIzaSyBzMxMJyp_lnk5JDW3YbKK_XIYkiFG8w6s' ,'AIzaSyCBAkblsUSpejOjYvNQuhOb2Qrlj9jNsoM','AIzaSyD89uiMrEnbUrc6wj7mMttTIdWBdD6MzgQ'];

module.exports.getGeoCodeFunction = function(placearray){
    let updatedarray = [];
   // let placearr = placearray.data;
    //let town = placearray.town;
     let defer = Q.defer();
     function getGeocode(i)
     {
       
         var geo = geocoder({
          key: apikeys[Math.floor(Math.random() * apikeys.length)]
        }); 
        
         if(i < placearray.length)
         {
           
 	       let address = placearray[i].split("|")[9];
  	       if(address != "")
  	       {
  	       let place2search =  address + " " + "Hong Kong";
  	         
                geo.find( place2search , function ( err, data ) {
             //   geocoder.geocode( place2search , function ( err, data ) {          
                     let latitude = "";
                     let longitude = "";
                     if(err)
                     {
                         console.log("Error in Geocoder response in key : " + geo.queryData.key);
                     }
                     
                     if(data != undefined && data.length > 0 && data[0].location != undefined)
                     {
                         
                          latitude = data[0].location.lat;
                          longitude = data[0].location.lng;
                     }
                     
                      let newrec = placearray[i] + "|" + latitude + "|" + longitude;
                      updatedarray.push(newrec);
                      console.log("Total length : " + placearray.length);
                      console.log(i + " record  : " + newrec);
                   
                     getGeocode(i + 1);
                    
                  });
  	       }
  	       else
  	       {
  	         defer.resolve(updatedarray);
  	       }
         }
         else{
             
              defer.resolve(updatedarray);
         }
           
     }
     
     getGeocode(0);
     return defer.promise;
}