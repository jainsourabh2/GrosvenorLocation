module.exports.getliverpooloneFBdata = function(req,res,logger){

var request = require("request");
var url = "http://10.80.2.4:8047/query.json";
var moment = require('moment');
var q = require('q');

    let dataset = req.query.dataset;
    let startdate = req.query.startdate;
    let enddate = req.query.enddate;
    let todaydate = new Date().toLocaleDateString();
    let error = {errormsg : ""};    
     let sdate = (startdate != undefined) ? startdate : moment(todaydate,"yyyy-mm-dd").subtract(1,'days').toISOString().split('T')[0];  //Format in yyyy-mm-dd Current date
     let edate = (enddate != undefined) ? enddate :  moment(todaydate,"yyyy-mm-dd").toISOString().split('T')[0]; //Format in yyyy-mm-dd Tomorows date 
     
     if(dataset == undefined || dataset != 'facebook')
     {
        error.errormsg = "Dataset parameter is mandatory and its value must be facebook";
        res.send(error);
     }

     let query = " select count(1) as postcount,A.id,A.name,A.category,B.Latitude,B.Longitude from `hive_social_media`.`default`.`facebookdata` A inner join `dfs`.`default`.`MasterStoreData` B on " + 
                 " LOWER(A.username) = LOWER(B.FBHandle)  where A.fb_date between '" + sdate + "' and '" + edate + "' and LOWER(A.username) in(" + 
                 "'adidasuk','allsaints','americanapparel','annsummersofficial','apple','barburritouk','barberbarberuk','bembrasil'," +
                 "'birminghambierkeller','billsrestaurants','boseuk','bouxavenue','bravissimo','brownsfashion','buildabear','busabaeathai'," +
                 "'byronhamburgers','cadenzza','caffenero','card-factory-124991387578486','cassArt1984','cathkidston','liverpoolchaophraya'," +
                 "'claireseurope','clintonsuk','coaststores','costacoffee','cosyclubliverpool','d.m.robinson.jewellers','debenhams','alive-dirty-460312137396247'," +
                 "'disneystoreuk','drmartens','dunelondon','eatltduk','edseasydiners','ernestjonesjewellers','evanscycles','everton','fishlocks.flowers.liverpool'," +                  "'flannelsfashion','fredperry','gourmetburgerkitchen','ukgap','goldsmithsuk','greggsofficial','hmunitedkingdom','hsamuelthejeweller','harveynichols',"+
                 "'hobbsvip','hollister','hotelchocolat','hugoboss','interestingeat','jdsportsofficial','jackandjonesUK','jackwolfskinofficial','jamiesitalianuk'," +
                 "'jonesbootmaker','junglerumbleuk','karenmillen','kiehls','krispykremeuk','kuonitraveluk','loccitane.uk','liverpoolfc','lakelanduk','lasiguanasuk'," +
                 "'lego','levis.gb','lindtuk','lunya','mamasandpapas','mango.com','menkind','michaelkors','milliesliverpool','missselfridge','modainpelle'," + 
                 "'monsoonuk','like.mooboo','nandos.unitedkingdom','newlookfashion','nike','o2uk','oasisfashions','officeshoes1','pandorajewelry','paperchase'," +
                 "'pizzaexpress','pizzahutuk','pretamanger','prettygreenltd','pullandbear','radleylondon','redhotbuffet','redsbbqliverpool','reiss','rolex'," +
                 "'roxyballroomliverpool','sky','sblended.milkshakes.uk','schuhshoes','selectonline','7liverpool-266703353688640','simplybefashion','skechers'," +
                 "'smiggleuk','sportsdirect','starbucksuk','subwayukireland','superdry','ststudio.hq','swarovskicom','swatchuk','tgifridaysuk','tailorthread'," +
                 "'tavernL1','tedbaker','tessutiuk','thebodyshopuk','theclubhousel1','theentertainertoyshop','fragranceshopuk','fueljuicebars','thenorthface'," +
                 "'theperfumeshoponline','thewhitecompany','thorntonschocs','topshop','tortillauk','toysrusuk','turtlebayrestaurants','uscfashion','ugguk'," +
                 "'urbandecaycosmetics','urbanoutfitterseurope','utilitydesign.co.uk','vanseurope','victoriassecret','whsmith','wagamama-uk-1837864496502928'," +
                 "'wahaca','warehousefashion','waterstones','thisiswhistles','whitewallgalleries','yardandcoop','yeerahliverpool','yosushi','zara','zizziliverpool') group by A.id,A.name,A.category,B.Latitude,B.Longitude" ;
        
        let dataarray = [];
        let dataobj = {};
        
      let reqoptions = {
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
                  
              var obj = JSON.parse(data);
              //console.log(obj);
              for(let n =0; n < obj.rows.length; n++)
              {
                  let facebookid = obj.rows[n].id;
                  let facebookpagename = obj.rows[n].name;
                  let pagecategory = obj.rows[n].category;
                  let latitude = obj.rows[n].Latitude;
                  let longitude = obj.rows[n].Longitude;
                  let postcount = obj.rows[n].postcount;

                  dataarray.push({
                             "pr" : {"p1" : facebookpagename,"p2" : pagecategory, "p3" : postcount,"id": facebookid },
                             "ge" : {"lo" : longitude , "la" : latitude }
                     });

              }
              
                dataobj.type = "FeatureCollection";
                      dataobj.features = dataarray;
          
                      console.log(JSON.stringify(dataobj));
                      res.send(dataobj);  
              }
           });


}


