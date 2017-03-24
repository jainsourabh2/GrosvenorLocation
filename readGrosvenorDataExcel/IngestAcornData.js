'use strict'
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var fs = require('fs');
var Q = require('q');
let year = process.argv[2];
let startline = process.argv[3];
let endline = process.argv[4];
var exec = require('child_process').exec;
var child;
let basefolderpath = "outputfile/";
var checkHDFS = require("./checkHDFSFolderexists");
var checkLocalFile = require('./createLocalFile');
var conf = require('./config/config');
const constant = conf.constants;
let sheetname = constant.AcornSheetName;
let filename = "/opt/nodeprojects/GrosvenorLocation/readGrosvenorDataExcel/outputfile/" + sheetname + ".txt";

if(process.argv.length < 5)
{
console.log("Required parameters for ingesting acorn is : year startline endline. Eg : node IngestAcornData.js 2016 40 57 ");
process.exit(0);
}

function readSheet()
{
    var defered = Q.defer();
     workbook.xlsx.readFile(constant.AcornPath)
        .then(function() {
            // use workbook
            var worksheet =  workbook.getWorksheet(sheetname);
            var yeararray = [];
           
            worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
                    var rowvalues =  row.values;
                    var output="";
                    
               // console.log(rowNumber + " : " + JSON.stringify(rowvalues));
                
                if(rowNumber >= startline && rowNumber <= endline)
                {
                    
                    for(let r =1; r < rowvalues.length; r++)
                    {
                        let value = "";
                        if(rowvalues[r] != undefined && typeof(rowvalues[r]) == "object")
                        {
                           value = rowvalues[r].result;
                        }
                         else
                        {
                           value = (rowvalues[r] == undefined) ? null : rowvalues[r];
                        }
                         output += value + '|' ;
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


//readSheet();