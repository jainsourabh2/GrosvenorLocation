'use strict';
let exec = require('child_process').exec;
let request = require("request");
let cheerio = require("cheerio");
let moment = require("moment");
let async = require("async");
let fs = require("fs");
let q = require("q");

let checkLocalFile = require("./createLocalFile");
let geolocation = require("./geolocation.js");
let config = require("./config");

function startScrapping(link, sublink, pageno, restaurantdetails, defer) {
	request(link, function(error, response, body) {
		console.log("StatusCode : " + response.statusCode, "error : " + error);
		console.log();

		if (!error && response.statusCode == 200) {

			let $ = cheerio.load(body, { normalizeWhitespace: true });

			let rowlists = $('.pois-restaurant-list').children();
			let closedrestlist = $('#pois-closed-restaurants').children().children();

			for (let j = 0; j < rowlists.length; j++) {
				let restname = $(rowlists[j]).find('.title-name').text().trim();
				let hrefname = $(rowlists[j]).find('.title-name').find('a').attr('href');
				let hrefarray = (hrefname != undefined) ? hrefname.split('/') : null;
				let hrefidarray = (hrefarray != null) ? hrefarray[hrefarray.length - 1].split('-') : null;
				let restid = (hrefidarray != null) ? hrefidarray[hrefidarray.length - 1] : null;
				let style = $(rowlists[j]).find('.details-wrapper').find('.door-photo').attr('style');
				let imageurl = (style != undefined) ? style.substring(style.indexOf("https"), style.indexOf("jpg") + 3) : null;
				let pricerange = $(rowlists[j]).find(".icon-info-food-price").text().trim();
				let cuisinetype = $($(rowlists[j]).find(".icon-info-food-name").find("li")[0]).text();
				let rev = $(rowlists[j]).find('.counters-container').children().text();
				let noofreviews = (rev != undefined) ? rev.substring(rev.indexOf("(") + 1, rev.indexOf(")")).split(" ")[0] : null;
				let noofratings = $(rowlists[j]).find('.bookmarkedUserCount').attr('data-count');
				let smilefacerating = $(rowlists[j]).find('.smile-face').children('span').text();
				let sadfacerating = $(rowlists[j]).find('.sad-face').children('span').text();
				let address = $(rowlists[j]).find('.address').children('span').text().trim();
				let datestamp = moment().format("DD-MM-YYYY");
				let status = "Open";
				let completerecord = datestamp + "|" + restid + "|" + restname + "|" + status + "|" + imageurl + "|" + pricerange + "|" + cuisinetype + "|" + noofreviews + "|" + noofratings + "|" + address + "|" + smilefacerating + "|" + sadfacerating;
				restaurantdetails.push(completerecord);
			}

			if (closedrestlist.length > 0) {
				//build closed url -  pageno, areaname, count
				let count = $('.pois-closed-restaurants-collapse-toggle').attr('data-count');
				let closedlink = config.closedRestUrl + pageno + "&sortBy=Default&" + sublink + "&uiCity=hongkong&uiLang=en&count=" + count ;
				//	let pageno = 

				async.series([
					function(callback) {
						request(closedlink, function(err, res) {
							if(err){
								callback(err);
							} else {
								let jsonobj = JSON.parse(res.body);

								for (let k = 0; k < jsonobj.results.length; k++) {
									let datestamp = moment().format("DD-MM-YYYY");
									let name = jsonobj.results[k].name;
									let restidarray = (jsonobj.results[k].urlUI != undefined) ? jsonobj.results[k].urlUI.split('/') : null;
									let t1rest = (restidarray != null) ? restidarray[restidarray.length - 1] : null;
									let t2restarray = (t1rest != null) ? t1rest.split('-') : null;
									let restid = (t2restarray != null) ? t2restarray[t2restarray.length - 1] : null;
									let status = "Closed";
									let imageurl = (jsonobj.results[k].doorPhoto != undefined) ? jsonobj.results[k].doorPhoto.url : null;
									let pricerange = jsonobj.results[k].priceUI;
									let cuisinetype = (jsonobj.results[k].categories != undefined) ? jsonobj.results[k].categories[0].name : null;
									let noofreviews = jsonobj.results[k].reviewCount;
									let noofratings = jsonobj.results[k].rating;
									let address = jsonobj.results[k].address;
									let smilefacerating = jsonobj.results[k].scoreSmile;
									let sadfacerating = jsonobj.results[k].scoreCry;
									let latitude = jsonobj.results[k].mapLatitude;
									let longitude = jsonobj.results[k].mapLongitude;

									let completerecord = datestamp + "|" + restid + "|" + name + "|" + status + "|" + imageurl + "|" + pricerange + "|" + cuisinetype + "|" + noofreviews + "|" + noofratings + "|" + address + "|" + smilefacerating + "|" + sadfacerating;
									restaurantdetails.push(completerecord);
								}

								callback(null, restaurantdetails);
							}
						});
					}
				], function(err, data) {
					if(err){
						defer.reject(err);
					} else {
						defer.resolve(data[0]);
					}
				});
			}

			if ($(".pagination-button.next.js-next").length > 0) {
				let pagination = $(".pagination-button.next.js-next").last().attr("href");
				let pageno = $(".pagination-button.next.js-next").last().attr("data-page");
				let newurl = config.url + pagination;
				startScrapping(newurl, sublink, pageno, restaurantdetails, defer);
				console.log("Finished scraping : " + newurl);
				// console.log("Total Records : " + restaurantdetails.length);
			}

			if (closedrestlist.length == 0 && $(".pagination-button.next.js-next").length == 0) {
				defer.resolve(restaurantdetails);
			}
		}

	});

	return defer.promise;
}

function scrapePipe(baselink, sublink) {
	let defer = q.defer();
	let deferlocal = q.defer();
	let restaurantdetails = [];
	
	startScrapping(baselink, sublink, null, restaurantdetails, defer).then(function(allrestdetails) {

		// call geo modules 
		if (allrestdetails.length > 0) {
			geolocation.getGeoCodeFunction(allrestdetails).then(function(modarray) {
				if (modarray.length > 0) {
					writeRecords(modarray).then(function(res) {
						if (res == 0) {
							deferlocal.resolve(0);
						}
					});
				} else {
					deferlocal.resolve(0);
				}

			});
		} else {
			deferlocal.resolve(0);
		}
	});

	return deferlocal.promise;
}

function readFileFunc(filename) {
	var deferred = q.defer();

	fs.readFile(filename, 'utf8', function(err, data) {
		if (err) {
			deferred.reject(new Error(err));
		} else {
			deferred.resolve(data);
		}
	});

	return deferred.promise;
}

function writeRecords(allres) {
	let defer = q.defer();

	if (allres.length > 0) {
		allres.forEach(function(v) {
			fs.appendFileSync(config.localOutputPath + config.outputFileName, v + '\n');
		});

		defer.resolve(0);
	}

	return defer.promise;
}

function uploadFiletoHadoop() {

	let updatedfilename = config.outputFileName + "_" + new Date().getTime().toString();
	let FScommand = "hadoop fs -put " + config.localOutputPath + config.outputFileName + " " + config.hdfsOutputPath + "; hadoop fs -mv " + config.hdfsOutputPath + config.outputFileName + " " + config.hdfsOutputPath + updatedfilename;

	exec(FScommand, function(error, stdout, stderr) {

		if (error !== null) {
			console.log('exec error: ' + error);
		}
		else {
			console.log("File successfully uploaded ");
			process.exit(0);
		}
	});

}

async.waterfall([
	function(cb){
		checkLocalFile.removeExistingLocalfile(config.localOutputPath + config.outputFileName).then(function(err) {
			if(err){
				cb(err);
			} else {
				cb();
			}
		})
	},
	function(cb){
		readFileFunc(config.districtsInputFile).then(function(districtData) {
			cb(null, districtData);
		})
	},
	function(districtData, cb){
		readFileFunc(config.cuisinesInputFile).then(function(cuisineData) {
			cb(null, districtData, cuisineData);
		})
	},
	function(districtData, cuisineData, cb){
		let districts = districtData.split('\n');
		let cuisines = cuisineData.split('\n');
	
		let allSubLinks = [];
		for (let j = 0; j < districts.length; j++) {
			for (let k = 0; k < cuisines.length; k++) {
				if(districts[j] != '' && cuisines[k] != ''){
					let sublink = 'districtId=' + districts[j] + '&cuisineId=' + cuisines[k];
					allSubLinks.push(sublink);
				}
			}
		}
		console.log('allSubLinks', allSubLinks);
		cb(null, allSubLinks);
	}
	
], function(err, allSubLinks){
	if(err){
		console.log('ERROR', err);
		
	} else {
		async.forEachLimit(allSubLinks, 10, function(sublink, callback) {
			let url = config.baseLink + sublink;
			scrapePipe(url, sublink).then(function(res) {
				callback();
			})
		}, function(err) {
	        if (err) {
				console.log('ERROR', err);
	        } else {
	        	// uploadFiletoHadoop();
	        }
	    });
	}
})
