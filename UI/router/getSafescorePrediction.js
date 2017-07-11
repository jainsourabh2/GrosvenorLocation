
module.exports.getSafeScorePrediction = function(req,res,logger){

var request = require("request");
var url = "http://10.80.2.4:8047/query.json";

    let error = { errormsg : "" };

    let q = buildDrillQuery();

    let dataarray = [];
    let dataobj = {};
    
    let reqoptions = {
	    uri :url,
	    headers:{'Content-Type':'application/json'},
	    method : "POST",
	    body: JSON.stringify({queryType : 'SQL', query : q})              
  	};
       

    request(reqoptions, function(err, response, data){
      if(err){
		logger.error("Error: " + err);
		}
       if (!err && response.statusCode ==200){
           let obj = JSON.parse(data);

           for(let o =0; o < obj.rows.length; o++)
           {
             	
             	let postcode = obj.rows[o].areacode;
             	let latit = obj.rows[o].latitude;
             	let longit = obj.rows[o].longitude;
             	let safescore = obj.rows[o].safescore;

              safescore = parseFloat(safescore).toFixed(2);

               dataarray.push({  "pr" : { "pc" : postcode, "ss" : safescore  } , 
                                "ge" : {  "la" : latit, "lo" : longit}});

           
           }

           dataobj.type = "FeatureCollection";
           dataobj.features = dataarray;

           res.send(dataobj);

       	}
       });
        

//Function to build drill query based on parameters passed
function buildDrillQuery()
{
	let query = "SELECT * FROM `hive_social_media`.`default`.`safeLiverpoolAreas`";
	return query;
}

}


