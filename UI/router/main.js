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



/**
 * @swagger
 * definitions:
 *   GetData:
 *     properties:
 *       Type:
 *         type: string
 *       features:
 *         type: array
 *         items : {
            type : string
            }
 */

/**
 * @swagger
 * /getdata?dataset={dataset}&startdate={startdate}:
 *   get:
 *     tags:
 *       -  Latest tweets for Live Activities.
 *     description: Returns latest 10 twitter data to be displayed for Live Activities. Parameter dataset must be twitter and startdate in format yyyy-mm-dd
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: dataset
 *         description: Dataset 
 *         in: path
 *         required: true
 *         type: string
 *       - name: startdate
 *         description: Dataset 
 *         in: path
 *         required: false
 *         type: string
 *  
 *     responses:
 *       200:
 *         description: Twitter data
 *     schema:
 *           $ref: '#/definitions/GetData'
 */

 /**
 * @swagger
 * /getdata?dataset={dataset}&areatype={areatype}&boundstart={boundstart}&boundend={boundend}:
 *   get:
 *     tags:
 *       - Facebook API
 *     description: Parameter dataset should be facebook and areatype can be borough or msoa or lsoa and boundstart,boundend should be in format lat,long 
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: dataset
 *         description: Dataset 
 *         in: path
 *         required: true
 *         type: string
 *      
 *       - name: areatype
 *         description: Dataset 
 *         in: path
 *         required: false
 *         type: string
 *
 *       - name: boundstart
 *         description: Dataset 
 *         in: path
 *         required: false
 *         type: string
 *
 *       - name: boundend
 *         description: Dataset 
 *         in: path
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Facebook data
 *     schema:
 *           $ref: '#/definitions/GetData'
 */


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

            //console.log(querystring);
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
                   // console.log("Err: " + err);
                   logger.error("Error in request : " + err);
                }
                if (!err && response.statusCode ==200){
		logger.info("Facebook query ended");
                //  console.log("Reached within query");
                //  console.log(data);
                //console.log(data.length);
		logger.info("Parse started");
                var obj = JSON.parse(data);
		logger.info("Parse ended");
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
                                        
                                      /* dataarray.push({"type" : "Feature",
                                       "properties" : { "p1" : areaname , 
                                                        "p2" : pcforBar , //Bar aggregate 
                                                        "p3" : pcforCasinos,  //Cinema Agregare
                                                        "p4" : pcforCinemas,  //Rest Aggregate
                                                        "p5" : pcforRestaurant        //Casinos Aggregate
                                       } , 

                                       "geometry" : { "type" : "Point" , "coordinates" : cordinatearray}}); */

				    dataarray.push({
                                       "pr" :         { "p1" : areaname , 
                                                        "p2" : pcforBar , //Bar aggregate 
                                                        "p3" : pcforCasinos,  //Cinema Agregare
                                                        "p4" : pcforCinemas,  //Rest Aggregate
                                                        "p5" : pcforRestaurant        //Casinos Aggregate
                                       } , 

                                      "ge" : { "lo" : arealongitude, "la" : arealatitude }});

                                    }
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

                                      /*  dataarray.push({"type" : "Feature",
                                        "properties" : { "p1" : name , 
                                                         "p2" : category , 
                                                         "p3" : postcount,
							  "id" : fbid  
                                                                            
                                        }, 

                                       "geometry" : { "type" : "Point" , "coordinates" : coordinates}}
                                       ); */

					dataarray.push({
                                        "pr" :         { "p1" : name , 
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
                    		       
                			   
                	/* dataarray.push({"type" : "Feature",
                	    "properties" : { "p1" : tweet , "p2" : created_at_string , "p3" : username, "p4" : imageurl, "p5" : follcount, "p6" : tweetid} , 
               		"geometry" : { "type" : "Point" , "coordinates" : cordinatearray}}); */
		
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
  
})

/**
 * @swagger
 * definitions:
 *   GeoTweets:
 *     properties:
 *       Type:
 *         type: string
 *       features:
 *         type: array
 *         items: {
            type: string
            }
 */

/**
 * @swagger
 * /getgeotwitterdata?dataset={dataset}&latrange={latrange}&longrange={longrange}:
 *   get:
 *     tags:
 *       - Geo based tweets
 *     description: Returns geo based twitter data
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: dataset
 *         description: Dataset 
 *         in: path
 *         required: true
 *         type: string
 *       - name: latrange
 *         description: Latitude range eg 51.2611,51.7160
 *         in: path
 *         required: true
 *         type: string
 *       - name: longrange
 *         description: Longitude range  eg -0.5383,0.2939
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Geo based tweets
 *     schema:
 *           $ref: '#/definitions/GeoTweets'
 */

app.get("/api/getgeotwitterdata",function(req,res){
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
    //var moment_todaydate = moment(todaydate,"yyyy-mm-dd");
     let sdate = (startdate != undefined) ? startdate.substr(2,startdate.length) : moment(todaydate,"yyyy-mm-dd").subtract(1,'days').toISOString().split('T')[0].substr(2,moment(todaydate,"yyyy-mm-dd").toISOString().length);  //Format in yyyy-mm-dd Current date
     let edate = (enddate != undefined) ? enddate.substr(2,enddate.length) :  moment(todaydate,"yyyy-mm-dd").toISOString().split('T')[0].substr(2,moment(todaydate,"yyyy-mm-dd").toISOString().length);


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

           /* let q = " select tweet_id,tweetlatitude,tweetlongitude from `hive_social_media`.`default`.`newtwittercategorystream`  " +
                    "  where  create_date between '" + sdate + "' and '" + edate + "' and category=0 " +  
                    "  and  CAST(geolatitude as float) between 51.2611  and 51.7160 " +  
                    "  and CAST(geolongitude as float) between -0.5383  and 0.2939 " + 
                    " and geolatitude <> 'null' and " + 
                    "  geolongitude <> 'null' and tweetlatitude <> 'null' " ;  */
           
		let q = " select tweet_id,tweetlatitude,tweetlongitude from `hive_social_media`.`default`.`newtwittercategorystream`  " +
                    "  where  create_date between '" + sdate + "' and '" + edate + "' and category=0 " +  
                    "  and  CAST(geolatitude as float) between " +  lat[0] + " and " + lat[1]  +  
                    "  and CAST(geolongitude as float) between "  + long[0] + " and " + long[1] + 
                    " and geolatitude <> 'null' and " + 
                    "  geolongitude <> 'null' and tweetlatitude <> 'null' " ;

            
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
	else{

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
});


app.get("/api/getalltwitterdata",function(req,res){
  /*  var obj1 = { "longitude" : -0.74578, "latitude" : 51.448222};
    var obj2 = {"longitude" : -0.74578, "latitude" : 52.992679};
    var obj3 = {"longitude" : -0.74578, "latitude" : 52.992679};
    var obj4 = {"longitude" : 1.768936, "latitude" : 51.448222};

    var r = randomCoordinates(obj1,obj2,obj3,obj4); */
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

});


/*function randomCoordinates(pc1,pc2,pc3,pc4)
{
    let randomCoord = {};
    if(pc4.latitude > pc2.latitude)
    {
        randomCoord.latitude =  Math.random().toFixed(2) * (pc4.latitude - pc2.latitude) + pc2.latitude;
        console.log("RV1: " + randomCoord.latitude);
    }
    else
    {
         randomCoord.latitude =  Math.random().toFixed(2) * (pc2.latitude - pc4.latitude) + pc4.latitude;
         
    }   
   
   if(pc3.longitude > pc1.longitude)
   {
    randomCoord.longitude = Math.random().toFixed(2) * (pc3.longitude - pc1.longitude) + pc1.longitude;
   }
   else
    {
    randomCoord.longitude = Math.random().toFixed(2) * (pc1.longitude - pc3.longitude) + pc3.longitude; 
    }


    //console.log(randomCoord);
    return  randomCoord;

}
*/




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


/**
 * @swagger
 * definitions:
 *   FacebookDetail:
 *     properties:
 *       posts:
 *         type: array
 *         items: {
            type: string
            }
 */

/**
 * @swagger
 * /getfbdetail?dataset={dataset}&entityid={entityid}:
 *   get:
 *     tags:
 *       - Facebook post details
 *     description: Returns facebook posts details respective to facebook page id.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: dataset
 *         description: Dataset 
 *         in: path
 *         required: true
 *         type: string
 *       - name: entityid
 *         description: Id of the entity 
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Facebook details
 *     schema:
 *           $ref: '#/definitions/FacebookDetail'
 */


app.get("/api/getfbdetail",function(req,res){
      let dataset = req.query.dataset;
      let fbid = req.query.entityid;
      let todaydate = new Date().toLocaleDateString();

      let sdate =  moment(todaydate,"yyyy-mm-dd").subtract(1,'days').toISOString().split('T')[0];  
      let edate =  moment(todaydate,"yyyy-mm-dd").toISOString().split('T')[0];  

      let q = "select message_id,message_from,message,createdtime from `hive_social_media`.`default`.`facebookdata` where  categorize=0 and id='" + fbid + "' and fb_date between '" + sdate + "' and '"+  edate + "' order by createdtime desc";

      var reqoptions = {
                  uri :url,
                  headers:{'Content-Type':'application/json'},
                  method : "POST",
                  body: JSON.stringify({queryType : 'SQL', query : q})
                  
              };
      		//console.log("Query : " + q);
      		logger.info("Facebook latest post api query started");

      request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err)
              {
                  //console.log("Err: " + err);
                    logger.error("Error: " + err);
              }
              if (!err && response.statusCode ==200)
              {
                  //  console.log("Reached within query");
                  //  console.log(data);
                  //console.log(data.length);
                 let obj = JSON.parse(data);
                 
                 var jsonarray = [];
                 var postsobj = {};
                 console.log(obj.rows.length);
                 for(let o = 0; o < obj.rows.length; o++ )
                 {
                  if(obj.rows[o].message != undefined)
                  {
                    let jsonobj = {};
                    console.log(obj.rows[o]);
                    let fbmsg = obj.rows[o].message.substring(0,140);
                    let created_tm = obj.rows[o].createdtime;
                    let uname = obj.rows[o].message_from;
                    let fbmsgid = obj.rows[o].message_id;

                    jsonobj.p1 = uname;
                    jsonobj.p2 = fbmsg;
                    jsonobj.p3 = created_tm;
                    jsonobj.p4 = "https://www.facebook.com/" + fbmsgid;
                    jsonarray.push(jsonobj);
                  }
                    
                 }
                // console.log(jsonarray);
                 postsobj.posts = jsonarray;
                 res.send(postsobj);
                 logger.info("Facebook latest post api query end");
              }
            });

          

});



/**
 * @swagger
 * definitions:
 *   GetLiverpoolData:
 *     properties:
 *       Type:
 *         type: string
 *       features:
 *         type: array
 *         items: {
            type: string
            }
 */

/**
 * @swagger
 * /getliverpooldata?dataset={dataset}&type={type}:
 *   get:
 *     tags:
 *       - Liverpool data for Sales, Transactions and Footfall
 *     description: Returns sales data/Transactional data/Store Footfall data for 2016
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: dataset
 *         description: Dataset (liverpool) 
 *         in: path
 *         required: true
 *         type: string
 *       - name: type
 *         description: Type (Sales/Transactions/StoreFootfall) 
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Returns sales data/Transactional data/Store Footfall data for 2016
 *     schema:
 *           $ref: '#/definitions/GetLiverpoolData'
 */

app.get("/api/getliverpooldata",function(req,res){
    let dataset = req.query.dataset;
    let type = req.query.type;
     
    //Get drill query based on type.
    let query = getDrillQueryForType(type);
    let dataobj = {};
    let responsearray = [];
    //Make Drill Req
    
      var reqoptions = {
              uri :url,
              headers:{'Content-Type':'application/json'},
              method : "POST",
              body: JSON.stringify({queryType : 'SQL', query : query})
              
          };
          
           request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err)
              {
                  console.log("Err: " + err);
              }
              if (!err && response.statusCode ==200){
                 //Format Response and send back
                 
                  var obj = JSON.parse(data);
                  
                  for(let r =0; r < obj.rows.length; r++)
                  {
                      let storename = obj.rows[r].storename;
                      let totalcount = obj.rows[r].totalcount;
                      let latitude = obj.rows[r].Latitude;
                      let longitude = obj.rows[r].Longitude;
                      
                     responsearray.push({
                             "pr" : {"p1" : storename , "p2" : totalcount},
                             "ge" : {"lo" : longitude , "la" : latitude }
                     });
                  }
              
                        dataobj.type = "FeatureCollection";
                            dataobj.features = responsearray;
      
                            console.log(JSON.stringify(dataobj));
                            res.send(dataobj);                   
              }
           });
    
   
});

function getDrillQueryForType(type)
{
    let query = "";
    
    if(type.toLowerCase() == "sales")
    {
       query = 'SELECT SUM(CAST(S.SalesValue as int)) as totalcount,S.StoreName as storename,S.Zone,M.Latitude,M.Longitude from `dfs`.`default`.`SalesView` S inner join `dfs`.`default`.`MasterStoreData` M on S.StoreName=M.StoreName and S.Zone=M.Zone group by S.StoreName,S.Zone,M.Latitude,M.Longitude' 
    }
    else if(type.toLowerCase() == "storefootfall")
    {
     query = 'SELECT SUM(CAST(F.FootfallValue as int)) as totalcount,F.StoreName as storename,F.Zone,M.Latitude,M.Longitude  from `dfs`.`default`.`StorefootfallView` F inner join `dfs`.`default`.`MasterStoreData` M on F.StoreName=M.StoreName and F.Zone=M.Zone group by F.StoreName,F.Zone,M.Latitude,M.Longitude'    
    }
    else if(type.toLowerCase() == "transactions")
    {
   query = 'SELECT SUM(CAST(T.TransactionsValue as int)) as totalcount,T.StoreName as storename,T.Zone,M.Latitude,M.Longitude  from `dfs`.`default`.`TransactionsView` T inner join `dfs`.`default`.`MasterStoreData` M on T.StoreName=M.StoreName and T.Zone=M.Zone group by T.StoreName,T.Zone,M.Latitude,M.Longitude'         
    }
    
    return query;
}



app.get("/api/liverpoolOneFB",function(req,res){
    let dataset = req.query.dataset;
    let startdate = req.query.startdate;
    let enddate = req.query.enddate;
    let todaydate = new Date().toLocaleDateString();
    let error = {errormsg : ""};    
     let sdate = (startdate != undefined) ? startdate : moment(todaydate,"yyyy-mm-dd").subtract(1,'days').toISOString().split('T')[0];  //Format in yyyy-mm-dd Current date
     let edate = (enddate != undefined) ? enddate :  moment(todaydate,"yyyy-mm-dd").toISOString().split('T')[0]; //Format in yyyy-mm-dd Tomorows date 
     
     if(dataset == undefined || dataset != 'facebook')
     {
        error.errormsg = "Dataset parameter is mandatory and its value must be facebook";
        res.send(error);
     }

     let query = " select distinct A.id,A.name,A.category,B.Latitude,B.Longitude from `hive_social_media`.`default`.`facebookdata` A inner join `dfs`.`default`.`MasterStoreData` B on " + 
                 " LOWER(A.username) = LOWER(B.FBHandle)  where A.fb_date between '" + sdate + "' and '" + edate + "' and LOWER(A.username) in(" + 
                 "'adidasuk','allsaints','americanapparel','annsummersofficial','apple','barburritouk','barberbarberuk','bembrasil'," +
                 "'birminghambierkeller','billsrestaurants','boseuk','bouxavenue','bravissimo','brownsfashion','buildabear','busabaeathai'," +
                 "'byronhamburgers','cadenzza','caffenero','card-factory-124991387578486','cassArt1984','cathkidston','liverpoolchaophraya'," +
                 "'claireseurope','clintonsuk','coaststores','costacoffee','cosyclubliverpool','d.m.robinson.jewellers','debenhams','alive-dirty-460312137396247'," +
                 "'disneystoreuk','drmartens','dunelondon','eatltduk','edseasydiners','ernestjonesjewellers','evanscycles','everton','fishlocks.flowers.liverpool'," +                  "'flannelsfashion','fredperry','gourmetburgerkitchen','ukgap','goldsmithsuk','greggsofficial','hmunitedkingdom','hsamuelthejeweller','harveynichols',"+
                 "'hobbsvip','hollister','hotelchocolat','hugoboss','interestingeat','jdsportsofficial','jackandjonesUK','jackwolfskinofficial','jamiesitalianuk'," +
                 "'jonesbootmaker','junglerumbleuk','karenmillen','kiehls','krispykremeuk','kuonitraveluk','loccitane.uk','liverpoolfc','lakelanduk','lasiguanasuk'," +
                 "'lego','levis.gb','lindtuk','lunya','mamasandpapas','mango.com','menkind','michaelkors','milliesliverpool','missselfridge','modainpelle'," + 
                 "'monsoonuk','like.mooboo','nandos.unitedkingdom','newlookfashion','nike','o2uk','oasisfashions','officeshoes1','pandorajewelry','paperchase'," +
                 "'pizzaexpress','pizzahutuk','pretamanger','prettygreenltd','pullandbear','radleylondon','redhotbuffet','redsbbqliverpool','reiss','rolex'," +
                 "'roxyballroomliverpool','sky','sblended.milkshakes.uk','schuhshoes','selectonline','7liverpool-266703353688640','simplybefashion','skechers'," +
                 "'smiggleuk','sportsdirect','starbucksuk','subwayukireland','superdry','ststudio.hq','swarovskicom','swatchuk','tgifridaysuk','tailorthread'," +
                 "'tavernL1','tedbaker','tessutiuk','thebodyshopuk','theclubhousel1','theentertainertoyshop','fragranceshopuk','fueljuicebars','thenorthface'," +
                 "'theperfumeshoponline','thewhitecompany','thorntonschocs','topshop','tortillauk','toysrusuk','turtlebayrestaurants','uscfashion','ugguk'," +
                 "'urbandecaycosmetics','urbanoutfitterseurope','utilitydesign.co.uk','vanseurope','victoriassecret','whsmith','wagamama-uk-1837864496502928'," +
                 "'wahaca','warehousefashion','waterstones','thisiswhistles','whitewallgalleries','yardandcoop','yeerahliverpool','yosushi','zara','zizziliverpool')" ;
        
        let dataarray = [];
        let dataobj = {};
        
      let reqoptions = {
              uri :url,
              headers:{'Content-Type':'application/json'},
              method : "POST",
              body: JSON.stringify({queryType : 'SQL', query : query})
              
          };
          
           request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err)
              {
                  console.log("Err: " + err);
              }
              if (!err && response.statusCode ==200){
                  
              var obj = JSON.parse(data);
              //console.log(obj);
              for(let n =0; n < obj.rows.length; n++)
              {
                  let facebookid = obj.rows[n].id;
                  let facebookpagename = obj.rows[n].name;
                  let pagecategory = obj.rows[n].category;
                  let latitude = obj.rows[n].Latitude;
                  let longitude = obj.rows[n].Longitude;
                  
                  let cordinatearray = [];
                  cordinatearray.push(longitude);
                  cordinatearray.push(latitude);
                  
                   dataarray.push({"type" : "Feature",
                             "properties" : { "p1" : facebookid,"p2" : facebookpagename, "p3" : pagecategory } , 
                             "geometry" : { "type" : "Point" , "coordinates" : cordinatearray}});
              }
              
                dataobj.type = "FeatureCollection";
                      dataobj.features = dataarray;
          
                      console.log(JSON.stringify(dataobj));
                      res.send(dataobj);  
              }
           });
    
});


//Get tweets having keyword #LiverpoolOne

/**

* @swagger
* /getliverpoolonedata?dataset={dataset}&startdate={startdate}&enddate={enddate}:
*   get:
*     tags:
*       -  Latest tweets for Live Activities.
*     description: Returns tweets with data liverpoolone keyword. Parameter dataset must be twitter and date in format yyyy-mm-dd
*     produces:
*       - application/json
*     parameters:
*       - name: dataset
*         description: Dataset
*         in: path
*         required: true
*         type: string
*       - name: startdate
*         description: Dataset
*         in: path
*         required: false
*         type: string
*       - name: enddate
*         description: Dataset
*         in: path
*         required: false
*         type: string
* 
*     responses:
*       200:
*         description: Twitter data
*     schema:
*           $ref: '#/definitions/GetLiverPoolData'
*/

app.get("/api/getliverpoolonedata",function(req,res){

    var dataset = req.query.dataset;

    var startdate = req.query.startdate;

    var enddate = req.query.enddate;

    var todaydate = new Date().toLocaleDateString();

    if(dataset == undefined)
      {
          var errorobj = {"error" : "Not enough parameters. Parameters dataset is mandatory"};
          res.send(errorobj);
      }

     if(dataset == "twitter")
     {
        logger.info("Twitter query started for LiverPoolOne");       

         let sdate = (startdate != undefined) ? startdate.substr(2,startdate.length) : moment(todaydate,"yyyy-mm-dd").subtract(1,'days').toISOString().split('T')[0].substr(2,moment(todaydate,"yyyy-mm-dd").toISOString().length);  //Format in yyyy-mm-dd Current date

         let edate = (enddate != undefined) ? enddate.substr(2,enddate.length) :  moment(todaydate,"yyyy-mm-dd").toISOString().split('T')[0].substr(2,moment(todaydate,"yyyy-mm-dd").toISOString().length); 


        logger.info("StartDate for LiverPoolOne ",startdate);

        logger.info("EndDate for LiverPoolOne ",enddate);                           

         var track = "liverpoolone";

         var reqobj = {"dataset" : dataset, "startdate" : sdate, "enddate" : edate, "keywords" : track}

         var q = getQueryForLiverPoolOne(reqobj);

         console.log(q);

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
                   var obj = JSON.parse(data);
                   for(let p =0; p < obj.rows.length; p++)

                    {

                      console.log(obj.rows[p]);

                        var created_at = new Date(obj.rows[p].creeated_at);

                        var tweet = obj.rows[p].tweet;                        

                        var imageurl = obj.rows[p].userprofileimageurl;

                        var username = obj.rows[p].userscreenname;

                        var follcount = obj.rows[p].userfollowercount;

                        var tweetid = obj.rows[p].tweet_id;

                                                                     

                        var cordinatearray = [];

                         cordinatearray.push(0.0);

                         cordinatearray.push(0.0);

                        

                         dataarray.push({

                             "pr" : { "p1" : tweet , "p2" : created_at , "p3" : username, "p4" : imageurl, "p5" : follcount, "p6" : tweetid} ,

                             "ge" : { "lo" : cordinatearray[0] , "la" : cordinatearray[1] }});

                    }

                dataobj.type = "FeatureCollection";

                      dataobj.features = dataarray;

                      console.log(JSON.stringify(dataobj));

                      res.send(dataobj); 

                }

                 else

                 {

                        var errorobj = {"error" : "Unexpected Error"};

                        res.send(errorobj);

                 }

 

        });

      }

    });


function getQueryForLiverPoolOne(robj)

{

     var dataset = robj.dataset;

     var startdate = robj.startdate;

     var enddate = robj.enddate;

     var track = robj.keywords;

     logger.info("Inside getQueryForLiverPoolOne");

    if(robj.dataset == "twitter")

    {

        var query= "select creeated_at,tweet, userscreenname,userprofileimageurl,userfollowercount,tweet_id from `hive_social_media`.`default`.`newtwittercategorystream` where create_date between '" + startdate + "' and '" + enddate+ "' and category=0 and STRPOS(LOWER(tweet),'"+ track +"') > 0";

        logger.info("Get Query For LiverPoolOne ",query);

        return query;

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
