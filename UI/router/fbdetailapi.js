module.exports.getFBDetails = function(req,res,logger){

      var request = require("request");
      var url = "http://10.80.2.4:8047/query.json";
      var moment = require('moment');
      
      let dataset = req.query.dataset;
      let fbid = req.query.entityid;
      let startdate = req.query.startdate;//added on 5th Apr
      let enddate = req.query.enddate;// added on 5th Apr

      let todaydate = new Date().toLocaleDateString();

      //Format in yyyy-mm-dd Current date
      let sdate="";
      let edate="";     
     if(startdate === undefined )
      {
        sdate =  moment(todaydate,"yyyy-mm-dd").subtract(1,'days').toISOString().split('T')[0]; 
      }else{
        sdate = startdate;
      }
       
      if(enddate === undefined )
      {
        edate =  moment(todaydate,"yyyy-mm-dd").toISOString().split('T')[0]; 
      }else{
        edate = enddate;
      }

      console.log(sdate);        
      console.log(edate);

      let q = "select message_id,message_from,message,createdtime from `hive_social_media`.`default`.`facebookdata` where  categorize=0 and id='" + fbid + "' and fb_date between '" + sdate + "' and '"+  edate + "' order by createdtime desc";

      var reqoptions = {
                  uri :url,
                  headers:{'Content-Type':'application/json'},
                  method : "POST",
                  body: JSON.stringify({queryType : 'SQL', query : q})
                  
              };
          //console.log("Query : " + q);
          logger.info("Facebook latest post api query started");

      request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err)
              {
                  //console.log("Err: " + err);
                    logger.error("Error: " + err);
              }
              if (!err && response.statusCode ==200)
              {
                  //  console.log("Reached within query");
                  //  console.log(data);
                  //console.log(data.length);
                 let obj = JSON.parse(data);
                 
                 var jsonarray = [];
                 var postsobj = {};
                 console.log(obj.rows.length);
                 for(let o = 0; o < obj.rows.length; o++ )
                 {
                  if(obj.rows[o].message != undefined)
                  {
                    let jsonobj = {};
                    console.log(obj.rows[o]);
                    let fbmsg = obj.rows[o].message.substring(0,140);
                    let created_tm = obj.rows[o].createdtime;
                    let uname = obj.rows[o].message_from;
                    let fbmsgid = obj.rows[o].message_id;

                    jsonobj.p1 = uname;
                    jsonobj.p2 = fbmsg;
                    jsonobj.p3 = created_tm;
                    jsonobj.p4 = "https://www.facebook.com/" + fbmsgid;
                    jsonarray.push(jsonobj);
                  }
                    
                 }
                // console.log(jsonarray);
                 postsobj.posts = jsonarray;
                 res.send(postsobj);
                 logger.info("Facebook latest post api query end");
              }
            });

}

