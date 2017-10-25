'use strict'
let geocoder = require("google-geocoder");
let async = require('async');
let Q = require("q");

//let apikeys = ['AIzaSyBzMxMJyp_lnk5JDW3YbKK_XIYkiFG8w6s' ,'AIzaSyCBAkblsUSpejOjYvNQuhOb2Qrlj9jNsoM','AIzaSyD89uiMrEnbUrc6wj7mMttTIdWBdD6MzgQ'];
let apikeys = ['AIzaSyAheZPsQaGaH4HGps03mEbyu9828DQrLOw'];

module.exports.getGeoCodeFunction = function(placeArray) {

    let updatedArray = [];
    let defer = Q.defer();
    
    async.forEach(placeArray, function(place, callback) {
        getGeocode(place, callback);
        
	}, function(err) {
        if (err) {
			defer.reject(err);
        } else {
        	defer.resolve(updatedArray);
        }
    });

    return defer.promise;
    
    function getGeocode(place, callback){
        let address = place.split("|")[9];
        
        if (address != "") {
            let place2search = address + " " + "Hong Kong";
    
            var geo = geocoder({
                key: apikeys[Math.floor(Math.random() * apikeys.length)]
            });

            geo.find(place2search, function(err, data) {
                let latitude = "";
                let longitude = "";
                if (err) {
                    console.log("Error in Geocoder response in key : " + geo.queryData.key);
                }
    
                if (data != undefined && data.length > 0 && data[0].location != undefined) {
                    latitude = data[0].location.lat;
                    longitude = data[0].location.lng;
                }
    
                let newRec = place + "|" + latitude + "|" + longitude;
                updatedArray.push(newRec);
                
                // console.log("Total length : " + placeArray.length);
                console.log("Updated record  : " + newRec);
                callback();
            });
            
        } else {
            callback();
        }
    }
}