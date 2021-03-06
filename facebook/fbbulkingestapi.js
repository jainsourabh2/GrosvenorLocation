var graph = require('fbgraph');
const config = require('../config/config');
const constants = config.constants;
const mysql      = require('mysql');
var fs = require('fs');
var jsonparsing = require('./jsonparsing');
var completedata = ""; 
var moment = require('moment'); 
 var Q = require("q");
var abusivewordpath = "/opt/nodeprojects/GrosvenorLocation/config/abusivewords"; 

 const connection = mysql.createConnection({
  host     : constants.mysql_host,
  port     : constants.mysql_port,
  user     : constants.mysql_username,
  password : constants.mysql_password,
  database : constants.mysql_database
});
 connection.connect();
 graph.setVersion("2.8");
 
 if(process.argv.length < 3)
 {
     console.log("Provide arguments to script eg:  node facebookgraphapi.js yyyy-mm-dd");
     process.exit(1);
 }

var fromDate = moment(process.argv[2]).toISOString();
var toDate = moment(process.argv[2]).add(1,'days').toISOString();
 
function readAbusiveList(filename)
 {
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
 }

readAbusiveList(abusivewordpath).then(function(data){

  var abusivelist = data.split('\n');

  connection.query("SELECT distinct id FROM facebooklist order by id asc",function(ferr,frows,ffields)
      {
        if(frows.length > 0)
        {
            console.log("Fetching data from mysql");
	          console.log("Total ids : " + frows.length);
            function getDetails(n)
            {
                
                if(n < frows.length)
                {
		                console.log("Procesed : " + n + " request with id " + frows[n].id);
                    var date = new Date().toISOString();
                    var params = "";
                    completedata = "";
                    
                    params = { fields: "id,about,bio,category,category_list,cover,description,engagement,fan_count,general_info,hours,is_always_open,is_verified,is_permanently_closed,is_unclaimed,link,location,name,overall_star_rating,place_type,price_range,rating_count,username,verification_status,website,feed.until("+ toDate+").since("+ fromDate +"){message,place,link,picture,source,actions,message_tags,scheduled_publish_time,created_time,from}" }; 

                    // params = { fields: "id,about,bio,business,category,category_list,cover,description,engagement,fan_count,general_info,hours,is_always_open,is_verified,is_permanently_closed,is_unclaimed,link,location,name,overall_star_rating,place_type,price_range,rating_count,username,verification_status,website,feed.since("+ ep +"){message,place,link,picture,source,actions,message_tags,scheduled_publish_time,created_time,from}" }; 
                    
                    
                    graph.setAccessToken(constants.access_token[Math.floor(Math.random()*constants.access_token.length)]);

                    graph.get(frows[n].id.toString(), params,  function(err, res) {
                      //console.log(res); // { picture: "http://profile.ak.fbcdn.net/..." } 
		      console.log("Inside the graph get Api");
                      if(err)
                      {
                          console.log("Error in graph get : " + JSON.stringify(err));
			
                      }
			console.log("Fetching data from api");
			//console.log(res);
                   try
                   {
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
                          jsonparsing.getParsedString(JSON.stringify(completedata),abusivelist);     
                   			connection.query('UPDATE facebooklist SET epoch = "'+ new Date().toISOString() +'" WHERE id = "'+ frows[n].id +'";', function(err, rows, fields) {
                          			if (err) 
                          			 {
                          				console.log(err);   
                          				}
                          			else
                          			{
                          				//console.log("Updated");
                          			}
                          		});
                          getDetails(n + 1);
                      }
                    }
                    catch(ex)
                    {
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
                          process.exit(0);
                      }
                    });
                }
            }
            
            getDetails(0);
            
            
            //Recursive function call
            
        function recursivecall(res,n)
          {
              
              try
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
        			       jsonparsing.getParsedString(JSON.stringify(completedata),abusivelist);
                      //Update sql table : epoch field with todays date time.
                      connection.query('UPDATE facebooklist SET epoch = "'+ new Date().toISOString() +'" WHERE id = "'+ frows[n].id +'";', function(err, rows, fields) {
              					if (err) 
              					{
              					 console.log(err);   
              					}
              					else
              					{
              					    //console.log("Updated");
              					}
              				});
                      
                      getDetails(n + 1); 
                  }
            }
            catch(ex)
            {}
          }
            
        }
    });
});                      
        
    
