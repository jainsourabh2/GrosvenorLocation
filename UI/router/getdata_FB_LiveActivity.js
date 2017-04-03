module.exports.GetData = function(req,res,logger){

	var q = require('q');
	var moment = require('moment');
	var url = "http://10.80.2.4:8047/query.json";

	var request = require("request");
    var dataset = req.query.dataset;
    var startdate = req.query.startdate;
    var enddate = req.query.enddate;
    var areatype= req.query.areatype;
    //var station = req.query.station;
     var track = req.query.track;
     var boundstart = req.query.boundstart;
     var boundend = req.query.boundend;
     var restaurantlist = [];
     var boundstartlat = "";
     var boundstartlong = "";
     var boundendlat = "";
     var boundendlong = "";
     

      if(dataset == undefined)
        {
            var errorobj = {"error" : "Not enough parameters. Parameters dataset is mandatory"};
            res.send(errorobj);
            
        }

     if(dataset == "facebook")
     {
        if(areatype == undefined)
        {
            var errorobj = {"error" : "Not enough parameters. Parameters areatype is mandatory for dataset facebook"};
            res.send(errorobj);
        }
            
        if((areatype.toLowerCase() == "lsoa" || areatype.toLowerCase() == "msoa" || areatype.toLowerCase() == "entity") && 
            (boundstart == undefined || boundend == undefined))
            {
                var errorobj = {"error" : "Not enough parameters. Parameters boundstart and boundend is mandatory for dataset facebook and areatype lsoa/msoa/entity"};
                res.send(errorobj);
            } 

         logger.info("API call started");
         var todaydate = new Date().toLocaleDateString();
        // todaydate = moment(todaydate,"yyyy-mm-dd");
         //var tomorowdate = todaydate.subtract(1,'days');
         if(boundstart != undefined && boundend != undefined)
         {
            boundstartlat = boundstart.split(',')[0];
            boundstartlong = boundstart.split(',')[1];

            boundendlat = boundend.split(',')[0];
            boundendlong = boundend.split(',')[1];
         }
         
         var sdate = (startdate != undefined) ? startdate : moment(todaydate,"yyyy-mm-dd").subtract(1,'days').toISOString().split('T')[0];  //Format in yyyy-mm-dd Current date
         var edate = (enddate != undefined) ? enddate :  moment(todaydate,"yyyy-mm-dd").toISOString().split('T')[0]; //Format in yyyy-mm-dd Tomorows date 
          console.log("Start date " + sdate);
          console.log("End Date " + edate);
         var reqobj = {"dataset" : dataset, "startdate" : sdate , "enddate" : edate, "areatype" : areatype, "boundstartlat" : boundstartlat, "boundstartlong" : boundstartlong,
                        "boundendlat" : boundendlat, "boundendlong" : boundendlong};

          getDrillQuery(reqobj).then(function(querystring){

              var dataobj = {};
         	 var dataarray = [];
        
            var reqoptions = {
                uri :url,
                headers:{'Content-Type':'application/json'},
                method : "POST",
                body: JSON.stringify({queryType : 'SQL', query : querystring})
                
            };
            
       logger.info("Facebook query started");
             request(reqoptions, function(err, response, data){
                //console.log(response + " " + err + " " + data);
                if(err)
                {
                   logger.error("Error in request : " + err);
                }
                if (!err && response.statusCode ==200){
			    logger.info("Facebook query ended");
			    logger.info("Parse started");
			                var obj = JSON.parse(data);
			    logger.info("Parse ended");

                if(obj.rows.length > 0)
                {
                    function buildJSONObj(p)
                        {
                            if(p < obj.rows.length)
                            {
                            try
                               {
                                   if(areatype != "entity") 
                                   {    
                                        var areaname = obj.rows[p].name;
                                        var arealatitude = obj.rows[p].latitude;
                                        var arealongitude = obj.rows[p].longitude;
                                        var pcforBar = obj.rows[p].p2;
                                        var pcforCasinos = obj.rows[p].p3;
                                        var pcforCinemas = obj.rows[p].p4;
                                        var pcforRestaurant = obj.rows[p].p5;
                                        var cordinatearray = [];
                                        cordinatearray.push(arealatitude);
                                        cordinatearray.push(arealongitude);
                                       

            				dataarray.push({
			                       "pr" :         { 
			                       	"p1" : areaname , 
                                    "p2" : pcforBar , //Bar aggregate 
                                    "p3" : pcforCasinos,  //Cinema Agregare
                                    "p4" : pcforCinemas,  //Rest Aggregate
                                    "p5" : pcforRestaurant        //Casinos Aggregate
			                           } , 
			                          "ge" : { "lo" : arealongitude, "la" : arealatitude }});}
                                    else
                                    {
          							var fbid = obj.rows[p].id;
                                    var name = obj.rows[p].name;
                                    var category = obj.rows[p].category;
                                    var postcount = obj.rows[p].postcount;
                                    var latitude = obj.rows[p].latitude;
                                    var longitude = obj.rows[p].longitude;

                                    var coordinates = [];
                                    coordinates.push(latitude);
                                    coordinates.push(longitude);

          					dataarray.push({
                               "pr" :         
                               { "p1" : name , 
                                 "p2" : category , 
                                 "p3" : postcount,
                                  "id" : fbid  
                                }, 

                                "ge" : { "lo" : longitude, "la" : latitude }});
          
                                }   
                               }
                        catch(ex)
                            { 
                                //console.log("Error while parsiing :" + ex);
                                logger.error("Error while parsiing :" + ex);
                            }
                                
                                    buildJSONObj(p + 1);
                            }
                            else
                            {
                               // console.log(station,stnlat,stnlong);
        						logger.info("Building Object collection ended");
                                dataobj.type = "FeatureCollection";
                                dataobj.features = dataarray;
                                
                                //console.log(JSON.stringify(dataobj));
                                res.send(dataobj); 
                                logger.info("API call end");                         
                            }
                        }
                        logger.info("Building Object collection started");
                        buildJSONObj(0);
                    
                }

                
                }
             });
         });

     //  console.log("Query " + query);
        
     }
     else if(dataset == "twitter")
     {
        if(startdate == undefined)
        {
            var errorobj = {"error" : "Not enough parameters. Parameter startdate is mandatory for Twitter dataset"};
            res.send(errorobj);
        }

        logger.info("Twitter query started");
  
         var sdate = (startdate != undefined) ? startdate.substr(2,startdate.length) : undefined;
         var edate = (enddate != undefined) ? enddate.substr(2,enddate.length) : undefined;
         console.log(sdate);
		  console.log(edate);
		  if(track == undefined)
		  {
		    track = "grosvenor,mayfair,belgravia";
		  }
         var reqobj = {"dataset" : dataset, "startdate" : sdate, "enddate" : edate, "keywords" : track}
         var q = getDrillQuery(reqobj);
         var dataobj = {};
         var dataarray = [];
             
          var reqoptions = {
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
              //  console.log("Reached within query");
              //  console.log(data);
          //console.log(data.length);
          var obj = JSON.parse(data);
            var jsonresp = {};
          if(obj.rows.length > 0)
          {
                  function buildJSONObj(p)
                    {
                        if(p < obj.rows.length)
                        {
                    try
                         {
                                    
                                var tweet = obj.rows[p].tweet;
                                var created_at = new Date(obj.rows[p].creeated_at);
                          		var created_at_string = created_at.toLocaleString().replace(',', '');
                                var imageurl = obj.rows[p].userprofileimageurl;
                                var username = obj.rows[p].userscreenname;
                                var follcount = obj.rows[p].userfollowercount;
                         		var tweetid = obj.rows[p].tweet_id;
                                console.log("Tweet at : " + created_at);

                              //  console.log(restname,restlat,restlong,postcount);
                               var cordinatearray = [];
                               cordinatearray.push(0.0);
                               cordinatearray.push(0.0);
    
       					dataarray.push({
                             "pr" : { "p1" : tweet , "p2" : created_at_string , "p3" : username, "p4" : imageurl, "p5" : follcount, "p6" : tweetid} , 
                             "ge" : { "lo" : cordinatearray[0] , "la" : cordinatearray[1] }});
                             
                         }
		                  catch(ex)
		                    { 
                               // console.log("Error while parsiing :" + ex);
                               logger.error("Error while parsiing :" + ex);
                            }
    
                                    buildJSONObj(p + 1);
                        }
                        else
                        {
                               // console.log(station,stnlat,stnlong);
                                dataobj.type = "FeatureCollection";
                                dataobj.features = dataarray;
                                //console.log(JSON.stringify(dataobj));
                                res.send(dataobj); 
                                logger.info("Twitter query end");                       
                        }
                    }
                    
                    buildJSONObj(0);
                }
          
              }
           });
     }
     else
     {
            var errorobj = {"error" : "Unexpected Error"};
            res.send(errorobj);
     }
  


function getDrillQuery(robj)
{
    var querystring = "";
     var startdate = robj.startdate;
     var enddate = robj.enddate;
     var deferred = q.defer();
     logger.info("Inside GetDrill Query");
    if(robj.dataset == "facebook")
    {
      var areatype = robj.areatype;
      var boundingbox = robj.boundingarea;
     // console.log("Inside Drill Q");

       if(areatype.toLowerCase() == "borough")
         {
            logger.info("Querying BOROUGH with parameter : startdate : " + startdate + " and enddate : " + enddate );
             querystring =  " Select name,latitude,longitude, " +
                            " sum(case when category = 'Bar' then postcount else 0 end) as p2," +
                            " sum(case when category = 'Casino & Gaming' then postcount else 0 end) as p3," +
                            " sum(case when category = 'Movie Theater' then postcount else 0 end) as p4," +
                            " sum(case when category = 'Restaurant' then postcount else 0 end) as p5 " +               
                            " From " +
                            " ( " +
                            " select count(1) as postcount,B.ladname as name,B.ladlatitude as latitude ,B.ladlongitude as longitude,A.category as category" +
                            " from `hive_social_media`.`default`.`facebookdata` as A join `hive_social_media`.`default`.`NewDimPostCode` B" + 
                            " on REGEXP_REPLACE(A.locationzip,' ','') = REGEXP_REPLACE(B.postcode,' ','')" + 
                            " where A.fb_date between '" + startdate + "' and '" + enddate + "'" +  
                            " AND A.category IN ('Movie Theater','Bar','Restaurant','Casino & Gaming') " + 
                            " group by B.ladname,B.ladlatitude,B.ladlongitude,A.category" +
                            " ) as G Group by G.name,G.latitude,G.longitude" ;

            deferred.resolve(querystring);
         }

      if(robj.boundstartlat != "" && robj.boundstartlong != "" && robj.boundendlat != "" && robj.boundendlong != "")
      {
           // getPostCodeQuery(robj).then(function(postcode){
           // console.log(robj.boundstartlat + "," + robj.boundstartlong + "," + robj.boundendlat + "," + robj.boundendlong);
            var minlat = (parseFloat(robj.boundstartlat) < parseFloat(robj.boundendlat)) ? robj.boundstartlat : robj.boundendlat;
            var maxlat = (parseFloat(robj.boundstartlat) > parseFloat(robj.boundendlat)) ? robj.boundstartlat : robj.boundendlat;
           
            var minlong = (parseFloat(robj.boundstartlong) < parseFloat(robj.boundendlong)) ? robj.boundstartlong : robj.boundendlong;
            var maxlong = (parseFloat(robj.boundstartlong) > parseFloat(robj.boundendlong)) ? robj.boundstartlong : robj.boundendlong;

            console.log("Min Lat : " + minlat);
            console.log("Max Lat : " + maxlat);
            console.log("Min Long : " + minlong);
            console.log("Max long : " + maxlong);

                if(areatype.toLowerCase() == "msoa" )
                     {
                        logger.info("Querying MSOA for parameter boundstartlat : " + robj.boundstartlat + ", boundstartlong : " + robj.boundstartlong + ", boundendlat : " + robj.boundendlat + ", boundendlong : " + robj.boundendlong + ", startdate : " + startdate + ", enddate : " + enddate);
                          querystring =  " Select name,latitude,longitude, " +
                                        " sum(case when category = 'Bar' then postcount else 0 end) as p2," +
                                        " sum(case when category = 'Casino & Gaming' then postcount else 0 end) as p3," +
                                        " sum(case when category = 'Movie Theater' then postcount else 0 end) as p4," +
                                        " sum(case when category = 'Restaurant' then postcount else 0 end) as p5 " + 
                                        " From " +
                                        " ( " +
                                        " select count(1) as postcount,B.msoaname as name,B.msoalatitude as latitude ,B.msoalongitude as longitude,A.category as category" +
                                        " from `hive_social_media`.`default`.`facebookdata` as A join `hive_social_media`.`default`.`NewDimPostCode` B" + 
                                        " on REGEXP_REPLACE(A.locationzip,' ','') = REGEXP_REPLACE(B.postcode,' ','')" + 
                                        " where A.fb_date between '" + startdate + "' and '" + enddate + "'" +  
                                        " AND A.category IN ('Movie Theater','Bar','Restaurant','Casino & Gaming') and B.PostCodeLatitude Between '" +  minlat + "' and '" + maxlat + "'" +
                                        " And B.PostCodeLongitude Between '" + minlong + "' and '" + maxlong + "' " +
                                        " group by B.msoaname,B.msoalatitude,B.msoalongitude,A.category" +
                                        " ) as G Group by G.name,G.latitude,G.longitude" ;
                     }
                     else if(areatype.toLowerCase() == "lsoa")
                    {
                        logger.info("Querying LSOA for parameter boundstartlat : " + robj.boundstartlat + ", boundstartlong : " + robj.boundstartlong + ", boundendlat : " + robj.boundendlat + ", boundendlong : " + robj.boundendlong + ", startdate : " + startdate + ", enddate : " + enddate);
                         querystring =  " Select name,latitude,longitude, " +
                                        " sum(case when category = 'Bar' then postcount else 0 end) as p2," +
                                        " sum(case when category = 'Casino & Gaming' then postcount else 0 end) as p3," +
                                        " sum(case when category = 'Movie Theater' then postcount else 0 end) as p4," +
                                        " sum(case when category = 'Restaurant' then postcount else 0 end) as p5 " + 
                                        " From " +
                                        " ( " +
                                        " select count(1) as postcount,B.lsoaname as name,B.lsoalatitude as latitude ,B.lsoalongitude as longitude,A.category as category" +
                                        " from `hive_social_media`.`default`.`facebookdata` as A join `hive_social_media`.`default`.`NewDimPostCode` B" + 
                                        " on REGEXP_REPLACE(A.locationzip,' ','') = REGEXP_REPLACE(B.postcode,' ','')" + 
                                        " where A.fb_date between '" + startdate + "' and '" + enddate + "'" +  
                                        " AND A.category IN ('Movie Theater','Bar','Restaurant','Casino & Gaming') and B.PostCodeLatitude Between '" +  minlat + "' and '" + maxlat + "'" +
                                        " And B.PostCodeLongitude Between '" + minlong + "' and '" + maxlong + "' " + 
                                        " group by B.lsoaname,B.lsoalatitude,B.lsoalongitude,A.category" +
                                        " ) as G Group by G.name,G.latitude,G.longitude" ;
                                        
                    }
                    else if(areatype.toLowerCase() == "entity")
                    {
                        logger.info("Querying ENTITY for parameter boundstartlat : " + robj.boundstartlat + ", boundstartlong : " + robj.boundstartlong + ", boundendlat : " + robj.boundendlat + ", boundendlong : " + robj.boundendlong + ", startdate : " + startdate + ", enddate : " + enddate);
                        querystring = " select count(1) as postcount,id,name,locationlatt as latitude,locationlong as longitude,category" + 
                                        " from `hive_social_media`.`default`.`facebookdata` " +
                                        " where fb_date between '" + startdate + "' and '" + enddate + "' " +
                                        " AND category IN ('Movie Theater','Bar','Restaurant','Casino & Gaming') " + 
                                        " and REGEXP_REPLACE(locationzip,' ','')  IN( Select REGEXP_REPLACE(PostCode,' ','') " +
                                        " From `hive_social_media`.`default`.`NewDimPostCode` Where PostCodeLatitude Between  '" + minlat + "' and '" + maxlat + "' " + 
                                        " And PostCodeLongitude Between '" + minlong + "' and '" + maxlong + "') group by id,name,locationlatt,locationlong,category";
                    }
                console.log("Query within code : " + querystring);
                logger.debug("Query within code : " + querystring);
                 deferred.resolve(querystring);
            
            //});
      }
      
           
      return deferred.promise;
    }
    else if(robj.dataset == "twitter")
    {
       
        var track = robj.keywords.split(',');
        
        var query1 = "SELECT tweet,tweet_id,userprofileimageurl,userscreenname,creeated_at,userfollowercount FROM `hive_social_media`.`default`.`newtwittercategorystream` where ";
        var query2 = "";
        var query3 = "";
        var query4 = "";

        for(var t = 0; t < track.length ; t++)
        {
           query2 += "STRPOS(LOWER(tweet),'" + track[t] + "') +" ;
        }
        
        query2 = query2.substr(0,query2.length - 1);
        
        // query2 = "STRPOS(LOWER(tweet),'grosvenor')"; //dynamic
        if(startdate != undefined && enddate != undefined)
        {
            query3 = " > 0 and create_date between '" + startdate + "' and '"+ enddate + "' "; //based on single date or range
        }
        else
        {
            query3 = " > 0 and create_date = '" + startdate + "' "; //based on single date or range
        }
         
        query4 = " and category = 0 order  by creeated_at desc limit 10";


         querystring = query1 + query2 + query3 + query4;
		  logger.info("GetDrill Query ended");
		  console.log(querystring);
         return querystring;
    }
        
    }


}


