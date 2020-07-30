const to = require("await-to-js").default;
const fs = require("fs");
const path = require("path");
const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
require("dayjs/locale/en-au"); // load on demand
dayjs.extend(utc);
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const rimraf = require("rimraf");
const argv = require("yargs").argv;
const { sum, min, max, pairs, rollups, ascending } = require("d3-array");
const { parse } = require("date-fns");
const slugify = require("slugify");
const query = require("cli-interact").getYesNo;

const credentials = require("./secret.json");
const format = require("./format");
const formatWho = require("./formatWho");
const getCountryTotals = require("./getCountryTotals");
const getAfter100 = require("./getAfter100");
const getAndParseUrl = require("./getAndParseUrl");
const getDsiData = require("./getDsiData");
const colectHybridData = require("./collectHybridData");
const getHybridExtra = require("./getHybridExtra");
const getPlacesTotals = require("./getPlacesTotals");
const getRegions = require("./getRegions");
const parseLocalAcquisitionData = require("./parseLocalAcquisitionData");
const backupData = require("./backupData");

const TEMP_PATH = path.join(__dirname, `../tmp`);

function writeTempJSON(name, jsonOrObject) {
  if (!fs.existsSync(TEMP_PATH)) {
    fs.mkdirSync(TEMP_PATH, { recursive: true });
  }

  fs.writeFileSync(
    path.join(TEMP_PATH, `${name}.json`),
    typeof jsonOrObject === "object"
      ? JSON.stringify(jsonOrObject)
      : jsonOrObject
  );

  console.log(`Temporary data written to ${name}.json`);
}

// TODO: this isn't needed any more I think (check)
let isHybridUpdatable = true;

const startTime = dayjs();

console.log(`##########################################
WELCOME TO THE COVID-19 DATA PIPELINE TOOL
##########################################
The time is: ${startTime.format()}`);

const {
  JOHNS_HOPKINS_DATA_URL,
  ORIGINAL_JOHNS_HOPKINS_DEATHS_URL,
  ORIGINAL_JOHNS_HOPKINS_RECOVERIES_URL,
  ORIGINAL_WHO_DATA_URL,
  ORIGINAL_ECDC_DATA_URL,
  DSI_DATA_URL,
  DSI_SOURCE_OF_INFECTION_URL,
} = require("./urls");

const main = async () => {
  // Fetch all data
  const johnsHopkinsParsed = await getAndParseUrl(JOHNS_HOPKINS_DATA_URL);
  const johnsHopkinsDeathsParsed = await getAndParseUrl(
    ORIGINAL_JOHNS_HOPKINS_DEATHS_URL
  );
  const johnsHopkinsRecoveriesParsed = await getAndParseUrl(
    ORIGINAL_JOHNS_HOPKINS_RECOVERIES_URL
  );
  const parsedWho = await getAndParseUrl(ORIGINAL_WHO_DATA_URL);
  const parsedEcdc = await getAndParseUrl(ORIGINAL_ECDC_DATA_URL);
  const dsiFormatted = await getDsiData(DSI_DATA_URL);

  // Format Johns Hopkins data
  const formattedData = format(johnsHopkinsParsed.data);
  const formatedJohnsHopkinsDeathsData = format(johnsHopkinsDeathsParsed.data);
  const formatedJohnsHopkinsRecoveriesData = format(
    johnsHopkinsRecoveriesParsed.data
  );

  // Object containing all the regions that are part of countries
  const formattedRegions = getRegions({
    cases: formattedData,
    deaths: formatedJohnsHopkinsDeathsData,
    recoveries: formatedJohnsHopkinsRecoveriesData,
  });

  // Combine Johns Hopkins states into countries and reformat
  const countryTotals = getCountryTotals(formattedData);
  const after100 = getAfter100(countryTotals);

  const johnsHopkinsDeathsCountryTotals = getCountryTotals(
    formatedJohnsHopkinsDeathsData
  );
  const johnsHopkinsRecoveriesCountryTotals = getCountryTotals(
    formatedJohnsHopkinsRecoveriesData
  );

  // Format WHO data
  const whoCountryTotals = formatWho(parsedWho.data);
  const whoAfter100 = getAfter100(whoCountryTotals);

  // Format ECDC data
  const ecdcCountryTotals = formatWho(parsedEcdc.data);
  const ecdcAfter100 = getAfter100(ecdcCountryTotals);

  // Combining Johns Hopkins + DSI + some ECDC
  const hybridData = colectHybridData(
    countryTotals,
    dsiFormatted,
    ecdcCountryTotals
  );

  // Try to account for time zones and differing update times
  // Previously we were shifting days. Now we remove latest DSI day
  let finalHybridDate;
  let finalJohnsHopkinsDate;

  // Get the last day by looping through
  // TODO: probably find a more direct way to do this
  for (let day in hybridData.Australia) {
    finalHybridDate = day;
  }
  for (let day in countryTotals.Australia) {
    finalJohnsHopkinsDate = day;
  }

  // Now we don't need the days to line up
  // Up to date data is more important
  // So we just check all the data is in
  // by checking if total cases is the same or higher
  const hybridAustraliaFinalDayCount = hybridData.Australia[finalHybridDate];
  const hybridAustraliaPenultimateDayCount =
    hybridData.Australia[
      dayjs(finalHybridDate).subtract(1, "day").format("YYYY-MM-DD")
    ];

  console.log(
    "Latest day: " + hybridAustraliaFinalDayCount,
    "Yesterday count: " + hybridAustraliaPenultimateDayCount
  );

  if (hybridAustraliaFinalDayCount < hybridAustraliaPenultimateDayCount) {
    console.log("DSI data likely incomplete. Deleting final day.");
    // Delete latest date (probably incomplete)
    delete hybridData.Australia[finalHybridDate];
  }

  // Get after 100 cases data for hybrid
  const hybridAfter100 = getAfter100(hybridData);

  // Counries cases deaths recoveries
  const hybridExtra = getHybridExtra({
    originalData: hybridData,
    deaths: johnsHopkinsDeathsCountryTotals,
    recoveries: johnsHopkinsRecoveriesCountryTotals,
  });

  // One master file to rule them all
  const placesTotals = getPlacesTotals({
    countries: hybridExtra,
    regions: formattedRegions,
  });

  // Separate DSI data for Simon's piece
  const dsiSourceOfInfection = await getAndParseUrl(
    DSI_SOURCE_OF_INFECTION_URL
  );

  const dsiSourceOfInfectionParsed = parseLocalAcquisitionData(
    dsiSourceOfInfection.data
  );

  // Write files to temporary directory
  // Clear dir
  rimraf.sync(TEMP_PATH);
  console.log("Cleaning tmp directory...");

  // Write full data
  writeTempJSON("data", formattedData);

  // Write country totals
  writeTempJSON("country-totals", countryTotals);

  // Write country totals after 100
  writeTempJSON("after-100-cases", after100);

  // Write WHO data
  writeTempJSON("who-country-totals", whoCountryTotals);
  writeTempJSON("who-after-100-cases", whoAfter100);

  // Write ECDC data
  writeTempJSON("ecdc-country-totals", ecdcCountryTotals);
  writeTempJSON("ecdc-after-100-cases", ecdcAfter100);

  // Write Hybrid data to disk, only if AUS 1 day ahead
  if (isHybridUpdatable) {
    writeTempJSON("hybrid-country-totals", hybridData);
    writeTempJSON("hybrid-after-100-cases", hybridAfter100);
    writeTempJSON("places-totals", placesTotals);
  }

  // Write countries total with deaths etc
  writeTempJSON("country-totals-extra", hybridExtra);

  // Write countries total with deaths etc
  writeTempJSON("dsi-local-acquisition", dsiSourceOfInfectionParsed);

  // Also upload timestamped data with --timestamp argument
  // eg. node src/index.js --timestamp
  // NOTE: PROBABLY DON'T DO THIS TO NOT WASTE DISK SPACE
  if (argv.timestamp) {
    writeTempJSON(
      `data${dayjs.utc().format("--YYYY-MM-DDTHHmmss[Z]")}`,
      formattedData
    );
  }

  // Let's make a static api to save data transfers if
  // people only want a certain country
  const tempPlacesPath = path.join(TEMP_PATH, "places");

  if (!fs.existsSync(tempPlacesPath)) {
    fs.mkdirSync(tempPlacesPath, { recursive: true });
  }

  for (const placeName in placesTotals) {
    const individualPlace = { name: placeName, ...placesTotals[placeName] };
    const slugifiedPlaceName = slugify(placeName, {
      replacement: "-", // replace spaces with replacement character, defaults to `-`
      remove: undefined, // remove characters that match regex, defaults to `undefined`
      lower: true, // convert to lower case, defaults to `false`
      strict: true, // strip special characters except replacement, defaults to `false`
    });
    writeTempJSON(`places/${slugifiedPlaceName}`, individualPlace);
  }

  // Deploy to FTP by default use --no-ftp to override
  // TODO: Implement a progress monitor
  if (argv.ftp || typeof argv.ftp === "undefined") {
    // DON'T WAIT FOR USER INPUT ANY MORE (NOT REQUIRED)
    // var answer = query("ABC network (or VPN) access required for backup and upload. Ready?");
    // console.log("You answered:", answer);

    // Use --no-backup to avoid backing up
    if (argv.backup || typeof argv.backup === "undefined") {
      // Backup remote data first just in case
      console.log("Backing up data...");
      await backupData();
      console.log("Data backed up...");
    }

    console.log(
      "Deploying from /tmp to remote FTP. This might take a while...\n"
    );

    ftpDeploy.on("uploading", function (data) {
      // total file count being transferred
      console.log(
        `Transferred ${data.transferredFileCount} of ${data.totalFilesCount}`
      ); // number of files transferred
      console.log(data.filename); // partial path with filename being uploaded
    });

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

    console.log(`Johns Hopkins data:
https://www.abc.net.au/dat/news/interactives/covid19-data/data.json
Also:
https://www.abc.net.au/dat/news/interactives/covid19-data/country-totals.json
And:
https://www.abc.net.au/dat/news/interactives/covid19-data/after-100-cases.json

WHO country totals:
https://www.abc.net.au/dat/news/interactives/covid19-data/who-country-totals.json
WHO after 100:
https://www.abc.net.au/dat/news/interactives/covid19-data/who-after-100-cases.json

ECDC country totals:
https://www.abc.net.au/dat/news/interactives/covid19-data/ecdc-country-totals.json
ECDC after 100:
https://www.abc.net.au/dat/news/interactives/covid19-data/ecdc-after-100-cases.json

ABC hybrid country totals:
https://www.abc.net.au/dat/news/interactives/covid19-data/hybrid-country-totals.json
ABC hybrid after 100:
https://www.abc.net.au/dat/news/interactives/covid19-data/hybrid-after-100-cases.json

ABC hybrid extra data (deaths etc.):
https://www.abc.net.au/dat/news/interactives/covid19-data/country-totals-extra.json

Combined data with deaths and recovered and regions etc:
https://www.abc.net.au/dat/news/interactives/covid19-data/places-totals.json

DSI source of infection data:
https://www.abc.net.au/dat/news/interactives/covid19-data/dsi-local-acquisition.json

Individual places also available at eg:
https://www.abc.net.au/dat/news/interactives/covid19-data/places/australia.json
Just change the filename to the place you want (slugified) eg. new-zealand.json`);
  }

  console.log(
    `Operation took: ${dayjs()
      .diff(startTime, "minutes", true)
      .toFixed(2)} minutes`
  );
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

// Make sure Johns Hopkins and DSI data line up days
// if (
//   dayjs(finalHybridDate)
//     .subtract(1, "day")
//     .isSame(dayjs(finalJohnsHopkinsDate), "day")
// ) {
//   console.log("Australia DSI data is 1 day ahead. We are go for update...");
//   isHybridUpdatable = true;

//   // Delete latest date (probably incomplete)
//   delete hybridData.Australia[finalHybridDate];

//   // Sort Hybrid data keys for added days (YES AGAIN)
//   hybridData.Australia = sortKeys(hybridData.Australia);
// }
