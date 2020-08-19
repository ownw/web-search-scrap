const moment = require("moment");

/**
 * Names a file based on params (param ext: write without '.' -> nameFile({..., ext: 'json'}))
 * @type {function(ext: string, names: ...string): string}
 */
const nameFile = (ext, ...names) => {
    const date = moment().format("YYYYMMMDD_HHmmss");
    return encodeURI([date, ...names].join('_') + '.' + ext);
}


module.exports = {nameFile: nameFile};
