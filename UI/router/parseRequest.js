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

                        var curAgr = obj.rows[p].Cur;		
            						var prevAgr = obj.rows[p].Prev;
            						var storename = obj.rows[p].storename;
            						var zone = obj.rows[p].Zone;
            						var lat = obj.rows[p].Latitude;
            						var lon = obj.rows[p].Longitude;
            						var id = obj.rows[p].Id;
                        var dayPeriod = obj.rows[p].DayPeriod;

                        let diff = getVariance(curAgr,prevAgr);
						
            						dataarray.push({ 
                                         "pr" : { "p1" : curAgr , "p2" : prevAgr , "p3" : storename, "p4" : zone, "p5" : id, "p6" : dayPeriod, "p7":diff} , 
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

        function getVariance(curAgr,prevAgr)
        {
          let variance = (100 * (curAgr - prevAgr ))/curAgr;
          return (parseFloat(variance).toFixed(2));
        }

}