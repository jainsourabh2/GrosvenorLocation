module.exports.getAllTwitterData = function(req,res,logger)
{
	var request = require("request");
	var url = "http://10.80.2.4:8047/query.json";
	var moment = require('moment');
	var q = require('q');

	let source = req.query.dataset;
     let obj = {};
    let dataobj = {};
    let dataarray = [];
     let startdate = req.query.startdate;
    let enddate = req.query.enddate;
    let todaydate = new Date().toLocaleDateString();
     let tweetid =req.query.tweetid;
    //var moment_todaydate = moment(todaydate,"yyyy-mm-dd");
     let sdate = (startdate != undefined) ? startdate.substr(2,startdate.length) : moment(todaydate,"yyyy-mm-dd").subtract(1,'days').toISOString().split('T')[0].substr(2,moment(todaydate,"yyyy-mm-dd").toISOString().length);  //Format in yyyy-mm-dd Current date
     let edate = (enddate != undefined) ? enddate.substr(2,enddate.length) :  moment(todaydate,"yyyy-mm-dd").toISOString().split('T')[0].substr(2,moment(todaydate,"yyyy-mm-dd").toISOString().length); 
     console.log("Startdate" + sdate);
     console.log("EndDate" + edate);

     if(source == "twitter")
    {
   		if(tweetid == undefined)
            {
               let q = " select tweet_id,geolatitude,geolongitude from `hive_social_media`.`default`.`newtwittercategorystream`  " +
                    "  where  create_date between '" + sdate + "' and '" + edate + "' and category=0 " +  
                    "  and  CAST(geolatitude as float) between 51.2611  and 51.7160 " +  
                    "  and CAST(geolongitude as float) between -0.5383  and 0.2939 " + 
                    " and geolatitude <> 'null' and " + 
                    "  geolongitude <> 'null' " ; 

                let reqoptions = {
                        uri :url,
                        headers:{'Content-Type':'application/json'},
                        method : "POST",
                        body: JSON.stringify({queryType : 'SQL', query : q})
                        
                    };
                
               // var postData = ;
               let jsondata = "";
                                
                logger.info("Starting query"); 
                request(reqoptions, function(err, response, data){
                    //console.log(response + " " + err + " " + data);
                    if(err)
                    {
                        console.log("Err: " + err);
                       // logger.error("Error: " + err);
                    }
                    if (!err && response.statusCode ==200){
                      console.log("Reached within query");
                     // console.log(data);
                    //console.log(data.length);
                    try
                    {
                        logger.info("Callback receieved");
                        obj = JSON.parse(data); 
                    }
                    catch(ex)
                    {
                        console.log("Parsing Exception : " + ex);
                    }

                    var jsonresp = {};
                    logger.info("Before for loop");
                    for(let p = 0; p < obj.rows.length; p++)
                    {

                        let tweet = obj.rows[p].tweet_id;
                        let geo = obj.rows[p].geolatitude;
                        let coordinates = obj.rows[p].geolongitude;
                       
                    
                        let cordinatearray = [];

                         cordinatearray.push(geo);
                         cordinatearray.push(coordinates);
                           
                            //dataarray.push({"type" : "Feature", "properties" : {"name" : businessname , "postcount" : totalcount},"geometry" : {"type" : "Point" , "coordinates" : cordinatearray });
                       
                           dataarray.push({"type" : "Feature",
                           "properties" : { "p1" : tweet  } , 
                           "geometry" : { "type" : "Point" , "coordinates" : cordinatearray}});
                          

                        }
                        logger.info("For loop end");
                        dataobj.type = "FeatureCollection";
                        dataobj.features = dataarray;
                        //console.log(JSON.stringify(dataobj));
                        res.send(dataobj); 
                        logger.info("Twitter query end"); 
                    

                    }
                }); 
            }
		  else
		  {
		    let q = "select tweet,tweet_id,userprofileimageurl,userscreenname,creeated_at,userfollowercount from `hive_social_media`.`default`.`newtwittercategorystream` where tweet_id ='" + tweetid + "' and create_date between '" + sdate + "' and '" + edate + "'" ;
            
            let reqoptions = {
                    uri :url,
                    headers:{'Content-Type':'application/json'},
                    method : "POST",
                    body: JSON.stringify({queryType : 'SQL', query : q})
                    
                };
            
            logger.info("Twitter detail query fired");
            
            request(reqoptions, function(err, response, data){
                    //console.log(response + " " + err + " " + data);
                    if(err)
                    {
                        //console.log("Err: " + err);
                        logger.error("Error: " + err);
                    }
                    if (!err && response.statusCode ==200){
                        let obj = JSON.parse(data);

                        let tweet_id = obj.rows[0].tweet_id;
                        let tweet_msg = obj.rows[0].tweet;
                        let userprofile = obj.rows[0].userprofileimageurl;
                        let userscreenname = obj.rows[0].userscreenname;
                        let created_date = obj.rows[0].creeated_at;
                        let followercount = obj.rows[0].userfollowercount;

                        var jsonobj = {};
                        jsonobj.Id = tweet_id;
                        jsonobj.TweetText = tweet_msg;
                        jsonobj.Created = created_date;
                        jsonobj.UserScreenName = userscreenname;
                        jsonobj.UserProfileImageUrl = userprofile;
                        jsonobj.UserFollowersCount = followercount;

                        res.send(jsonobj);
                        logger.info("Twitter detail API end");

                    }
                });
  } 
    }
}