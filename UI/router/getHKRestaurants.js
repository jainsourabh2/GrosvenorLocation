module.exports.getHKRestaurantIds = function(req,res,logger){

      let request = require("request");
      let url = "http://10.80.2.4:8047/query.json";
      let moment = require('moment');
      
      let q = "select distinct rest_id,latitude,longitude from `hive_social_media`.`default`.`HKrestaurantdetails` ";
      let dataarray = [];
      let dataobj = {};

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
                  
                     let obj = JSON.parse(data);
                
                    for(let p =0; p < obj.rows.length; p++)

                    {
                      console.log(obj.rows[p]);

                        let id = obj.rows[p].rest_id; 
                        let latitude = obj.rows[p].latitude;
                        let longitude = obj.rows[p].longitude;
                                               
                        dataarray.push({  "pr" : { "p1" : id , "p2" : latitude , "p3" : longitude}});

                      }

                    dataobj.type = "FeatureCollection";

                    dataobj.features = dataarray;

                    console.log(JSON.stringify(dataobj));

                    res.send(dataobj); 
              }
            });

}

module.exports.getHKRestaurantDetails = function(req,res,logger){

      let request = require("request");
      let url = "http://10.80.2.4:8047/query.json";
      let moment = require('moment');
      
       let rest_id = req.query.restid;

      if(rest_id == undefined)
      {
        let err = {};
        err.msg = "Restaurant id is required for the detail";
        res.send(err);
      }
       

      let q = "SELECT * FROM `hive_social_media`.`default`.`HKrestaurantdetails` where rest_id ='" + rest_id + "' order by scraped_date desc limit 1 ";

      let reqoptions = {
                  uri :url,
                  headers:{'Content-Type':'application/json'},
                  method : "POST",
                  body: JSON.stringify({queryType : 'SQL', query : q})
                  
              };
          //console.log("Query : " + q);
          logger.info("HKRestaurant Detail Api called...");

      request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err)
              {
                  //console.log("Err: " + err);
                    logger.error("Error: " + err);
              }
              if (!err && response.statusCode ==200)
              {
                  
                    let obj = JSON.parse(data);
                    var pdobj = {};
                   
                    logger.info(obj.rows[0]);

                    if(obj.rows.length > 0)
                    {

                       pdobj = obj.rows[0];
 
                    }
                    
                    
                 console.log(pdobj);
      
                 res.send(pdobj);
                 logger.info("HK Restaurant Detail list api query end");
              }
            });

}