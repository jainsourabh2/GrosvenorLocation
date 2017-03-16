//Module to check for existing HDFS folder before putting the file

'use strict';

const Q = require('q');
var child;
var exec = require('child_process').exec;

module.exports.checkHDFSFolderExist = function(CheckFolderCommand,mkdirCommand){
        
        let deferred = Q.defer();
		      
    	child = exec(CheckFolderCommand,function(error,stdout,stderr){
    	    
    		        if(error != null)
    		        {
			         console.log("Folder does not exists so mkdir command");
    		            //deferred.reject(new Error(error));
			            //Folder does not exists so mkdir command
    		          exec(mkdirCommand , function(err,stdout,stderr){
    		                  if(err != null)
    		                  {
            				     console.log(err);
    		                      deferred.reject(new Error(stderr));
    		                  }
    		                  else{
    		                      deferred.resolve(0);
    		                  }
    		               });
        		        }
        		        else{
        		            //deferred.resolve(stdout);
        		             deferred.resolve(0); // Folder exists
        		            
        		        }
    		   });
    		   
    		   return deferred.promise;
    
}