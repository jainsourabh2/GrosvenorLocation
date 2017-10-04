'use strict';
let xml2js = require('xml2js').parseString;
let exec = require('child_process').exec;
let request = require("request");
let moment = require("moment"); 
let async = require("async"); 
let fs = require("fs");
let q = require("q");

let checkLocalFile = require("./createLocalFile");
let config = require("./config");

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

function writeToLocal(allRecords, localOutputPath, outputFileName) {
	let defer = q.defer();

	if (allRecords.length > 0) {
        fs.appendFileSync(localOutputPath + '/' + outputFileName, allRecords);
		defer.resolve('done');
	} else {
	    defer.resolve('done');
	}

	return defer.promise;
}

function writeToHadoop(localOutputPath, hdfsOutputPath, outputFileName) {
    let defer = q.defer();
    
    var fileToCopy = localOutputPath + '/' + outputFileName;
	let updatedFilename = outputFileName + "_" + new Date().getTime().toString();
	
	let FScommand = "hadoop fs -put " + fileToCopy + " " + hdfsOutputPath + "; hadoop fs -mv " + hdfsOutputPath+"/"+outputFileName + " " + hdfsOutputPath + "/" + updatedFilename;

	exec(FScommand, function(error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
			defer.reject(error);
		} else {
			console.log("File successfully uploaded ");
			defer.resolve(0);
		}
	});
    return defer.promise;
}

function parseXmlUrl(xmlURL, type){
    var defer = q.defer();
    request(xmlURL, function(error, response, body) {
        
        console.log("StatusCode : " + response.statusCode);
        console.log("error : " + error);
        
        if (!error && response.statusCode == 200) {
            
            xml2js(body, function (err, result) {
                
                if(err){
                    console.log('err', err);
                } else {
                    
                    if(type == 'venues'){
                        let allRecords  = '';
                        let arr = result.venues.venue;
                        
                        for(let i=0; i < arr.length; i++){
                            // console.log(i, arr[i].$.id);
                            let id = arr[i].$.id.toString().replace(/[\r\n]/g,'');
                            let venuee = arr[i].venuee.toString().replace(/[\r\n]/g,'');
                            let venuec = arr[i].venuec.toString().replace(/[\r\n]/g,'');
                            let lat = arr[i].latitude.toString().replace(/[\r\n]/g,'');
                            let long = arr[i].longitude.toString().replace(/[\r\n]/g,'');
                            
                            let completeRecord = id + "|" + venuec + "|" + venuee + "|" + lat + "|" + long + "\n";
                            allRecords = allRecords + completeRecord;
                        }
                        defer.resolve(allRecords);
                        
                    } else if(type == 'events'){
                        let allRecords = '';
                        let arr = result.events.event;
                        
                        for(let i=0; i < arr.length; i++){
                            let id = arr[i].$.id.toString().replace(/[\r\n]/g,'');
                            let titlec = arr[i].titlec.toString().replace(/[\r\n]/g,'');
                            let titlee = arr[i].titlee.toString().replace(/[\r\n]/g,'');
                            let cat1 = arr[i].cat1.toString().replace(/[\r\n]/g,'');
                            let cat2 = arr[i].cat2.toString().replace(/[\r\n]/g,'');
                            let predateC = arr[i].predateC.toString().replace(/[\r\n]/g,'');
                            let predateE = arr[i].predateE.toString().replace(/[\r\n]/g,'');
                            let progtimec = arr[i].progtimec.toString().replace(/[\r\n]/g,'');
                            let progtimee = arr[i].progtimee.toString().replace(/[\r\n]/g,'');
                            let venueid = arr[i].venueid.toString().replace(/[\r\n]/g,'');
                            let agelimitc = arr[i].agelimitc.toString().replace(/[\r\n]/g,'');
                            let agelimite = arr[i].agelimite.toString().replace(/[\r\n]/g,'');
                            let pricec = arr[i].pricec.toString().replace(/[\r\n]/g,'');
                            let pricee = arr[i].pricee.toString().replace(/[\r\n]/g,'');
                            let descc = arr[i].descc.toString().replace(/[\r\n]/g,'');
                            let desce = arr[i].desce.toString().replace(/[\r\n]/g,'');
                            let urlc = arr[i].urlc.toString().replace(/[\r\n]/g,'');
                            let urle = arr[i].urle.toString().replace(/[\r\n]/g,'');
                            let tagenturlc = arr[i].tagenturlc.toString().replace(/[\r\n]/g,'');
                            let tagenturle = arr[i].tagenturle.toString().replace(/[\r\n]/g,'');
                            let remarkc = arr[i].remarkc.toString().replace(/[\r\n]/g,'');
                            let remarke = arr[i].remarke.toString().replace(/[\r\n]/g,'');
                            let enquiry = arr[i].enquiry.toString().replace(/[\r\n]/g,'');
                            let fax = arr[i].fax.toString().replace(/[\r\n]/g,'');
                            let email = arr[i].email.toString().replace(/[\r\n]/g,'');
                            let saledate = arr[i].saledate.toString().replace(/[\r\n]/g,'');
                            let interbook = arr[i].interbook.toString().replace(/[\r\n]/g,'');
                            let presenterorgc = arr[i].presenterorgc.toString().replace(/[\r\n]/g,'');
                            let presenterorge = arr[i].presenterorge.toString().replace(/[\r\n]/g,'');
                            let prog_image = arr[i].prog_image.toString().replace(/[\r\n]/g,'');
                            let detail_image1 = arr[i].detail_image1.toString().replace(/[\r\n]/g,'');
                            let detail_image2 = arr[i].detail_image2.toString().replace(/[\r\n]/g,'');
                            let detail_image3 = arr[i].detail_image3.toString().replace(/[\r\n]/g,'');
                            let detail_image4 = arr[i].detail_image4.toString().replace(/[\r\n]/g,'');
                            let detail_image5 = arr[i].detail_image5.toString().replace(/[\r\n]/g,'');
                            let video_link = arr[i].video_link.toString().replace(/[\r\n]/g,'');
                            let video2_link = arr[i].video2_link.toString().replace(/[\r\n]/g,'');
                            let my_culture_app = arr[i].my_culture_app.toString().replace(/[\r\n]/g,'');
                            let submitdate = arr[i].submitdate.toString().replace(/[\r\n]/g,'');
                            
                            let completeRecord = id + "|" + titlec + "|" + titlee + "|" + cat1 + "|" + cat2 + "|" + predateC + "|" + predateE + "|" + progtimec +
                                "|" + progtimee + "|" + venueid + "|" + agelimitc + "|" + agelimite + "|" + pricec + "|" + pricee + "|" + descc +
                                "|" + desce + "|" + urlc + "|" + urle + "|" + tagenturlc + "|" + tagenturle + "|" + remarkc + "|" + remarke +
                                "|" + enquiry + "|" + fax + "|" + email + "|" + saledate + "|" + interbook + "|" + presenterorgc + "|" + presenterorge +
                                "|" + prog_image + "|" + detail_image1 + "|" + detail_image2 + "|" + detail_image3 + "|" + detail_image4 +
                                "|" + detail_image5 + "|" + video_link + "|" + video2_link + "|" + my_culture_app + "|" + submitdate + "\n";
                            
                            allRecords = allRecords + completeRecord;
                        }
                        defer.resolve(allRecords);
                    }
                }
            });
            
            console.log('url parsed');
        }
    });
    console.log('returning');
    return defer.promise;
}

function startParsing(xmlURL, type, cb){
    var localOutputPath = config.localOutputPath;
    var hdfsOutputPath ;
    var outputFilename ;
    
    if(type == 'venues'){
        hdfsOutputPath = config.hdfsVenuesOutputPath;
        outputFilename = config.venuesOutputFileName;
    } else if(type == 'events'){
        hdfsOutputPath = config.hdfsEventsOutputPath;
        outputFilename = config.eventsOutputFileName;
    }

    async.waterfall([
        function(callback){
            checkLocalFile.removeExistingLocalfile(localOutputPath + '/' + outputFilename).then(function(err) {
                if (err) {
                    console.log('Delete error');
                    callback(err);
                } else {
                    console.log('Delete done');
                    callback();
                }
            });
        },
        function(callback){
            parseXmlUrl(xmlURL, type).then(function(allRecords){
                console.log('parse done');
                // console.log(allRecords);
                callback(null, allRecords);
            });
        },
        function(allRecords, callback){
            writeToLocal(allRecords, localOutputPath, outputFilename).then(function(res){
                console.log("Write to local done");
                callback(null);
            });
        },
        function(callback){
            writeToHadoop(localOutputPath, hdfsOutputPath, outputFilename).then(function() {
                callback();
            });
        }
    ], function(err){
        if(err){
            console.log('ERROR', err);
        }
        cb();
    });
}

async.parallel([
    function(cb){
        startParsing(config.venuesUrl, 'venues', cb);
    },
    function(cb){
        startParsing(config.eventsUrl, 'events', cb);
    }
], function(){
    process.exit();
})