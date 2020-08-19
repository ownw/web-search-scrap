const pino = require('pino');
const pinoPretty = require('pino-pretty');
const path = require('path');
const fs = require('fs');

const logsPath = path.join(".", "logs");
if(!fs.existsSync(logsPath)){
    fs.mkdirSync(logsPath);
}

/**
 * Creates a pino logger with the specified file name.
 * @type {function(fileName: string): Object}
 */
const logger = (fn) => {
    const dest = pino.destination({dest: path.join(logsPath, fn), sync: false});
    return pino({
        prettyPrint: {
            colorize: false,
            translateTime: 'yyyy-mm-dd HH:MM:ssZ',
            ignore: 'pid,hostname'
        },
        traceLog: true,
        //level: process.env.LOG_LEVEL || 'info'
    }, dest);
};


module.exports = {logger: logger}

