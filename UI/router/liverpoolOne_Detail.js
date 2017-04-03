'use strict';
module.exports.getLiverpoolOneDetail = function(req,res,logger){

var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
var moment = require('moment');

	let storeid = req.query.storeid;
    let fromdate = req.query.fromdate;
    let todate = req.query.todate;
    let entity = req.query.entity; //Sales/Transactions/Footfall
    let weekdays = req.query.weekdays;  //optional
    let error = { errormsg : "" };
   

    if(fromdate == undefined || todate == undefined || storeid == undefined || entity == undefined)
    {
    	error.errormsg = "FromDate,ToDate,Storeid,Entity parameters are mandatory.  eg : /api/getLiverpoolStoreSalesDetail?fromdate=2016-10-01&todate=2016-12-31&storeid=11&entity=sales";
    	res.send(error);
    }

    let queryobj = { weekdays : weekdays, startdate : fromdate, enddate : todate,storeid : storeid};

    entity = entity.toLowerCase();
    console.log(entity);
    let q = buildDrillQuery(queryobj,entity);

    let dataarray = [];
    let dataobj = {};
        
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
                  console.log("Err: " + err);
              }

              if (!err && response.statusCode ==200)
              {
                  
	              var obj = JSON.parse(data);
	              //console.log(obj);
	              for(let n =0; n < obj.rows.length; n++)
	              {
	              	let salesvalue = obj.rows[n].totalvalue;
	              	let storename =  obj.rows[n].storename;
	              	let zone = obj.rows[n].zone;
	              	let period = obj.rows[n].period;
	              	let dayperiod = obj.rows[n].dayperiod;

	              	 dataarray.push({
                             "pr" : {"p1" : salesvalue,"p2" : storename, "p3" : zone, "p4" : period, "p5" : dayperiod }
                     });
	              }

	              dataobj.type = "FeatureCollection";
                  dataobj.features = dataarray;
          
                  //console.log(JSON.stringify(dataobj));
                  res.send(dataobj); 
          	  }
          	});


//Function to build drill query based on parameters passed
function buildDrillQuery(reqobj,entity)
{
/*
SELECT CAST(S.SalesValue as int) as SalesValue,S.StoreName as storename,S.Zone,S.Period,S.DayPeriod from 
(Select * from `dfs`.`default`.`SalesView` V where V.Period between '2016-05-05' and '2016-07-01' and DayPeriod 
IN('Friday','Saturday','Sunday'))  S inner join `dfs`.`default`.`MasterStoreData` M 
on S.StoreName=M.StoreName and S.Zone=M.Zone and M.Id = '1' 

*/

//entity can be Sales/Transactions/Footfall
let weekdays = reqobj.weekdays;
let startdate = reqobj.startdate;
let enddate = reqobj.enddate;
let storeid = reqobj.storeid;
let weekdaylist = "";

if(weekdays != undefined) //weekdays is optional parameter
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
}



if(entity == "sales")
{
	let query1 = " SELECT CAST(S.SalesValue as int) as totalvalue,S.StoreName as storename,S.Zone as zone,S.Period as period,S.DayPeriod as dayperiod from ";
	let query2 = " (Select * from `dfs`.`default`.`SalesView` V where V.Period between '" + startdate + "' and '" + enddate + "' ";
	let query3 =  " and LOWER(SUBSTR(DayPeriod,1,3)) IN( " + weekdaylist + ")" ;  // 'Friday','Saturday','Sunday'
	let query4 = " )  S inner join `dfs`.`default`.`MasterStoreData` M on S.StoreName=M.StoreName and S.Zone=M.Zone and M.Id = '" + storeid + "'";
	let query = "";

	if(weekdays != undefined)
	{
	   query = query1 + query2 + query3 + query4;
	}
	else
	{
	    query = query1 + query2 + query4;
	}
	
	console.log(query);
	return query;
}

if(entity == "transactions")
{

	let query1 = " SELECT CAST(S.TransactionsValue as int) as totalvalue,S.StoreName as storename,S.Zone as zone,S.Period as period,S.DayPeriod as dayperiod from ";
	let query2 = " (Select * from `dfs`.`default`.`TransactionsView` V where V.Period between '" + startdate + "' and '" + enddate + "' ";
	let query3 =  " and LOWER(SUBSTR(DayPeriod,1,3)) IN( " + weekdaylist + ")" ;  // 'Friday','Saturday','Sunday'
	let query4 = " )  S inner join `dfs`.`default`.`MasterStoreData` M on S.StoreName=M.StoreName and S.Zone=M.Zone and M.Id = '" + storeid + "'";
	let query = "";

	if(weekdays != undefined)
	{
	   query = query1 + query2 + query3 + query4;
	}
	else
	{
	    query = query1 + query2 + query4;
	}
	
	console.log(query);
	return query;

}

if(entity == "footfall")
{

	let query1 = " SELECT CAST(S.FootfallValue as int) as totalvalue,S.StoreName as storename,S.Zone as zone,S.Period as period,S.DayPeriod as dayperiod from ";
	let query2 = " (Select * from `dfs`.`default`.`StorefootfallView` V where V.Period between '" + startdate + "' and '" + enddate + "' ";
	let query3 =  " and LOWER(SUBSTR(DayPeriod,1,3)) IN( " + weekdaylist + ")" ;  // 'Friday','Saturday','Sunday'
	let query4 = " )  S inner join `dfs`.`default`.`MasterStoreData` M on S.StoreName=M.StoreName and S.Zone=M.Zone and M.Id = '" + storeid + "'";
	let query = "";

	if(weekdays != undefined)
	{
	   query = query1 + query2 + query3 + query4;
	}
	else
	{
	    query = query1 + query2 + query4;
	}
	
	console.log(query);
	return query;
}


}

}