# COVID-19 Data Import Function

A NodeJS app that grabs COVID-19 data and uploads it to FTP.

_Note: Will only work within ABC network_

## Usage

Clone this repo.

Make sure your `.abc-credentials` for `contentftp` is up to date.

Run `npm start` or `node src/index.js` to fetch, parse, and deploy to FTP.

Run `node src/index.js --timestamp` to also deploy a timestamped data file.

## Schedule

Use **cron** to schedule script executions.

## Data URLs

Combined data files have become too large and will soon be deprecated.

Please use this lookup file and fetch individual place data separately from now on.

~~Lookup: https://www.abc.net.au/dat/news/interactives/covid19-data/places-lookup.json~~
~~Example for United States: https://www.abc.net.au/dat/news/interactives/covid19-data/places/us.json~~

https://abcnewsdata.sgp1.digitaloceanspaces.com/covid-data/places-lookup.json
https://abcnewsdata.sgp1.digitaloceanspaces.com/covid-data/places/us.json


## Development

Please develop on a separate branch. Changes and pull requests pushed to master will go live to production.
