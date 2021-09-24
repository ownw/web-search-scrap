<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]


# web-search-scrap
Scrap any content on any website that has a search bar (using [Puppeteer](https://github.com/puppeteer/puppeteer)).


[Explore the docs »](https://github.com/ownw/web-search-scrap)

[View Demo](https://github.com/ownw/web-search-scrap)
·
[Report Bug](https://github.com/ownw/web-search-scrap/issues)
·
[Request Feature](https://github.com/ownw/web-search-scrap/issues)

<!--
 <-- TABLE OF CONTENTS 
## Table of Contents

* [About the Project](#about-the-project)
  * [Built With](#built-with)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Usage](#usage)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)
* [Acknowledgements](#acknowledgements)
-->
<!-- ABOUT THE PROJECT -->
## About The Project


Automate data scrapping on the web.
Works on any website using a search bar.
The scrapper manually enters a text in the search bar, then explore the links it finds.
You can specify any number of websites to explore, any text to search as well as any number of values to retrieve.



[![Mockup 1][mockup1]]()
[![Mockup 2][mockup2]]()
[![Mockup 3][mockup3]]()
[![Mockup 4][mockup4]]()

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
  Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v14.17.6

    $ npm --version
    7.24.1

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

## Install

    $ npm install @ownw/web-search-scrap

<!-- USAGE EXAMPLES -->
## Usage

The module has the following functions:

    const {scrap, saveJsonAsyncGenerator, pagesToScrap, nameFile, qos} = require('@ownw/web-search-scrap');
    _______________
    
    //starts the scrapping
    scrap(toSearchFor:string|string[], pagesToScrap:...PageToScrap): AsyncGenerator<Object>
    
    //save results to a directory
    saveJsonAsyncGenerator(fileDir:string, gens:...AsyncGenerator): Promise<void>
    
    //loads all config files
    pagesToScrap(directoryName:string): Promise<PageToScrap[]>
    
    //generates a name with the current date
    nameFile(names:...string): string

Your main file could look like this:

    const {scrap, saveJsonAsyncGenerator, pagesToScrap, nameFile} = require('@ownw/web-search-scrap');
     
    pagesToScrap(path.join(__dirname, 'pageToScrap')).then(async pages => {
         const pathDir = path.join('results', nameFile("search1"));
         await saveJsonAsyncGenerator(pathDir, scrap(["text to search", "other text to search"], pages['target1']));
        
         const pathDir2 = path.join('results', nameFile("search2"));
         await saveJsonAsyncGenerator(pathDir2, scrap("text to search", pages['target1'], pages['target2']));
         
         process.exit(0);
    });

Using the function `saveJsonAsyncGenerator()` will save to the specified directory 3 files. Let say you have this code:

    pathDir = 'out' 
    pathSearch = path.join(pathDir, nameFile('search'))
    targetPage = ...
    saveJsonAsyncDirectory(pathSearch, scrap([...], targetPage)
    ---    
    You will have the following files:
    out/[date].search/
                    ->[date].search.json
                    ->[date].search.log
                    ->[date].search.qos

You can also directly use the results generated:

    const {scrap} = require('@ownw/web-search-scrap');
    const targetWebsite = ...;
    
    const asyncFn = async () => {
         for await (const res of scrap("text to search", targetWebsite)){
            //do something with res...
            //res.type = ('data'|'log'|'qos')
            //  ->data: contains the actual data (use res.value)
            //  ->log: contains the log
            //  ->qos: contains metrics for the search
         }
    });
    
    asyncFn();

The files loaded by the function _pagesToScrap(directory path)_ need to have the following structure:

    {
        "name": ...,
        "url": ...,
        "searchBarSelector": ...,
        "xpathResults": [...],
        "xpathPagination": {"next": ...},
        "disableIntercept": true/false,
        "delayStrategy": {
            "nbUrlPerChunk": ...,
            "delayBetweenChunks": ...(ms)
        },
        "fields": [
            {
              "name": ...,
              "xpath": ...,
              "htmlProperty": "textContent"/"src"/...
            },
            ...
        ],
        "captcha": {
            "xpath": ...,
            "retryIn": ...(ms),
            "maxTries": ...
        }
    }

For example if the targeted website is amazon, the following values are suggested:

    {
      "name": "amazon",
      "url": "https://www.amazon.com",
      "searchBarSelector": "#twotabsearchtextbox",
      "xpathResults": [
        "//*[@data-component-type='s-search-result']//a[not(contains(@href, '#customerReviews') or contains(@href, 'javascript') or contains(@href, 'offer-listing') or contains(@href, 'bestsellers'))]"
      ],
      "xpathPagination" : {
        "next": "//ul[@class='a-pagination']//li[@class='a-last']//a"
      },
      "disableIntercept": true,
      "delayStrategy": {
        "nbUrlPerChunk": 2,
        "delayBetweenChunks": 20000
      },
      "fields": [
        {
          "name": "title",
          "xpath": "//*[@id=\"productTitle\"]",
          "htmlProperty": "textContent"
        },
        {
          "name": "image",
          "xpath": "//*[@id=\"landingImage\"]",
          "htmlProperty": "src"
        },
        {
          "name": "price",
          "xpath": "//*[@id=\"priceblock_ourprice\"]",
          "htmlProperty": "textContent"
        }
      ],
      "captcha": {
        "xpath": "//title[contains(.,'CAPTCHA')]",
        "retryIn": 250000,
        "maxTries": 5
      }
    }


This will yield the results (depending on the text searched):
(Note you can get at most 350 results per search on Amazon)

    [
        {
            "url": "https://www.amazon.fr/gp/slredirect/picassoRedirect.html/ref=pa_sp_atf_aps_sr_pg1_1?ie=UTF8&adId=A05352261ELNJONHOCE7P&url=%2FPhilips-Connect%25C3%25A9e-Compatible-Bluetooth-Fonctionne%2Fdp%2FB07SS377J3%2Fref%3Dsr_1_1_sspa%3F__mk_fr_FR%3D%25C3%2585M%25C3%2585%25C5%25BD%25C3%2595%25C3%2591%26dchild%3D1%26keywords%3DPhilips%2BHue%2Bampoule%26qid%3D1596722562%26sr%3D8-1-spons%26psc%3D1&qualifier=1596722562&id=6255010379111342&widgetName=sp_atf",
            "title": "Philips Hue Ampoule LED Connectée White & Color Ambiance E27 Compatible Bluetooth, Fonctionne avec Alexa",
            "image": "https://images-na.ssl-images-amazon.com/images/I/71rIv9NRlZL._AC_SX342_.jpg",
            "price": "59,90 €"
        },
        {
            "url": "https://www.amazon.fr/gp/slredirect/picassoRedirect.html/ref=pa_sp_atf_aps_sr_pg1_1?ie=UTF8&adId=A030014930UETVZTN5TEW&url=%2FPhilips-Connect%25C3%25A9e-Compatible-Bluetooth-Fonctionne%2Fdp%2FB07SNGBWG4%2Fref%3Dsr_1_2_sspa%3F__mk_fr_FR%3D%25C3%2585M%25C3%2585%25C5%25BD%25C3%2595%25C3%2591%26dchild%3D1%26keywords%3DPhilips%2BHue%2Bampoule%26qid%3D1596722562%26sr%3D8-2-spons%26psc%3D1&qualifier=1596722562&id=6255010379111342&widgetName=sp_atf",
            "title": "Philips Hue Ampoule LED Connectée White Filament E27 Forme Standard, Compatible Bluetooth 7 W, Fonctionne avec Alexa et Google Assistant",
            "image": "https://images-na.ssl-images-amazon.com/images/I/61LalkKznwL._AC_SX342_.jpg",
            "price": "19,99 €"
        },
        {
            "url": "https://www.amazon.fr/gp/slredirect/picassoRedirect.html/ref=pa_sp_atf_aps_sr_pg1_1?ie=UTF8&adId=A01163081ITUF15PTIXWC&url=%2FPhilips-Connect%25C3%25A9es-Compatible-Bluetooth-Fonctionne%2Fdp%2FB07SR3DTPG%2Fref%3Dsr_1_3_sspa%3F__mk_fr_FR%3D%25C3%2585M%25C3%2585%25C5%25BD%25C3%2595%25C3%2591%26dchild%3D1%26keywords%3DPhilips%2BHue%2Bampoule%26qid%3D1596722562%26sr%3D8-3-spons%26psc%3D1&qualifier=1596722562&id=6255010379111342&widgetName=sp_atf",
            "title": "Philips Hue Ampoules LED Connectées White Ambiance E27 Compatible Bluetooth, Fonctionne avec Alexa Pack de 2",
            "image": "https://images-na.ssl-images-amazon.com/images/I/71-HeRcTqSL._AC_SX342_.jpg",
            "price": "44,99 €"
        },
        ...
    ]

The documentation for each attribute utility is available in the code.

To search on Google, use:

    {
      "name": "google",
      "url": "https://www.google.com/",
      "searchBarSelector": "input.gLFyf.gsfi",
      "xpathResults": [
        ".//*[contains(@href, 'https://webcache.googleusercontent.com/search')]"
      ],
      "xpathPagination" : {
        "next": "//*[@id=\"pnnext\"]"
      },
      "delayStrategy": {
        "nbUrlPerChunk": 1,
        "delayBetweenChunks": 20000
      },
      "disableIntercept": true,
      "fields": [
        ...
      ],
      "captcha": {
        "xpath": "//*[@id='captcha-form']",
        "retryIn": 250000,
        "maxTries": 5
      }
    }

with

    scrap("text site:targetedWebsite.com", page['google'])

_For more examples, please refer to the [Documentation](https://github.com/ownw/web-search-scrap)_

<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/ownw/web-search-scrap/issues) for a list of proposed features (and known issues).



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

Project Link:
* [github](https://github.com/ownw/web-search-scrap)
* [npmjs](https://www.npmjs.com/package/@ownw/web-search-scrap)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/ownw/web-search-scrap.svg?style=flat-square
[contributors-url]: https://github.com/ownw/web-search-scrap/contributors
[forks-shield]: https://img.shields.io/github/forks/ownw/web-search-scrap.svg?style=flat-square
[forks-url]: https://github.com/ownw/web-search-scrap/network/members
[stars-shield]: https://img.shields.io/github/stars/ownw/web-search-scrap.svg?style=flat-square
[stars-url]: https://github.com/ownw/web-search-scrap/stargazers
[issues-shield]: https://img.shields.io/github/issues/ownw/web-search-scrap.svg?style=flat-square
[issues-url]: https://github.com/ownw/web-search-scrap/issues
[license-shield]: https://img.shields.io/github/license/ownw/web-search-scrap.svg?style=flat-square
[license-url]: https://github.com/ownw/web-search-scrap/blob/master/LICENSE.txt

[product-screenshot]: public/images/screenshot.png
[mockup1]: images/mockup1.png
[mockup2]: images/mockup2.png
[mockup3]: images/mockup3.png
[mockup4]: images/mockup4.png
