
module.exports.getSummaryforStores = function(req,res,logger){

var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
var moment = require('moment');
var asyncobj = require("async");

	let store_id = req.query.storeid;
	let fromdate = req.query.fromdate;
	let todate = req.query.todate;
    let entity = req.query.entity; //Sales/Transactions/Footfall
    let error = { errormsg : "" };
    
    if(store_id == undefined || entity == undefined || fromdate == undefined || todate == undefined)
    {
    	error.errormsg = "storeid,entity,fromdate and todate parameters are mandatory.  eg : /api/getSalesSummary?storeid=11&entity=sales&fromdate=2016-01-01&todate=2016-12-31";
    	res.send(error);
    }

	let prevyearstartdate = moment(fromdate).subtract(1,'years').format('YYYY-MM-DD');
  	let prevyearenddate = moment(todate).subtract(1,'years').format('YYYY-MM-DD');

  	console.log("Current year startdate : " + fromdate );
  	console.log("Current year enddate : " + todate );

  	console.log("previous year startdate : " + prevyearstartdate );
  	console.log("previous year enddate : " + prevyearenddate );


    entity = entity.toLowerCase();
    //console.log(entity);
   
    let q = buildDrillQuery(store_id,entity);

    let agg_curr_all_store = q[0];
	let agg_prev_all_store = q[1];
	let agg_curr_curr_store = q[2];
	let agg_prev_curr_store = q[3];
	let agg_month = q[4];

    let dataarray = [];
    let dataobj = {};
        
    asyncobj.parallel([
    			function(callback) {

    				let reqoptions = {
					      uri :url,
					      headers:{'Content-Type':'application/json'},
					      method : "POST",
					      body: JSON.stringify({queryType : 'SQL', query : agg_curr_all_store})
			      
			  			};

	 
				  request(reqoptions, function(err, response, data){
			              //console.log(response + " " + err + " " + data);
				              if(err)
				              {
				                  console.log("Err: " + err);
				              }

				              if (!err && response.statusCode ==200)
				              {
				                  
					              let objAllAgg_curr = JSON.parse(data);
					             // console.log(objAllAgg_curr);
					              callback(null,objAllAgg_curr);
				                   
				          	  }
			        	});

    			},
    			function(callback)
    			{
    				let reqoptions = {
					      uri :url,
					      headers:{'Content-Type':'application/json'},
					      method : "POST",
					      body: JSON.stringify({queryType : 'SQL', query : agg_prev_all_store})
			      
			  			};

	 
				  request(reqoptions, function(err, response, data){
			              //console.log(response + " " + err + " " + data);
				              if(err)
				              {
				                  console.log("Err: " + err);
				              }

				              if (!err && response.statusCode ==200)
				              {
				                  
					              let objAllAgg_prev = JSON.parse(data);
					              //console.log(objAllAgg_prev);
					              callback(null,objAllAgg_prev);
				                  
				          	  }
			        	});
    			},
    			function(callback)
    			{
    				let reqoptions = {
					      uri :url,
					      headers:{'Content-Type':'application/json'},
					      method : "POST",
					      body: JSON.stringify({queryType : 'SQL', query : agg_curr_curr_store})
			      
			  			};

	 
				  request(reqoptions, function(err, response, data){
			              //console.log(response + " " + err + " " + data);
				              if(err)
				              {
				                  console.log("Err: " + err);
				              }

				              if (!err && response.statusCode ==200)
				              {
				                  
					              let objCurrAgg_curr = JSON.parse(data);
					              //console.log(objCurrAgg_curr);
					              callback(null,objCurrAgg_curr);
				                  
				          	  }
			        	});

    			},
    			function(callback)
    			{
    				let reqoptions = {
					      uri :url,
					      headers:{'Content-Type':'application/json'},
					      method : "POST",
					      body: JSON.stringify({queryType : 'SQL', query : agg_prev_curr_store})
			      
			  			};

	 
				  request(reqoptions, function(err, response, data){
			              //console.log(response + " " + err + " " + data);
				              if(err)
				              {
				                  console.log("Err: " + err);
				              }

				              if (!err && response.statusCode ==200)
				              {
				                  
					              let objCurrAgg_prev = JSON.parse(data);
					             // console.log(objCurrAgg_prev);
					              callback(null,objCurrAgg_prev);
				                  
				          	  }
			        	});
    			},
    			function(callback)
    			{

		    		let reqoptions = {
					      uri :url,
					      headers:{'Content-Type':'application/json'},
					      method : "POST",
					      body: JSON.stringify({queryType : 'SQL', query : agg_month})
			      
			  			};

	 
				  request(reqoptions, function(err, response, data){
			              //console.log(response + " " + err + " " + data);
				              if(err)
				              {
				                  console.log("Err: " + err);
				              }

				              if (!err && response.statusCode ==200)
				              {
				                  
					              let objMonthAgg = JSON.parse(data);
					             // console.log(objMonthAgg);
					              callback(null,objMonthAgg);
				                 
				          	  }
			        	});

			    }

    	],
          // callback
          function(err, results) {

          	 if(err)
              {
                  console.log("Error in Final callback : " +  err );
                  let errorobj = {"error" : "Unexpected Error"};
                  res.send(errorobj);
              }
               
               let totalstore_curr = results[0];
               let totalstore_prev = results[1];
               let currentstore_curr = results[2];
               let currentstore_prev = results[3];
               let month_agg = results[4];

              /* console.log(totalstore_curr);
               console.log(totalstore_prev);
               console.log(currentstore_curr);
               console.log(currentstore_prev);
               console.log(month_agg); */

                dataobj.csv = currentstore_curr.rows[0].TotalValue; //current date range aggregated store sales value
				dataobj.cav = totalstore_curr.rows[0].TotalValue; //current date range aggregated all store sales value
				dataobj.psv = currentstore_prev.rows[0].TotalValue; //previous date range aggregated store sales value
				dataobj.pav = totalstore_prev.rows[0].TotalValue; //previous date range aggregated all store sales value

				dataobj.csjan = month_agg.rows[0].StoreValueCurrentJan;
				dataobj.csfeb = month_agg.rows[0].StoreValueCurrentFeb;
				dataobj.csmar = month_agg.rows[0].StoreValueCurrentMar;
				dataobj.csapr = month_agg.rows[0].StoreValueCurrentApr;
				dataobj.csmay = month_agg.rows[0].StoreValueCurrentMay;
				dataobj.csjun = month_agg.rows[0].StoreValueCurrentJun;
				dataobj.csjul = month_agg.rows[0].StoreValueCurrentJul;
				dataobj.csaug = month_agg.rows[0].StoreValueCurrentAug;
				dataobj.cssep = month_agg.rows[0].StoreValueCurrentSep;
				dataobj.csoct = month_agg.rows[0].StoreValueCurrentOct;
				dataobj.csnov = month_agg.rows[0].StoreValueCurrentNov;
				dataobj.csdec = month_agg.rows[0].StoreValueCurrentDec;

				dataobj.asjan = month_agg.rows[0].TotalValueCurrentJan;
				dataobj.asfeb = month_agg.rows[0].TotalValueCurrentFeb;
				dataobj.asmar = month_agg.rows[0].TotalValueCurrentMar;
				dataobj.asapr = month_agg.rows[0].TotalValueCurrentApr;
				dataobj.asmay = month_agg.rows[0].TotalValueCurrentMay;
				dataobj.asjun = month_agg.rows[0].TotalValueCurrentJun;
				dataobj.asjul = month_agg.rows[0].TotalValueCurrentJul;
				dataobj.asaug = month_agg.rows[0].TotalValueCurrentAug;
				dataobj.assep = month_agg.rows[0].TotalValueCurrentSep;
				dataobj.asoct = month_agg.rows[0].TotalValueCurrentOct;
				dataobj.asnov = month_agg.rows[0].TotalValueCurrentNov;
				dataobj.asdec = month_agg.rows[0].TotalValueCurrentDec;


				//calculate variance 
					let variance = (100 * (dataobj.csv - dataobj.psv ))/dataobj.csv;

					if (!isFinite(parseFloat(variance).toFixed(2))){
			              	variance = 0.00;  
			          }
			           else {
			            	variance = parseFloat(variance).toFixed(2);
			          }

			        dataobj.var = variance;

				console.log(dataobj);
				res.send(dataobj);

          });

	


//Function to build drill query based on parameters passed
function buildDrillQuery(sid,entity)
{
//Part of query build here - to aggregate by month and aggregation between dates will be fired parallely and
// will build single object.

/*
Sample Drill Query this function will construct -

SELECT 
MAX(CASE WHEN Period = 'January' then  CAST(SalesValue as int) end) as TotalSalesCurrentJan,
MIN(CASE WHEN Period = 'January' then  CAST(SalesValue as int) end) as StoreSalesCurrentJan,
MAX(CASE WHEN Period = 'February' then  CAST(SalesValue as int) end) as TotalSalesCurrentFeb,
MIN(CASE WHEN Period = 'February' then  CAST(SalesValue as int) end) as StoreSalesCurrentFeb,
MAX(CASE WHEN Period = 'March' then  CAST(SalesValue as int) end) as TotalSalesCurrentMar,
MIN(CASE WHEN Period = 'March' then  CAST(SalesValue as int) end) as StoreSalesCurrentMar,
MAX(CASE WHEN Period = 'April' then  CAST(SalesValue as int) end) as TotalSalesCurrentApr,
MIN(CASE WHEN Period = 'April' then  CAST(SalesValue as int) end) as StoreSalesCurrentApr,
MAX(CASE WHEN Period = 'May' then  CAST(SalesValue as int) end) as TotalSalesCurrentMay,
MIN(CASE WHEN Period = 'May' then  CAST(SalesValue as int) end) as StoreSalesCurrentMay,
MAX(CASE WHEN Period = 'June' then  CAST(SalesValue as int) end) as TotalSalesCurrentJun,
MIN(CASE WHEN Period = 'June' then  CAST(SalesValue as int) end) as StoreSalesCurrentJun,
MAX(CASE WHEN Period = 'July' then  CAST(SalesValue as int) end) as TotalSalesCurrentJul,
MIN(CASE WHEN Period = 'July' then  CAST(SalesValue as int) end) as StoreSalesCurrentJul,
MAX(CASE WHEN Period = 'August' then  CAST(SalesValue as int) end) as TotalSalesCurrentAug,
MIN(CASE WHEN Period = 'August' then  CAST(SalesValue as int) end) as StoreSalesCurrentAug,
MAX(CASE WHEN Period = 'September' then  CAST(SalesValue as int) end) as TotalSalesCurrentSep,
MIN(CASE WHEN Period = 'September' then  CAST(SalesValue as int) end) as StoreSalesCurrentSep,
MAX(CASE WHEN Period = 'October' then  CAST(SalesValue as int) end) as TotalSalesCurrentOct,
MIN(CASE WHEN Period = 'October' then  CAST(SalesValue as int) end) as StoreSalesCurrentOct,
MAX(CASE WHEN Period = 'November' then  CAST(SalesValue as int) end) as TotalSalesCurrentNov,
MIN(CASE WHEN Period = 'November' then  CAST(SalesValue as int) end) as StoreSalesCurrentNov,
MAX(CASE WHEN Period = 'December' then  CAST(SalesValue as int) end) as TotalSalesCurrentDec,
MIN(CASE WHEN Period = 'December' then  CAST(SalesValue as int) end) as StoreSalesCurrentDec
from (
SELECT SUM(CAST(SalesValue as Int)) as SalesValue,MonthPeriod as Period from `dfs`.`default`.`SalesView` 
where Period between '2016-01-01' and '2016-12-31' group by MonthPeriod union
SELECT SUM(CAST(SalesValue as Int)),MonthPeriod as Period from `dfs`.`default`.`SalesView` S 
inner join `dfs`.`default`.`MasterStoreData` M  on S.StoreName=M.StoreName and S.Zone=M.Zone and M.Id ='1' 
where Period between '2016-01-01' and '2016-12-31' group by MonthPeriod )


*/

//entity can be Sales
 let storeid = sid;

 // let currentyear = moment().year();
 // let previousyear = moment().subtract(1, 'y').format('YYYY');


if(entity == "sales")
{
	let query = [];
	let outer1 = " SELECT MAX(CASE WHEN Period = 'January' then  CAST(TotalValue as int) end) as TotalValueCurrentJan,";
	let outer2 = " MIN(CASE WHEN Period = 'January' then  CAST(TotalValue as int) end) as StoreValueCurrentJan,";
	let outer3 = " MAX(CASE WHEN Period = 'February' then  CAST(TotalValue as int) end) as TotalValueCurrentFeb,";
	let outer4 = " MIN(CASE WHEN Period = 'February' then  CAST(TotalValue as int) end) as StoreValueCurrentFeb,";
	let outer5 = " MAX(CASE WHEN Period = 'March' then  CAST(TotalValue as int) end) as TotalValueCurrentMar,";
	let outer6 = " MIN(CASE WHEN Period = 'March' then  CAST(TotalValue as int) end) as StoreValueCurrentMar,";
	let outer7 = " MAX(CASE WHEN Period = 'April' then  CAST(TotalValue as int) end) as TotalValueCurrentApr,";
	let outer8 = " MIN(CASE WHEN Period = 'April' then  CAST(TotalValue as int) end) as StoreValueCurrentApr,";
	let outer9 = " MAX(CASE WHEN Period = 'May' then  CAST(TotalValue as int) end) as TotalValueCurrentMay,";
	let outer10 = " MIN(CASE WHEN Period = 'May' then  CAST(TotalValue as int) end) as StoreValueCurrentMay,";
	let outer11 = " MAX(CASE WHEN Period = 'June' then  CAST(TotalValue as int) end) as TotalValueCurrentJun,";
	let outer12 = " MIN(CASE WHEN Period = 'June' then  CAST(TotalValue as int) end) as StoreValueCurrentJun,";
	let outer13 = " MAX(CASE WHEN Period = 'July' then  CAST(TotalValue as int) end) as TotalValueCurrentJul,";
	let outer14 = " MIN(CASE WHEN Period = 'July' then  CAST(TotalValue as int) end) as StoreValueCurrentJul,";
	let outer15 = " MAX(CASE WHEN Period = 'August' then  CAST(TotalValue as int) end) as TotalValueCurrentAug,";
	let outer16 = " MIN(CASE WHEN Period = 'August' then  CAST(TotalValue as int) end) as StoreValueCurrentAug,";
	let outer17 = " MAX(CASE WHEN Period = 'September' then  CAST(TotalValue as int) end) as TotalValueCurrentSep,";
	let outer18 = " MIN(CASE WHEN Period = 'September' then  CAST(TotalValue as int) end) as StoreValueCurrentSep,";
	let outer19 = " MAX(CASE WHEN Period = 'October' then  CAST(TotalValue as int) end) as TotalValueCurrentOct,";
	let outer20 = " MIN(CASE WHEN Period = 'October' then  CAST(TotalValue as int) end) as StoreValueCurrentOct,";
	let outer21 = " MAX(CASE WHEN Period = 'November' then  CAST(TotalValue as int) end) as TotalValueCurrentNov,";
	let outer22 = " MIN(CASE WHEN Period = 'November' then  CAST(TotalValue as int) end) as StoreValueCurrentNov,";
	let outer23 = " MAX(CASE WHEN Period = 'December' then  CAST(TotalValue as int) end) as TotalValueCurrentDec,";
	let outer24 = " MIN(CASE WHEN Period = 'December' then  CAST(TotalValue as int) end) as StoreValueCurrentDec from (";

	let query1 = " SELECT SUM(CAST(SalesValue as Int)) as TotalValue,MonthPeriod as Period from `dfs`.`default`.`SalesView`  " ;
	let query2 = " where Period between '" + fromdate + "' and '" + todate + "' group by MonthPeriod union ";
	let query3 = " SELECT SUM(CAST(SalesValue as Int)),MonthPeriod from `dfs`.`default`.`SalesView` S  ";
	let query4 = " inner join `dfs`.`default`.`MasterStoreData` M  on S.StoreName=M.StoreName ";
	let query5 =  " and S.Zone=M.Zone and M.Id ='" + storeid + "' where Period between '" + fromdate + "' and '" + todate + "' group by MonthPeriod )";
	
	query[0] = "SELECT SUM(CAST(SalesValue as Int)) as TotalValue from `dfs`.`default`.`SalesView` where Period between '" + fromdate + "' and '" + todate + "'";
	query[1] = "SELECT SUM(CAST(SalesValue as Int)) as TotalValue from `dfs`.`default`.`SalesView` where Period between '" + prevyearstartdate + "' and '" + prevyearenddate + "'";
	query[2] = "SELECT SUM(CAST(SalesValue as Int)) as TotalValue from `dfs`.`default`.`SalesView` S inner join `dfs`.`default`.`MasterStoreData` M  on S.StoreName=M.StoreName " + 
				" and S.Zone=M.Zone and M.Id ='" + store_id + "' where Period between '" + fromdate + "' and '" + todate + "'"; 
	query[3] = "SELECT SUM(CAST(SalesValue as Int)) as TotalValue from `dfs`.`default`.`SalesView` S inner join `dfs`.`default`.`MasterStoreData` M  on S.StoreName=M.StoreName " + 
				" and S.Zone=M.Zone and M.Id ='" + store_id + "' where Period between '" + prevyearstartdate + "' and '" + prevyearenddate + "'";

	query[4] = outer1 + outer2 + outer3 + outer4 + outer5 + outer6 + outer7 + outer8 + outer9 + outer10 + outer11 + outer12 + 
	outer13 + outer14 + outer15 + outer16 + outer17 + outer18 + outer19 + outer20 + outer21 + outer22 + outer23 + outer24 +
	 query1 + query2 + query3 + query4 + query5 ;

	//console.log(query);
	return query;
}

if(entity == "transactions")
{
	//Replace Sales with Transactions
	let query = [];
	let outer1 = " SELECT MAX(CASE WHEN Period = 'January' then  CAST(TotalValue as int) end) as TotalValueCurrentJan,";
	let outer2 = " MIN(CASE WHEN Period = 'January' then  CAST(TotalValue as int) end) as StoreValueCurrentJan,";
	let outer3 = " MAX(CASE WHEN Period = 'February' then  CAST(TotalValue as int) end) as TotalValueCurrentFeb,";
	let outer4 = " MIN(CASE WHEN Period = 'February' then  CAST(TotalValue as int) end) as StoreValueCurrentFeb,";
	let outer5 = " MAX(CASE WHEN Period = 'March' then  CAST(TotalValue as int) end) as TotalValueCurrentMar,";
	let outer6 = " MIN(CASE WHEN Period = 'March' then  CAST(TotalValue as int) end) as StoreValueCurrentMar,";
	let outer7 = " MAX(CASE WHEN Period = 'April' then  CAST(TotalValue as int) end) as TotalValueCurrentApr,";
	let outer8 = " MIN(CASE WHEN Period = 'April' then  CAST(TotalValue as int) end) as StoreValueCurrentApr,";
	let outer9 = " MAX(CASE WHEN Period = 'May' then  CAST(TotalValue as int) end) as TotalValueCurrentMay,";
	let outer10 = " MIN(CASE WHEN Period = 'May' then  CAST(TotalValue as int) end) as StoreValueCurrentMay,";
	let outer11 = " MAX(CASE WHEN Period = 'June' then  CAST(TotalValue as int) end) as TotalValueCurrentJun,";
	let outer12 = " MIN(CASE WHEN Period = 'June' then  CAST(TotalValue as int) end) as StoreValueCurrentJun,";
	let outer13 = " MAX(CASE WHEN Period = 'July' then  CAST(TotalValue as int) end) as TotalValueCurrentJul,";
	let outer14 = " MIN(CASE WHEN Period = 'July' then  CAST(TotalValue as int) end) as StoreValueCurrentJul,";
	let outer15 = " MAX(CASE WHEN Period = 'August' then  CAST(TotalValue as int) end) as TotalValueCurrentAug,";
	let outer16 = " MIN(CASE WHEN Period = 'August' then  CAST(TotalValue as int) end) as StoreValueCurrentAug,";
	let outer17 = " MAX(CASE WHEN Period = 'September' then  CAST(TotalValue as int) end) as TotalValueCurrentSep,";
	let outer18 = " MIN(CASE WHEN Period = 'September' then  CAST(TotalValue as int) end) as StoreValueCurrentSep,";
	let outer19 = " MAX(CASE WHEN Period = 'October' then  CAST(TotalValue as int) end) as TotalValueCurrentOct,";
	let outer20 = " MIN(CASE WHEN Period = 'October' then  CAST(TotalValue as int) end) as StoreValueCurrentOct,";
	let outer21 = " MAX(CASE WHEN Period = 'November' then  CAST(TotalValue as int) end) as TotalValueCurrentNov,";
	let outer22 = " MIN(CASE WHEN Period = 'November' then  CAST(TotalValue as int) end) as StoreValueCurrentNov,";
	let outer23 = " MAX(CASE WHEN Period = 'December' then  CAST(TotalValue as int) end) as TotalValueCurrentDec,";
	let outer24 = " MIN(CASE WHEN Period = 'December' then  CAST(TotalValue as int) end) as StoreValueCurrentDec from (";

	let query1 = " SELECT SUM(CAST(TransactionsValue as Int)) as TotalValue,MonthPeriod as Period from `dfs`.`default`.`TransactionsView`  " ;
	let query2 = " where Period between '" + fromdate + "' and '" + todate + "' group by MonthPeriod union ";
	let query3 = " SELECT SUM(CAST(TransactionsValue as Int)),MonthPeriod from `dfs`.`default`.`TransactionsView` S  ";
	let query4 = " inner join `dfs`.`default`.`MasterStoreData` M  on S.StoreName=M.StoreName ";
	let query5 =  " and S.Zone=M.Zone and M.Id ='" + storeid + "' where Period between '" + fromdate + "' and '" + todate + "' group by MonthPeriod )";
	
	query[0] = "SELECT SUM(CAST(TransactionsValue as Int)) as TotalValue from `dfs`.`default`.`TransactionsView` where Period between '" + fromdate + "' and '" + todate + "'";
	query[1] = "SELECT SUM(CAST(TransactionsValue as Int)) as TotalValue from `dfs`.`default`.`TransactionsView` where Period between '" + prevyearstartdate + "' and '" + prevyearenddate + "'";
	query[2] = "SELECT SUM(CAST(TransactionsValue as Int)) as TotalValue from `dfs`.`default`.`TransactionsView` S inner join `dfs`.`default`.`MasterStoreData` M  on S.StoreName=M.StoreName " + 
				" and S.Zone=M.Zone and M.Id ='" + store_id + "' where Period between '" + fromdate + "' and '" + todate + "'"; 
	query[3] = "SELECT SUM(CAST(TransactionsValue as Int)) as TotalValue from `dfs`.`default`.`TransactionsView` S inner join `dfs`.`default`.`MasterStoreData` M  on S.StoreName=M.StoreName " + 
				" and S.Zone=M.Zone and M.Id ='" + store_id + "' where Period between '" + prevyearstartdate + "' and '" + prevyearenddate + "'";

	query[4] = outer1 + outer2 + outer3 + outer4 + outer5 + outer6 + outer7 + outer8 + outer9 + outer10 + outer11 + outer12 + 
			outer13 + outer14 + outer15 + outer16 + outer17 + outer18 + outer19 + outer20 + outer21 + outer22 + outer23 + outer24 + 
			query1 + query2 + query3 + query4 + query5 ; 

	//console.log(query);
	return query;

}

if(entity == "footfall")
{
	let query = [];
	let outer1 = " SELECT MAX(CASE WHEN Period = 'January' then  CAST(TotalValue as int) end) as TotalValueCurrentJan,";
	let outer2 = " MIN(CASE WHEN Period = 'January' then  CAST(TotalValue as int) end) as StoreValueCurrentJan,";
	let outer3 = " MAX(CASE WHEN Period = 'February' then  CAST(TotalValue as int) end) as TotalValueCurrentFeb,";
	let outer4 = " MIN(CASE WHEN Period = 'February' then  CAST(TotalValue as int) end) as StoreValueCurrentFeb,";
	let outer5 = " MAX(CASE WHEN Period = 'March' then  CAST(TotalValue as int) end) as TotalValueCurrentMar,";
	let outer6 = " MIN(CASE WHEN Period = 'March' then  CAST(TotalValue as int) end) as StoreValueCurrentMar,";
	let outer7 = " MAX(CASE WHEN Period = 'April' then  CAST(TotalValue as int) end) as TotalValueCurrentApr,";
	let outer8 = " MIN(CASE WHEN Period = 'April' then  CAST(TotalValue as int) end) as StoreValueCurrentApr,";
	let outer9 = " MAX(CASE WHEN Period = 'May' then  CAST(TotalValue as int) end) as TotalValueCurrentMay,";
	let outer10 = " MIN(CASE WHEN Period = 'May' then  CAST(TotalValue as int) end) as StoreValueCurrentMay,";
	let outer11 = " MAX(CASE WHEN Period = 'June' then  CAST(TotalValue as int) end) as TotalValueCurrentJun,";
	let outer12 = " MIN(CASE WHEN Period = 'June' then  CAST(TotalValue as int) end) as StoreValueCurrentJun,";
	let outer13 = " MAX(CASE WHEN Period = 'July' then  CAST(TotalValue as int) end) as TotalValueCurrentJul,";
	let outer14 = " MIN(CASE WHEN Period = 'July' then  CAST(TotalValue as int) end) as StoreValueCurrentJul,";
	let outer15 = " MAX(CASE WHEN Period = 'August' then  CAST(TotalValue as int) end) as TotalValueCurrentAug,";
	let outer16 = " MIN(CASE WHEN Period = 'August' then  CAST(TotalValue as int) end) as StoreValueCurrentAug,";
	let outer17 = " MAX(CASE WHEN Period = 'September' then  CAST(TotalValue as int) end) as TotalValueCurrentSep,";
	let outer18 = " MIN(CASE WHEN Period = 'September' then  CAST(TotalValue as int) end) as StoreValueCurrentSep,";
	let outer19 = " MAX(CASE WHEN Period = 'October' then  CAST(TotalValue as int) end) as TotalValueCurrentOct,";
	let outer20 = " MIN(CASE WHEN Period = 'October' then  CAST(TotalValue as int) end) as StoreValueCurrentOct,";
	let outer21 = " MAX(CASE WHEN Period = 'November' then  CAST(TotalValue as int) end) as TotalValueCurrentNov,";
	let outer22 = " MIN(CASE WHEN Period = 'November' then  CAST(TotalValue as int) end) as StoreValueCurrentNov,";
	let outer23 = " MAX(CASE WHEN Period = 'December' then  CAST(TotalValue as int) end) as TotalValueCurrentDec,";
	let outer24 = " MIN(CASE WHEN Period = 'December' then  CAST(TotalValue as int) end) as StoreValueCurrentDec from (";

	let query1 = " SELECT SUM(CAST(FootfallValue as Int)) as TotalValue,MonthPeriod as Period from `dfs`.`default`.`StorefootfallView`  " ;
	let query2 = " where Period between '" + fromdate + "' and '" + todate + "' group by MonthPeriod union ";
	let query3 = " SELECT SUM(CAST(FootfallValue as Int)),MonthPeriod from `dfs`.`default`.`StorefootfallView` S  ";
	let query4 = " inner join `dfs`.`default`.`MasterStoreData` M  on S.StoreName=M.StoreName ";
	let query5 =  " and S.Zone=M.Zone and M.Id ='" + storeid + "' where Period between '" + fromdate + "' and '" + todate + "' group by MonthPeriod )";
	
	query[0] = "SELECT SUM(CAST(FootfallValue as Int)) as TotalValue from `dfs`.`default`.`StorefootfallView` where Period between '" + fromdate + "' and '" + todate + "'";
	query[1] = "SELECT SUM(CAST(FootfallValue as Int)) as TotalValue from `dfs`.`default`.`StorefootfallView` where Period between '" + prevyearstartdate + "' and '" + prevyearenddate + "'";
	query[2] = "SELECT SUM(CAST(FootfallValue as Int)) as TotalValue from `dfs`.`default`.`StorefootfallView` S inner join `dfs`.`default`.`MasterStoreData` M  on S.StoreName=M.StoreName " + 
				" and S.Zone=M.Zone and M.Id ='" + store_id + "' where Period between '" + fromdate + "' and '" + todate + "'"; 
	query[3] = "SELECT SUM(CAST(FootfallValue as Int)) as TotalValue from `dfs`.`default`.`StorefootfallView` S inner join `dfs`.`default`.`MasterStoreData` M  on S.StoreName=M.StoreName " + 
				" and S.Zone=M.Zone and M.Id ='" + store_id + "' where Period between '" + prevyearstartdate + "' and '" + prevyearenddate + "'";

	query[4] = outer1 + outer2 + outer3 + outer4 + outer5 + outer6 + outer7 + outer8 + outer9 + outer10 + outer11 + outer12 + 
			outer13 + outer14 + outer15 + outer16 + outer17 + outer18 + outer19 + outer20 + outer21 + outer22 + outer23 + outer24 + 
			query1 + query2 + query3 + query4 + query5 ; 

	//console.log(query);
	return query;

}



}



}


