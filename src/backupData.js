// const axios = require("axios");
const fs = require("fs");
const PromiseFtp = require("promise-ftp");
const ftp = new PromiseFtp();
const { zip } = require("zip-a-folder");
const dayjs = require("dayjs");
const rimraf = require("rimraf");
const findConfig = require("find-config");

// First clear current backups
rimraf.sync("./backup/*");

// Make sure backup and archive folders exist
const backupDir = "./backup";
const placesDir = "./backup/places";
const archiveDir = "./archive";

makeDirIfNotExist(backupDir);
makeDirIfNotExist(placesDir);
makeDirIfNotExist(archiveDir);

function makeDirIfNotExist(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

const backupData = async () => {
  const config = JSON.parse(findConfig.read(".abc-credentials"));
  const credentials = config.contentftp;

  // Some ftp credentials for backup purposes
  const connectionResponse = await ftp.connect({
    host: credentials.host,
    user: credentials.username,
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

  await zip(
    "backup",
    `archive/backup-${dayjs().format("YYYY-MM-DDTHH-mm-ss")}.zip`
  );
};

module.exports = backupData;
