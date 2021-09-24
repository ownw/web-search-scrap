const pino = require('pino');
const pinoPretty = require('pino-pretty');
const path = require('path');
const fs = require('fs');


/**
 * Creates a pino logger with the specified file name.
 * @type {function(fileName: string): Object}
 */
const logger = (streamLog) => {
    return pino({
        prettyPrint: {
            colorize: false,
            translateTime: 'yyyy-mm-dd HH:MM:ssZ',
            ignore: 'pid,hostname'
        },
        traceLog: true,
        //level: process.env.LOG_LEVEL || 'info'
    }, streamLog);
};


module.exports = {logger: logger}

