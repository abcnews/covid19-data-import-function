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
const formatWho = require("./formatWho");
const getCountryTotals = require("./getCountryTotals");
const getAfter100 = require("./getAfter100");

const ORIGINAL_DATA_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";
const ORIGINAL_WHO_DATA_URL =
  "https://covid.ourworldindata.org/data/full_data.csv";
const ORIGINAL_ECDC_DATA_URL =
  "https://covid.ourworldindata.org/data/ecdc/full_data.csv";

const main = async () => {
  // Fetch John Hopkins data
  const [fetchErr, fetchResponse] = await to(
    axios({
      method: "get",
      url: ORIGINAL_DATA_URL
    })
  );

  // Catch fetch errors
  if (fetchErr) {
    console.log("Fetch error...", fetchErr);
    return;
  }

  console.log("Remote John Hopkins file fetched...");
  console.log(ORIGINAL_DATA_URL);

  // Fetch WHO data
  const [fetchWhoErr, fetchWhoResponse] = await to(
    axios({
      method: "get",
      url: ORIGINAL_WHO_DATA_URL
    })
  );

  // Catch fetch errors
  if (fetchWhoErr) {
    console.log("Fetch WHO error...", fetchErr);
    return;
  }

  console.log("Remote WHO file fetched...");
  console.log(ORIGINAL_WHO_DATA_URL);

  // Fetch ECDC data
  const [fetchEcdcErr, fetchEcdcResponse] = await to(
    axios({
      method: "get",
      url: ORIGINAL_ECDC_DATA_URL
    })
  );

  // Catch fetch errors
  if (fetchEcdcErr) {
    console.log("Fetch Ecdc error...", fetchEcdcErr);
    return;
  }

  console.log("Remote ECDC file fetched...");
  console.log(ORIGINAL_ECDC_DATA_URL);

  // Parse the Johns Hopkins CSV data
  const parsed = Papa.parse(fetchResponse.data, {
    header: true,
    dynamicTyping: true
  });

  console.log("CSV parsed...");

  // Parse the WHO CSV data
  const parsedWho = Papa.parse(fetchWhoResponse.data, {
    header: true,
    dynamicTyping: true
  });

  console.log("CSV WHO parsed...");

  // Parse the ECDC CSV data
  const parsedEcdc = Papa.parse(fetchEcdcResponse.data, {
    header: true,
    dynamicTyping: true
  });

  console.log("CSV ECDC parsed...");

  // Format data
  const formattedData = format(parsed.data);
  const countryTotals = getCountryTotals(formattedData);
  const after100 = getAfter100(countryTotals);

  // Format WHO data
  const whoCountryTotals = formatWho(parsedWho.data);
  const whoAfter100 = getAfter100(whoCountryTotals);

  // Format ECDC data
  const ecdcCountryTotals = formatWho(parsedEcdc.data);
  const ecdcAfter100 = getAfter100(ecdcCountryTotals);

  // Upload to FTP
  // Clear dir
  rimraf.sync("./tmp/*");
  console.log("Cleaning tmp directory...");

  // Write full data
  fs.writeFileSync("./tmp/data.json", JSON.stringify(formattedData));
  console.log("Temporary data written to data.json");

  // Write country totals
  fs.writeFileSync("./tmp/country-totals.json", JSON.stringify(countryTotals));
  console.log("Temporary data written to country-totals.json");

  // Write country totals after 100
  fs.writeFileSync("./tmp/after-100-cases.json", JSON.stringify(after100));
  console.log("Temporary data written to after-100-cases.json");

  // Write WHO data
  fs.writeFileSync(
    "./tmp/who-country-totals.json",
    JSON.stringify(whoCountryTotals)
  );
  console.log("Temporary data written to who-country-totals.json");

  fs.writeFileSync(
    "./tmp/who-after-100-cases.json",
    JSON.stringify(whoAfter100)
  );
  console.log("Temporary data written to who-after-100-cases.json");

  // Write ECDC data
  fs.writeFileSync(
    "./tmp/ecdc-country-totals.json",
    JSON.stringify(ecdcCountryTotals)
  );
  console.log("Temporary data written to ecdc-country-totals.json");

  fs.writeFileSync(
    "./tmp/ecdc-after-100-cases.json",
    JSON.stringify(ecdcAfter100)
  );
  console.log("Temporary data written to ecdc-after-100-cases.json");

  // Also upload timestamped data with --timestamp argument
  // eg. node src/index.js --timestamp
  // NOTE: PROBABLY DON'T DO THIS TO NOT WASTE DISK SPACE
  if (argv.timestamp) {
    const filenameTime = dayjs.utc().format("--YYYY-MM-DDTHHmmss[Z]");
    const tempFilenameWithTime = `./tmp/data${filenameTime}.json`;

    fs.writeFileSync(tempFilenameWithTime, JSON.stringify(formattedData));
    console.log("Temporary data written to " + tempFilenameWithTime);
  }

  // Deploy to FTP by default use --no-ftp to override
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
      console.log("FTP error...", ftpErr);
      return;
    }

    // User feedback
    console.log("Uploaded to FTP...", ftpResponse);
    console.log(
      "Data should be available at: https://www.abc.net.au/dat/news/interactives/covid19-data/data.json"
    );
    console.log(
      "Also https://www.abc.net.au/dat/news/interactives/covid19-data/country-totals.json"
    );
    console.log(
      "And https://www.abc.net.au/dat/news/interactives/covid19-data/after-100-cases.json"
    );
    console.log(
      "WHO country totals: https://www.abc.net.au/dat/news/interactives/covid19-data/who-country-totals.json"
    );
    console.log(
      "WHO after 100: https://www.abc.net.au/dat/news/interactives/covid19-data/who-after-100-cases.json"
    );
  }
};

// Run main async function
main();
