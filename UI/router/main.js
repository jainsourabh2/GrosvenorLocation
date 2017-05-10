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
const getdataapi = require('./getdata_FB_LiveActivity.js');
const getgeotwitter = require('./getgeotwitterdata.js');
const getalltwitter = require('./getalltwitterdata.js');
const fbdetails = require('./fbdetailapi.js');
const liverpoolstoredata = require('./getliverpoolstoredata.js');
const liverpooloneFBdata = require('./getliverpooloneFBdata.js');
const liverpoolonehashtag = require('./getliverpoolone_hashtag_data.js');
const liverpoolOnedetail = require('./liverpoolOne_Detail.js');
const liverpoolOneSales_agg = require('./getLiverpoolOneSales_agg.js');
const liverpoolOneTrans_agg = require('./getLiverpoolOneTrans_agg.js');
const liverpoolOneFF_agg = require('./getLiverpoolOneFF_agg.js');
const liverpoolOne_getRates = require('./getliverpoolOneRates.js');
const liverpoolOneAvgTranNConv_agg = require('./getLiverpoolOneAvgTranNConv_agg.js');
const liverpoolEventDetails = require('./getLiverpoolEventsDetail');
const events = require('./getEvents.js');

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
    getdataapi.GetData(req,res,logger);
});

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
       getgeotwitter.getGeoTwitterData(req,res,logger);  
});


app.get("/api/getalltwitterdata",function(req,res){
      getalltwitter.getAllTwitterData(req,res,logger);
     
});


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
 *       - name: startdate (yyyy-mm-dd)
 *         description: start date 
 *         in: query
 *         required: false
 *         type: string
 *       - name: enddate
 *         description: end date (yyyy-mm-dd) 
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Facebook details
 *     schema:
 *           $ref: '#/definitions/FacebookDetail'
 */


app.get("/api/getfbdetail",function(req,res){
      fbdetails.getFBDetails(req,res,logger);          
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
    liverpoolstoredata.getliverpoolstoredata(req,res,logger);
});


//Get Facebook posts of LiverpoolOne stores.
app.get("/api/liverpoolOneFB",function(req,res){
    liverpooloneFBdata.getliverpooloneFBdata(req,res,logger);
});


/**
 * @swagger
 * definitions:
 *   GetLiverpoolOneData:
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
 * /getliverpoolonedata?dataset={dataset}&startdate={startdate}&enddate={enddate}:
 *   get:
 *     tags:
 *       - Get Liverpoolone tags from twitter
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: dataset
 *         description: Dataset (twitter) 
 *         in: path
 *         required: true
 *         type: string
 *       - name: startdate
 *         description: Date in format yyyy-mm-dd
 *         in: path
 *         required: true
 *         type: string
 *       - name: enddate
 *         description: Date in format yyyy-mm-dd
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Returns tweets with liverpoolone tag
 *     schema:
 *           $ref: '#/definitions/GetLiverpoolOneData'
 */

app.get("/api/getliverpoolonedata",function(req,res){
      liverpoolonehashtag.getliverpoolonehashtag(req,res,logger);

    });


/**
 * @swagger
 * definitions:
 *   LiverpoolStoreDetails:
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
 * /getLiverpoolStoreDetail?storeid={storeid}&fromdate={fromdate}&todate={todate}&entity={entity}:
 *   get:
 *     tags:
 *       - Liverpool Store Details
 *     description: Returns Sales/Transactions/Footfall data for stores
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: storeid
 *         description: Store Id 
 *         in: path
 *         required: true
 *         type: string
 *       - name: fromdate
 *         description: From date (eg 2016-03-01)
 *         in: path
 *         required: true
 *         type: string
 *       - name: todate
 *         description: To Date (eg 2016-03-31)
 *         in: path
 *         required: true
 *         type: string
 *       - name: entity
 *         description: Either Sales/Transactions/Footfall
 *         in: path
 *         required: true
 *         type: string
 *       - name: weekdays
 *         description: Weekday value (eg Sun,Mon,...)
 *         in: query
 *         required: false
 *         type: string
 *       - name: aggregateby
 *         description: Aggregate value by weekly or daily?
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Sales/Transactions/Footfall data of store within date range.
 *     schema:
 *           $ref: '#/definitions/LiverpoolStoreDetails'
 */

//This API returns back LiverpoolOne stores Sales/Transactions/StoreFootfall details

app.get("/api/getLiverpoolStoreDetail",function(req,res){
   liverpoolOnedetail.getLiverpoolOneDetail(req,res,logger);
});

/**
 * @swagger
 * definitions:
 *   GetAggregateSalesData:
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
 * /getAggregateSalesData?startdate={startdate}&enddate={enddate}:
 *   get:
 *     tags:
 *       - Get Aggregate Sum of Sales
 *     description: Returns aggregate sum of sales per store
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: startdate
 *         description: start date eg 2016-01-01
 *         in: path
 *         required: true
 *         type: string
 *       - name: enddate
 *         description: end date eg 2016-05-01
 *         in: path
 *         required: true
 *         type: string
 *       - name: days
 *         description: selected weekdays in three letters eg mon,tue
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Get Aggregate Sum of Sale
 *     schema:
 *           $ref: '#/definitions/GetAggregateSalesData'
 */
app.get("/api/getAggregateSalesData",function(req,res){
  liverpoolOneSales_agg.getliverpoolOneSales_agg(req,res,logger);
});

/**
 * @swagger
 * definitions:
 *   GetAggregateTransactionsData:
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
 * /getAggregateTransactionsData?startdate={startdate}&enddate={enddate}:
 *   get:
 *     tags:
 *       - Get Aggregate Sum of Transaction
 *     description: Returns aggregate sum of transcation per store
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: startdate
 *         description: start date eg 2016-01-01
 *         in: path
 *         required: true
 *         type: string
 *       - name: enddate
 *         description: end date eg 2016-05-01
 *         in: path
 *         required: true
 *         type: string
 *       - name: days
 *         description: selected weekdays in three letters eg mon,tue
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Get Aggregate Sum of Sale
 *     schema:
 *           $ref: '#/definitions/GetAggregateTransactionsData'
 */

app.get("/api/getAggregateTransactionsData",function(req,res){
  liverpoolOneTrans_agg.getliverpoolOneTrans_agg(req,res,logger);
});

/**
 * @swagger
 * definitions:
 *   GetAggregateFootfallData:
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
 * /getAggregateFootfallData?startdate={startdate}&enddate={enddate}:
 *   get:
 *     tags:
 *       - Get Aggregate Sum of footfall
 *     description: Returns aggregate Sum of footfall per store
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: startdate
 *         description: start date eg 2016-01-01
 *         in: path
 *         required: true
 *         type: string
 *       - name: enddate
 *         description: end date eg 2016-05-01
 *         in: path
 *         required: true
 *         type: string
 *       - name: days
 *         description: selected weekdays in three letters eg mon,tue
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Get Aggregate Sum of Sale
 *     schema:
 *           $ref: '#/definitions/GetAggregateFootfallData'
 */

app.get("/api/getAggregateFootfallData",function(req,res){
  liverpoolOneFF_agg.getliverpoolOneFF_agg(req,res,logger);
});


/**
 * @swagger
 * definitions:
 *   CalculateRates:
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
 * /getRates?storeid={storeid}&fromdate={fromdate}&todate={todate}&entity={entity}:
 *   get:
 *     tags:
 *       - Conversion Rates and Average Sales calculation
 *     description: Returns CR and Avg sales data for stores
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: storeid
 *         description: Store Id 
 *         in: path
 *         required: true
 *         type: string
 *       - name: fromdate
 *         description: From date (eg 2016-03-01)
 *         in: path
 *         required: true
 *         type: string
 *       - name: todate
 *         description: To Date (eg 2016-03-31)
 *         in: path
 *         required: true
 *         type: string
 *       - name: weekdays
 *         description: Weekday value (eg Sun,Mon,...)
 *         in: query
 *         required: false
 *         type: string
 *       - name: aggregateby
 *         description: Aggregate value by weekly or daily?
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Conversion Rate/ Avg Sales 
 *     schema:
 *           $ref: '#/definitions/CalculateRates'
 */

app.get("/api/getRates",function(req,res){
  liverpoolOne_getRates.getliverpoolOneRates(req,res,logger);
   
});

/**
 * @swagger
 * definitions:
 *   GetAggrConvRateWithAvgTranData:
 *     properties:
 *       posts:
 *         type: array
 *         items: {
            type: string
            }
 */

/**
 * @swagger
 * /getAggrConvRateWithAvgTranData?startdate={startdate}&enddate={enddate}:
 *   get:
 *     tags:
 *       - Get Aggregate Conversion Rate and Avg transaction Data
 *     description: Get Aggregate Conversion Rate and Avg transaction Data.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: startdate
 *         description: start date 
 *         in: path
 *         required: true
 *         type: string
 *       - name: enddate
 *         description: end date 
 *         in: path
 *         required: true
 *         type: string
 *       - name: days
 *         description: week days (eg mon,tue)
 *         in: query
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Get Aggregate Conversion Rate and Avg transaction Data
 *     schema:
 *           $ref: '#/definitions/GetAggrConvRateWithAvgTranData'
 */

app.get("/api/getAggrConvRateWithAvgTranData",function(req,res){
  liverpoolOneAvgTranNConv_agg.getliverpoolOneAvgTranNConvRate_agg(req,res,logger);
});


/**
 * @swagger
 * definitions:
 *   LiverpoolEventDetails:
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
 * /getLiverpoolEventsDetail?eventid={eventid}:
 *   get:
 *     tags:
 *       - Liverpool Events Details
 *     description: Returns Events detail based on id.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: eventid
 *         description: Event Id 
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Event detail based on id.
 *     schema:
 *           $ref: '#/definitions/LiverpoolEventDetails'
 */

app.get("/api/getLiverpoolEventsDetail",function(req,res){
  liverpoolEventDetails.getLiverpoolEventsDetail(req,res,logger);
   
});

/**
 * @swagger
 * definitions:
 *   GetEvents:
 *     properties:
 *       posts:
 *         type: array
 *         items: {
            type: string
            }
 */

/**
 * @swagger
 * /getEvents?startdate={startdate}&enddate={enddate}:
 *   get:
 *     tags:
 *       - Get Events Data
 *     description: Get Events Data.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: startdate
 *         description: start date 
 *         in: path
 *         required: true
 *         type: string
 *       - name: enddate
 *         description: end date 
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Get Events Data
 *     schema:
 *           $ref: '#/definitions/GetEvents'
 */
app.get("/api/getEvents",function(req,res){
  events.getEvents(req,res,logger);
});

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
