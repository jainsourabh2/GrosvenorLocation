var graph = require('fbgraph');
const config = require('../config/config');
const constants = config.constants;
const mysql      = require('mysql');
var fs = require('fs');
var jsonparsingfbcom = require('./jsonparsingfbcom');
var completedata = ""; 
var newdata = new Array();
var moment = require('moment');
 var Q = require("q");
var abusivewordpath = "/opt/nodeprojects/GrosvenorLocation/config/abusivewords";
 
console.log("before mysql connection");
 const connection = mysql.createConnection({
  host     : constants.mysql_host,
  port     : constants.mysql_port,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});
 connection.connect();
 graph.setVersion("2.8");
console.log("got mysql connection");

if(process.argv[2] != null && process.argv[3] != null)
{
 var dt = moment(process.argv[2]);
 var edt = moment(process.argv[3]);
 
 var fromDate = dt.toISOString();
 var toDate = (edt == null) ? moment(process.argv[2]).add(1,'days').toISOString() : edt.toISOString();
 
 console.log(fromDate);
 console.log(toDate); 
    
} 
 function readAbusiveList(filename)
 {
    console.log("before reading abusive list");
     var defered = Q.defer();
     
     fs.readFile(filename,'utf-8',function(err,data){
        if(err)
        {
            defered.reject(new Error(err));
        }
        else{
            defered.resolve(data);
        }
        
     });
     
    return defered.promise;
    //var ret = fs.readFileSync(filename,'utf8');
    //console.log("read  abusive list");
    //return ret;

 }
 
 readAbusiveList(abusivewordpath).then(function(data){
     //var data = readAbusiveList('../config/abusivewords'); 
     var abusivelist = data.split('\n');
      connection.query("SELECT * FROM facebookcomments",function(ferr,frows,ffields)
    {
        console.log("frows length",frows.length);
        if(frows.length > 0)
        {
            console.log("Fetching data from mysql");
            function getDetails(n)
            {
                
                if(n < frows.length)
                {
                    var id = frows[n].id;
                    var name = frows[n].name;
                    completedata = "";
                    
                    var params="";
                    
                    if(fromDate != null)
                    {
                        params = { fields: "feed.since("+ fromDate +").until("+ toDate +"){comments}"  };
                        console.log("params are: ",params);
                    }
                    else
                    {
                        //Get All comments right from start
                        params = { fields: "feed{comments}" }; 
                    } 
                    
                    graph.setAccessToken(constants.access_token[Math.floor(Math.random()*constants.access_token.length)]);
                    
                    graph.get(frows[n].id.toString(), params,  function(err, res) {
                      //console.log(res); // { picture: "http://profile.ak.fbcdn.net/..." } 
                      if(err)
                      {
                          console.log(err);
                      }
			           console.log("Fetching data from api");
                      if(res != null)
                      {
                          var data = res;
                         completedata = data;
                         
                      } 
                      
                      if(data.feed != undefined)
                      {
                          if(data.feed.paging && data.feed.paging.next) {
                                recursivecall(data.feed,n);
                          }
                      }
                      else
                      {
                          //For Pages which does not have feeds spanned across pages.
                          jsonparsingfbcom.getParsedString(JSON.stringify(newdata),abusivelist);
                          
                        // connection.query('UPDATE facebookcomments SET epoch = "'+ new Date().toISOString() +'" WHERE restaurantid = "'+ frows[n].restaurantid +'";', function(err, rows, fields) {
        					//if (err) 
        					//{
        					 //console.log(err);   
        					//}
        					//else
        					//{
        					    //console.log("Updated");
        					//}
        				//});
    			      
                          getDetails(n + 1);
                      }
                    });
                }
                else
                {
                    //Close SQL connection
                    connection.end(function(err) {
                      // The connection is terminated now 
                      if(err)
                      {
                          console.log("Error in sql closure.");
                      }
                      else
                      {
                          console.log("Connection closed");
                          //process.exit(0);
                      }
                    });
                }
            }
            
            getDetails(0);
            
            
            //Recursive function call
            
        function recursivecall(res,n)
          {
              
              if(res.paging && res.paging.next)
              {
                  graph.get(res.paging.next, function(nerr, nres) {
                      if(nerr)
                      {
                          console.log(nerr);
                      }
                        var ndata = nres;
          
                         for(var d = 0; d < ndata.data.length; d++) //Push all paginated feed data into single feed data array
                         {
                           completedata.feed.data.push(ndata.data[d]);
                         }
                          
                          recursivecall(nres,n); //Recursive call
                  });
              }
              else
              {
                  console.log("start saving comments data");
                  for(var cnt = 0; cnt < completedata.feed.data.length; cnt++) 
                 {
                    if(completedata.feed.data[cnt].hasOwnProperty("comments")){
                        //console.log("got comments");
                        for(var comcnt = 0; comcnt < completedata.feed.data[cnt].comments.data.length; comcnt++)
                        {
                            var commentObj = {time:"",name:"",innerId:"",message:"",outId:""};
                            commentObj.time=completedata.feed.data[cnt].comments.data[comcnt].created_time;
                            commentObj.name=completedata.feed.data[cnt].comments.data[comcnt].from.name;
                            commentObj.innerId=completedata.feed.data[cnt].comments.data[comcnt].from.id;
                            var sent =completedata.feed.data[cnt].comments.data[comcnt].message;
                            if(sent != null){
                                sent = sent.replace(/</g,"").trim();
                                sent = sent.replace(/>/g,"").trim();
                            }
                            commentObj.message=sent;
                            commentObj.outId=completedata.feed.data[cnt].comments.data[comcnt].id;
                            newdata.push(commentObj);
                        }
                    } else{
                       // console.log("no, i have not comments property ",cnt);
                    }
                 }
                 console.log("end saving comments data");
                 
                   console.log("calling json parsing ");
    			   jsonparsingfbcom.getParsedString(JSON.stringify(newdata),abusivelist);
    			  
                  
                  getDetails(n + 1); 
              }
             
          }
  
        }
    });
 });
 

                      
        
    
