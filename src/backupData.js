const axios = require("axios");
const fs = require("fs");
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

const dir = "./backup";

const backupData = async () => {
  for (const fileName of backupFiles) {
    const reply = await axios.get(BASE_URL + fileName);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    fs.writeFileSync("./backup/" + fileName, JSON.stringify(reply.data));
    console.log("Backup data written to: " + fileName);
  }
};

module.exports = backupData;
