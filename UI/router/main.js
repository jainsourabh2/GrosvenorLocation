module.exports = function(app){

// *********** Routing Logic Here ************** //
const config = require('../config/config.js');
const constants = config.constants;
var fs = require("fs");
const mysql = require('mysql');
var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
var moment = require('moment');
var q = require('q');
var sql = require('mssql');
const logger = require('../config/log.js');

 const connection = mysql.createConnection({
  host     : constants.mysql_host,
  port     : constants.mysql_port,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});
 
// connection.connect();
 
var mssqlconnection = {
    user: constants.mssql_username,
    password: constants.mssql_password,
    server: constants.mssql_host,
    port: constants.mssql_port,
    database: constants.mssql_database,
};


app.get("/",function(req,res){
    var stationnames = [];
     connection.query("SELECT name FROM stationnames",function(ferr,frows,ffields)
    {
        if(ferr)
        {
            console.log(ferr);
        }
        else{
            if(frows.length > 0)
            {
                for(var j =0; j < frows.length; j++)
                {
                    //console.log(frows[j]);
                 stationnames.push(frows[j].name);   
                }
                var data = {"stationnames" : stationnames }
                res.render("index",data);
            }
        }
        
    });
	
});

app.get("/multimap",function(req,res){
    var stationnames = [];
     connection.query("SELECT name FROM stationnames",function(ferr,frows,ffields)
    {
        if(ferr)
        {
            console.log(ferr);
        }
        else{
            if(frows.length > 0)
            {
                for(var j =0; j < frows.length; j++)
                {
                   // console.log(frows[j]);
                 stationnames.push(frows[j].name);   
                }
                var data = {"stationnames" : stationnames }
                res.render("multimap",data);
            }
        }
        
    });
	
});

app.get("/callmaps",function(req,res){
    
    var dataarray = [];
    var stationnames = [];
   connection.query("SELECT * FROM stationnames",function(ferr,frows,ffields)
    {
        if(ferr)
        {
            console.log(ferr);
        }
        else
        {
            //var frows = data.split('\n');
            //console.log(frows.length);
            if(frows.length > 0)
            {
              function getdata(n)
              {
                  if(n < frows.length)
                  {
                     //var rows = frows[n].split(',');
                     //console.log(rows); 
                   var lat = frows[n].latitude;
                   var lon = frows[n].longitude;
                   var loc = frows[n].name;
                   
                  // console.log("Lat: " + lat);
                  // console.log("Long: " + lon);
                   
                   dataarray.push({"lat" : lat, "lng" : lon,"location": loc, "type": "station" });
                   stationnames.push(loc);
                  // console.log(dataarray);
                   getdata(n + 1);   
                  }
                  else
                  {
                    //  readRestaurantList(stationnames);
                       res.send({"data" : dataarray, "stationnames" : stationnames});
                  }
              }
           getdata(0);
        }
       
        }
    });
        
});

app.get('/getPosition',function(req,res){
    var station = req.query.station;
    var fromdate = req.query.fromdate;
    var todate = req.query.todate;
    var weekday = req.query.weekday;
    var timeframe = req.query.timeframe;
    
    
    var q = "SELECT * FROM facebooklist WHERE location = '" + station + "'";
    //console.log(q);
    var restaurantlist = [];
    
    connection.query(q,function(ferr,frows,ffields)
    {
        if(ferr)
        {
            console.log(ferr);
        }
        else
        {
            if(frows.length > 0)
            {
                function getNearRest(n)
                {
                   if(n < frows.length)
                   {
                       var resname = frows[n].name;
                       restaurantlist.push(resname);
                      // dataarray.push({"restname" : resname, "restlat" : restlat, "restlong" : restlong});
                       getNearRest(n + 1);
                   }
                   else
                   {
                       
                        var stnlat = frows[0].latitude;
                       var stnlong = frows[0].longitude;
                       //console.log(stnlat + "," + stnlong);
                       // console.log(restaurantlist);
                       getStationDetail(restaurantlist,stnlat,stnlong,station,fromdate,todate,weekday,timeframe);
                      
                   }
                }
                getNearRest(0);
            }
        }
    });
    
    
     function getStationDetail(restaurantlist,stnlat,stnlong,station,fromdate,todate,weekday,timeframe)
    {
        var querystr = "";
        var dataobj = {};
        var dataarray = [];
        var totalcountarray = [];
        var totalpostcounts = [];
        
        for(var i = 0; i < restaurantlist.length; i++)
        {
	    var resname = restaurantlist[i].replace(/'/g,"''");
            querystr += "'" + resname + "',";
        }
        querystr = querystr.substr(0, querystr.length - 1);
        //querystr = querystr.replace(/'/g,"''");

       /* console.log("Query: " + querystr);
        
        //console.log("From Date: " + fromdate);
       // console.log("To Date: "+ todate);
         //console.log("Weekday: "+ weekday);
         // console.log("TimeFrame: "+ timeframe); */
          
        var q  = "";
        
        //Query Drill and get back name,lat,long,Total Post count, Rating of the rest from HDFS. Create array of object and send back to the client.
        q = queryBuilder(querystr,fromdate,todate,weekday,timeframe);
        
       // console.log(q);
        
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
        	    console.log("Err: " + err);
        	}
        	if (!err && response.statusCode ==200){
        		console.log("Reached within query");
        		//console.log(data);
			//console.log(data.length);
			var obj = JSON.parse(data);

        		if(obj.rows.length > 0)
        		{
        		  function getRestroDetails(p)
        		    {
        		        if(p < obj.rows.length)
        		        {
        				try
        			   {
                		        
            		        var restname = obj.rows[p].RestaurantName;
            		        var restlat = obj.rows[p].Latitude;
            		        var restlong = obj.rows[p].Longitude;
            		        var postcount = obj.rows[p].TotalCount;
            		        var hours = obj.rows[p].Hours;
            		        
            		       // console.log(restname,restlat,restlong,postcount);
            		        if(p > 0)
            		        {
            		            
            		            if(dataarray[p - 1].location == restname)
            		            {
            		             totalpostcounts.push(dataarray[p - 1].postcount);
            		            }
            		            else
            		            {
            		                var totalcount = 0;
            		                if(totalpostcounts.length > 0)
            		                {
            		                     for(var tc =0; tc < totalpostcounts.length ; tc++)
                		                {
                		                    totalcount += parseInt(totalpostcounts[tc]);
                		                }
            		                }
            		                else
            		                {
            		                        totalcount =  parseInt(dataarray[p - 1].postcount); 
            		                }
            		               
            		                totalcountarray.push({"location": dataarray[p - 1].location,"lat" : dataarray[p - 1].lat,"lng" : dataarray[p - 1].lng,"postcount" :  totalcount,"type" : "restaurant"});
            		                totalpostcounts = [];
            		            }
            		        }
            		        
            		        dataarray.push({"location": restname, "lat" : restlat, "lng" : restlong,"postcount" : postcount ,"hour" : hours,"type" : "restaurant"});
        			   }
        			catch(ex)
        				{ console.log("Error while parsiing :" + ex);}

                                getRestroDetails(p + 1);
        		        }
        		        else
        		        {
                            //console.log(station,stnlat,stnlong);
                            var stnname= station;
                           
                            totalcountarray.push({"location" : stnname, "lat" : stnlat,"lng" : stnlong, "type" : "station"});
                            dataarray.push({"location" : stnname, "lat" : stnlat,"lng" : stnlong, "type" : "station"});
                            
                            var dataobj = { "dataarray" : dataarray, "totalcountarray" : totalcountarray};
                            res.send(dataobj);        		            
        		        }
        		    }
        		    
        		    getRestroDetails(0);
        		}
        		
        	}
    });
    	
       function queryBuilder(querystr,fromdate,todate,weekday,timeframe)
       {
           var query = "SELECT count(1) as TotalCount, name as RestaurantName,locationlatt as Latitude,locationlong as Longitude,hours as Hours FROM `hive_social_media`.`default`.`facebookdata` WHERE name IN (" + querystr + ")";
           
           console.log("Timeframe: " + timeframe);
           
           if(fromdate != "NaN/NaN/NaN" || todate != "NaN/NaN/NaN")
           {
             // query += " and CAST(createdtime as date) >  '" + fromdate + "' and  CAST(createdtime as date) < '" + todate + "' "; 
 		var frmdatearray = fromdate.split('/');
               var frmdate = frmdatearray[0] + "-" + frmdatearray[1] + "-" + frmdatearray[2];
               
               var todatearray = todate.split('/');
               var tdate = todatearray[0] + "-" + todatearray[1] + "-" + todatearray[2] ;

              query += " and createddate >  '" + fromdate + "' and  createddate < '" + todate + "' and fb_date between '" +  frmdate +"' and '" + tdate + "'" ;     
           }
            if(timeframe != "select" && timeframe != undefined)
           {
               query += " and timeframe ='" + timeframe + "' ";
               //console.log("Time: " + query);
           }
            if(weekday != "select" && weekday != undefined)
           {
               query += " and weekday ='" + weekday + "' ";
                //console.log("Week: " + query);
           }
           
               query += " group by name,locationlatt,locationlong,hours";
           
           
           return query;
       }
        
    }
});

app.get("/api/getdata",function(req,res){
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

        logger.info("Facebook query started");
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

            //console.log(querystring);
              var dataobj = {};
         var dataarray = [];
        
            var reqoptions = {
                uri :url,
                headers:{'Content-Type':'application/json'},
                method : "POST",
                body: JSON.stringify({queryType : 'SQL', query : querystring})
                
            };
            
             request(reqoptions, function(err, response, data){
                //console.log(response + " " + err + " " + data);
                if(err)
                {
                   // console.log("Err: " + err);
                   logger.error("Error in request : " + err);
                }
                if (!err && response.statusCode ==200){
                //  console.log("Reached within query");
                //  console.log(data);
                //console.log(data.length);
                var obj = JSON.parse(data);
                //console.log(JSON.stringify(obj));

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
                                        
                                       dataarray.push({"type" : "Feature",
                                       "properties" : { "p1" : areaname , 
                                                        "p2" : pcforBar , //Bar aggregate 
                                                        "p3" : pcforCasinos,  //Cinema Agregare
                                                        "p4" : pcforCinemas,  //Rest Aggregate
                                                        "p5" : pcforRestaurant        //Casinos Aggregate
                                       } , 

                                       "geometry" : { "type" : "Point" , "coordinates" : cordinatearray}});
                                    }
                                    else
                                    {
                                        var name = obj.rows[p].name;
                                        var category = obj.rows[p].category;
                                        var postcount = obj.rows[p].postcount;
                                        var latitude = obj.rows[p].latitude;
                                        var longitude = obj.rows[p].longitude;

                                        var coordinates = [];
                                        coordinates.push(latitude);
                                        coordinates.push(longitude);

                                        dataarray.push({"type" : "Feature",
                                        "properties" : { "p1" : name , 
                                                         "p2" : category , 
                                                         "p3" : postcount  
                                                                            
                                        }, 

                                       "geometry" : { "type" : "Point" , "coordinates" : coordinates}}
                                       );
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
                                dataobj.type = "FeatureCollection";
                                dataobj.features = dataarray;
                                
                                //console.log(JSON.stringify(dataobj));
                                res.send(dataobj); 
                                logger.info("Facebook query end");                         
                            }
                        }
                        
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
            	//	console.log("Reached within query");
            	//	console.log(data);
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
                    		       
                    		        //dataarray.push({"type" : "Feature", "properties" : {"name" : businessname , "postcount" : totalcount},"geometry" : {"type" : "Point" , "coordinates" : cordinatearray });
                			   
                			       dataarray.push({"type" : "Feature",
                			       "properties" : { "p1" : tweet , "p2" : created_at_string , "p3" : username, "p4" : imageurl, "p5" : follcount, "p6" : tweetid} , 
                			       "geometry" : { "type" : "Point" , "coordinates" : cordinatearray}});
                			       
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
  
})

function getPostCodeQuery(robj)
{
    var postcodestring = "";
    var defered = q.defer();
    //console.log("Inside PostCodeQuery");
   // logger.info("Inside PostCodequery");
    var connection2 = new sql.Connection(mssqlconnection, function(err) {
    logger.info("Querying MSSQL started");
    var request = new sql.Request(connection2);
    request.input('startlat', sql.VarChar(50), robj.boundstartlat);
    request.input('startlon', sql.VarChar(50), robj.boundstartlong);
    request.input('endlat', sql.VarChar(50), robj.boundendlat);
    request.input('endlon', sql.VarChar(50), robj.boundendlong);
    //request.output('out', sql.Int);
    //console.log(robj.boundstartlat + "," + robj.boundstartlong + "," + robj.boundendlat + "," + robj.boundendlong);
    logger.debug(robj.boundstartlat + "," + robj.boundstartlong + "," + robj.boundendlat + "," + robj.boundendlong);
    request.execute('dbo.uspSelPostCodeByBoundary', function(err, recordsets, returnValue) {

        if(err)
        {
            logger.error("Error querying stored procedure : " + err);
            defered.reject(new Error(err));
        }
        else{
           // console.log(recordsets[0][0].PostCodes);
           logger.debug(recordsets[0][0].PostCodes);
            defered.resolve(recordsets[0][0].PostCodes);
            connection2.close();
            logger.info("Querying MSSQL stopped");
        }
    });

});


    return defered.promise;
}

function getDrillQuery(robj)
{
    var querystring = "";
     var startdate = robj.startdate;
     var enddate = robj.enddate;
     var deferred = q.defer();

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
                            " on A.locationzip = B.postcode" + 
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
                                        " on A.locationzip = B.postcode" + 
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
                                        " on A.locationzip = B.postcode" + 
                                        " where A.fb_date between '" + startdate + "' and '" + enddate + "'" +  
                                        " AND A.category IN ('Movie Theater','Bar','Restaurant','Casino & Gaming') and B.PostCodeLatitude Between '" +  minlat + "' and '" + maxlat + "'" +
                                        " And B.PostCodeLongitude Between '" + minlong + "' and '" + maxlong + "' " + 
                                        " group by B.lsoaname,B.lsoalatitude,B.lsoalongitude,A.category" +
                                        " ) as G Group by G.name,G.latitude,G.longitude" ;
                                        
                    }
                    else if(areatype.toLowerCase() == "entity")
                    {
                        logger.info("Querying ENTITY for parameter boundstartlat : " + robj.boundstartlat + ", boundstartlong : " + robj.boundstartlong + ", boundendlat : " + robj.boundendlat + ", boundendlong : " + robj.boundendlong + ", startdate : " + startdate + ", enddate : " + enddate);
                        querystring = " select count(1) as postcount,name,locationlatt as latitude,locationlong as longitude,category" + 
                                        " from `hive_social_media`.`default`.`facebookdata` " +
                                        " where fb_date between '" + startdate + "' and '" + enddate + "' " +
                                        " AND category IN ('Movie Theater','Bar','Restaurant','Casino & Gaming') " + 
                                        " and locationzip IN( Select PostCode " +
                                        " From `hive_social_media`.`default`.`NewDimPostCode` Where PostCodeLatitude Between  '" + minlat + "' and '" + maxlat + "' " + 
                                        " And PostCodeLongitude Between '" + minlong + "' and '" + maxlong + "') group by name,locationlatt,locationlong,category";
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
        
        var query1 = "SELECT tweet,tweet_id,userprofileimageurl,userscreenname,creeated_at,userfollowercount FROM `hive_social_media`.`default`.`twittercategorystream` where ";
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

         return querystring;
    }
        
    }

app.get("/api/getstation",function(req,res){
   
   var param = req.query.dataset;
   
    var q = "SELECT distinct location,latitude,longitude FROM facebooklist";
     var stnarray = [];
     var dataobj = {};

       connection.query(q,function(ferr,frows,ffields)
       {
        if(ferr)
        {
            console.log(ferr);
        }
        else
        {
            if(frows.length > 0)
            {
                function getallstation(n)
                {  
		
                   if(n < frows.length)
                   {
                       
                      // dataarray.push({"restname" : resname, "restlat" : restlat, "restlong" : restlong});
                       var stationname = frows[n].location;
                       var stnlat = frows[n].latitude;
                       var stnlong = frows[n].longitude;
                      
			var stncoordinates = [];
                      stncoordinates.push(stnlat);
                      stncoordinates.push(stnlong);
                      
                       stnarray.push({"type" : "Feature",
            			       "properties" : { "stationname" : stationname} , 
            			       "geometry" : { "type" : "Point" , "coordinates" : stncoordinates}});
                       getallstation(n + 1);
                   }
                   else
                   {
                             dataobj.type = "FeatureCollection";
                            dataobj.features = stnarray;
                            console.log(JSON.stringify(dataobj));
                            res.send(dataobj);   
                   }
                }
                getallstation(0);
            }
        }
       });
   
});

}
