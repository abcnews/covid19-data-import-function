const axios = require("axios");
const to = require("await-to-js").default;
const Papa = require("papaparse");
const fs = require("fs");
const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const credentials = require("./secret.json");

const ORIGINAL_DATA_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";

exports.main = async (req, res) => {
  const [err, response] = await to(
    axios({
      method: "get",
      url: ORIGINAL_DATA_URL
    })
  );

  // Catch fetch errors
  if (err) {
    console.log(err);
    res.json("Fetch error...");
    return;
  }

  // Parse the CSV data
  const parsed = Papa.parse(response.data, {
    header: true,
    dynamicTyping: true
  });

  // Write json to tmp directory
  // Make it synchronous otherwise function will end prematurely
  fs.writeFileSync("/tmp/data.json", JSON.stringify(parsed.data));

  // Upload to FTP
  if (req.query.ftp === "true") {
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

    console.log(ftpResponse);
  }

  // Return the data (just in case)
  res.json(parsed.data);
};
