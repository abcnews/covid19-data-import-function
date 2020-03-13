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

Use [PM2](https://pm2.keymetrics.io/) or **cron** to schedule script executions.
