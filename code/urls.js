const fs = require("fs");
const path = require("path");
require("./pageToScrapDoc");

/**
 * Loads all files in the target directory (should be .json files).
 * Uses {@link PageToScrap}.{@link PageToScrap.name name} attribute as key for each loaded file.
 * @see {@link PageToScrap}
 * @type {function(dirTaget: string): Promise<PageToScrap[]>}
 *
 * @example
 * -pages
 * |-amazon.json
 * |-google.json
 * |-cdiscount.json
 *
 * pagesToScrap(path.join(__dirname, 'pages')).then(pages => {
 *     //['amazon', 'google', 'cdiscount']
 *     Object.keys(pages)
 *     ...
 * });
 *
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
