var fs = require('fs'),
_ = require('underscore');

removeDirForce("C:\\Users\\Sachin13031\\Desktop\\domestic\\all-domestic-certificates\\");

// path should have trailing slash
function removeDirForce(path) {
    fs.readdir(path, function(err, files) {
		   if (err) {
		       console.log(err.toString());
		   }
		   else {
		       if (files.length == 0) {
			   fs.rmdir(path, function(err) {
					if (err) {
                                          console.log(err.toString());					    
					}
				    });
		       }
		       else {
			   _.each(files, function(file) {
				      var filePath = path + file + "\\";
				      fs.stat(filePath, function(err, stats) {
						  if (stats.isFile()) {
						      if(file == "recommendations.csv")
						      {
    						         fs.unlink(filePath, function(err) {
    								    if (err) {
                                         console.log(err.toString());
    								    }
    								});   
						      }
						    
						  }
						  if (stats.isDirectory()) {
						      removeDirForce(filePath);
						  }
					      });
				  });
		       }
		   }
	       });
}