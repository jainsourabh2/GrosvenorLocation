module.exports.getliverpoolonehashtag = function(req,res,logger){

var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
var moment = require('moment');
var q = require('q');

    var dataset = req.query.dataset;
    var startdate = req.query.startdate;
    var enddate = req.query.enddate;
    var todaydate = new Date().toLocaleDateString();
    let limit = req.query.limit;

    limit = (limit == undefined) ? 10 : limit;

    if(dataset == undefined)
      {
          var errorobj = {"error" : "Not enough parameters. Parameters dataset is mandatory"};
          res.send(errorobj);
      }

     if(dataset == "twitter")
     {
        logger.info("Twitter query started for LiverPoolOne");       
         let sdate = (startdate != undefined) ? startdate.substr(2,startdate.length) : moment(todaydate,"yyyy-mm-dd").subtract(1,'days').toISOString().split('T')[0].substr(2,moment(todaydate,"yyyy-mm-dd").toISOString().length);  //Format in yyyy-mm-dd Current date
         let edate = (enddate != undefined) ? enddate.substr(2,enddate.length) :  moment(todaydate,"yyyy-mm-dd").toISOString().split('T')[0].substr(2,moment(todaydate,"yyyy-mm-dd").toISOString().length); 
        logger.info("StartDate for LiverPoolOne ",startdate);
        logger.info("EndDate for LiverPoolOne ",enddate);                           

         var track = "liverpoolone";
         var reqobj = {"dataset" : dataset, "startdate" : sdate, "enddate" : edate, "keywords" : track, "limit" : limit}

         var q = getQueryForLiverPoolOne(reqobj);
         console.log(q);
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

                        var created_at = new Date(obj.rows[p].creeated_at).toISOString().replace(/T/, ' ').replace(/\..+/, '');

                        var tweet = obj.rows[p].tweet;                        

                        var imageurl = obj.rows[p].userprofileimageurl;

                        var username = obj.rows[p].userscreenname;

                        var follcount = obj.rows[p].userfollowercount;

                        var tweetid = obj.rows[p].tweet_id;
                        var cordinatearray = [];

                         cordinatearray.push(0.0);

                         cordinatearray.push(0.0);

                        

                         dataarray.push({

                             "pr" : { "p1" : tweet , "p2" : created_at , "p3" : username, "p4" : imageurl, "p5" : follcount, "p6" : tweetid} ,

                             "ge" : { "lo" : cordinatearray[0] , "la" : cordinatearray[1] }});

                    }

                dataobj.type = "FeatureCollection";

                      dataobj.features = dataarray;

                      console.log(JSON.stringify(dataobj));

                      res.send(dataobj); 

                }

                 else

                 {

                        var errorobj = {"error" : "Unexpected Error"};

                        res.send(errorobj);

                 }

 

        });

      }

function getQueryForLiverPoolOne(robj)
{
     var dataset = robj.dataset;
     var startdate = robj.startdate;
     var enddate = robj.enddate;
     var track = robj.keywords;
     var limit = robj.limit;

     logger.info("Inside getQueryForLiverPoolOne");

    if(robj.dataset == "twitter")
    {
        var query= "select creeated_at,tweet, userscreenname,userprofileimageurl,userfollowercount,tweet_id from `hive_social_media`.`default`.`newtwittercategorystream` where create_date between '" + startdate + "' and '" + enddate+ "' and category=0 and STRPOS(LOWER(tweet),'"+ track +"') > 0  order by creeated_at desc LIMIT " + limit;
        logger.info("Get Query For LiverPoolOne ",query);
        return query;

    }

}

}


