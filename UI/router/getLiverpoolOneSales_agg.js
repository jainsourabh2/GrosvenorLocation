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
  
  let fromdate = robj.startdate;
  let todate = robj.enddate;
  let latitude = robj.latitude;
  let longitude = robj.longitude;
  let weekdays = robj.days;
  let weekdaylist="";

  let prevyearstartdate = moment(fromdate).subtract(1,'years').format('YYYY-MM-DD');
  let prevyearenddate = moment(todate).subtract(1,'years').format('YYYY-MM-DD');

  let check = moment(fromdate, 'YYYY/MM/DD');
  let curyear  = check.format('YYYY');
  console.log("current year ",curyear);
  let prevyear = check.subtract(1,'years').format('YYYY');
  console.log("prevyear year ",prevyear);

  let query1 = "SELECT sum(case when YearPeriod = '" + curyear + "' then CAST(totalcount as int) else 0 end) as Cur,sum(case when YearPeriod = '"+prevyear+"' then CAST(totalcount as int) else 0 end) as  Prev,storename,Zone,Latitude,Longitude,Id";
  let query1Period=""
  let query1Next = " from (SELECT SUM(CAST(S.SalesValue as int)) as totalcount,S.StoreName as storename,S.Zone,M.Latitude,M.Longitude,S.YearPeriod,M.Id";
  let query1NextPeriod=""

  let query2 = " from (Select * from `dfs`.`default`.`SalesView` V where  V.Period between '"+fromdate+"' and '"+todate+"'";
  let query2Period ="";
  let query3 = " union Select * from `dfs`.`default`.`SalesView` SV where SV.Period between '"+prevyearstartdate+"' and '"+prevyearenddate+"'";
  let query3Period="";
  let query3Next=")";

  let query4 ="S inner join `dfs`.`default`.`MasterStoreData` M on S.StoreName=M.StoreName and S.Zone=M.Zone group by S.StoreName,S.Zone, M.Latitude,M.Longitude,S.YearPeriod,M.Id";
  let query4Period = "";
  let query5 = " order by storename,zone) group by Zone,Latitude,Longitude,storename,Id";
  let query5Period="";

  logger.info("Start of getQueryForSalesData");

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
    
    //query1Period = ",DayPeriod";
    //query1NextPeriod = ",S.DayPeriod";
    query2Period = " and LOWER(SUBSTR(DayPeriod,1,3)) IN ("+ weekdaylist + ")";
    query3Period = " and LOWER(SUBSTR(DayPeriod,1,3)) IN ("+ weekdaylist + ")";
    //query4Period = ",S.DayPeriod";
    //query5Period = ",DayPeriod";

  }
  
  var query = query1+query1Period+query1Next+query1NextPeriod+query2+query2Period+query3+query3Period+query3Next+query4+query4Period+query5+query5Period;
  
  logger.info("query in getQueryForSalesData", query);
 
  logger.info("End of getQueryForSalesData");
  
  return query;
  
}


}


