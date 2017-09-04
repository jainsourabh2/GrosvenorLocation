/*  Web scrape the Transactions detail from the site mentioned in the code for list of towns in HK */
'use strict'
let request = require("request");
let cheerio = require("cheerio");
let ineed = require("ineed");
let fs = require("fs");
let baselink = "https://transactions.gohome.com.hk";
let towns = ["Aberdeen","Ap-Lei-Chau","Causeway-Bay","Central-Sheung-Wan","Chai-Wan",
"Fortress-Hill","Happy-Valley","Heng-Fa-Chuen","Jardine-s-Lookout","Kennedy-Town","Mid-Levels-Central",
"Mid-Levels-East","Mid-Levels-North-Point-Braemar-Hill","Mid-Levels-West","North-Point","Peak","Pokfulam",
"Quarry-Bay","Red-Hill","Repulse-Bay","Sai-Wan-Ho","Sai-Ying-Pun","Shau-Kei-Wan","Shouson-Hill","Siu-Sai-Wan",
"Stanley","Tai-Hang","Tai-Koo-Shing-Kornhill","Tai-Tam","Tin-Hau","Wanchai"];
 
 let url = "http://10.80.2.4:8047/query.json";
let endpart = "/en/?Page=";
let Q = require("q");
let geocode = require("./geocode.js");
var defer = "";
 let allres = [];
let date_stop_flag = 0;
let outputfilename = 'propertyTransactions.txt';
let outputfilepath = '/opt/nodeprojects/GrosvenorLocation/HongKong/PropertyTransaction/output';
let outputpath = outputfilepath + "/" + outputfilename;
let filename = "";
var checkHDFS = require("./checkHDFSFolderexists");
var checkLocalFile = require('./createLocalFile');
let exec = require('child_process').exec;
let child;
let moment = require("moment");

  function scrapePropertyTrans(link,town,initialrec)
  {
     
       let rowvalues = "";
       
        request(link, function (error, response, body) {
    			console.log("StatusCode : " + response.statusCode);
    			console.log("error : " + error);
    			//console.log(body);
    			if (!error && response.statusCode == 200){
    			    
    			   // console.log(body);
    			   	let $ = cheerio.load(body,{normalizeWhitespace: true});
    			   
    			   
    			    //Logic here to scrape the site records
    			   rowvalues = $($("div[itemscope]").find("table")[8]).find("tr"); //Get all rows from the table 
    			   
     			   for(let i =1 ; i < rowvalues.length - 1 ; i++)
     			  // for(let i = 1 ; i < 2 ; i++)  //For testing 
     			   {
     			        let record = "";
     			       for(let j =0; j < $($(rowvalues[i]).find("td")).length ; j++)
     			       {
     			           let rec = $($(rowvalues[i]).find("td")[j]).text();
     			           let dt = "";
     			           
     			           if(j == 0)// Parse the date
     			           {
     			               dt = moment(rec).format("YYYY-MM-DD");
     			               rec = rec + "|" + dt;
     			           }
     			           
     			           if(j == 2)
     			           {
     			              rec =  rec.replace(/\$/g,'').replace(/\M/g,'');   
     			           }
     			           
     			           if(j == 3) //Splitting SA and GFA from the record
     			           {
     			              let rec_1 = $($(rowvalues[i]).find("td")[j])[0].children[0].data;
     			              let rec_2 = $($(rowvalues[i]).find("td")[j])[0].children[2].data;
     			              
     			              rec_1 = rec_1 == "-" ? null : rec_1;
     			              rec_2 = rec_2 == "-" ? null : rec_2;
     			              rec = rec_1 + "|" + rec_2;
     			           }
     			           
     			           if(j == 4) //Splitting $ sq/A for SA and GFA
     			           {
     			              let rec_1 = $($(rowvalues[i]).find("td")[j])[0].children[0].data.replace(/\$/g, '').replace(/\,/g,'');
     			              let rec_2 = $($(rowvalues[i]).find("td")[j])[0].children[2].data.replace(/\$/g, '').replace(/\,/g,'');
     			              
     			              rec_1 = rec_1 == "-" ? null : rec_1;
     			              rec_2 = rec_2 == "-" ? null : rec_2;
     			              rec = rec_1 + "|" + rec_2;
     			           }
     			          record += rec + "|";
     			       }
     			      
     			       record = record.substr(0,record.length - 1);
     			       if(initialrec != null && initialrec.initaldate == record.split('|')[0] && initialrec.initaladdress == record.split('|')[2])
     			       {
				   console.log("No new records found for " + town);
     			           date_stop_flag = 1;
     			           break;
     			       }
     			       else
     			       {
     			         allres.push(record);
     			       }
     			           
     			    }
     			    
                    //Pagination
                    let paginationlink = $("#ctl00_Master_Content_Paging_NextPageLink")[0];
                    
                    if( paginationlink != undefined && date_stop_flag == 0)
                    {
			console.log("Inside pagination section");
                        let pglink = paginationlink.attribs.href;  //Get Pagination link from page
                        let ln = baselink + pglink;
                        scrapePropertyTrans(ln,town,null);
                    
                    }
                    else
                    {
                       defer.resolve(allres); 
                    }
                  
    			console.log(allres);
    			        
     		}
    			   
     }); 
     
    return defer.promise;
  }
  
  //Writes Records to Output file synchronously.
  function writeRecords(allres,townname)
  {
      let defer = Q.defer();
        filename = outputpath;
        allres.forEach(function(v) { 
           fs.appendFileSync(filename,v + '\n');
        });
        
        defer.resolve(0);
        
        return defer.promise;
  }
  
  //Main Function
  function writepropertyTransrecords(i)
  {
       defer = Q.defer();
      if(i < towns.length )
      {
          let link = baselink + "/records/" +towns[i] + endpart + "1";  //Call First page of the link
          
          //Got Town - Make drill req to get the latest record fr the town and send it to scrapeproperty
          
          getLastRecordFromTable(towns[i]).then(function(resobj){  //resobj can be null or result obj { initaldate , initaladdress}
             
              scrapePropertyTrans(link,towns[i],resobj).then(function(q){
              
              if(q.length != 0)
              {
                  //Call geocode and get the lat,long 
                  let o = { "data" : q , "town" : towns[i]};
                  
                  geocode.getGeoCodeFunction(o).then(function(e){
                      
                     if(e.length != 0)
                     {
                       //Remove Local file and create new one
                       checkLocalFile.removeExistingLocalfile(outputpath).then(function(res){
                          
                           if(res == 0)
                           {
                                  writeRecords(e,towns[i]).then(function(r){
                                  if(r == 0)
                                  {
                                      //When last record is written. Call back for the new town.
                                     
                                     writepropertyTransrecords(i + 1); 
                                  }
                                }); 
                           }
                            
                       });
                       
                     }
                  });
              }
              else
              {
                  writepropertyTransrecords(i + 1); //No page from the previous page
                  //process.exit(0);
              }
          });
          });
             
      }
      else{
          //Move the file into Hadoop
          console.log("All file written");
          
            var hdfsfolder = "/grosvenor/HongKong/PropertyTransaction/";
                 var CheckFolderCommand = "hadoop fs -ls " + hdfsfolder;
                 let updatedfilename = outputfilename + "_" + new Date().getTime().toString();
                 let FScommand = "hadoop fs -put " + outputpath  + " " + hdfsfolder + "; hadoop fs -mv " + hdfsfolder + outputfilename + " " + hdfsfolder + "/" + updatedfilename;
                 
		if(fs.existsSync(outputpath))
          	{
                 child = exec(FScommand, function (error, stdout, stderr) {
                              
                              if (error !== null) {
                                console.log('exec error: ' + error);
                              }
                              else
                              {
                                  console.log("File successfully uploaded ");
                                  process.exit(0);
                              }
                        }); 
		}
         
      }
  }
  
  //Initial main function call
  writepropertyTransrecords(0);
  
  
  function getLastRecordFromTable(town)
  {
      let defer = Q.defer();
      let localtown = town.replace(/\-/g,'');
      let obj = null;
      
      //obj = { initaldate : "04 Aug 2017" , initaladdress : "House B Cayman Rise"};

       let q = "SELECT trans_date,trans_address FROM `hive_social_media`.`default`.`propertytransaction` where REGEXP_REPLACE(REGEXP_REPLACE(town,'-',''),' ','') = '" + localtown + "' order by trans_dt_format desc limit 1 ";

      let reqoptions = {
                  uri :url,
                  headers:{'Content-Type':'application/json'},
                  method : "POST",
                  body: JSON.stringify({queryType : 'SQL', query : q})
                  
              };
          
           request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err)
              {
                  //console.log("Err: " + err);
                    logger.error("Error: " + err);
              }
              if (!err && response.statusCode ==200)
              {
                  
                    let obj = JSON.parse(data);
                    

                    if(obj.rows.length > 0)
                    {
                      let initaladdress = obj.rows[0].trans_address;
                      let initaldate = obj.rows[0].trans_date;

                      obj.initaldate = initaldate;
                      obj.initaladdress = initaladdress;

                    }
                   console.log("Inital Record obj : " + obj.initaldate + " | " + obj.initaladdress );
                    defer.resolve(obj);

              }
            });
      return defer.promise;
      
  }
  
    
    
