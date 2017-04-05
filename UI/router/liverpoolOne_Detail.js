
module.exports.getLiverpoolOneDetail = function(req,res,logger){

var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
var moment = require('moment');

	let storeid = req.query.storeid;
    let fromdate = req.query.fromdate;
    let todate = req.query.todate;
    let entity = req.query.entity; //Sales/Transactions/Footfall
    let weekdays = req.query.weekdays;  //optional
    let aggregateby = req.query.aggregateby; //optional (default is Weekly)
    let error = { errormsg : "" };
   
   	aggregateby = (aggregateby == undefined) ? "weekly" : aggregateby;

    if(fromdate == undefined || todate == undefined || storeid == undefined || entity == undefined)
    {
    	error.errormsg = "FromDate,ToDate,Storeid,Entity parameters are mandatory.  eg : /api/getLiverpoolStoreSalesDetail?fromdate=2016-10-01&todate=2016-12-31&storeid=11&entity=sales";
    	res.send(error);
    }

    let queryobj = { weekdays : weekdays, startdate : fromdate, enddate : todate,storeid : storeid};

    entity = entity.toLowerCase();
    console.log(entity);
    let q = buildDrillQuery(queryobj,entity,aggregateby);

    let dataarray = [];
    let dataobj = {};
        
	let reqoptions = {
	      uri :url,
	      headers:{'Content-Type':'application/json'},
	      method : "POST",
	      body: JSON.stringify({queryType : 'SQL', query : q})
	      
	  };

	  //For daily aggregate by 
	if(aggregateby.toLowerCase() == "daily")
	{
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
	}
	else if(aggregateby.toLowerCase() == "weekly")
	{
		let currentyear = moment(fromdate).year();
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
				if(obj.rows.length > 0)
				{
					let storename = obj.rows[0].storename;
					let zone = obj.rows[0].Zone;

					let weeklist = [];

		              for(let n =0; n < obj.rows.length; n++)
		              {
		              	weeklist.push({
		              		"wk" : obj.rows[n].WeekPeriod , "pc" : obj.rows[n].pc , "cc" : obj.rows[n].cc
		              	});
		              	
		              }
		              console.log(weeklist);
		      
		              dataobj.p1 = storename;
		              dataobj.p2 = zone;
		              dataobj.p3 = currentyear;
	                  dataobj.weekdata = weeklist;
				}
	              
          
                  //console.log(JSON.stringify(dataobj));
                  res.send(dataobj); 
          	  }
          	});

	}


//Function to build drill query based on parameters passed
function buildDrillQuery(reqobj,entity,aggregateby)
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


if(aggregateby.toLowerCase() == "daily")
{
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

 if(aggregateby.toLowerCase() == 'weekly')
{
//Aggregare by week for each store value
		 let currentstartdate = startdate;
		 let currentenddate = enddate;
		 let previousstartdate = moment(currentstartdate).subtract(1,'years').format('YYYY-MM-DD');
		 let previousenddate  =  moment(currentenddate).subtract(1,'years').format('YYYY-MM-DD');
		 let currentyear = moment(currentstartdate).year();
		 let previousyear = moment(previousstartdate).year();

	if(entity == "sales")
	{
		 
		 let query = "";
		 let query1 = " SELECT SUM(case when YearPeriod='" + previousyear + "' then totalcount else 0 end ) as pc," ;
		 let query2 = " SUM(case when YearPeriod='" + currentyear + "' then totalcount else 0 end) as cc,storename,Zone,WeekPeriod from ";
		 let query3 = " (SELECT SUM(CAST(S.SalesValue as int)) as totalcount,S.StoreName as storename,S.Zone,S.YearPeriod,S.WeekPeriod from " ;
		 let query4 = " (Select * from `dfs`.`default`.`SalesView` V where  V.Period between '" + previousstartdate + "' and '" + previousenddate + "' "; 
		 let query5 = " and LOWER(SUBSTR(DayPeriod,1,3)) IN( " + weekdaylist + ") ";
		 let query6 = " union " ;
		 let query7 = " Select * from `dfs`.`default`.`SalesView` SV where SV.Period between '" + currentstartdate + "' and '" + currentenddate + "' ";
		 let query8 = " and LOWER(SUBSTR(DayPeriod,1,3)) IN( " + weekdaylist + ") ";
		 let query9 = ")  S inner join `dfs`.`default`.`MasterStoreData` M " ;
		 let query10 = " on S.StoreName=M.StoreName and S.Zone=M.Zone and M.Id ='" + storeid + "' group by S.StoreName,S.Zone, M.Latitude,M.Longitude,S.YearPeriod,S.WeekPeriod ) group by storename,Zone,WeekPeriod order by CAST(WeekPeriod as int)";

		 if(weekdays != undefined)
			{
			   query = query1 + query2 + query3 + query4 + query5 + query6 + query7 + query8 + query9 + query10;
			}
			else
			{
			    query = query1 + query2  + query3 + query4  + query6 + query7 + query9 + query10;
			}
			
		  console.log(query);
		 return query;
	}

	if(entity == "transactions")
	{
		 let query = "";
		 let query1 = " SELECT SUM(case when YearPeriod='" + previousyear + "' then totalcount else 0 end ) as pc," ;
		 let query2 = " SUM(case when YearPeriod='" + currentyear + "' then totalcount else 0 end) as cc,storename,Zone,WeekPeriod from ";
		 let query3 = " (SELECT SUM(CAST(S.TransactionsValue as int)) as totalcount,S.StoreName as storename,S.Zone,S.YearPeriod,S.WeekPeriod from " ;
		 let query4 = " (Select * from `dfs`.`default`.`TransactionsView` V where  V.Period between '" + previousstartdate + "' and '" + previousenddate + "' "; 
		 let query5 = " and LOWER(SUBSTR(DayPeriod,1,3)) IN( " + weekdaylist + ") ";
		 let query6 = " union ";
		 let query7 = " Select * from `dfs`.`default`.`TransactionsView` SV where SV.Period between '" + currentstartdate + "' and '" + currentenddate + "' "; 
		 let query8 = " and LOWER(SUBSTR(DayPeriod,1,3)) IN( " + weekdaylist + ") ";
		 let query9 = ")  S inner join `dfs`.`default`.`MasterStoreData` M ";
		 let query10 = " on S.StoreName=M.StoreName and S.Zone=M.Zone and M.Id ='" + storeid + "' group by S.StoreName,S.Zone, M.Latitude,M.Longitude,S.YearPeriod,S.WeekPeriod ) group by storename,Zone,WeekPeriod order by CAST(WeekPeriod as int)";

		 if(weekdays != undefined)
			{
			   query = query1 + query2 + query3 + query4 + query5 + query6 + query7 + query8 + query9 + query10;
			}
			else
			{
			    query = query1 + query2  + query3 + query4  + query6 + query7 + query9 + query10;
			}
			
		  console.log(query);
		 return query;
	}

	if(entity == "footfall")
	{
		 let query = "";
		 let query1 = " SELECT SUM(case when YearPeriod='" + previousyear + "' then totalcount else 0 end ) as pc," ;
		 let query2 = " SUM(case when YearPeriod='" + currentyear + "' then totalcount else 0 end) as cc,storename,Zone,WeekPeriod from ";
		 let query3 = " (SELECT SUM(CAST(S.FootfallValue as int)) as totalcount,S.StoreName as storename,S.Zone,S.YearPeriod,S.WeekPeriod from " ;
		 let query4 = " (Select * from `dfs`.`default`.`StorefootfallView` V where  V.Period between '" + previousstartdate + "' and '" + previousenddate + "' ";
		 let query5 = " and LOWER(SUBSTR(DayPeriod,1,3)) IN( " + weekdaylist + ") ";
		 let query6 = " union ";
		 let query7 = " Select * from `dfs`.`default`.`StorefootfallView` SV where SV.Period between '" + currentstartdate + "' and '" + currentenddate + "' ";
		 let query8 = " and LOWER(SUBSTR(DayPeriod,1,3)) IN( " + weekdaylist + ") ";
		 let query9 = ")  S inner join `dfs`.`default`.`MasterStoreData` M ";
		 let query10 = " on S.StoreName=M.StoreName and S.Zone=M.Zone and M.Id ='" + storeid + "' group by S.StoreName,S.Zone, M.Latitude,M.Longitude,S.YearPeriod,S.WeekPeriod ) group by storename,Zone,WeekPeriod order by CAST(WeekPeriod as int)";

		 if(weekdays != undefined)
			{
			   query = query1 + query2 + query3 + query4 + query5 + query6 + query7 + query8 + query9 + query10;
			}
			else
			{
			    query = query1 + query2  + query3 + query4  + query6 + query7 + query9 + query10;
			}
			
		  console.log(query);
		 return query;

	}
}

}



}


