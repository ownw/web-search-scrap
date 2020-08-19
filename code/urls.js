const fs = require("fs");
const path = require("path");
require("./pageToScrapDoc");

/**
 * Loads all files in the target directory
 * @type {function(dirTaget: string): Promise<PageToScrap[]>}
 */
const pagesToScrap = (async(dirTarget) => {
    try{
        const files = await fs.promises.readdir(dirTarget);
        const obj = {};
        const arr = files.map(file => require(path.join(dirTarget, file)));
        arr.map(a => obj[a.name] = a);
        return obj;
    }catch (e) {
        console.error(e);
        process.abort();
    }
});


module.exports = {
    pagesToScrap: pagesToScrap
};
