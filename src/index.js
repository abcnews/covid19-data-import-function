const to = require("await-to-js").default;
const fs = require("fs");
const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
require("dayjs/locale/en-au"); // load on demand
dayjs.extend(utc);
const rimraf = require("rimraf");
const argv = require("yargs").argv;

const credentials = require("./secret.json");
const format = require("./format");
const formatWho = require("./formatWho");
const getCountryTotals = require("./getCountryTotals");
const getAfter100 = require("./getAfter100");
const getAndParseUrl = require("./getAndParseUrl");
const getDsiData = require("./getDsiData");
const colectHybridData = require("./collectHybridData");
const getHybridExtra = require("./getHybridExtra");

let isHybridUpdatable = false;

const {
  ORIGINAL_JOHNS_HOPKINS_DATA_URL,
  ORIGINAL_JOHNS_HOPKINS_DEATHS_URL,
  ORIGINAL_JOHNS_HOPKINS_RECOVERED_URL,
  ORIGINAL_WHO_DATA_URL,
  ORIGINAL_ECDC_DATA_URL,
  ORIGINAL_DSI_DATA,
} = require("./urls");

const main = async () => {
  // Fetch all data
  const johnsHopkinsParsed = await getAndParseUrl(
    ORIGINAL_JOHNS_HOPKINS_DATA_URL
  );
  const johnsHopkinsDeathsParsed = await getAndParseUrl(
    ORIGINAL_JOHNS_HOPKINS_DEATHS_URL
  );
  const johnsHopkinsRecoveredParsed = await getAndParseUrl(
    ORIGINAL_JOHNS_HOPKINS_RECOVERED_URL
  );
  const parsedWho = await getAndParseUrl(ORIGINAL_WHO_DATA_URL);
  const parsedEcdc = await getAndParseUrl(ORIGINAL_ECDC_DATA_URL);
  const dsiFormatted = await getDsiData(ORIGINAL_DSI_DATA);

  // Format Johns Hopkins data
  const formattedData = format(johnsHopkinsParsed.data);
  const formatedJohnsHopkinsDeathsData = format(johnsHopkinsDeathsParsed.data);
  const formatedJohnsHopkinsRecoveredData = format(
    johnsHopkinsRecoveredParsed.data
  );

  // Combine Johns Hopkins states into countries and reformat
  const countryTotals = getCountryTotals(formattedData);
  const after100 = getAfter100(countryTotals);

  const johnsHopkinsDeathsCountryTotals = getCountryTotals(
    formatedJohnsHopkinsDeathsData
  );
  const johnsHopkinsRecoveredCountryTotals = getCountryTotals(
    formatedJohnsHopkinsRecoveredData
  );

  // Format WHO data
  const whoCountryTotals = formatWho(parsedWho.data);
  const whoAfter100 = getAfter100(whoCountryTotals);

  // Format ECDC data
  const ecdcCountryTotals = formatWho(parsedEcdc.data);
  const ecdcAfter100 = getAfter100(ecdcCountryTotals);

  const hybridData = colectHybridData(
    countryTotals,
    dsiFormatted,
    ecdcCountryTotals
  );

  // Try to account for time zones and differing update times
  // Previously we were shifting days. Now we remove latest DSI day
  let finalHybridDate;
  let finalJohnsHopkinsDate;

  // Make sure Australia is 1 day ahead (timezones are weird)
  for (let day in hybridData.Australia) {
    finalHybridDate = day;
  }

  for (let day in countryTotals.Australia) {
    finalJohnsHopkinsDate = day;
  }

  if (
    dayjs(finalHybridDate)
      .subtract(1, "day")
      .isSame(dayjs(finalJohnsHopkinsDate), "day")
  ) {
    console.log("Australia DSI data is 1 day ahead. We are go for update...");
    isHybridUpdatable = true;

    // Delete latest date (probably incomplete)
    delete hybridData.Australia[finalHybridDate];

    // Sort Hybrid data keys for added days (YES AGAIN)
    hybridData.Australia = sortKeys(hybridData.Australia);
  }

  // Get after 100 cases data for hybrid
  const hybridAfter100 = getAfter100(hybridData);

  const hybridExtra = getHybridExtra({
    originalData: hybridData,
    deaths: johnsHopkinsDeathsCountryTotals,
    recovered: johnsHopkinsRecoveredCountryTotals,
  });

  // Write files to temporary directory
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

  // Write Hybrid data to disk, only if AUS 1 day ahead
  if (isHybridUpdatable) {
    fs.writeFileSync(
      "./tmp/hybrid-country-totals.json",
      JSON.stringify(hybridData)
    );
    console.log("Temporary data written to hybrid-country-totals.json");

    fs.writeFileSync(
      "./tmp/hybrid-after-100-cases.json",
      JSON.stringify(hybridAfter100)
    );
    console.log("Temporary data written to hybrid-after-100-cases.json");
  }

  // Write countries total with deaths etc
  fs.writeFileSync(
    "./tmp/country-totals-extra.json",
    JSON.stringify(hybridExtra)
  );
  console.log("Temporary data written to country-totals-extra.json");

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
  // TODO: Implement a progress monitor
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
        forcePasv: true,
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
    console.log(
      "ECDC country totals: https://www.abc.net.au/dat/news/interactives/covid19-data/ecdc-country-totals.json"
    );
    console.log(
      "ECDC after 100: https://www.abc.net.au/dat/news/interactives/covid19-data/ecdc-after-100-cases.json"
    );

    console.log(
      "ABC hybrid country totals: https://www.abc.net.au/dat/news/interactives/covid19-data/hybrid-country-totals.json"
    );
    console.log(
      "ABC hybrid after 100: https://www.abc.net.au/dat/news/interactives/covid19-data/hybrid-after-100-cases.json"
    );
    console.log(
      "ABC hybrid extra data (deaths etc.): https://www.abc.net.au/dat/news/interactives/covid19-data/country-totals-extra.json"
    );
  }
};

// Run main async function
main();


// Helper functions
function sortKeys(unsortedObject) {
  sortedObject = {};

  Object.keys(unsortedObject)
    .sort()
    .forEach(function (key) {
      sortedObject[key] = unsortedObject[key];
    });

  return sortedObject;
}

// OLD CODE

// // Bump back each day 1 day
// for (let day in hybridData.Australia) {
//   const theDayBefore = dayjs(day)
//     .subtract(1, "day")
//     .format("YYYY-MM-DD");
//   hybridData.Australia[theDayBefore] = hybridData.Australia[day];
// }
// // Delete bumped up day
// delete hybridData.Australia["2020-01-21"];
