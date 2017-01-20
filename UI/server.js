var express = require("express");
var app = express();

//***** Routing call ********
var router = require("./router/main");

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static('images'));

//****** Engine Logic Here ************* //
app.set('view engine','ejs');
app.engine('html', require('ejs').renderFile); //Specify view engine 

router(app);
var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0",function(){
	console.log("Started server on port 3000 !!!");
});
