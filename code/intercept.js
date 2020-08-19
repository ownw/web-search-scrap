const blockedResourceTypes = [
    //'image',
    'media',
    'font',
    'texttrack',
    'object',
    'beacon',
    'csp_report',
    'imageset',
];

const skippedResources = [
    'quantserve',
    'adzerk',
    'doubleclick',
    'adition',
    'exelator',
    'sharethrough',
    'cdn.api.twitter',
    'google-analytics',
    'googletagmanager',
    'google',
    'fontawesome',
    'facebook',
    'analytics',
    'optimizely',
    'clicktale',
    'mixpanel',
    'zedo',
    'clicksor',
    'tiqcdn',
];

/**
 * Block unwanted ressources from loading
 * @type {function(Page): Page}
 */
const intercept = async (page, disableIntercept = false) => {
    if(!disableIntercept) {
        await page.setRequestInterception(true);
        //await page.setViewport({width: 1920, height: 1080});
        page.on('request', request => {
            const requestUrl = request._url.split('?')[0].split('#')[0];
            if (
                blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
                skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
            ) {
                request.abort();
            } else {
                request.continue();
            }
        });
    }
    return page;
};


module.exports = {intercept: intercept}
