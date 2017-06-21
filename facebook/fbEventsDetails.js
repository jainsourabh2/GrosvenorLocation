//This script fetches Events from Facebook page configured in Mysql table facebookEventId. It takes two optional parameters startdate and enddate. If no parameter specified it will run for all the events present in the Fbpage right from start.

var graph = require('fbgraph');
const config = require('../config/config');
const constants = config.constants;
const mysql      = require('mysql');
var fs = require('fs');
var jsonparsing = require('./jsonEventparsing');
var completedata = ""; 
var moment = require('moment');
 var Q = require("q");
 
 const connection = mysql.createConnection({
  host     : constants.mysql_host,
  port     : constants.mysql_port,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});
 connection.connect();
 graph.setVersion("2.8");

if(process.argv[2] != null && process.argv[3] != null)
{
 var dt = moment(process.argv[2]);
 var edt = moment(process.argv[3]);
 
 var fromDate = dt.toISOString();
 var toDate = (edt == null) ? moment(process.argv[2]).add(1,'days').toISOString() : edt.toISOString();
 
 console.log(fromDate);
 console.log(toDate); 
    
}
 
 

connection.query("SELECT * FROM facebookEventId",function(ferr,frows,ffields)
    {
        if(frows.length > 0)
        {
            console.log("Fetching data from mysql");
            function getDetails(n)
            {
                
                if(n < frows.length)
                {
                   
                    var date = new Date().toISOString();
                    var params = "";
                    completedata = "";
                    
                    if(fromDate != null)
                    {
                        params = { fields: "events.since(" + fromDate + ").until(" + toDate + "){name,description,id,start_time,end_time,place,updated_time}" }; 
                    }
                    else
                    {
                        //Get All events right from start
                        params = { fields: "events{name,description,id,start_time,end_time,place,updated_time}" }; 
                    }
                    
                     graph.setAccessToken(constants.access_token[Math.floor(Math.random()*constants.access_token.length)]);
                    
                    graph.get(frows[n].pageid.toString(), params,  function(err, res) {
                      //console.log(res); // { picture: "http://profile.ak.fbcdn.net/..." } 
                      if(err)
                      {
                          console.log(err);
                      }
			           console.log("Fetching data from api");
                      if(res != null)
                      {
                          var resdata = res;
                         completedata = resdata;
                        // console.log("Data is : " + JSON.stringify(resdata.events.data));
                      } 
                      
                      if(resdata.events != undefined)
                      {
                          if(resdata.events.paging && resdata.events.paging.next) {
                                recursivecall(resdata.events,n);
                          }
			  else
			{
			  //For Pages which does not have feeds spanned across pages.
			  jsonparsing.getParsedString(JSON.stringify(completedata));
			  getDetails(n + 1);
			}
                      }
			else{
			
			 connection.end(function(err) {
                      // The connection is terminated now 
                      if(err)
                      {
                          console.log("Error in sql closure.");
                      }
                      else
                      {
                          console.log("Connection closed");
                          
                      }
                    	});			

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
                          
                      }
                    });
                }
            }
            
            getDetails(0);
            
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
                           completedata.events.data.push(ndata.data[d]);
                         }
                          
                          recursivecall(nres,n); //Recursive call
                  });
              }
              else
              {
    			  jsonparsing.getParsedString(JSON.stringify(completedata));
    			  
                  getDetails(n + 1); 
              }
             
          }
        
        }
 });
