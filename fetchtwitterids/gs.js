"use strict";

var exports = module.exports = {};

exports.getGoogleCustomSearchTwitterHandle = function(googleSearch,query,callback){

const qarray = query.split(" ");
var twitterArray=[];

var initialsTwitterHandle ="";
for(let j=0;j<qarray.length;j++){
  initialsTwitterHandle = initialsTwitterHandle + qarray[j].substring(0,1);
  }
initialsTwitterHandle = initialsTwitterHandle.substring(0,initialsTwitterHandle.length-1);


    googleSearch.build({
      q: query,
      start: 1,
      //fileType: "*",
      gl: "uk", //geolocation,
      num: 10, // Number of search results to return between 1 and 10, inclusive
      siteSearch: "https://twitter.com" // Restricts results to URLs from a specified site
      }, function(error, response) {
      let k=0;
      var obj = JSON.parse(JSON.stringify(response.items));
      //console.log(obj);
      for(let i=0;i<obj.length;i++){
        let link = obj[i].link;
        let displayLink = obj[i].displayLink;
        let slashOccurence = (link.match(/\//g) || []).length;

        if((displayLink === 'twitter.com') && (slashOccurence === 3)){
          if (link.includes("status") || link.includes("mobile") || link.includes("hashtag")) {
          } else {
            //console.log(twitterArray);
            console.log(k);
            let twitterHandle = link.substring(20,link.length);
            twitterArray.push([twitterHandle,0]);

            //Check 1 for initials
            if(twitterHandle.toLowerCase().includes(initialsTwitterHandle.toLowerCase())){
              //console.log(twitterHandle + " is the correct one");
              twitterArray[k][1] = twitterArray[k][1] + 1;
            }

          //Check 2
          // check if the words are present in the handle
            for(let j=0;j<qarray.length;j++){
              if(twitterHandle.toLowerCase().includes(qarray[j].toLowerCase())){
                //console.log(twitterHandle + " is the correct one");
                twitterArray[k][1] = twitterArray[k][1] + 1;
              }

              //Check 3 . Exact match with one of the words.
              if(twitterHandle.toLowerCase() === qarray[j].toLowerCase()){
                //console.log(twitterHandle + " is the correct one");
                twitterArray[k][1] = twitterArray[k][1] + 1;
              }
            }
            k=k+1;
          }
        }
      }
      twitterArray.sort(sortFunction);
      console.log(twitterArray);
      callback(null,twitterArray);
    });
};

function sortFunction(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] > b[1]) ? -1 : 1;
    }
}
