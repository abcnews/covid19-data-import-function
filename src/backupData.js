// const axios = require("axios");
const fs = require("fs");
const PromiseFtp = require("promise-ftp");
const ftp = new PromiseFtp();

const credentials = require("./secret.json");

// const BASE_URL = "https://www.abc.net.au/dat/news/interactives/covid19-data/";

// const backupFiles = [
//   "data.json",
//   "country-totals.json",
//   "after-100-cases.json",
//   "who-country-totals.json",
//   "who-after-100-cases.json",
//   "ecdc-country-totals.json",
//   "ecdc-after-100-cases.json",
//   "hybrid-country-totals.json",
//   "hybrid-after-100-cases.json",
//   "country-totals-extra.json",
//   "places-totals.json",
// ];

// const dir = "./backup";

const backupData = async () => {
  // for (const fileName of backupFiles) {
  //   const reply = await axios.get(BASE_URL + fileName);

  //   if (!fs.existsSync(dir)) {
  //     fs.mkdirSync(dir);
  //   }

  //   fs.writeFileSync("./backup/" + fileName, JSON.stringify(reply.data));
  //   console.log("Backup data written to: " + fileName);
  // }

  // Some ftp tests for backup purposes
  const connectionResponse = await ftp.connect({
    host: credentials.host,
    user: credentials.user,
    password: credentials.password,
  });

  // Backup main files
  await ftp.cwd("/www/dat/news/interactives/covid19-data");

  const fileList = await ftp.list();

  for (const item of fileList) {
    if (item.type === "-") {
      const fileStream = await ftp.get(item.name);
      console.log(item.name);
      fileStream.pipe(fs.createWriteStream("backup/" + item.name));
    }
  }

  // Backup places directory
  await ftp.cwd("/www/dat/news/interactives/covid19-data/places");
  console.log("dir changed");

  const placesList = await ftp.list();

  for (const item of placesList) {
    if (item.type === "-") {
      const fileStream = await ftp.get(item.name);
      console.log(item.name);
      fileStream.pipe(fs.createWriteStream("backup/places/" + item.name));
    }
  }

  await ftp.end();
};

module.exports = backupData;
