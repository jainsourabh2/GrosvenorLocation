module.exports.getliverpoolOneRates = function(req,res,logger){

    let storeid = req.query.storeid;
    let fromdate = req.query.fromdate;
    let todate = req.query.todate;
    let weekdays = req.query.weekdays;  //optional(fri,sat)
    let aggregateby = req.query.aggregateby; //optional (default is Weekly)
    var asyncobj = require('async');
    var request = require("request");
    
   
   let detailTransAPI = "http://10.80.1.4:4000/api/getLiverpoolStoreDetail?fromdate=" + fromdate + "&todate=" + todate + "&storeid=" + storeid + "&entity=Transactions" ;
    let detailFFAPI =     "http://10.80.1.4:4000/api/getLiverpoolStoreDetail?fromdate=" + fromdate + "&todate=" + todate + "&storeid=" + storeid + "&entity=footfall";
    let detailSalesAPI = "http://10.80.1.4:4000/api/getLiverpoolStoreDetail?fromdate=" + fromdate+ "&todate=" + todate + "&storeid=" + storeid + "&entity=sales";
    
/*
    let detailTransAPI = "http://localhost:3000/api/getLiverpoolStoreDetail?fromdate=" + fromdate + "&todate=" + todate + "&storeid=" + storeid + "&entity=Transactions" ;
    let detailFFAPI =     "http://localhost:3000/api/getLiverpoolStoreDetail?fromdate=" + fromdate + "&todate=" + todate + "&storeid=" + storeid + "&entity=footfall";
    let detailSalesAPI = "http://localhost:3000/api/getLiverpoolStoreDetail?fromdate=" + fromdate+ "&todate=" + todate + "&storeid=" + storeid + "&entity=sales";
   */

    if(weekdays != undefined)
    {
      detailTransAPI += "&weekdays=" + weekdays;
      detailFFAPI +=  "&weekdays=" + weekdays;
      detailSalesAPI += "&weekdays=" + weekdays;
    }

    if(aggregateby != undefined)
    {
      detailTransAPI += "&aggregateby=" + aggregateby;
      detailFFAPI +=  "&aggregateby=" + aggregateby;
      detailSalesAPI += "&aggregateby=" + aggregateby;
    }
    logger.info("ConversionRateAPI : Calling Transaction,Sales,Footfall APIs parallely");
    asyncobj.parallel([
            function(callback) {
                //Request call to Transaction API
                //console.log("Transaction API getting called");
                 logger.info("Transaction API getting called");
                let reqoptions = {
                  uri : detailTransAPI,
                  method : "GET"
              };
              
              request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
                  if(err)
                  {
                      console.log("Err: " + err);
                  }
                  if (!err && response.statusCode ==200){
                      //console.log("Inside Transaction API ");
                      logger.info("Inside Transaction API");
                      let obj = JSON.parse(data);
                      callback(null,obj);
                      // console.log("Transaction API done");
                      logger.info("Transaction API done");
                  }
              });
                
            },
             function(callback) {
               // Request call to FF API.
               // console.log("Fooftall API getting called");
               logger.info("Fooftall API getting called");
                let reqoptions = {
                  uri : detailFFAPI,
                  method : "GET"
              };
              
              request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              
                  if(err)
                  {
                      console.log("Err: " + err);
                  }
                  if (!err && response.statusCode ==200){
                      //console.log("Inside Fooftall API");
                      logger.info("Inside Fooftall API");
                      let obj = JSON.parse(data);
                      callback(null,obj);
                     // console.log("Fooftall API deon");
                      logger.info("Fooftall API done");
                  }
              });
               
            },
             function(callback) {
               // Request call to Sales API.
               // console.log("Sales API getting called");
               logger.info("Sales API getting called");
                let reqoptions = {
                  uri : detailSalesAPI,
                  method : "GET"
              };
              
              request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              
                  if(err)
                  {
                      console.log("Err: " + err);
                  }
                  if (!err && response.statusCode ==200){
                      //console.log("Inside Sales API");
                      logger.info("Inside Sales API");
                      let obj = JSON.parse(data);
                      callback(null,obj);
                      //console.log("Sales API deon");
                       logger.info("Sales API done");
                  }
              });
               
            }

        ],
        // optional callback
         function(err, results) {
            if(err)
            {
                console.log("Error in Final callback : " +  err );
            }
             
             let finalresult = results;
             let transactionval = finalresult[0];
             let footfallval = finalresult[1];
             let Salesval = finalresult[2];
             let Resultarray = [];
             let Resultobj = {};

             //console.log(transactionval);
             logger.info(transactionval);
             //console.log(footfallval);
             logger.info(footfallval);
             //console.log(Salesval);
             logger.info(Salesval);

             if(aggregateby == undefined || aggregateby == "weekly")
             {
              for(let j =0 ; j < transactionval.weekdata.length; j++)
               {
                 let obj = {};
                 //console.log(transactionval.weekdata[j].pc);
                  let Pc_transvalue = transactionval.weekdata[j].pc;
                  let Cc_transvalue = transactionval.weekdata[j].cc;

                  let Pc_Footfallvalue = footfallval.weekdata[j].pc;
                  let Cc_Footfallvalue = footfallval.weekdata[j].cc;

                  let Pc_SalesValue = Salesval.weekdata[j].pc;
                  let Cc_SalesValue = Salesval.weekdata[j].cc;
                  
                  let Pc_ConversionRate = (Pc_Footfallvalue / Pc_transvalue);

                  if(isNaN(Pc_ConversionRate))
                  {
                    Pc_ConversionRate = 0;
                  }

                  let Cc_ConversionRate = (Cc_Footfallvalue / Cc_transvalue);

                  if(isNaN(Cc_ConversionRate))
                  {
                    Cc_ConversionRate = 0;
                  }

                  let Pc_AvgSales = (Pc_SalesValue / Pc_transvalue);

                  if(isNaN(Pc_AvgSales))
                  {
                    Pc_AvgSales = 0;
                  }

                  let Cc_AvgSales = (Cc_SalesValue / Cc_transvalue);

                  if(isNaN(Cc_AvgSales))
                  {
                    Cc_AvgSales = 0;
                  }

                  //console.log("Previou year CR : " + Pc_ConversionRate);
                  logger.info("Previou year CR : " + Pc_ConversionRate);
                  //console.log("Current year CR : " + Cc_ConversionRate);
                  logger.info("Current year CR : " + Cc_ConversionRate);
                  //console.log("Previou year AS : " + Pc_AvgSales);
                  logger.info("Previou year AS : " + Pc_AvgSales);
                  //console.log("Current year AS : " + Cc_AvgSales);
                  logger.info("Current year AS : " + Cc_AvgSales);
                  
                  obj.wk = transactionval.weekdata[j].wk;
                  obj.prevCR = Pc_ConversionRate.toFixed(2);
                  obj.CurrCR = Cc_ConversionRate.toFixed(2);
                  obj.prevAS = Pc_AvgSales.toFixed(2);
                  obj.CurrAS = Cc_AvgSales.toFixed(2);

                  Resultarray.push(obj);

               }

             Resultobj.p1 = transactionval.p1;
             Resultobj.p2 = transactionval.p2;
             Resultobj.p3 = transactionval.p3;
             Resultobj.p4 = Resultarray;
             res.send(Resultobj);

             }

             else
             {
                //console.log(transactionval.features[0].pr);
                
                let RArray = [];
                let RObj = {};

                for(let i =0; i < transactionval.features.length; i++)
                {
                  let RsObj = {};
                  let psalesval = Salesval.features[i].pr.pc;
                  let ptransval = transactionval.features[i].pr.pc;
                  let pffallval = footfallval.features[i].pr.pc;

                  let csalesval = Salesval.features[i].pr.cc;
                  let ctransval = transactionval.features[i].pr.cc;
                  let cffallval = footfallval.features[i].pr.cc;

                  let pConversionRate = pffallval/ptransval;

                   if(isNaN(pConversionRate))
                  {
                    pConversionRate = 0;
                  }

                  let cConversionRate = cffallval/ctransval;

                   if(isNaN(cConversionRate))
                  {
                    cConversionRate = 0;
                  }

                  let pAvgSales = psalesval/ptransval;

                   if(isNaN(pAvgSales))
                  {
                    pAvgSales = 0;
                  }


                  let cAvgSales = csalesval/ctransval;

                   if(isNaN(cAvgSales))
                  {
                    cAvgSales = 0;
                  }
                  //console.log("Conversion rate : " + ConversionRate);
                  //console.log("Avg Sales : " + AvgSales);

                  RsObj.pCR = pConversionRate.toFixed(2);
                  RsObj.pAS = pAvgSales.toFixed(2);
                  RsObj.pDt = transactionval.features[i].pr.pp;
                  RsObj.pDay = transactionval.features[i].pr.pd;

                  RsObj.cCR = cConversionRate.toFixed(2);
                  RsObj.cAS = cAvgSales.toFixed(2);
                  RsObj.cDt = transactionval.features[i].pr.cp;
                  RsObj.cDay = transactionval.features[i].pr.cd;

                  RArray.push(RsObj);
                }

                RObj.p1 = transactionval.features[0].pr.sn;
                RObj.p2 = transactionval.features[0].pr.zn;
                RObj.p3 = RArray;

                res.send(RObj);
             }
             
        });

}