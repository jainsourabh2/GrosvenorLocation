module.exports.getliverpoolstoredata = function(req,res,logger){

var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
var moment = require('moment');
var q = require('q');


    let dataset = req.query.dataset;
    let type = req.query.type;
     
    //Get drill query based on type.
    let query = getDrillQueryForType(type);
    let dataobj = {};
    let responsearray = [];
    //Make Drill Req
    
      var reqoptions = {
              uri :url,
              headers:{'Content-Type':'application/json'},
              method : "POST",
              body: JSON.stringify({queryType : 'SQL', query : query})
              
          };
          
           request(reqoptions, function(err, response, data){
              //console.log(response + " " + err + " " + data);
              if(err)
              {
                  console.log("Err: " + err);
              }
              if (!err && response.statusCode ==200){
                 //Format Response and send back
                 
                  var obj = JSON.parse(data);
                  
                  for(let r =0; r < obj.rows.length; r++)
                  {
                      let storename = obj.rows[r].storename;
                      let totalcount = obj.rows[r].totalcount;
                      let latitude = obj.rows[r].Latitude;
                      let longitude = obj.rows[r].Longitude;
                      
                     responsearray.push({
                             "pr" : {"p1" : storename , "p2" : totalcount},
                             "ge" : {"lo" : longitude , "la" : latitude }
                     });
                  }
              
                        dataobj.type = "FeatureCollection";
                            dataobj.features = responsearray;
      
                            console.log(JSON.stringify(dataobj));
                            res.send(dataobj);                   
              }
           });
    

  function getDrillQueryForType(type)
  {
      let query = "";
      
      if(type.toLowerCase() == "sales")
      {
         query = 'SELECT SUM(CAST(S.SalesValue as int)) as totalcount,S.StoreName as storename,S.Zone,M.Latitude,M.Longitude from `dfs`.`default`.`SalesView` S inner join `dfs`.`default`.`MasterStoreData` M on S.StoreName=M.StoreName and S.Zone=M.Zone group by S.StoreName,S.Zone,M.Latitude,M.Longitude' 
      }
      else if(type.toLowerCase() == "storefootfall")
      {
       query = 'SELECT SUM(CAST(F.FootfallValue as int)) as totalcount,F.StoreName as storename,F.Zone,M.Latitude,M.Longitude  from `dfs`.`default`.`StorefootfallView` F inner join `dfs`.`default`.`MasterStoreData` M on F.StoreName=M.StoreName and F.Zone=M.Zone group by F.StoreName,F.Zone,M.Latitude,M.Longitude'    
      }
      else if(type.toLowerCase() == "transactions")
      {
     query = 'SELECT SUM(CAST(T.TransactionsValue as int)) as totalcount,T.StoreName as storename,T.Zone,M.Latitude,M.Longitude  from `dfs`.`default`.`TransactionsView` T inner join `dfs`.`default`.`MasterStoreData` M on T.StoreName=M.StoreName and T.Zone=M.Zone group by T.StoreName,T.Zone,M.Latitude,M.Longitude'         
      }
      
      return query;
  }
}


