//{ error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
'use strict';

const winston = require('winston');
const fs = require('fs');
const config = require('./config.js');
const constants = config.constants;
const logDir = constants.logDir;
const env = process.env.NODE_ENV || constants.environment;

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const tsFormat = () => (new Date()).toLocaleTimeString();
const logger = new (winston.Logger)({
  transports: [
    // colorize the output to the console
    new (winston.transports.Console)({
      timestamp: tsFormat,
      colorize: true,
      level: env === 'development' ? 'verbose' : 'info'
    }),
    new (require('winston-daily-rotate-file'))({
      filename: `${logDir}/-grosvenor.log`,
      timestamp: tsFormat,
      datePattern: 'yyyy-MM-dd',
      prepend: true,
      level: env === 'development' ? 'verbose' : 'info'
    })
  ]
});

module.exports = logger;
