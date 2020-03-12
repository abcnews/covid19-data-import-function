const axios = require("axios");
const to = require("await-to-js").default;
const Papa = require("papaparse");
const fs = require("fs");
const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const credentials = require("./secret.json");

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
    console.log(fetchErr);
    res.json("Fetch error...");
    return;
  }

  console.log("Remote file fetched...")

  // Parse the CSV data
  const parsed = Papa.parse(fetchResponse.data, {
    header: true,
    dynamicTyping: true
  });

  console.log("CSV parsed...")

  // Upload to FTP
  // Write json to tmp directory
  fs.writeFileSync("/tmp/data.json", JSON.stringify(parsed.data));

  const [ftpErr, ftpResponse] = await to(
    ftpDeploy.deploy({
      user: credentials.user,
      password: credentials.password,
      host: credentials.host,
      port: 21,
      localRoot: "tmp",
      remoteRoot: credentials.remoteRoot,
      include: ["data.json"],
      exclude: [],
      deleteRemote: false,
      forcePasv: true
    })
  );

  if (ftpErr) {
    console.log(ftpErr);
    res.json("FTP error...");
    return;
  }

  console.log("Uploaded to FTP...")
  console.log(ftpResponse);
};

main();
