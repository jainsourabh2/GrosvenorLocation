'use strict';
let request = require('request');
//http://api.eventful.com/json/events/search?app_key=58DzFPNGM4FphBWC&location=liverpool%20UK%20&within=5&date=2014010100-2017123100&page_size=100
let Q = require('q');
const sanitizeHtml = require('sanitize-html');
let fs = require("fs");
let appkey = "58DzFPNGM4FphBWC";
let applocation = "liverpool UK";
let appdaterange = "2014010100-2017123100"; //Date Range to change in format yyyymmdd00-yyyymmdd00
let appwithin = 5;
let apppagesize = 100;
let appageno = 1;
let basefolderpath = "outputfile/";
var checkHDFS = require("./checkHDFSFolderexists");
var checkLocalFile = require('./createLocalFile');
let filename = "outputfile/Events.txt";

let apiurl = "http://api.eventful.com/json/events/search?";
let apikey = "app_key=" + appkey;
let location = "&location=" + applocation;
let withinradius = "&within=" + appwithin;  //5 miles radius from location
let daterange = "&date=" + appdaterange;
let pagesize = "&page_size=" + apppagesize;


let appurl = apiurl + apikey + location + withinradius + daterange + pagesize;
let totalevents = [];
 var defered = Q.defer();
 
function eventIngest(pageno)
{
   
    
        let reqoptions = {
              uri : appurl + "&page_number=" + pageno ,
              method : "GET"
    };
            
 
    request(reqoptions,function(err,response,data){
        if(err)
        {
            console.log("Eror in requesting API: " + err);
        }
        
        if(!err && response.statusCode ==200)
        {
             let eventdata = JSON.parse(data);
            let totalcount = eventdata.page_count;
            for(let c =0; c < eventdata.events.event.length; c++)
            {
               totalevents.push(eventdata.events.event[c]); 
            }
            console.log("Total Page Count: " + totalcount);
            console.log("Processed page : " + pageno );
              if(pageno < totalcount)
            //  if(pageno < 2)
              {
                  eventIngest(pageno + 1);
              }
              else
              {
                  console.log(totalevents.length);
                  defered.resolve(totalevents);
              }
            
            //defered.resolve(totalevents);
            //console.log(eventdata);
        }
    });
    
    return defered.promise;
}



function parseData(data)
{
   // let defered = Q.defer();
    let properies = ["watching_count","olson_path","calendar_count","comment_count","region_abbr","postal_code","going_count","all_day",
        "latitude","groups","url","id","privacy","city_name","link_count","longitude","country_name","country_abbr","region_name","start_time",
        "tz_id","description","modified","venue_display","tz_country","performers","title","venue_address","geocode_type","tz_olson_path",
        "recur_string","calendars","owner","going","country_abbr2","image","created","venue_id","tz_city","stop_time","venue_name","venue_url"];
      
      let performerproperty = ["performers.performer.creator","performers.performer.linker","performers.performer.name",
        "performers.performer.url","performers.performer.id","performers.performer.short_bio"];
        
        
    for(let g =0; g < data.length; g++)
    {
        let eachrow = "";
        for(let p =0 ; p < properies.length; p++)
        {
            try
            {
                if(properies[p] == "performers")
                {
                    if(eval("data[" + g + "]" + "." + properies[p]) != null)
                    {
                        for(let y=0; y < performerproperty.length; y++)
                        {
                            let eachval = eval("data[" + g + "]" + "." + performerproperty[y]);
                            eachval = (eachval != null) ? eachval.replace(/\|/g,'#').trim() : eachval;
                            eachrow +=  eachval + "|";
                        }
                    }
                    else
                    {
                      for(let y=0; y < performerproperty.length; y++)
                        {
                            eachrow += 'null' + "|";
                        }   
                    }
                }
               
               else if(properies[p] == "image")
                {
                    if(eval("data[" + g + "]" + "." + properies[p]) != null)
                    {
                        let imageurl = eval("data[" + g + "]" + "." +  properies[p] + ".medium.url");
                        eachrow +=  imageurl + "|";
                    }
                    else
                    {
                        eachrow += 'null' + "|";
                    }
                    
                }
                else
                {
                    let val = eval("data[" + g + "]" + "." + properies[p]);
                    val = (val != null) ? val.replace(/\|/g,'#').trim() : val;
                    eachrow += (val == "") ? 'null' : val + "|";
                }
             //eachrow += eval("data[" + g + "]" + "." + properies[p]) + "|";
            }
            catch(er)
            {
                console.log(er);
            }
            
        }
        eachrow = eachrow.substr(0,eachrow.length - 1);
       
        
        //Check for new line and special characters.
        
        eachrow = eachrow.replace(/<3/g,'').trim();
	    eachrow = eachrow.replace(/(\r\n|\n|\r)/gm,"").trim();
	    eachrow = eachrow.replace(/&amp;/gi,'&').trim();
    	eachrow = eachrow.replace(/&lt;/gi,'<').trim();
    	eachrow = eachrow.replace(/&gt;/gi,'>').trim();
    	eachrow = eachrow.replace(/&quot;/gi,'"').trim();
    	eachrow = eachrow.replace(/\t/g,'').trim();
    	eachrow = eachrow.replace(/\n/g,'').trim();
    	eachrow = eachrow.replace(/\r/g,'').trim();
    	eachrow = eachrow.replace(/(?:\r\n|\r|\n)/g,' ').trim();
	    eachrow += '\n';
        
            fs.appendFile(filename,eachrow,'UTF-8',function(err,wres){
              if(!err)
              {
                  defered.resolve(0);
              }
        
             });
                    
        console.log(eachrow);
        
    }
    
    return defered.promise;
}

eventIngest(appageno).then(function(resultdata){
    let resultarray = resultdata;
   
    parseData(resultarray).then(function(data){
       if(data == 0)
       {
           console.log("File Written");
       }
    })
});

