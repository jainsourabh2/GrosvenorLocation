var express = require("express");
var app = express();
var swaggerJSDoc = require('swagger-jsdoc');
//***** Routing call ********
var router = require("./router/main");
var liverpoolOneDetail = require("./router/liverpoolOne_Detail");
var liverpoolOneAggregate = require("./router/liverpoolOne_Aggregate");

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.static(__dirname));
app.use(express.static('images'));

//****** Engine Logic Here ************* //
app.set('view engine','ejs');
app.engine('html', require('ejs').renderFile); //Specify view engine 

// swagger definition
var swaggerDefinition = {
  info: {
    title: 'Node Swagger API',
    version: '1.0.0',
    description: 'Demonstrating how to describe a RESTful API with Swagger',
  },
  host: 'gvpocw01.westeurope.cloudapp.azure.com:3000',
  basePath: '/api',
};

// options for the swagger docs
var options = {
  // import swaggerDefinitions
  swaggerDefinition: swaggerDefinition,
  // path to the API docs
  apis: ['./router/main.js','./router/liverpoolOne_Detail.js'],
};

// initialize swagger-jsdoc
var swaggerSpec = swaggerJSDoc(options);

// serve swagger
app.get('/swagger.json', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

router(app);
liverpoolOneDetail(app);
liverpoolOneAggregate(app);

var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0",function(){
	console.log("Started server on port 3000 !!!");
});