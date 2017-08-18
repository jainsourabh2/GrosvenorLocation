module.exports.getGeoTwitterData = function(req,res,logger)
{

    var request = require("request");
    var url = "http://10.80.2.4:8047/query.json";
    var moment = require('moment');
    var q = require('q');

    let source = req.query.dataset;
    let latitude = req.query.latrange; // 51.2611,51.7160 (London)
    let longitude = req.query.longrange; // -0.5383,0.2939 (London)
    let dataobj = {};
    let dataarray = [];
    let startdate = req.query.startdate;
    let enddate = req.query.enddate;
    let tweetid = req.query.tweetid;
    let todaydate = new Date().toLocaleDateString();
    let error = { msg : ""};
    let entityname = "";
    //var moment_todaydate = moment(todaydate,"yyyy-mm-dd");
     let sdate = (startdate != undefined) ? startdate.substr(2,startdate.length) : moment(todaydate,"yyyy-mm-dd").subtract(1,'days').toISOString().split('T')[0].substr(2,moment(todaydate,"yyyy-mm-dd").toISOString().length);  //Format in yyyy-mm-dd Current date
     let edate = (enddate != undefined) ? enddate.substr(2,enddate.length) :  moment(todaydate,"yyyy-mm-dd").toISOString().split('T')[0].substr(2,moment(todaydate,"yyyy-mm-dd").toISOString().length);
     //let fromarchive = false;
     let montharray = [];
     let yeararray = [];
     let yearstring = "";
     let monthstring = "";

     if(moment(enddate).diff(moment(startdate),'days') >= 30 )
     {
        //console.log("More than 30 days");
        //Calculate month and year ranges to scan.
       let diffmonth = moment(enddate).diff(moment(startdate),'months');
       
        for(let m = 0; m <= diffmonth; m++)
        {
            let iter_month = moment(startdate).add(m,'months').format("YYYY-MM-DD");
            montharray.push(iter_month.split('-')[1]);
            yeararray.push(iter_month.split('-')[0]);
        }
        var u_yeararr = yeararray.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
        var u_montharr = montharray.filter(function(item, i, ar){ return ar.indexOf(item) === i; });

        console.log("Array : " + u_montharr.toString());
        console.log("Array Year : " + u_yeararr.toString()); 

         entityname = "`dfs`.`default`.`ptwitterdata`  where  `Year` IN(" + u_yeararr.toString() + ") and `Month` IN(" + u_montharr.toString() + ") and ";
        //fromarchive = true;
     }
     else
     {
        entityname = "`hive_social_media`.`default`.`newtwittercategorystream` where ";
        //console.log("Less than 30 days");
     }

     if(source != "twitter")
    {
      error.msg = "Dataset must be twitter.";
      res.send(error);
    }
   
     console.log("Startdate" + sdate);
     console.log("EndDate" + edate);
     logger.info("Twitter API call with geo query started");

    if(source == "twitter")
    {
 
        if(tweetid == undefined)
        {
  
            if(latitude == undefined || longitude == undefined)
            {
              error.msg = "latrange and longrange parameter is required. Eg : latrange=51.2611,51.7160&longrange=-0.5383,0.2939 ";
                res.send(error); 
            } 
            let lat = latitude.split(',');
            let long = longitude.split(',');
           
               // let q = " select tweet_id,tweetlatitude,tweetlongitude from `hive_social_media`.`default`.`newtwittercategorystream`  " +
                 let q = " select tweet_id,tweetlatitude,tweetlongitude from " + entityname +  
                 //let q = " select tweet_id,tweetlatitude,tweetlongitude from " + 
                    "  create_date between '" + sdate + "' and '" + edate + "' and category=0 " +  
                    "  and  CAST(geolatitude as float) between " +  lat[0] + " and " + lat[1]  +  
                    "  and CAST(geolongitude as float) between "  + long[0] + " and " + long[1] + 
                    " and geolatitude <> 'null' and " + 
                    "  geolongitude <> 'null' and tweetlatitude <> 'null' " ;
                   console.log(q);
            
                let reqoptions = {
                    uri :url,
                    headers:{'Content-Type':'application/json'},
                    method : "POST",
                    body: JSON.stringify({queryType : 'SQL', query : q})
                    
                };
                
                request(reqoptions, function(err, response, data){
                    //console.log(response + " " + err + " " + data);
                    if(err)
                    {
                        //console.log("Err: " + err);
                        logger.error("Error: " + err);
                    }
                    if (!err && response.statusCode ==200){
                     // console.log("Reached within query");
                       logger.info("Twitter API call with geo : Drill API Request called");
                     // console.log(data);
                    //console.log(data.length);
                    var obj = JSON.parse(data);

                    var jsonresp = {};
                    logger.info("For loop started");
                    for(let c =0; c < obj.rows.length; c++)
                    {
                         let geo = obj.rows[c].tweetlatitude;
                        let coordinates = obj.rows[c].tweetlongitude;
                        let tweet = obj.rows[c].tweet_id;
                        let cordinatearray = [];

                        cordinatearray.push(geo);
                        cordinatearray.push(coordinates);

                      /*  dataarray.push({"type" : "Feature",
                       "properties" : { "p1" : tweet  } , 
                       "geometry" : { "type" : "Point" , "coordinates" : cordinatearray}}); */

                    dataarray.push({
                       "pr" : { "p1" : tweet  } , 
                       "ge" : { "lo" : cordinatearray[1], "la" : cordinatearray[0]}});

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

            let q = "select tweet,tweet_id,userprofileimageurl,userscreenname,creeated_at,userfollowercount from " + entityname + "  tweet_id ='" + tweetid + "' and create_date between '" + sdate + "' and '" + edate + "'" ;
            
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



