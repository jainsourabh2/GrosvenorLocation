module.exports.getRestaurantDetails = function(req,res,logger){

      let request = require("request");
      let url = "http://10.80.2.4:8047/query.json";
      let moment = require('moment');
      
      let q = "select * from `hive_social_media`.`default`.`HKrestaurantdetails` ";

      let reqoptions = {
          uri :url,
          headers:{'Content-Type':'application/json'},
          method : "POST",
          body: JSON.stringify({queryType : 'SQL', query : q})
          
      };

      //console.log("Query : " + q);
      logger.info("Restaurant Details Api called...");

      request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err) {
                  //console.log("Err: " + err);
                  logger.error("Error: " + err);
              }

              if (!err && response.statusCode ==200) {
                  
                    data = JSON.parse(data);
                
                    var restaurantDetailsObj = {};

                    var index;
                    for(record in data){

                    }

                 
                    logger.info(obj.rows[0]);
                    let title = obj.rows[0].Title;
                    let starttime = obj.rows[0].Start_time;
                    let description = obj.rows[0].Description;
                    let url =  obj.rows[0].url;
                    let venuename =  obj.rows[0].venue_name; 
                    let venueadd =  obj.rows[0].venue_address;
                    let image =  obj.rows[0].image;

                    if (image === null || image === '' || image === 'null'){
                      image = "";
                    }

                    eventsobj.p1 = title;
                    eventsobj.p2 = starttime;
                    eventsobj.p3 = description;
                    eventsobj.p4 = url;
                    eventsobj.p5 = venuename;
                    eventsobj.p6 = venueadd;
                    eventsobj.p7 = image;
                    
                // console.log(jsonarray);
                 
                 res.send(eventsobj);
                 logger.info("Event Detail list api query end");
              }
            });

}

