const assert = require('assert');

describe('load', () => {
    it('loads everything', () => {
        let loaded = require('../index');
        assert.strictEqual(typeof loaded.scrap, "function");
        assert.strictEqual(typeof loaded.pagesToScrap, "function");
        assert.strictEqual(typeof loaded.nameFile, "function");
        assert.strictEqual(typeof loaded.saveJsonAsyncGenerator, "function");
        assert.strictEqual(typeof loaded.browserOptions, "object");
    });

    it('browser options default values', () => {
        let {browserOptions} = require('../index');
        assert.strictEqual(browserOptions.defaultViewport, null);
        assert.strictEqual(browserOptions.headless, false);
        assert.strictEqual((browserOptions.slowMo>0), true);
        assert.strictEqual((Object.keys(browserOptions.args).length>0), true);
    });

    it('name file correctly', () => {
        let {nameFile} = require('../index');
        let moment = require('moment');
        assert.strictEqual(nameFile('json', 'test'), moment().format("YYYYMMMDD_HHmmss")+"_test.json");
        assert.notStrictEqual(nameFile('json', 'test'), 'test.json');
    });

    it('load pageToScrap directory', () => {
        let {pagesToScrap} = require('../index');
        let fs = require('fs');
        let path = require('path');
        let pathDir = path.join(__dirname, 'pageToScrap');
        if(!fs.existsSync(pathDir)){
            fs.mkdirSync(pathDir);
        }
        let pageTest = {'name': 'test'};
        let pathPageTest = path.join(pathDir, 'pageTest.json');
        fs.writeFileSync(pathPageTest, JSON.stringify(pageTest, null, 4));
        pagesToScrap(pathDir).then(pages => {
            assert.strictEqual(Object.keys(pages).length, 1);
            assert.strictEqual(Object.keys(pages)[0], 'test');
            assert.strictEqual(pages['test'].name, 'test');
        }).then(_ => {
            fs.unlinkSync(pathPageTest);
            fs.rmdirSync(pathDir);
        });
    });
});



