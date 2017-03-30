'use strict';
module.exports = function(app){

// *********** Routing Logic Here ************** //
const config = require('../config/config.js');
const constants = config.constants;
var fs = require("fs");
var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
var q = require('q');
const logger = require('../config/log.js');
//var entity="";

 /**
 * @swagger
 * definitions:
 *   Get LiverPool One Data for Sales:
 *     properties:
 *       Type:
 *         type: string
 *       features:
 *         type: array
 *         items: {
            type: string
			type: string
			type: string
			type: string
            }
 */
 
/**
 * @swagger
 * /getAggregateSalesData?startdate={startdate}&enddate={enddate}&day={day}&latitude={latitude}&longitude={longitude}:
 *   get:
 *     tags:
 *       -  Get aggregate data for Sales.
 *     description: Returns aggregate data for Sales from all liverpoolone stores, by passing parameter as start and end date in format yyyy-mm-dd, day of week and boundry.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: startdate
 *         description: From date 
 *         in: path
 *         required: true
 *         type: string
 *       - name: enddate
 *         description: end date 
 *         in: path
 *         required: true
 *         type: string
 *		- name: day
 *         description: week day 
 *         in: path
 *         required: true
 *         type: string
 *		- name: latitude
 *         description: Latitude 
 *         in: path
 *         required: true
 *         type: string
 *		- name: longitude
 *         description: Longitude 
 *         in: path
 *         required: true
 *         type: string
 *  
 *     responses:
 *       200:
 *         description: Twitter data
 *     schema:
 *           $ref: '#/definitions/getDataForSales'
 */

app.get("/api/getAggregateSalesData",function(req,res){
    var startdate = req.query.startdate;
    var enddate = req.query.enddate;
	var days = req.query.days;
	var lats = req.query.latitude;
	var longs = req.query.longitude; 
	let error = { errormsg : "" };
	var entity = "Sales";

	logger.info("Start of getAggregateSalesData");

	if(startdate == undefined || enddate == undefined)
    {
    	error.errormsg = "StartDate,EndDate parameters are mandatory.  eg : /api/getAggregateSalesData?startdate=2016-10-01&enddate=2016-12-31";
    	res.send(error);
    }
	
	var reqobj = {"startdate" : startdate, "enddate" : enddate, "days" : days, "latitude":lats, "longitude":longs }
	var q = getQueryForSalesData(reqobj);
	    
    parseRequest(req,res,entity,q);
	
})


function getQueryForSalesData(robj)
{
    var fromdate = robj.startdate;
    var todate = robj.enddate;
    var latitude = robj.latitude;
	var longitude = robj.longitude;
	var weekdays = robj.days;
	var query2 = "";
	var query3 =")";
	var query4 = " S inner join `dfs`.`default`.`MasterStoreData` M on S.StoreName=M.StoreName and S.Zone=M.Zone group by S.StoreName,S.Zone,S.DayPeriod, M.Latitude,M.Longitude,M.Id";
	let weekdaylist="";

	logger.info("Start of getQueryForSalesData");
    
	var query1 = "SELECT SUM(CAST(S.SalesValue as int)) as totalcount,S.StoreName as storename,S.Zone,M.Id,M.Latitude,M.Longitude,S.DayPeriod from (Select * from `dfs`.`default`.`SalesView` V where V.Period between '" + fromdate + "' and '"+ todate + "'";    	 
	if(weekdays != undefined )
	{
		if(weekdays.indexOf(',') > -1) //If multiple weekdays are selected, make comma seperated list 
		{
	  		let weekdayarray = weekdays.split(',');
	  		for(let j =0; j < weekdayarray.length; j++)
	  		{
	  			weekdaylist += "'" + weekdayarray[j].toLowerCase() + "'" + ",";
	  		}

	  		weekdaylist = weekdaylist.substring(0,weekdaylist.length - 1);
	  		console.log("Weekdaylist : "  + weekdaylist);
		}
		else
		{
			weekdaylist = "'" + weekdays.toLowerCase() + "'";
		}
		query2 = "and LOWER(V.DayPeriod) IN ("+ weekdaylist + ")";
	}
	
	var query = query1+query2+query3+query4;
	logger.info("query in getQueryForSalesData", query);
	
	logger.info("End of getQueryForSalesData");
	
	return query;
}


/**
 * @swagger
 * /getAggregateTransactionsData?startdate={startdate}&enddate={enddate}&day={day}&latitude={latitude}&longitude={longitude}:
 *   get:
 *     tags:
 *       -  Get aggregate data for Transactions.
 *     description: Returns aggregate data for Transactions from all liverpoolone stores, by passing parameter as start and end date in format yyyy-mm-dd, day of week and boundry.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: startdate
 *         description: From date 
 *         in: path
 *         required: true
 *         type: string
 *       - name: enddate
 *         description: end date 
 *         in: path
 *         required: true
 *         type: string
 *		- name: day
 *         description: week day 
 *         in: path
 *         required: true
 *         type: string
 *		- name: latitude
 *         description: Latitude 
 *         in: path
 *         required: true
 *         type: string
 *		- name: longitude
 *         description: Longitude 
 *         in: path
 *         required: true
 *         type: string
 *  
 *     responses:
 *       200:
 *         description: Twitter data
 *     schema:
 *           $ref: '#/definitions/getDataForTransactions'
 */

app.get("/api/getAggregateTransactionsData",function(req,res){
    var startdate = req.query.startdate;
    var enddate = req.query.enddate;
	var days = req.query.days;
	var lats = req.query.latitude;
	var longs = req.query.longitude; 
	let error = { errormsg : "" };   
	var entity = "Transactions";

	logger.info("Start of getAggregateTransactionsData");

	if(startdate == undefined || enddate == undefined)
    {
    	error.errormsg = "StartDate,EndDate parameters are mandatory.  eg : /api/getAggregateTransactionsData?startdate=2016-10-01&enddate=2016-12-31";
    	res.send(error);
    }
	
	var reqobj = {"startdate" : startdate, "enddate" : enddate, "days" : days, "latitude":lats, "longitude":longs }
	var q = getQueryForTransactionsData(reqobj);
	

	parseRequest(req,res,entity,q);

})


function getQueryForTransactionsData(robj)
{
    var fromdate = robj.startdate;
    var todate = robj.enddate;
    var latitude = robj.latitude;
	var longitude = robj.longitude;
	var weekdays = robj.days;
	var query2 = "";
	var query3 =")";
	var query4 = " S inner join `dfs`.`default`.`MasterStoreData` M on S.StoreName=M.StoreName and S.Zone=M.Zone group by S.StoreName,S.Zone,S.DayPeriod, M.Latitude,M.Longitude,M.Id";
	let weekdaylist="";

	logger.info("Start of getQueryForTransactionsData");
    
	var query1 = "SELECT SUM(CAST(S.TransactionsValue as int)) as totalcount,S.StoreName as storename,S.Zone,M.Id,M.Latitude,M.Longitude,S.DayPeriod from (Select * from `dfs`.`default`.`TransactionsView` V where V.Period between '" + fromdate + "' and '"+ todate + "'";    	 
	if(weekdays != undefined )
	{
		if(weekdays.indexOf(',') > -1) //If multiple weekdays are selected, make comma seperated list 
		{
	  		let weekdayarray = weekdays.split(',');
	  		for(let j =0; j < weekdayarray.length; j++)
	  		{
	  			weekdaylist += "'" + weekdayarray[j].toLowerCase() + "'" + ",";
	  		}

	  		weekdaylist = weekdaylist.substring(0,weekdaylist.length - 1);
	  		console.log("Weekdaylist : "  + weekdaylist);
		}
		else
		{
			weekdaylist = "'" + weekdays.toLowerCase() + "'";
		}
		query2 = "and LOWER(V.DayPeriod) IN ("+ weekdaylist + ")";
	}
	
	var query = query1+query2+query3+query4;
	logger.info("query in getQueryForTransactionsData", query);
	
	logger.info("End of getQueryForTransactionsData");
	
	return query;
}


/**
 * @swagger
 * /getAggregateFootfallData?startdate={startdate}&enddate={enddate}&day={day}&latitude={latitude}&longitude={longitude}:
 *   get:
 *     tags:
 *       -  Get aggregate data for Transactions.
 *     description: Returns aggregate data for Transactions from all liverpoolone stores, by passing parameter as start and end date in format yyyy-mm-dd, day of week and boundry.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: startdate
 *         description: From date 
 *         in: path
 *         required: true
 *         type: string
 *       - name: enddate
 *         description: end date 
 *         in: path
 *         required: true
 *         type: string
 *		- name: day
 *         description: week day 
 *         in: path
 *         required: true
 *         type: string
 *		- name: latitude
 *         description: Latitude 
 *         in: path
 *         required: true
 *         type: string
 *		- name: longitude
 *         description: Longitude 
 *         in: path
 *         required: true
 *         type: string
 *  
 *     responses:
 *       200:
 *         description: Twitter data
 *     schema:
 *           $ref: '#/definitions/getDataForTransactions'
 */

app.get("/api/getAggregateFootfallData",function(req,res){
    var startdate = req.query.startdate;
    var enddate = req.query.enddate;
	var days = req.query.days;
	var lats = req.query.latitude;
	var longs = req.query.longitude; 
	let error = { errormsg : "" };   
	var entity = "Footfall";

	logger.info("Start of getAggregateFootfallData");

	if(startdate == undefined || enddate == undefined)
    {
    	error.errormsg = "StartDate,EndDate parameters are mandatory.  eg : /api/getAggregateFootfallData?startdate=2016-10-01&enddate=2016-12-31";
    	res.send(error);
    }
	
	var reqobj = {"startdate" : startdate, "enddate" : enddate, "days" : days, "latitude":lats, "longitude":longs }
	var q = getQueryForFootfallData(reqobj);

	parseRequest(req,res,entity,q);
	     
})


function getQueryForFootfallData(robj)
{
    var fromdate = robj.startdate;
    var todate = robj.enddate;
    var latitude = robj.latitude;
	var longitude = robj.longitude;
	var weekdays = robj.days;
	var query2 = "";
	var query3 =")";
	var query4 = " S inner join `dfs`.`default`.`MasterStoreData` M on S.StoreName=M.StoreName and S.Zone=M.Zone group by S.StoreName,S.Zone,S.DayPeriod, M.Latitude,M.Longitude,M.Id";
	let weekdaylist="";
	
	logger.info("Start of getQueryForFootfallData");
    
	var query1 = "SELECT SUM(CAST(S.FootfallValue as int)) as totalcount,S.StoreName as storename,S.Zone,M.Id,M.Latitude,M.Longitude,S.DayPeriod from (Select * from `dfs`.`default`.`StorefootfallView` V where V.Period between '" + fromdate + "' and '"+ todate + "'";    	 
	if(weekdays != undefined )
	{
		if(weekdays.indexOf(',') > -1) //If multiple weekdays are selected, make comma seperated list 
		{
	  		let weekdayarray = weekdays.split(',');
	  		for(let j =0; j < weekdayarray.length; j++)
	  		{
	  			weekdaylist += "'" + weekdayarray[j].toLowerCase() + "'" + ",";
	  		}

	  		weekdaylist = weekdaylist.substring(0,weekdaylist.length - 1);
	  		console.log("Weekdaylist : "  + weekdaylist);
		}
		else
		{
			weekdaylist = "'" + weekdays.toLowerCase() + "'";
		}
		query2 = "and LOWER(V.DayPeriod) IN ("+ weekdaylist + ")";
	}
	
	var query = query1+query2+query3+query4;
	logger.info("query in getQueryForFootfallData", query);
	
	logger.info("End of getQueryForFootfallData");
	
	return query;
}

//This is common function which will be called for parsing request from all endpoints
function parseRequest(req,res,entity,q)
{
	var dataobj = {};
	var dataarray = [];
	
	console.log("Start parseRequest for getAggregate"+entity+"Data");

	var reqoptions = {
		uri :url,
		headers:{'Content-Type':'application/json'},
		method : "POST",
		body: JSON.stringify({queryType : 'SQL', query : q})        	    
	};
        
		request(reqoptions, function(err, response, data){

               logger.info("Processing  request for getAggregate"+entity+"Data");

               if(err)

               {

                logger.error("Error: " + err);

               }
               if (!err && response.statusCode ==200){
                   var obj = JSON.parse(data);
                   for(let p =0; p < obj.rows.length; p++)

                    {

                      console.log(obj.rows[p]);

                        var totalcount = obj.rows[p].totalcount;		
						var storename = obj.rows[p].storename;
						var zone = obj.rows[p].Zone;
						var lat = obj.rows[p].Latitude;
						var lon = obj.rows[p].Longitude;
						var id = obj.rows[p].Id;
						var dayPeriod = obj.rows[p].DayPeriod;
						
						var cordinatearray = [];
						cordinatearray.push(lon);
						cordinatearray.push(lat);
		
						dataarray.push({
                             "pr" : { "p1" : totalcount , "p2" : storename , "p3" : zone, "p4" : id, "p5" : dayPeriod} , 
                             "ge" : { "lo" : cordinatearray[1] , "la" : cordinatearray[0] }});

                    }

					dataobj.type = "FeatureCollection";

                    dataobj.features = dataarray;

                    console.log(JSON.stringify(dataobj));

                    res.send(dataobj); 

                }else{
                        var errorobj = {"error" : "Unexpected Error"};
                        res.send(errorobj);
						logger.info("Error for getAggregate"+entity+"Data");
                 } 
				logger.info("End for getAggregate"+entity+"Data");
        });
        console.log("End parseRequest for getAggregate"+entity+"Data");
}

}