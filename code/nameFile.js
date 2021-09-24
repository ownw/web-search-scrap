const moment = require("moment");

/**
 * Names a file based on params and adds current time.
 * @param {...string} names - names joined with '_'
 * @type {function(names: ...string): string}
 * @example
 * //returns 20200820_100030_test1_test2.json
 * nameFile( 'test1', 'test2');
 */
const nameFile = (...names) => {
    const date = moment().format("YYYYMMMDD_HHmmss");
    return encodeURI([date, ...names].join('_'));
}


module.exports = {nameFile: nameFile};
