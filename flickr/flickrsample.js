'use strict';
const alasql = require('alasql');
const fs = require("fs");
const config = require('../config/config');
const constant = config.constants;
var exec = require('child_process').exec;
const Flickr = require("flickrapi"),
flickrOptions = {
      api_key: constant.flickr_api_key,
      secret:  constant.flickr_secret
    };
const moment = require("moment");
const Q = require('q');
//Create Photos ID Table
 alasql("CREATE TABLE photos (" + 
     "id string, " +
     "owner string," +
     "title string" +
     "ispublic int" +
     ")");
     
  alasql("CREATE TABLE photoInfo(photoid string,dateuploaded string,owner_nsid string,owner_username string,owner_realname string,owner_location string,title string,description string,dateposted string,phototaken string,photolastupdate string,views int,locationlat double,locationlong double,url string,media string)");
 
  alasql("CREATE TABLE photoComments(photoid string,commentid string,author string,authorname string,commentlink string,authorrealname string,content string)");
  
  let filename = constant.flickr_filename;
  let time = process.argv[2]; 
  
	
  if(time == undefined)
  {
   time = moment().format("YYYY-MM-DD");
  }

  filename = filename + "_" + time + ".txt"; //FileName to store Filckr data

  let tom = moment(time).add(1,'days');
  let epochst = moment(time).unix();
  let epochet = moment(tom).unix();
  var child;
  
Flickr.tokenOnly(flickrOptions, function(error, flickr) {
   
   console.log("Starting flickr api"); 
   
   function SearchPhotos(pageid)
   {
        var options = {
                  api_key: constant.flickr_api_key,
                  min_upload_date : epochst,
                  max_upload_date : epochet,
                  bbox : "-0.5411,51.2568,0.2925,51.7177",
                  extras : "geo,owner_name,media,url_l",
                  page : pageid
         }
         let deferred = Q.defer();
         
         flickr.photos.search(options , function(err, result) {
         
             if(err)
             {
                 deferred.reject(new Error(err));
             }
             else
             {
                 deferred.resolve(result);
             }
         });
         
         return deferred.promise;
         
   }
   
   //Search Photo API Call
   SearchPhotos(1).then(function(result){
                
                let deferred = Q.defer();
                 let pages = result.photos.pages;
                 console.log("No of Pages : " + pages);
                 InsertPhotoIds(result);
                 let count = 2;
               
                 callingRecursive(count);
                 
                 function callingRecursive(count)
                 {
                     if(count <= pages)
                     {
                       SearchPhotos(count).then(function(res){
                           InsertPhotoIds(res);
                           callingRecursive(count + 1);
                           
                       });  
                     }
                     else
                     {
                         deferred.resolve(1);
                     }
                    
                 }
                 
                return deferred.promise;
                
   }).then(function(res1){
       //Call Get Info API from photo Id.
       let deferred = Q.defer();
       
        let photoids = alasql("select * from photos");
        
        function getphotoinfo(n)
        {
            if(n < photoids.length)
            {
                var opt = {"photo_id" : photoids[n].id };
               flickr.photos.getInfo(opt, function(err,infores){
                    //Get Photo Info and store it into ALASQL Table.
                    //let infoobj = infores;
                    if(err)
                    {
                        deferred.reject(new Error(err));
                    }
                    let photoid = infores.photo.id;
                    let dateuploaded = moment.unix(infores.photo.dateuploaded).format("YYYY-MM-DD HH:mm:ss");
                    let owner_nsid = infores.photo.owner.nsid;
                    let owner_username = infores.photo.owner.username.replace(/'/g,"''");
                    let owner_realname = infores.photo.owner.realname.replace(/'/g,"''");
                    let owner_location = infores.photo.owner.location;
                    let title= infores.photo.title._content.replace(/'/g,"''");
                    title = title.replace(/(\r\n|\n|\r)/gm,"").trim();
                    let description = infores.photo.description._content.replace(/'/g,"''");
                    description = description.replace(/(\r\n|\n|\r)/gm,"").trim();
                    let dateposted = moment.unix(infores.photo.dates.posted).format("YYYY-MM-DD HH:mm:ss");
                    let phototaken = infores.photo.dates.taken;
                    let photolastupdate = moment.unix(infores.photo.dates.lastupdate).format("YYYY-MM-DD HH:mm:ss");
                    let views = infores.photo.views;
                    let locationlat = infores.photo.location.latitude;
                    let locationlong = infores.photo.location.longitude;
                    let url = infores.photo.urls.url[0]._content;
                    let media = infores.photo.media;
                    
                    let insertvalues = "'" + photoid + "','" + dateuploaded + "','" + owner_nsid + "','" + owner_username + "','" +  owner_realname + "','" + owner_location + "','" + title + "','" + description + 
                    "','" + dateposted + "','" + phototaken + "','" + photolastupdate + "'," + views + "," + locationlat + "," + locationlong + 
                    ",'" + url + "','" + media + "'";
                    
                    //console.log(insertvalues);
                    alasql.promise("Insert into photoInfo values(" + insertvalues +")")
                    .then(function(res){
                        //console.log("Info result inserted : " + res);
                    }).catch(function(err){
                        console.log(insertvalues);
                        console.log("Error in inserting photoinfo : " + err);
                    });
                    
                    getphotoinfo(n + 1); //Increment the loop
                }); 
            }
            else
            {
                deferred.resolve(1);
                
            }
            
        }
       
       getphotoinfo(0);
       return deferred.promise;
      
   }).then(function(res2){
        console.log("Called after everything");
       //Get All comments from photo ids.
       let photoids = alasql("select * from photos");
     
       function getPhotoComments(n)
       {
           
           if(n < photoids.length)
           {
              var opt = {photo_id : photoids[n].id , api_key : constant.flickr_api_key };
               flickr.photos.comments.getList(opt,function(err,res){
                  if(err)
                  {
                      console.log("Error in comment api " + err);
                  }
                 // console.log(res); 
                  let commentarray = res.comments.comment;
                  if(commentarray != undefined)
                  {
                      for(let cid = 0; cid < commentarray.length ; cid++)
                      {
                          let photoid = photoids[n].id;
                          let commentid = res.comments.comment[cid].id;
                          let author = res.comments.comment[cid].author.replace(/'/g,"''");
                          let authorname = res.comments.comment[cid].authorname.replace(/'/g,"''");
                          let commentlink = res.comments.comment[cid].permalink.replace(/'/g,"''");
                          let authorrealname = res.comments.comment[cid].realname.replace(/'/g,"''");
                          let content = res.comments.comment[cid]._content.replace(/'/g,"''");
                          content = content.replace(/(\r\n|\n|\r)/gm,"").trim();
                          
                          let insertvalues = "'" + photoid + "','" + commentid + "','" + author + "','" + authorname + "','" + commentlink + "','" + authorrealname + "','" + content + "'";
                          
                           alasql.promise("Insert into photoComments values(" + insertvalues +")")
                            .then(function(res){
                               // console.log("Info result inserted : " + res);
                            }).catch(function(err){
                                //console.log(insertvalues);
                                console.log("Error in inserting photoinfo : " + err);
                            });
                      }
                  }
                  
                  
                  
                  getPhotoComments(n + 1);
               });
           }
           else
           {
               //Join all three tables and make a flat structure to insert data into HDFS.
               let completeresult = alasql("select * from photos A INNER JOIN photoInfo B ON A.id = B.photoid LEFT OUTER JOIN photoComments C on B.photoid = C.photoid");
               let seperator = "|";
              
               let objkey = ["id","owner","title","photoid","dateuploaded","owner_nsid","owner_username","owner_realname","owner_location","description","dateposted","phototaken","photolastupdate","views","locationlat","locationlong","url","media","commentid","author","authorname","commentlink","authorrealname","content"];
               let finalstream = "";
               for(let x =0; x < completeresult.length; x++)
               {
                    let output = "";
                   for(let k =0; k < objkey.length ; k++)
                   {
                       let obj = "completeresult[" + x + "]" + "." + objkey[k]; 
                       let val = eval(obj);
                       if(val == "" || val == undefined)
                       {
                           val = 'null';
                       }
                       
                       output +=  val + seperator;
                       
                   }
                   output = output.substr(0,output.length - 1);
                   output = output + "\n";
                   // Push into HDFS Path
                   finalstream += output;
                   
               }
               //console.log(finalstream);
               
               /*  Create a local file with complete data and then push it to HDFS */
               //Remove local file 
                function removingFile(filename)
               {
                       let defer = Q.defer();
                       
                          if(fs.existsSync(filename))
                          {
                            fs.unlink(filename, function(err) {
                               if(err)
                               {
                                   defer.reject(new Error(err));
                               }
                               else
                               {
                                   defer.resolve(1);
                               }
                              
                            });
                          }
                          else
                          {
                              defer.resolve(0);
                              console.log("File does not exists. Hence creating new file");
                          }
                       
                        
                        return defer.promise;
                   }
            
              removingFile(filename).then(function(res){
                      let defer = Q.defer();
                      
                      //Append final stream into local file.
                        fs.appendFile(filename,finalstream,function(err,wres){
                          if(err)
                          {
                              defer.reject(new Error(err));
                              console.log("Error in writing file : " + err);
                          }
                          
                          defer.resolve();
                       });
                       
                       return defer.promise;
                       
              }).then(function(res){
                  
          // Hadoop command to put the file on HDFS.
		  console.log("Writing File Operation complete");
		  var hdfsfolder = "/grosvenor/flickr/" + moment(time).format("YYYY-MM-DD");
		  var CheckFolderCommand = "hadoop fs -ls " + hdfsfolder;
		  var mkdirCommand = "hadoop fs -mkdir " + hdfsfolder;
		  
		  //Checking HDFS Folder exist
		  function checkHDFSFolderExist()
		  {
		      let deferred = Q.defer();
		      
    		   child = exec(CheckFolderCommand,function(error,stdout,stderr){
    		        if(error != null)
    		        {
			    console.log("Folder does not exists so mkdir command");
    		            //deferred.reject(new Error(error));
			    //Folder does not exists so mkdir command
    		          exec(mkdirCommand , function(err,stdout,stderr){
    		                  if(err != null)
    		                  {
            				     console.log(err);
    		                      deferred.reject(new Error(stderr));
    		                  }
    		                  else{
    		                      deferred.resolve(0);
    		                  }
    		               });
    		        }
    		        else{
    		            //deferred.resolve(stdout);
    		             deferred.resolve(0); // Folder exists
    		            
    		        }
    		   });
    		   
    		   return deferred.promise;
		  }
		      
               checkHDFSFolderExist().then(function(res){
		         
                    //Move command
                    let hdfspath = hdfsfolder + "/flickrdata_" + time + ".txt";
                    var FScommand = "hadoop fs -rm -skipTrash " + hdfspath + ";hadoop fs -put " + filename  + " " + hdfsfolder;
                    console.log("Hadoop command : " + FScommand); 
                         
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
                   
                    }) ;   
                  
                  
              }) ;
           
               
           }
       }
       
       getPhotoComments(0);
   });
   
   function InsertPhotoIds(res)
   {
                let photoarray = res.photos.photo;
               
                for(let j =0 ; j < photoarray.length; j++)
                {
                    let photoid = photoarray[j].id;
                    let owner = photoarray[j].owner;
                    let title = photoarray[j].title.replace(/'/g,"''");
                    let ispublic = photoarray[j].ispublic;
            
                 
                    //alasql("INSERT INTO photos VALUES ('" + photoid + "','"+ owner + "','" + secret + "'," + server +"," + farm + ",'"+ title + "')");
                
                    alasql.promise("INSERT INTO photos VALUES ('" + photoid + "','"+ owner + "','" + title + "'," + ispublic + ")")
                    .then(function(res){
                   
                    }).catch(function(err){
                        console.log("INSERT INTO photos VALUES ('" + photoid + "','"+ owner + "','" + title + "'," + ispublic + ")");
                       console.log("Error in insert statemnt :" + err); 
                    }); 
                }
                    var rescount = alasql("select * from photos");
                    console.log("Total count : " + rescount.length);
                     
               
   }
   

});
