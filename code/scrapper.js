const puppeteer = require("puppeteer");
const stream = require('stream');

const {logger} = require("./logger");
const {intercept} = require("./intercept");
const {saveJsonAsyncGenerator} = require("./result");
const {nameFile} = require("./nameFile");
const {pagesToScrap} = require("./urls");
const {qos} = require("./qos");


/**
 * Divides the array in chunks of size n.
 */
Object.defineProperty(Array.prototype, 'chunk', {value: function(n) {
        return Array.from(Array(Math.ceil(this.length/n)), (_,i)=>this.slice(i*n,i*n+n));
    }});

/**
 * @type {function(t:number, data: any):Promise<any>}
 */
const delay = async (t, data) => new Promise(r => setTimeout(r.bind(null,data), t));

/**
 * Emulated browser's options.
 * @see {@link https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-puppeteerlaunchoptions}
 *
 * @example
 * //default values
 * const browserOptions = {
 *     args: [
 *         '--no-sandbox',
 *         '--disable-setuid-sandbox',
 *         '--disable-dev-shm-usage',
 *         '--disable-accelerated-2d-canvas',
 *         '--disable-gpu',
 *     ],
 *     headless: false,
 *     slowMo: 10,
 *     defaultViewport: null
 * }
 *
 * @type {Object} options -  Set of configurable options to set on the browser
 */
const browserOptions = {
    args: [
        //'--proxy-server='+proxy,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
    ],
    headless: true,
    slowMo: 15,
    defaultViewport: null
};


/**
 * Emulates a navigation on one or more web pages in order to get targeted values.
 * @param {string||string[]} toSearchFor - text to search
 * @param {PageToScrap[]} pagesToScrap - web pages to analyse
 * @returns {AsyncGenerator<Object[]>}
 * @see {@link PageToScrap}
 * @see {@link pagesToScrap pagesToScrap(...)}
 * @see {@link browserOptions}
 * @see {@link saveJsonAsyncGenerator saveJsonAsyncGenerator(...)}
 * @see {@link nameFile nameFile(...)}
 *
 * @example
 * page = require('...'); //json file
 * for await (const result of scrap("text", page)){
 *     //do something with result
 * }
 * @example
 * pagesToScrap(path.join(__dirname, 'pageToScrap')).then(async pages => {
 *       const pathFile = path.join('results', nameFile('json', "..."));
 *       await saveJsonAsyncGenerator(pathFile, scrap(["text to search", "other text to search"], pages['...']));
 *  });
 */
const scrap = async function*(toSearchFor, ...pagesToScrap){
    toSearchFor = (Array.isArray(toSearchFor)?toSearchFor:[toSearchFor]);
    let resStream = new stream.PassThrough({objectMode: true});
    let logStream = new stream.PassThrough({objectMode: true});
    //const log = logger(nameFile("log", pagesToScrap.map(o => [o.name]).join('_')));//TODO
    const log = logger(logStream);
    logStream.on('data', (chunk) => {
        resStream.write({
            type: 'log',
            value: chunk
        });
    });
    const qosg = new qos();

    /**
     * S'occupe d'une recherche
     * @param {string} t - texte à rechercher
     * @param {Browser} b -
     * @param {PageToScrap} page -
     * @async
     * @generator
     * @yield {Object[]}
     */
    const searchManager = async function* (t, b, page, qost = null){
        log.info({page: page.name, text: t});
        const p = await intercept(await b.newPage(), page.disableIntercept);

        /**
         * lance une recherche sur le site concerné et se déplace vers la page de résultats
         * @type {function(sp: Page, {url: string, searchBarSelector: string, text: string}):Promise<Page>}
         */
        const launchSearch = async (sp, {url, searchBarSelector, text}) => {
            try {
                await sp.goto(url, {waitUntil: "networkidle2"});
                await sp.type(searchBarSelector, text);
                await delay(600);
                await sp.keyboard.press('Enter');
                await sp.waitForNavigation({waitUntil: "networkidle2"});
                return sp;
            } catch (e) {
                log.error({msg: e.msg, url: url, searchBarSelector: searchBarSelector, text: text});
                log.error(e);
                await delay(5000);
                return launchSearch(sp, {url, searchBarSelector, text});
            }
        };
        const searchPage = await launchSearch(p, {
            "url": page.url,
            "searchBarSelector": page.searchBarSelector,
            "text": t
        })
        log.info({searchPage: searchPage.url()});

        /**
         * Find a field value(s) if available
         * @type {function(Page, Field)}
         * @returns {Promise<string[]|string|null>}
         * @async
         */
        const findFieldOnPage = async (sp, field) => {
            return sp.$x(field.xpath)
                .then(res => res.map(r => sp.evaluate((div, property) => div[property].trim(), r, field.htmlProperty)))
                .then(res => Promise.all(res))
                .then(res => (res.length > 0) ? ((res.length === 1) ? res[0] : res) : null)
                .catch(e => log.warn({msg: e.message, url: sp.url(), field: field.name, lineNumber: e.lineNumber}))
        };

        /**
         * Trouve les liens de pages résultats
         * @param {Page} sp - page de résultats de recherche
         * @param {string} xpRes - xpath pour trouver les liens
         * @returns {Promise<string[]>}
         */
        const findResultLinks = async (sp, xpRes) => {
            return await findFieldOnPage(sp, {
                "name": "links",
                "xpath": xpRes,
                "htmlProperty": "href"
            });
        }

        /**
         * Detecte la présence de captcha sur la page
         * @param {Page} sp
         * @param {Captcha} captcha
         * @returns {Promise<void>}
         */
        const detectCaptcha = async (sp, captcha) => {
            return await findFieldOnPage(sp, {
                "name": 'captcha',
                "xpath": captcha.xpath,
                "htmlProperty": 'textContent'
            });
        }

        /**
         * Navigue à l'url demandée et prend en charge la detection de captcha
         * @param {Page} page
         * @param {string} url
         * @param {Captcha} captcha
         * @returns {Promise<Page|null>}
         */
        const gotoSafeCaptcha = async (page, url, captcha, tryNumber=0) => {
            try{
                await page.goto(url, {waitUntil: "networkidle2"});
                if(await detectCaptcha(page, captcha)){throw new Error("captcha error");}
                return page;
            }catch (err){
                log.warn({msg: "Error in goto", url: url, retryIn: captcha.retryIn, tryNumber: tryNumber});
                console.warn({msg: "Error in goto", url: url, retryIn: captcha.retryIn, tryNumber: tryNumber});
                if(tryNumber>=captcha.maxTries){throw err;}
                await delay(captcha.retryIn);
                return gotoSafeCaptcha(page, url, captcha, tryNumber+1);
            }
        }

        /**
         * explore le lien et en extrait les valeurs demandées.
         * @type {function(url: string, browser: Browser, fields: Field[]): Promise<Object>}
         */
        const searchLinkForFields = async (url, b, fields) => {
            const fp = await intercept(await b.newPage(), page.disableIntercept);
            let obj = {"url": url};
            try {
                await gotoSafeCaptcha(fp, url, page.captcha);
                await delay(5000);
                await Promise.all(fields.map(async field => obj[field.name] = await findFieldOnPage(fp, field)))
                await fp.close();
                return obj;
            } catch (e) {
                await fp.close();
                //throw e;
                return obj;
            }
        };

        /**
         * Navigue sur le lien de pagination de la page suivante
         * @param {Page} sp
         * @param {Pagination} xpPag
         * @param {Captcha} captcha
         * @returns {Promise<Page|null|*>}
         */
        const gotoLinkPagination = async(sp, xpPag, captcha) => {
            if(!xpPag.clickOnLink){
                let urlPag = await findFieldOnPage(sp, {"name": "next", "xpath": xpPag.next, "htmlProperty": "href"})
                    .then(url => (Array.isArray(url)?url[0]:url));
                if(!urlPag){throw new Error("pagination url null");}
                return await gotoSafeCaptcha(
                    sp,
                    urlPag,
                    captcha
                );
            } else {
                await sp.$x(xpPag.next).then(res => res[0].click());
                return sp;
            }
        };

        let pageno = 0, keepNav = true;
        let urlExplored = [];
        do {
            let qosp = qost.child("page "+pageno);
            page.fields.map(value => qosp.fields.add(value.name));
            /**
             * trouve les liens vers les pages produits depuis la page de résultats de recherche (et élimine les doublons)
             * @type {function(xp: string, sp: Page): Promise<string[]>}
             */
            const searchResults = await Promise.all(page.xpathResults.map(xpath => findResultLinks(searchPage, xpath)))
                .then(res => [...new Set([].concat(...res))])
                .then(res => res.filter(url => !urlExplored.includes(url)));
            //console.log("nb url: "+searchResults.length);
            log.info("found ["+searchResults.length+"] urls on results page ["+pageno+"]");//TODO
            qosp.resExp = searchResults.length;
            urlExplored.concat(...searchResults);

            /**
             * divise les urls trouvées en packs et lance l'analyse
             */
            const fieldsResults = async function* (urls, b, fields, delayStrategy) {
                const chunks = urls.chunk(delayStrategy.nbUrlPerChunk || 10);
                for (let [k,v] of chunks.entries()) {
                    yield await Promise.all(v.map(url => searchLinkForFields(url, b, fields)))
                        .then(res => {
                            log.info({
                                chunks: k,
                                pageNo: pageno,
                                res: res.map(r => {
                                    return JSON.stringify({
                                        fields: fields.filter(n=>(r)?r[n.name]:false).length+"/"+fields.length,
                                        url: r.url
                                    });
                                })
                            });
                            /*console.log({
                                chunks: k,
                                pageNo: pageno,
                                res: res.map(r => {
                                    return JSON.stringify({
                                        fields: fields.filter(n=>(r)?r[n.name]:false).length+"/"+fields.length,
                                        url: r.url
                                    });
                                })
                            });*/
                            return res;
                        })
                        .catch(async err => {
                            log.error(err);
                            qosp.err += 1;
                        });
                    await delay(delayStrategy.delayBetweenChunks || 1000);
                }
            }

            /**
             * renvoi les résultats
             */
            for await (const res of fieldsResults(searchResults, b, page.fields, page.delayStrategy)) {
                yield (res)? res.filter(n => (n) ? n[page.fields[0].name] : false) : res;
                //qosp.res += (res.map(value => (value)?(value.length-1)/page.fields.length:0)).reduce((tot, val) => tot+val, 0);
                qosp.res += (res.map(value => (value)?((Object.entries(value).map(([k,v]) => !!v).length-1)/page.fields.length):0))
                    .reduce((tot, val) => tot+val, 0);
                res.map(value => (value)?page.fields.map(field => qosp.fields[field.name] += (value[field.name])?1:0):false);
            }

            /**
             * Navigue à la prochaine page de résultat
             * Sort de la boucle do...while() si erreur (lien non-trouvé)
             */
            await gotoLinkPagination(searchPage, page.xpathPagination, page.captcha)
                .then(res => {
                    pageno++;
                    qosp.time.end();
                    log.info({msg: "navigation", pageNo: pageno, nextUrl: res.url()});
                    //console.log({msg: "navigation", pageNo: pageno, nextUrl: res.url()});
                    return res;
                })
                .then(async res => await delay(2000, res))
                .catch(err => {
                    log.warn(err);
                    return keepNav = false;
                });
        }while (keepNav);
        searchPage.close();
        log.info({msg: "End of search", page: page.name, text: t});
        qost.time.end();
        return {done: true};
    }

    /**
     * Lance les recherche pour chaque objet passé en paramètre de la fonction scrap.
     */
    Promise.all(pagesToScrap.map(async (page) => {
        const browser = await puppeteer.launch(browserOptions);
        const qosp = qosg.child(page.name);
        /**
         * lance la recherche pour chaque texte à rechercher
         * recherche séquentielle
         */
        for(let t of toSearchFor){
            const qost = qosp.child(t);
            let dataStream = stream.Readable.from(searchManager(t, browser, page, qost),{objectMode: true});
            dataStream.on('data', (chunk) => {
                resStream.write({
                    type: 'data',
                    value: chunk
                });
                //qost.res += chunk.length;
                resStream.write({
                    type: 'qos',
                    value: qosg.export()
                });
            });

            await new Promise((resolve => dataStream.on('end', () => resolve(true))));
        }
        await browser.close();
        qosp.time.end();
    })).then(_ => resStream.end());

    /**
     * Renvoi les résultats
     */
    for await (const chunk of resStream){
        yield chunk;
    }
    qosg.time.end();
    return {done: true};
}


module.exports = {
    scrap,
    browserOptions,
    saveJsonAsyncGenerator,
    pagesToScrap,
    nameFile,
    qos
};
