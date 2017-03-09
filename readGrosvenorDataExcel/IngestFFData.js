'use strict'
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var fs = require('fs');
var Q = require('q');
let year = process.argv[2]; 
var exec = require('child_process').exec;
var child;
let basefolderpath = "outputfile/";
var checkHDFS = require("./checkHDFSFolderexists");
var checkLocalFile = require('./createLocalFile');

let sheetname = "FF";
let filename = "outputfile/" + sheetname + ".txt";
function readSheet()
{
    var defered = Q.defer();
     workbook.xlsx.readFile("inputfile/GROSVENOR_PROJECT_DATA_2016.xlsx")
        .then(function() {
            // use workbook
            var worksheet =  workbook.getWorksheet("FF (2 Way Flow Unless Stated)");
            var yeararray = [];
           
            worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
                    var rowvalues =  row.values;
                    var output="";
                    
                    if(rowNumber > 1)
                    {
                        for(let r =1; r < rowvalues.length ; r++)
                        {
                            var val ="";
                            if(r == 1 && rowvalues[r] != undefined)
                            {
                               val = JSON.stringify(rowvalues[r]).split('T')[0].replace('"',''); 
                            }
                            else
                            {
                                val = (rowvalues[r] == undefined) ? 0 : rowvalues[r];
                            }
                           
                            output += val + '|' ;
                        }
                        
                        output = output.substr(0,output.length - 1);
                        output = output + "\n";
                    }
                    
                    
                
                checkLocalFile.removeExistingLocalfile(filename).then(function(r){
                            
                            if(r == 0)
                            {
                                fs.appendFile(filename,output,'utf-8',function(err,res){
                                    if(err)
                                    {
                                        defered.reject(new Error(err));
                                    }
                                    else
                                    {
                                        defered.resolve(0);
                                    }
                            
                                 }); 
                                
                            }
                             
                        });
                
            });
        });
        
        return defered.promise;
}

readSheet().then(function(res){
    
    var hdfsfolder = "/grosvenor/liverpoolone/" + sheetname;
     var CheckFolderCommand = "hadoop fs -ls " + hdfsfolder;
     var YearFolder = hdfsfolder + "/" + year;
     var mkdirCommand = "hadoop fs -mkdir " + hdfsfolder + "; hadoop fs -mkdir " + YearFolder ;
    
   if(res == 0)
   {
       console.log("File written");
       
          checkHDFS.checkHDFSFolderExist(CheckFolderCommand,mkdirCommand).then(function(re){
        
        if(re == 0)
        {
            console.log("Finished");
            // let filename = basefolderpath + sheetname;
               
                 let hdfspath = YearFolder + "/" + sheetname + ".txt";
                 var FScommand = "hadoop fs -rm -skipTrash " + hdfspath + ";hadoop fs -put " + filename  + " " + YearFolder;
                 console.log("Hadoop command : " + FScommand); 
                             
                 child = exec(FScommand, function (error, stdout, stderr) {
                          
                          if (error !== null) {
                            console.log('exec error: ' + error);
                          }
                          else
                          {
                              console.log("File successfully uploaded ");
                              process.exit(0);
                          }
                    }); 
            
        }
    });
   }
});