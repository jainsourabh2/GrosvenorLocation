'use strict';
let fs = require("fs");
let folderpath = "outputimages/LiverpoolImage";

fs.readdir(folderpath,function(err,files){
    
    for(let j =0; j < files.length; j++)
    {
        let newname = files[j].replace(/ /g,'');
        fs.renameSync("outputimages/LiverpoolImage/" +  files[j], "outputimages/LiverpoolImage/" +  newname ,function(er){
           if(er)
           {
             console.log(er); 
           }
           console.log("Renamed file : " + newname);
        });
    }
    
});
