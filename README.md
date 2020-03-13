COVID-19 Data Import Function
=============================

A NodeJS app that grabs COVID-19 data and uploads it to FTP.

__Note: Will only work within ABC network__

Usage
-----

Clone this repo. Make a `secret.json` in `src` dir and fill in details.

Run `npm start` or `node src/index.js` to fetch, parse, and deploy to FTP.

Run `node src/index.js --timestamp` to also deploy a timestamped data file. 
