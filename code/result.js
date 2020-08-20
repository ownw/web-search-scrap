const fs = require("fs");

/**
 * Saves params data to the given file name.
 * @type {function(fileName:string, gens:...AsyncGenerator): Promise<void>}
 * @example
 * pathFile = ...
 * await saveJsonAsyncGenerator(pathFile, scrap(...));
 * await saveJsonAsyncGenerator(pathFile, scrap(...), scrap(...));
 */
const saveJsonAsyncGenerator = async (pathFile, ...gens) => {
    await Promise.all(gens.map(async gen => {
        for await (const chunk of gen) {
            let res = [].concat(...fs.existsSync(pathFile) ? JSON.parse(fs.readFileSync(pathFile, {encoding: 'utf8'})) : [], ...chunk);
            fs.writeFile(
                pathFile,
                JSON.stringify(res, null, 4),
                'utf8',
                err => (err) ? console.error(err) : fs.stat(pathFile, (err1, stats) => console.log({
                    path: pathFile,
                    size: stats.size,
                    nbObject: res.length
                }))
            );
        }
    }));
}


module.exports = {
    saveJsonAsyncGenerator: saveJsonAsyncGenerator
}
