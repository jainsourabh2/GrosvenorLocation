module.exports.getHKPublicEventVenueIds = function(req,res,logger){

      let request = require("request");
      let url = "http://10.80.2.4:8047/query.json";
      let moment = require('moment');
    
      let q = "select distinct venue_id, venuee, venuec, latitude, longitude from `hive_social_media`.`default`.`hkPublicVenuesDetails`";

      let dataarray = [];
      let dataobj = {};

      let reqoptions = {
          uri :url,
          headers:{'Content-Type':'application/json'},
          method : "POST",
          body: JSON.stringify({queryType : 'SQL', query : q})
          
      };

      //console.log("Query : " + q);
      logger.info("Public Events Venue Api called...");

      request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err) {
                  //console.log("Err: " + err);
                  logger.error("Error: " + err);
              }

              if (!err && response.statusCode ==200) {
                  
                    let obj = JSON.parse(data);
                
                    for(let p =0; p < obj.rows.length; p++) {
                      console.log(obj.rows[p]);

                      let venue_id = obj.rows[p].venue_id;
                      let venuee = obj.rows[p].venuee; 
                      let venuec = obj.rows[p].venuec; 
                      let latitude = obj.rows[p].latitude;
                      let longitude = obj.rows[p].longitude;
                                             
                      dataarray.push({  "pr" : { "p1" : venue_id , "p2" : venuee , "p3" : venuec , "p4" : latitude, "p5" : longitude}});

                    }

                    dataobj.type = "FeatureCollection";

                    dataobj.features = dataarray;

                    console.log(JSON.stringify(dataobj));

                    res.send(dataobj); 
              }
            });

}

module.exports.getHKPublicEventDetails = function(req,res,logger){

      let request = require("request");
      let url = "http://10.80.2.4:8047/query.json";
      let moment = require('moment');
      
      let venue_id = req.query.venue_id;

      if(venue_id == undefined)
      {
        let err = {};
        err.msg = "Venue id is required for the detail";
        res.send(err);
      }
      
      let q = "select distinct event_id, titlec, titlee, cat1, cat2, predateC, predateE, progtimec, progtimee, venue_id, urlc, urle, enquiry, email, saledate, submitdate " 
        + "from `hive_social_media`.`default`.`hkPublicEventsDetails` " 
        + " where venue_id = '" + venue_id + "'";

      let reqoptions = {
                  uri :url,
                  headers:{'Content-Type':'application/json'},
                  method : "POST",
                  body: JSON.stringify({queryType : 'SQL', query : q})
                  
              };
          //console.log("Query : " + q);
      logger.info("HK Public Event Details Api called...");

      request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err) {
                  //console.log("Err: " + err);
                    logger.error("Error: " + err);
              }
              if (!err && response.statusCode ==200) {
                  
                    let obj = JSON.parse(data);
                    var pdobj = {};
                   
                    // logger.info(obj.rows[0]);

                    if(obj.rows.length > 0) {

                       pdobj = obj.rows;
 
                    }   
                    
                 console.log(pdobj);
      
                 res.send(pdobj);
                 logger.info("HK Public Event Details api query end");
              }
            });

}