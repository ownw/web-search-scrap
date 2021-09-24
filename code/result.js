const fs = require("fs");
const path = require("path");

/**
 * Saves params data to the given file name.
 * @type {function(dirName:string, gens:...AsyncGenerator): Promise<void>}
 * @example
 * pathDir = ...
 * await saveJsonAsyncGenerator(pathDir, scrap(...));
 * await saveJsonAsyncGenerator(pathDir, scrap(...), scrap(...));
 */
const saveJsonAsyncGenerator = async (pathDir, ...gens) => {
    if(!fs.existsSync(pathDir)){
        fs.mkdirSync(pathDir);
    }
    let pathFiles = {
        pathData: path.join(pathDir, path.basename(pathDir))+'.json',
        pathLog: path.join(pathDir, path.basename(pathDir))+'.log',
        pathQos: path.join(pathDir, path.basename(pathDir))+'_qos.json'
    }
    await Promise.all(gens.map(async gen => {
        for await (const chunk of gen){
            switch (chunk.type) {
                case 'data': {
                    let res = [].concat(...fs.existsSync(pathFiles.pathData) ? JSON.parse(fs.readFileSync(pathFiles.pathData, {encoding: 'utf8'})) : [], ...chunk.value);
                    fs.writeFile(
                        pathFiles.pathData,
                        JSON.stringify(res, null, 4),
                        'utf8',
                        err => (err) ? console.error(err) : fs.stat(pathFiles.pathData, (err1, stats) => console.log({
                            type: 'data',
                            path: pathFiles.pathData,
                            size: stats.size,
                            nbObject: res.length
                        }))
                    );
                    break;
                }
                case 'log': {
                    fs.appendFileSync(
                        pathFiles.pathLog,
                        chunk.value,
                        'utf8'
                    );
                    break;
                }
                case 'qos': {
                    fs.writeFile(
                        pathFiles.pathQos,
                        JSON.stringify(chunk, null, 4),
                        'utf8',
                        err => (err) ? console.error(err) : fs.stat(pathFiles.pathQos, (err1, stats) => console.log({
                            type: 'QoS',
                            path: pathFiles.pathQos,
                            size: stats.size
                        }))
                    );
                    break;
                }
                default:
            }
        }
    }));
}


module.exports = {
    saveJsonAsyncGenerator: saveJsonAsyncGenerator
}
