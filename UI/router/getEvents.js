module.exports.getEvents = function(req,res,logger){

var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
var moment = require('moment');

var startdate = req.query.startdate;
var enddate = req.query.enddate; 
let error = { errormsg : "" }; 

  logger.info("Start of getEvents");

  if(startdate == undefined || enddate == undefined)
    {
      error.errormsg = "StartDate,EndDate parameters are mandatory.  eg : /api/getEvents?startdate=2016-10-01&enddate=2016-12-31";
      res.send(error);
    }
  
  var reqobj = {"startdate" : startdate, "enddate" : enddate }
  var q = getQueryForEvents(reqobj);

  parseRequest(req,res,q);

  logger.info("End of getEvents");
       

function getQueryForEvents(robj)
{
  
  let startdate = robj.startdate;
  let enddate = robj.enddate;
  

  let query = "select distinct id,latitude,longitude from `dfs`.`default`.`EventsView` where  CAST(start_time as Date) between '" + startdate + "' and '" + enddate + "' ";
  

  logger.info("Start of getQueryForEvents");

  logger.info("query in getQueryForEvents", query);
 
  logger.info("End of getQueryForEvents");
  
  return query;
  
}


function parseRequest (req,res,q){


logger.info("Start parseRequest for getEvents"); 

  var dataobj = {};
  var dataarray = [];
  
  var reqoptions = {
    uri :url,
    headers:{'Content-Type':'application/json'},
    method : "POST",
    body: JSON.stringify({queryType : 'SQL', query : q})              
  };
        
    request(reqoptions, function(err, response, data){

               if(err)

               {

                logger.error("Error: " + err);

               }
               if (!err && response.statusCode ==200){
                   var obj = JSON.parse(data);
                   for(let p =0; p < obj.rows.length; p++)

                    {

                      console.log(obj.rows[p]);

                        let id = obj.rows[p].id; 
                        let latitude = obj.rows[p].latitude;
                        let longitude = obj.rows[p].longitude;
                                               
                        dataarray.push({ 
                                         "pr" : { "p1" : id , "p2" : latitude , "p3" : longitude}});

                                }

                         dataobj.type = "FeatureCollection";

                    dataobj.features = dataarray;

                    console.log(JSON.stringify(dataobj));

                    res.send(dataobj); 

                }else{
                        var errorobj = {"error" : "Unexpected Error"};
                        res.send(errorobj);
            
                 } 
        });

        logger.info("End parseRequest for getEvents");        
}


}


