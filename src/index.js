const axios = require("axios");
const to = require("await-to-js").default;
const Papa = require("papaparse");
const fs = require("fs");
const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const rimraf = require("rimraf");
const argv = require("yargs").argv;

const credentials = require("./secret.json");
const format = require("./format");

const ORIGINAL_DATA_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";

const main = async () => {
  const [fetchErr, fetchResponse] = await to(
    axios({
      method: "get",
      url: ORIGINAL_DATA_URL
    })
  );

  // Catch fetch errors
  if (fetchErr) {
    res.json("Fetch error...", fetchErr);
    return;
  }

  console.log("Remote file fetched...");
  console.log(ORIGINAL_DATA_URL);

  // Parse the CSV data
  const parsed = Papa.parse(fetchResponse.data, {
    header: true,
    dynamicTyping: true
  });

  console.log("CSV parsed...");

  // Format data
  const formattedData = format(parsed.data);

  // Upload to FTP
  // Clear dir
  rimraf.sync("./tmp/*");
  console.log("Cleaning tmp directory...");

  fs.writeFileSync("./tmp/data.json", JSON.stringify(formattedData));
  console.log("Temporary data written to data.json");

  // Also upload timestamped data with --timestamp argument
  // eg. node src/index.js --timestamp
  if (argv.timestamp) {
    const filenameTime = dayjs.utc().format("--YYYY-MM-DDTHHmmss[Z]");
    const tempFilenameWithTime = `./tmp/data${filenameTime}.json`;

    fs.writeFileSync(tempFilenameWithTime, JSON.stringify(formattedData));
    console.log("Temporary data written to " + tempFilenameWithTime);
  }

  if (argv.ftp || typeof argv.ftp === "undefined") {
    const [ftpErr, ftpResponse] = await to(
      ftpDeploy.deploy({
        user: credentials.user,
        password: credentials.password,
        host: credentials.host,
        port: 21,
        localRoot: "./tmp",
        remoteRoot: credentials.remoteRoot,
        include: ["*"],
        exclude: [".*"],
        deleteRemote: false,
        forcePasv: true
      })
    );

    if (ftpErr) {
      res.json("FTP error...", ftpErr);
      return;
    }

    console.log("Uploaded to FTP...", ftpResponse);
    console.log(
      "Data should be available at: https://www.abc.net.au/dat/news/interactives/covid19-data/data.json"
    );
  }
};

main();
