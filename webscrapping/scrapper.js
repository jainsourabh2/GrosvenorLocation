"use strict";

const request = require('request');
const cheerio = require('cheerio');
const ineed = require('ineed');
const config = require('../config/config.js');
const logger = require('../config/log.js');
const postcodes = config.postcodes;
const localbusiness = config.localbusiness;
const baseURL = 'https://www.yell.com/ucs/UcsSearchAction.do?&searchType=manualexpansion&filterDistance=0&intCam=intToolbar';
var array = [[],[]];
var paths = [];
let nameIndex=0;
let urlIndex=0;

const options = {
  headers: {'user-agent': 'student'}
  };


function IterateOver(list, iterator, callback) {
    // this is the function that will start all the jobs
    // list is the collections of item we want to iterate over
    // iterator is a function representing the job when want done on each item
    // callback is the function we want to call when all iterations are over

    let doneCount = 0;  // here we'll keep track of how many reports we've got

    function report() {
        // this function resembles the phone number in the analogy above
        // given to each call of the iterator so it can report its completion

        doneCount++;

        // if doneCount equals the number of items in list, then we're done
        if(doneCount === list.length)
            callback();
    }

    // here we give each iteration its job
    for(let i = 0; i < list.length; i++) {
        // iterator takes 2 arguments, an item to work on and report function
        logger.debug(i);
        iterator(list[i], report);
    }
}

function deriveSocialHandles(){
	console.log(array);
}

function processURLs(){
	console.log(array);
	IterateOver(paths, function(path, report) {
		request(path,options, function (error, response, body) {
			logger.info("StatusCode : " + response.statusCode);
			logger.error("error : " + error);
			//logger.debug(body);
			if (!error && response.statusCode == 200){
				logger.debug("Inside 2");
				let $ = cheerio.load(body,{normalizeWhitespace: true});
				logger.debug("$ extracted");
				let checkerror = $('h1').text();
				logger.debug("Check : " + checkerror);
				if (checkerror.includes('Sorry') === true){
					logger.info('No more results available');
				} else if (checkerror.includes('We have detected an increased number of attempts to access this webapp') === true) {
					logger.warn('Threshold limit reached for the API call to yell');
					process.exit(1);
				}
				else{
					$('.businessCapsule--callToAction').each(function(i, element){
						let webSite = $(this).children().attr('href');
						if (webSite !== undefined){
							array[urlIndex][1] = webSite;
						}
						urlIndex++;
					});
				}
			}else{
				logger.error(response.statusCode);
			}

	    // we must call report to report back iteration completion
	    report();

		});
	}, deriveSocialHandles);
}

for (let i=0;i<postcodes.length;i++){
	for(let j=0;j<localbusiness.length;j++){
		for(let k=0;k<10;k++){
			let url = '';
			if(k===0){
				url = baseURL+'&keywords='+localbusiness[j]+'&location='+postcodes[i];
				paths.push(url);
			}else{
				url = baseURL+'&keywords='+localbusiness[j]+'&location='+postcodes[i]+'&pageNum='+k;
				paths.push(url);
			}
		}
	}
}

IterateOver(paths, function(path, report) {
	request(path,options, function (error, response, body) {
		logger.info("StatusCode : " + response.statusCode);
		if (!error && response.statusCode == 200){
			logger.debug("Inside 1");
			let $ = cheerio.load(body,{normalizeWhitespace: true});
			logger.debug("$ extracted 1");
			let checkerror = $('h1').text();
			logger.debug("checkerror1 : " + checkerror);
			if (checkerror.includes('Sorry') === true){
				logger.info('No more results available');
			} else if (checkerror.includes('We have detected an increased number of attempts to access this webapp')) {
				logger.warn('Threshold limit reached for the API call to yell');
				process.exit(1);
			}
			else{
				$('h2').each(function(i, element){
					array[nameIndex] = [];
					array[nameIndex][0] = $(this).text();
					nameIndex++;
				});
			}
		}else{
			logger.error(response.statusCode);
			//console.log(res)
		}
    // we must call report to report back iteration completion
    report();

	});
}, processURLs);


/*
function scrapNameNWebSite(url,localbusiness,postcode){
	console.log('#####');
	console.log(url);
	request(url,options, function (error, response, body) {
		let $ = cheerio.load(body,{normalizeWhitespace: true});
		let checkerror = $('h1').text();
		if (checkerror.includes('Sorry') === true){
			console.log('No more results available');
			return 1;
		}else{
			$('h2').each(function(i, element){
				array[index] = [];
				array[index][0] = $(this).text();
				index++;
				console.log(index);
			});
			return 0;
		}
	});
}

*/

/*
let domain = 'https://www.yell.com/ucs/UcsSearchAction.do?&searchType=manualexpansion&filterDistance=0&intCam=intToolbar&keywords=shop&location=W1K&pageNum=5'

request(domain,options, function (error, response, body) {
	let $ = cheerio.load(body,{normalizeWhitespace: true});
	let array = [[],[]];
	let checkerror = $('h1').text();
	if (checkerror.includes('Sorry') === true){
		console.log('No more results available');
	}else{

    		$('h2').each(function(i, element){
			array[i] = [];
	  		array[i][0] = $(this).text();
		});


        	$('.businessCapsule--callToAction').each(function(i, element){
			array[i][1] = $(this).children().attr('href');
			console.log('WebSite :::: ' + array[i][1]);
			ineed.collect.hyperlinks.from(array[i][1],function (err, response, result) {
				if (result!=null && result.hyperlinks.length > 0){
					console.log('############################################');
					console.log('WebSite :: ' + array[i][1]);
					for(let j=0;j< result.hyperlinks.length;j++){
						if(result.hyperlinks[j].href.includes('www.facebook') && !result.hyperlinks[j].href.includes('pages') && !result.hyperlinks[j].href.includes('sharer')){
							console.log(result.hyperlinks[j].href);
							array[i][2] = result.hyperlinks[j].href;
						}
                                                //if(result.hyperlinks[j].href.includes('instagram') && result.hyperlinks[j].href.includes('www')){
						//        console.log(result.hyperlinks[j].href);
						//        array[i][3] = result.hyperlinks[j].href;													                                        //}
						if(result.hyperlinks[j].href.includes('www.twitter')){
						        console.log(result.hyperlinks[j].href);
	                                                array[i][3] = result.hyperlinks[j].href;                                                                                                                                                }

					}
				}else{
					console.log('0');
				}
			});

		});
	}

	console.log(array);

})
*/
