'use strict'
let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let q = require("q");
let moment = require("moment");
let exec = require('child_process').exec;
let child;
let restaurantdetails = [];
let filename = "RestaurantsDetails.txt";
let baselink = "https://www.openrice.com/en/hongkong/restaurants?";
let url = "https://www.openrice.com";
let completerecord = "";
var defer = "";
//let outputfilename = 'restaurantList';
let outputfilename = 'restaurantList.txt';
let outputfilepath = '/opt/nodeprojects/GrosvenorLocation/HongKong/OpenRiceWebScrapper/output';
let outputpath = outputfilepath + "/" + outputfilename;
let geolocation = require("./geolocation.js");
let checkLocalFile = require("./createLocalFile");
let inputfile = "input/areaslist.txt";
let arealist = [];
let closedresturl = "https://www.openrice.com/api/pois/closed?&page=";
let area = "";
let async = require("async");

function startScrapping(link,pageno) {
   
    let rowvalues = "";
   
	request(link, function (error, response, body) {
		console.log("StatusCode : " + response.statusCode);
		console.log("error : " + error);

		if (!error && response.statusCode == 200) {
		    
		   	let $ = cheerio.load(body,{normalizeWhitespace: true});
		    
			let rowlists = $('.pois-restaurant-list').children();
			let closedrestlist = $('#pois-closed-restaurants').children().children();
		   
		   
	   		for(let j = 0; j < rowlists.length; j++) {
	   			
	   			let restname = $(rowlists[j]).find('.title-name').text().trim();
	   			let hrefname = $(rowlists[j]).find('.title-name').find('a').attr('href');
	   			let hrefarray = (hrefname != undefined) ? hrefname.split('/') : null;
	   			let hrefidarray =  (hrefarray != null) ? hrefarray[hrefarray.length - 1].split('-') : null; 
	   			let restid =  ( hrefidarray != null ) ? hrefidarray[hrefidarray.length - 1] : null;
	   			let style = $(rowlists[j]).find('.details-wrapper').find('.door-photo').attr('style');
	   			let imageurl = (style != undefined) ? style.substring(style.indexOf("https"),style.indexOf("jpg") + 3) : null;
	   			let pricerange = $(rowlists[j]).find(".icon-info-food-price").text().trim();
	   			let cuisinetype = $($(rowlists[j]).find(".icon-info-food-name").find("li")[0]).text();
	   			let rev= $(rowlists[j]).find('.counters-container').children().text();
	   			let noofreviews = (rev != undefined) ? rev.substring(rev.indexOf("(") + 1,rev.indexOf(")")).split(" ")[0] : null;
	   			let noofratings = $(rowlists[j]).find('.bookmarkedUserCount').attr('data-count');
	   			let smilefacerating = $(rowlists[j]).find('.smile-face').children('span').text();
	   			let sadfacerating = $(rowlists[j]).find('.sad-face').children('span').text();
	   			let address = $(rowlists[j]).find('.address').children('span').text().trim();
	   			let datestamp = moment().format("DD-MM-YYYY");
	   			let status = "Open";
	   			completerecord = datestamp + "|" + restid + "|" + restname + "|" + status + "|" + imageurl + "|" + pricerange + "|" + cuisinetype + "|" + noofreviews + "|" + noofratings + "|" + address  + "|" + smilefacerating + "|" + sadfacerating;
	   			restaurantdetails.push(completerecord);
	   		
	   			
	   		}
	   		
	   		if(closedrestlist.length > 0)
	   		{
	   			//build closed url -  pageno, areaname, count
	   			let count = $('.pois-closed-restaurants-collapse-toggle').attr('data-count');
	   			let closedlink = closedresturl + pageno + "&sortBy=Default&=" + area + "&uiCity=hongkong&uiLang=en&count=" + count;
	   		//	let pageno = 
	   		
	   		async.series([
	   				function(callback){
	   					request(closedlink,function(err,res){
	   					
	   						if(!err)
	   						{
	   							let dataarray = [];
	   							let jsonobj = JSON.parse(res.body);
	   							
	   							for(let k =0; k < jsonobj.results.length; k++)
	   							{
let datestamp =  moment().format("DD-MM-YYYY");
let name = jsonobj.results[k].name;
let restidarray = (jsonobj.results[k].urlUI != undefined) ? jsonobj.results[k].urlUI.split('/') : null;
let t1rest = (restidarray != null) ? restidarray[restidarray.length - 1] : null;
let t2restarray = (t1rest != null) ? t1rest.split('-') : null;
let restid = (t2restarray != null) ? t2restarray[t2restarray.length - 1] : null;
let status = "Closed";
let imageurl = (jsonobj.results[k].doorPhoto != undefined) ? jsonobj.results[k].doorPhoto.url : null ;
let pricerange = jsonobj.results[k].priceUI;
let cuisinetype = (jsonobj.results[k].categories != undefined) ? jsonobj.results[k].categories[0].name : null;
let noofreviews = jsonobj.results[k].reviewCount;
let noofratings = jsonobj.results[k].rating;
let address = jsonobj.results[k].address;
let smilefacerating = jsonobj.results[k].scoreSmile;
let sadfacerating = jsonobj.results[k].scoreCry;
let latitude  = jsonobj.results[k].mapLatitude;
let longitude = jsonobj.results[k].mapLongitude;

completerecord = datestamp + "|" + restid + "|" + name + "|" + status + "|" + imageurl + "|" + pricerange + "|" + cuisinetype + "|" + noofreviews + "|" + noofratings + "|" + address  + "|" + smilefacerating + "|" + sadfacerating;
restaurantdetails.push(completerecord);
	   								
	   								
	   							}
	   							
	   							callback(null,restaurantdetails);
	   								
	   						}
	   					});	
	   						
	   				}
	   			],function(err,data){
	   				
	   				 defer.resolve(data[0]); 
	   				
	   			});
	   		
	   			
	   		}
	   		
	   		if($(".pagination-button.next.js-next").length > 0) {
	   			let pagination = $(".pagination-button.next.js-next").last().attr("href");
	   			let pageno = $(".pagination-button.next.js-next").last().attr("data-page");
	   			let newurl = url + pagination;
	   			startScrapping(newurl,pageno);
	   			console.log("Finished scraping : " + newurl);
	   			console.log("Total Records : " + restaurantdetails.length);
	   		} 
		  
			if(closedrestlist.length == 0 && $(".pagination-button.next.js-next").length == 0)
			{
				 defer.resolve(restaurantdetails); 	
			}
 		 }
		   
	}); 
 
	return defer.promise;
}

function writeRecords(allres){
	let defer = q.defer();
	
		if(allres.length > 0)
		{
			 allres.forEach(function(v) { 
	          // fs.appendFileSync(outputpath,v + '\n');
	          fs.appendFileSync(outputpath,v + '\n');
	        });
	        
	         defer.resolve(0);
		}
		
	return defer.promise;
}

function scrapePipe(baselink)
{
	 defer = q.defer();
	 let deferlocal = q.defer();
	startScrapping(baselink,null).then(function(allrestdetails){
	
	// call geo modules 
	if(allrestdetails.length > 0)
	{
			geolocation.getGeoCodeFunction(allrestdetails).then(function(modarray){
				if(modarray.length > 0)
				{
						writeRecords(modarray).then(function(res){
							if(res == 0)
							{
								//Send file to HDFS.
								deferlocal.resolve(0);
								
							}
						
					});
                      
				}
				else
				{
						//bypass the null values
						deferlocal.resolve(0);
				}
	
		});
	}
});

return deferlocal.promise;
}

function readFileFunc(filename)
{
	var deferred = q.defer();
	
	fs.readFile(filename,'utf8',function(err,data){
		if(err)
		{
			deferred.reject(new Error(err));	
		}
		else{
			deferred.resolve(data);
		}
		
	});

return deferred.promise;
	
}

function uploadFiletoHadoop()
{
	
	  var hdfsfolder = "/grosvenor/HongKong/RestaurantDetails/";
	  var CheckFolderCommand = "hadoop fs -ls " + hdfsfolder;
	  let updatedfilename = outputfilename+ "_" + new Date().getTime().toString();
	  let FScommand = "hadoop fs -put " + outputpath  + " " + hdfsfolder + "; hadoop fs -mv " + hdfsfolder + "/" + outputfilename + " " + hdfsfolder + "/" + updatedfilename;
 
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

checkLocalFile.removeExistingLocalfile(outputpath).then(function(res){
 if(res == 0)
{
	readFileFunc('input/areaslist.1.txt').then(function(data){
	   arealist = data.split('\n');
	   
	   function getdata(i)
	   {
	   		if( i < arealist.length)
	   		{
	   			let url = baselink + arealist[i];
	   			area = arealist[i];
	   			console.log("Area : " + area);
	   		    restaurantdetails = [];
	   			scrapePipe(url).then(function(res){
	   				if(res == 0)
	   				{
	   					getdata(i + 1);	
	   				}
	   			})
	   			
	   			
	   		}
	   		else
	   		{
	   			uploadFiletoHadoop();	
	   		}
	   	
	   	
	   }
	   
	   getdata(0);
	   
	});
}
});