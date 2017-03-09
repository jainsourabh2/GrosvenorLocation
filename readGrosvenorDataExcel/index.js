'use strict'
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var fs = require('fs');
var Q = require('q');
let sheetname = process.argv[2];
let year = process.argv[3]; 
var exec = require('child_process').exec;
var child;
let basefolderpath = "/opt/nodeprojects/GrosvenorLocation/readGrosvenorDataExcel/outputfile/";
var checkHDFS = require("./checkHDFSFolderexists");
var checkLocalFile = require('./createLocalFile');

function readSheet(name)
{
    var defered = Q.defer();
    workbook.xlsx.readFile("inputfile/GROSVENOR_PROJECT_DATA_2016.xlsx")
        .then(function() {
            // use workbook
            var worksheet =  workbook.getWorksheet(name);
            var yeararray = [];
           
            worksheet.eachRow({ includeEmpty: true }, function(row, rowNumber) {
                    //console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
                    
                    var rowvalues =  row.values;
                     var salearray = [];
                     
                     //Get all date ranges in array
                    if(rowNumber == 1)
                    {
                          for(let j =3 ; j < rowvalues.length; j++ )
                          {
                              yeararray.push(JSON.stringify(rowvalues[j]).split('T')[0].replace('"',''));
                              
                          }
                    }
                    else
                    {
                        //Get all values against the date ranges
                        if(rowvalues[1] != "Total Day")
                        {
                        for(let s =3 ; s < rowvalues.length; s++ )
                          {
                              let salevalue = (rowvalues[s] == undefined) ? 0 : rowvalues[s]; 
                              salearray.push(salevalue);
                              
                          } 
                        }
                    }
                    
                    if(yeararray.length == salearray.length)
                    {
                        var storename = rowvalues[1];
                        var zonename = rowvalues[2];
                        var output = "";
                        //output += storename + ',' + zonename + ",";
                        for(let c=0; c < yeararray.length; c++)
                        {
                            output += storename + '|' + zonename + "|" +  yeararray[c] + '|' + salearray[c] + "\n";
                        }
                        
                        //Check local file exist or not
			sheetname = sheetname.replace(' ','_');
                        let filename = "outputfile/" + sheetname + ".txt";
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
                        
                        
                    }
                       
                });
        });
        
         return defered.promise;
}

readSheet(sheetname).then(function(fe){
    
    if(fe == 0)
    {
	console.log("Sheetname : " + sheetname);
        var hdfsfolder = "/grosvenor/liverpoolone/" + sheetname;
	var CheckFolderCommand = "hadoop fs -ls " + hdfsfolder;
	var YearFolder = hdfsfolder + "/" + year;
	var mkdirCommand = "hadoop fs -mkdir " + hdfsfolder + "; hadoop fs -mkdir " + YearFolder ;

        console.log("Check HDFS folder exists");
        
     checkHDFS.checkHDFSFolderExist(CheckFolderCommand,mkdirCommand).then(function(re){
        
        if(re == 0)
        {
            console.log("Finished");
            //
            let filename = basefolderpath + sheetname + ".txt";
               
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