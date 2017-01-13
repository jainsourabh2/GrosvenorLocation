module.exports = function(app){

// *********** Routing Logic Here ************** //
const config = require('./config');
const constants = config.constants;
var fs = require("fs");
const mysql = require('mysql');
var request = require("request");
var url = "http://10.80.2.4:8047/query.json";

 const connection = mysql.createConnection({
  host     : constants.mysql_host,
  port     : constants.mysql_port,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});
 
 connection.connect();
 

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
           var query = "SELECT count(1) as TotalCount, name as RestaurantName,locationlatt as Latitude,locationlong as Longitude,hours as Hours FROM `hive_test`.`default`.`facebookdata` WHERE name IN (" + querystr + ")";
           
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
    var type= req.query.type;
    var station = req.query.station;
     var track = req.query.track;
     var restaurantlist = [];
    
     
     if(dataset == "facebook")
     {
         var reqobj = {"dataset" : dataset, "startdate" : startdate, "enddate" : enddate, "restaurantlist" : restaurantlist}
         
          var q = "SELECT  * FROM facebooklist WHERE location = '" + station + "' and type= '" + type + "'";
          
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
                        //   getStationDetail(restaurantlist,stnlat,stnlong,station,fromdate,todate,weekday,timeframe);
                          getAPIJSON(reqobj);
                       }
                    }
                    getNearRest(0);
                }
            }
           });
            
         function getAPIJSON(robj)
         {
             console.log("Obj : " + robj);
             var dataobj = {};
             var dataarray = [];
             
               var drillq = getDrillQuery(robj);
               
               console.log("Drill Q : " + drillq);
            	var reqoptions = {
            	uri :url,
            	headers:{'Content-Type':'application/json'},
            	method : "POST",
            	body: JSON.stringify({queryType : 'SQL', query : drillq})
        	    
        	};
        	
        	 request(reqoptions, function(err, response, data){
            	//console.log(response + " " + err + " " + data);
            	if(err)
            	{
            	    console.log("Err: " + err);
            	}
            	if (!err && response.statusCode ==200){
            		console.log("Reached within query");
            	 	console.log(data);
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
                        		        
                    		        var totalcount = obj.rows[p].TotalCount;
                    		        var businessname = obj.rows[p].BusinessName;
                    		        var businesslong = obj.rows[p].Longitude;
                    		        var businesslat = obj.rows[p].Latitude;
                    		        
                    		      //  console.log(restname,restlat,restlong,postcount);
                    		       var cordinatearray = [];
                    		       cordinatearray.push(businesslat);
                    		       cordinatearray.push(businesslong);
                    		       
                    		        //dataarray.push({"type" : "Feature", "properties" : {"name" : businessname , "postcount" : totalcount},"geometry" : {"type" : "Point" , "coordinates" : cordinatearray });
                			   
                			       dataarray.push({"type" : "Feature",
                			       "properties" : { "name" : businessname , "postcount" : totalcount} , 
                			       "geometry" : { "type" : "Point" , "coordinates" : cordinatearray}});
                			       
                			   }
            			catch(ex)
            				{ console.log("Error while parsiing :" + ex);}
    
                                    buildJSONObj(p + 1);
            		        }
            		        else
            		        {
                               // console.log(station,stnlat,stnlong);
                                dataobj.type = "FeatureCollection";
                                dataobj.features = dataarray;
                                console.log(JSON.stringify(dataobj));
                                res.send(dataobj);        		            
            		        }
            		    }
            		    
            		    buildJSONObj(0);
            		}
    			
            	}
        	 }); 
        }
        
     }
     else if(dataset == "twitter")
     {
         var sdate = (startdate != undefined) ? startdate.substr(2,startdate.length) : undefined;
         var edate = (enddate != undefined) ? enddate.substr(2,enddate.length) : undefined;
         
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
            	    console.log("Err: " + err);
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
            				{ console.log("Error while parsiing :" + ex);}
    
                                    buildJSONObj(p + 1);
            		        }
            		        else
            		        {
                               // console.log(station,stnlat,stnlong);
                                dataobj.type = "FeatureCollection";
                                dataobj.features = dataarray;
                                console.log(JSON.stringify(dataobj));
                                res.send(dataobj);        		            
            		        }
            		    }
            		    
            		    buildJSONObj(0);
            		}
    			
            	}
        	 });
     }
  
})

function getDrillQuery(robj)
{
    var querystring = "";
    
    if(robj.dataset == "facebook")
    {
         var Qobj = robj;
        var dataset = Qobj.dataset;
        var startdate = Qobj.startdate;
        var enddate = Qobj.enddate;
        var restaurantlist = Qobj.restaurantlist;
        
        var reststring = "";
        
         for(var i = 0; i < restaurantlist.length; i++)
        {
	    var resname = restaurantlist[i].replace(/'/g,"''");
            reststring += "'" + resname + "',";
        }
        reststring = reststring.substr(0, reststring.length - 1);
        
        //Logic to build drill query here
        querystring = "SELECT COUNT(1) as TotalCount,name as BusinessName ,locationlatt as Latitude,locationlong as Longitude FROM `hive_test`.`default`.`facebookdata` where name IN(" + reststring + ") and fb_date  BETWEEN '" + 
                        startdate + "' and '" + enddate + "' group by name,locationlatt,locationlong";
        
    }
    else if(robj.dataset == "twitter")
    {
        var startdate = robj.startdate;
        var enddate = robj.enddate;
        var track = robj.keywords.split(',');
        
        var query1 = "SELECT tweet,tweet_id,userprofileimageurl,userscreenname,creeated_at,userfollowercount FROM `hive_test`.`default`.`twitterstream` where ";
        var query2 = "";
        var query3 = "";
        
        for(var t = 0; t < track.length ; t++)
        {
           query2 += "STRPOS(LOWER(tweet),'" + track[t] + "') +" ;
        }
        
        query2 = query2.substr(0,query2.length - 1);
        
        // query2 = "STRPOS(LOWER(tweet),'grosvenor')"; //dynamic
        if(startdate != undefined && enddate != undefined)
        {
            query3 = " > 0 and create_date between '" + startdate + "' and '"+ enddate + "' order  by creeated_at desc limit 10"; //based on single date or range
        }
        else
        {
            query3 = " > 0 and create_date = '" + startdate + "' order  by creeated_at desc limit 10"; //based on single date or range
        }
         
        
         querystring = query1 + query2 + query3;
    }
       
        
        return querystring;
        
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
