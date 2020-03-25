COVID-19 Data Import Function
=============================

A NodeJS app that grabs COVID-19 data and uploads it to FTP.

_Note: Will only work within ABC network_

Usage
-----

Clone this repo. Make a `secret.json` in `src` dir and fill in details.

Run `npm start` or `node src/index.js` to fetch, parse, and deploy to FTP.

Run `node src/index.js --timestamp` to also deploy a timestamped data file. 

Schedule
--------

Use **cron** to schedule script executions.

Data should be available at: https://www.abc.net.au/dat/news/interactives/covid19-data/data.json

Also https://www.abc.net.au/dat/news/interactives/covid19-data/country-totals.json

And https://www.abc.net.au/dat/news/interactives/covid19-data/after-100-cases.json

WHO country totals: https://www.abc.net.au/dat/news/interactives/covid19-data/who-country-totals.json

WHO after 100: https://www.abc.net.au/dat/news/interactives/covid19-data/who-after-100-cases.json

ECDC country totals: https://www.abc.net.au/dat/news/interactives/covid19-data/ecdc-country-totals.json

ECDC after 100: https://www.abc.net.au/dat/news/interactives/covid19-data/ecdc-after-100-cases.json
