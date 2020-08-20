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
});

describe('name', () => {
    it('name file correctly', () => {
        let {nameFile} = require('../index');
        let moment = require('moment');
        assert.strictEqual(nameFile('json', 'test'), moment().format("YYYYMMMDD_HHmmss")+"_test.json");
        assert.notStrictEqual(nameFile('json', 'test'), 'test.json');
    });
});

describe('browserOpt', () => {
   it('default values', () => {
        let {browserOptions} = require('../index');
        assert.strictEqual(browserOptions.defaultViewport, null);
        assert.strictEqual(browserOptions.headless, false);
        assert.strictEqual((browserOptions.slowMo>0), true);
        assert.strictEqual((Object.keys(browserOptions.args).length>0), true);
   });
});
