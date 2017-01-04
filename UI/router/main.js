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
                    console.log(frows[j]);
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
                    console.log(frows[j]);
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
    console.log(q);
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
                       console.log(stnlat + "," + stnlong);
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
        
        console.log("From Date: " + fromdate);
        console.log("To Date: "+ todate);
         console.log("Weekday: "+ weekday);
          console.log("TimeFrame: "+ timeframe); */
          
        var q  = "";
        
        //Query Drill and get back name,lat,long,Total Post count, Rating of the rest from HDFS. Create array of object and send back to the client.
        q = queryBuilder(querystr,fromdate,todate,weekday,timeframe);
        
        console.log(q);
        
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
        		console.log(data);
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
            		        
            		        console.log(restname,restlat,restlong,postcount);
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
                            console.log(station,stnlat,stnlong);
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
           var query = "SELECT count(1) as TotalCount, name as RestaurantName,locationlatt as Latitude,locationlong as Longitude,hours as Hours FROM `hive_test`.`default`.`restaurants` WHERE name IN (" + querystr + ")";
           
           console.log("Weekday: " + weekday);
           console.log("Timeframe: " + timeframe);
           
           if(fromdate != "NaN/NaN/NaN" || todate != "NaN/NaN/NaN")
           {
              query += " and CAST(createdtime as date) >  '" + fromdate + "' and  CAST(createdtime as date) < '" + todate + "' ";   
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


/*app.get('/getPostsCount',function(req,res){
    var restname = req.query.restname;
    console.log("Inside PostCount");
    //Make req call to web api drill and pass query in body req.
    //var data = {"count"  : 30};
    
    	
    	var q = "SELECT count(1) as TotalCount FROM `hive_test`.`default`.`restaurants` WHERE name ='" + restname + "'";
    	
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
		console.log("Reached");
		console.log(data);
		var obj = JSON.parse(data);
		console.log("Res: " + obj.rows[0].TotalCount);
		var count = obj.rows[0].TotalCount;
		res.send(count);
	}
        
        
    });
    
}); */

}
