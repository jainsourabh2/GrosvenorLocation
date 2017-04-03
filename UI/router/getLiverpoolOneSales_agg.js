module.exports.getliverpoolOneSales_agg = function(req,res,logger){

var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
var moment = require('moment');
var parser = require('./parseRequest.js');

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
      
  parser.parseRequest(req,res,entity,q);
  
function getQueryForSalesData(robj)
{
    var fromdate = robj.startdate;
    var todate = robj.enddate;
    var latitude = robj.latitude;
  var longitude = robj.longitude;
  var weekdays = robj.days;
  var query2 = "";
  var query3 =")";
  var query4 = " S inner join `dfs`.`default`.`MasterStoreData` M on S.StoreName=M.StoreName and S.Zone=M.Zone group by S.StoreName,S.Zone, ";
  var quer4Period="";
  var query4remain= "M.Latitude,M.Longitude,M.Id";
  let weekdaylist="";

  logger.info("Start of getQueryForSalesData");
    
  var query1 = "SELECT SUM(CAST(S.SalesValue as int)) as totalcount,S.StoreName as storename,S.Zone,M.Id,M.Latitude,M.Longitude";
  var query1Period=""
  var query1remain = " from (Select * from `dfs`.`default`.`SalesView` V where V.Period between '" + fromdate + "' and '"+ todate + "'";

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
    
    query2 = "and LOWER(SUBSTR(DayPeriod,1,3)) IN ("+ weekdaylist + ")";
    query1Period =", S.DayPeriod ";
    quer4Period= "S.DayPeriod,";
  }
  
  var query = query1+query1Period+query1remain+query2+query3+query4+quer4Period+query4remain;
  logger.info("query in getQueryForSalesData", query);
  
  logger.info("End of getQueryForSalesData");
  
  return query;
}



}


