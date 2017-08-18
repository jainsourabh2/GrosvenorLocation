'use strict';
var fs = require("fs"); 
const Q = require("q");

 module.exports.removeExistingLocalfile = function (filename)
{
       let defer = Q.defer();
       
          if(fs.existsSync(filename))
          {
            fs.unlink(filename, function(err) {
               if(err)
               {
                   defer.reject(new Error(err));
               }
               else
               {
                   defer.resolve(0);
               }
              
            });
          }
          else
          {
              defer.resolve(0);
              console.log("File does not exists. Hence creating new file");
          }
       
        
        return defer.promise;
   }