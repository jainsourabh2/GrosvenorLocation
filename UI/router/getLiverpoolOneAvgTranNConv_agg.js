      module.exports.getliverpoolOneAvgTranNConvRate_agg = function(req,res,logger){
//
      var request = require("request");
      var moment = require('moment');
      var asyncobj = require("async");

      //let serverIP="10.80.1.4";
      //let port="3000";
      let serverIP="localhost";
      let port="3040";
      let fromdate = req.query.startdate;
      let todate = req.query.enddate;
      let days = req.query.days;
      let lats = req.query.latitude;
      let longs = req.query.longitude; 
      let error = { errormsg : "" };   
      let dataobj = {};
      let resultArr=new Array();
          
     
      if(fromdate == undefined || todate == undefined)
      {
           error.errormsg = "StartDate,EndDate parameters are mandatory.  eg : /api/getAggrConvRateWithAvgTranData?startdate=2016-10-01&enddate=2016-12-31";
           res.send(error);
      }

      let aggSalesAPI = "";
      let aggTranAPI = "";
      let aggFFAPI = "";

      if(days == undefined )
      {
        aggSalesAPI = "http://"+serverIP+":"+port+"/api/getAggregateSalesData?startdate="+fromdate+"&enddate="+todate;
        aggTranAPI = "http://"+serverIP+":"+port+"/api/getAggregateTransactionsData?startdate="+fromdate+"&enddate="+todate;
        aggFFAPI =  "http://"+serverIP+":"+port+"/api/getAggregateFootfallData?startdate="+fromdate+"&enddate="+todate;
      }else
      {
        aggSalesAPI= "http://"+serverIP+":"+port+"/api/getAggregateSalesData?startdate="+fromdate+"&enddate="+todate+"&days="+days;
        aggTranAPI = "http://"+serverIP+":"+port+"/api/getAggregateTransactionsData?startdate="+fromdate+"&enddate="+todate+"&days="+days;
        aggFFAPI =  "http://"+serverIP+":"+port+"/api/getAggregateFootfallData?startdate="+fromdate+"&enddate="+todate+"&days="+days;

      }
      console.log("aggSalesAPI is ",aggSalesAPI);
      console.log("aggTranAPI is ",aggTranAPI);
      console.log("aggFFAPI is ",aggFFAPI);

      
      asyncobj.parallel([
              function(callback) {
                  //Request call to Transaction API
                  console.log("Transaction API getting called");
                  let reqoptions = {
                    uri : aggTranAPI,
                    method : "GET"
                };
                
                request(reqoptions, function(err, response, data){
                //console.log(response + " " + err + " " + data);
                    if(err)
                    {
                        console.log("Err: " + err);
                    }
                    if (!err && response.statusCode ==200){
                        console.log("Inside Transaction API ");
                        let objTran = JSON.parse(data);
                        callback(null,objTran);
                        console.log("Transaction API done");
                    }
                });
                  
              },
              function(callback) {
                 // Request call to FF API.
                  console.log("Fooftall API getting called");
                  let reqoptions = {
                    uri : aggFFAPI,
                    method : "GET"
                };
                
                request(reqoptions, function(err, response, data){
                //console.log(response + " " + err + " " + data);
                
                    if(err)
                    {
                        console.log("Err: " + err);
                    }
                    if (!err && response.statusCode ==200){
                        console.log("Inside Fooftall API");
                        let objFF = JSON.parse(data);
                        callback(null,objFF);
                        console.log("Fooftall API done");
                    }
                });
                 
              },

              function(callback) {
                 // Request call to FF API.
                  console.log("Sales API getting called");
                  let reqoptions = {
                    uri : aggSalesAPI,
                    method : "GET"
                };
                
                request(reqoptions, function(err, response, data){
                //console.log(response + " " + err + " " + data);
                
                    if(err)
                    {
                        console.log("Err: " + err);
                    }
                    if (!err && response.statusCode ==200){
                        console.log("Inside Sales API");
                        let objSales = JSON.parse(data);
                        callback(null,objSales);
                        console.log("Sales API done");
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
               
               let transactions = results[0];
               let footfall = results[1];
               let sales = results[2];

               console.log("transactions is ",transactions.features[0]);
               console.log("footfall is ",footfall.features[0]);
               console.log("sales is ",sales.features[0]);

               let tranlen = transactions.features.length;
               let fflen = footfall.features.length;
               let saleslen = sales.features.length;

               for(let i=0; i<tranlen; i++){

                let resultObj={};

                let curTranAgg = transactions.features[i].pr.p1;
                let PrvTranAgg = transactions.features[i].pr.p2;
                
                let curFFAgg = footfall.features[i].pr.p1;
                let PrvFFAgg = footfall.features[i].pr.p2;
                                
                let curSalesAgg = sales.features[i].pr.p1;
                let PrvSalesAgg = sales.features[i].pr.p2;

                let curConvRate = curFFAgg/curTranAgg;
                if (!isFinite(parseFloat(curConvRate).toFixed(2)))
                {
                   curConvRate = "0";
                   //console.log("curConvRate is nan ",transactions.features[i].pr.p3);
                }
                //console.log("curConvRate is ",curConvRate);

                let prvConvRate = PrvFFAgg/PrvTranAgg;
                if (!isFinite(parseFloat(prvConvRate).toFixed(2)))
                {
                   prvConvRate = "0";
                   //console.log("prvConvRate is nan ",transactions.features[i].pr.p3);
                }
                //console.log("prvConvRate is ",prvConvRate);

                let curAvgTran = curSalesAgg/curTranAgg;
                if (!isFinite(parseFloat(curAvgTran).toFixed(2)))
                {
                   curAvgTran = "0";
                   //console.log("curAvgSales is nan ",transactions.features[i].pr.p3);
                }
                //console.log("curAvgSales is ",curAvgSales);

                let prvAvgTran = PrvSalesAgg/PrvTranAgg;
                 if (!isFinite(parseFloat(prvAvgTran).toFixed(2)))
                {
                   prvAvgTran = "0";
                   //console.log("prvAvgSales is nan ",transactions.features[i].pr.p3);
                }
                //console.log("prvAvgSales is ",prvAvgSales);

                resultObj.p1 = parseFloat(curConvRate).toFixed(2);
                resultObj.p2 = parseFloat(prvConvRate).toFixed(2);
                resultObj.p3 = parseFloat(curAvgTran).toFixed(2);
                resultObj.p4 = parseFloat(prvAvgTran).toFixed(2);
                resultObj.p5 = transactions.features[i].pr.p3;//storename
                resultObj.p6 = transactions.features[i].pr.p4;//zone
                resultObj.p7 = transactions.features[i].pr.p5;//id
                //resultObj.p8 = transactions.features[i].pr.p6;
                resultObj.lo = transactions.features[i].ge.lo;
                resultObj.la = transactions.features[i].ge.la;

                resultArr.push(resultObj);
               }
               dataobj.type = "FeatureCollection";
               dataobj.features = resultArr;
               console.log(JSON.stringify(resultArr));
               res.send(dataobj); 
          });



      }


