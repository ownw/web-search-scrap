/**
 * @typedef {Object} Field
 * @property {string} name - property name in the output file.
 * @property {string} xpath - xpath to select the htmlElement.
 * @property {string} htmlProperty - which attribute of the htmlElement to retrieve (ex: 'textContent' for the displayed value).
 */

/**
 * @typedef {Object} DelayStrategy
 * @property {int} nbUrlPerChunk - number of urls to launch the analysis on at the same time.
 * @property {int} delayBetweenChunks - delay between each pack of url (in ms).
 */

/**
 * @typedef {Object} Pagination
 * @property {string} next
 */

/**
 * @typedef {Object} Captcha
 * @property {string} xpath - a captcha's page unique descriptor.
 * @property {number} retryIn - delay the execution (in ms)
 * @property {number} maxTries - max number of times to try to load the page.
 */

/**
 * Describes a targeted website's structure.
 * @typedef {Object} PageToScrap
 * @property {string} name - name
 * @property {string} url - where the search bar is.
 * @property {string} searchBarSelector - search bar selector.
 * @property {string[]} xpathResults - xpath selector for product links (should have a href attribute).
 * @property {Pagination} xpathPagination - xpath selector for pagination links (should have a href attribute).
 * @property {DelayStrategy} delayStrategy - how to slow down the analysis to ovoid being blocked by the target website.
 * @property {boolean} disableIntercept - to disable the interception of non-essential resources (ex: fonts)(if true then resources loaded)
 * @property {Field[]} fields - which values to target and how to retrieve them.
 * @property {Captcha} captcha
 */
