const axios = require("axios");
const BASE_URL = "https://www.abc.net.au/dat/news/interactives/covid19-data/";

const backupFiles = [
  "data.json",
  "country-totals.json",
  "after-100-cases.json",
  "who-country-totals.json",
  "who-after-100-cases.json",
  "ecdc-country-totals.json",
  "ecdc-after-100-cases.json",
  "hybrid-country-totals.json",
  "hybrid-after-100-cases.json",
  "country-totals-extra.json",
  "places-totals.json",
];

const backupData = async () => {};

module.exports = backupData;
