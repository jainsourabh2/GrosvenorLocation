'use strict';
module.exports.parseRequest = function(req,res,entity,q){

var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
const logger = require('../config/log.js');
  
//This is common function which will be called for parsing request from all endpoints

	var dataobj = {};
	var dataarray = [];
	
	console.log("Start parseRequest for getAggregate"+entity+"Data");

	var reqoptions = {
		uri :url,
		headers:{'Content-Type':'application/json'},
		method : "POST",
		body: JSON.stringify({queryType : 'SQL', query : q})        	    
	};
        
		request(reqoptions, function(err, response, data){

               logger.info("Processing  request for getAggregate"+entity+"Data");

               if(err)

               {

                logger.error("Error: " + err);

               }
               if (!err && response.statusCode ==200){
                   var obj = JSON.parse(data);
                   for(let p =0; p < obj.rows.length; p++)

                    {

                      console.log(obj.rows[p]);

                        var totalcount = obj.rows[p].totalcount;		
            						var storename = obj.rows[p].storename;
            						var zone = obj.rows[p].Zone;
            						var lat = obj.rows[p].Latitude;
            						var lon = obj.rows[p].Longitude;
            						var id = obj.rows[p].Id;
            						var dayPeriod = obj.rows[p].DayPeriod;
						
            						dataarray.push({
                                         "pr" : { "p1" : totalcount , "p2" : storename , "p3" : zone, "p4" : id, "p5" : dayPeriod} , 
                                         "ge" : { "lo" : lon , "la" : lat }});

                                }

					               dataobj.type = "FeatureCollection";

                    dataobj.features = dataarray;

                    console.log(JSON.stringify(dataobj));

                    res.send(dataobj); 

                }else{
                        var errorobj = {"error" : "Unexpected Error"};
                        res.send(errorobj);
						logger.info("Error for getAggregate"+entity+"Data");
                 } 
				logger.info("End for getAggregate"+entity+"Data");
        });
        console.log("End parseRequest for getAggregate"+entity+"Data");

}