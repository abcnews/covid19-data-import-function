/**
 * Welcome to the COVID-19 Data Import Tool
 * A nodejs script that gets data and uploads it to
 * the ABC FTP server.
 * It runs currently hourly on http://newsdev3/
 */

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
const findConfig = require("find-config");

const {
  getIntlVaccinationsData,
  getAusVaccinationsData,
  getVicVaxData,
} = require("./vaccinations/index.js");

const getACTExposureSitesData = require("./exposure-sites/act-exposure-sites/index.js");
const getNSWExposureSitesData = require("./exposure-sites/nsw-exposure-sites/index.js");
const getQLDExposureSitesData = require("./exposure-sites/qld-exposure-sites/index.js");
const getSAExposureSitesData = require("./exposure-sites/sa-exposure-sites/index.js");
const getVicExposureSitesData = require("./exposure-sites/vic-exposure-sites/index.js");
const getWAExposureSitesData = require("./exposure-sites/wa-exposure-sites/index.js");

// AUS Covid data
const { getAusCovidData } = require("./aus-covid/index.js");

// NSW Case data
const {
  getNSWCasesData,
  getNSWVaxData,
  getNSWCasesAnnouncements,
} = require("./nsw-covid/index.js");

// Setup some constants
REMOTE_ROOT = "/www/dat/news/interactives/covid19-data";

const {
  formatJohnsHopkins,
  formatWhoOrEcdc,
  formatCtpUsStates,
} = require("./lib/format");

const getCountryTotals = require("./getCountryTotals");
const getAfter100 = require("./getAfter100");
const { getAndParseUrl, getUrl } = require("./getAndParseUrl");
// No longer needed?
// const getDsiData = require("./getDsiData");
const colectHybridData = require("./collectHybridData");
const getHybridExtra = require("./getHybridExtra");
const getPlacesTotals = require("./getPlacesTotals");
const getJohnsHopkinsRegions = require("./getJohnsHopkinsRegions");
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

function writeTempCSV(name, string) {
  if (!fs.existsSync(TEMP_PATH)) {
    fs.mkdirSync(TEMP_PATH, { recursive: true });
  }

  fs.writeFileSync(path.join(TEMP_PATH, `${name}.csv`), string);

  console.log(`Temporary data written to ${name}.csv`);
}

// TODO: this isn't needed any more I think (check)
// let isHybridUpdatable = true;

const startTime = dayjs();

console.log(`########################################################################
_______  _______  __   __  ___   ______                               
|       ||       ||  | |  ||   | |      |                              
|       ||   _   ||  |_|  ||   | |  _    |                             
|       ||  | |  ||       ||   | | | |   |                             
|      _||  |_|  ||       ||   | | |_|   |                             
|     |_ |       | |     | |   | |       |                             
|_______||_______|  |___|  |___| |______|                              
 ______   _______  _______  _______                                    
|      | |   _   ||       ||   _   |                                   
|  _    ||  |_|  ||_     _||  |_|  |                                   
| | |   ||       |  |   |  |       |                                   
| |_|   ||       |  |   |  |       |                                   
|       ||   _   |  |   |  |   _   |                                   
|______| |__| |__|  |___|  |__| |__|                                   
 ___   __   __  _______  _______  ______    _______  _______  ______   
|   | |  |_|  ||       ||       ||    _ |  |       ||       ||    _ |  
|   | |       ||    _  ||   _   ||   | ||  |_     _||    ___||   | ||  
|   | |       ||   |_| ||  | |  ||   |_||_   |   |  |   |___ |   |_||_ 
|   | |       ||    ___||  |_|  ||    __  |  |   |  |    ___||    __  |
|   | | ||_|| ||   |    |       ||   |  | |  |   |  |   |___ |   |  | |
|___| |_|   |_||___|    |_______||___|  |_|  |___|  |_______||___|  |_|

########################################################################
The time is: ${startTime.format()}`);

const {
  JOHNS_HOPKINS_CASES_URL,
  JOHNS_HOPKINS_DEATHS_URL,
  JOHNS_HOPKINS_RECOVERIES_URL,
  WHO_DATA_URL,
  ECDC_DATA_URL,
  DSI_DATA_URL,
  DSI_SOURCE_OF_INFECTION_URL,
  CTP_US_STATES_URL,
  JOHNS_HOPKINS_GLOBAL_URL,
} = require("./urls");

const main = async () => {
  // Story Lab CODE
  try {
    // Fetch all data
    const johnsHopkinsCasesParsed = await getAndParseUrl(
      JOHNS_HOPKINS_CASES_URL
    );
    const johnsHopkinsDeathsParsed = await getAndParseUrl(
      JOHNS_HOPKINS_DEATHS_URL
    );
    const johnsHopkinsRecoveriesParsed = await getAndParseUrl(
      JOHNS_HOPKINS_RECOVERIES_URL
    );

    // !!!!! DATA NO LONGER AVAILABLE/NOT BEING UPDATED !!!!!
    // const parsedWho = await getAndParseUrl(WHO_DATA_URL);
    // const parsedEcdc = await getAndParseUrl(ECDC_DATA_URL);
    // const dsiFormatted = await getDsiData(DSI_DATA_URL);

    const parsedCtpUsStates = await getAndParseUrl(CTP_US_STATES_URL);

    const johnsHopkinsGlobal = await getAndParseUrl(JOHNS_HOPKINS_GLOBAL_URL);

    // Format Johns Hopkins data
    const formattedJohnsHopkinsCasesData = formatJohnsHopkins(
      johnsHopkinsCasesParsed.data
    );
    const formattedJohnsHopkinsDeathsData = formatJohnsHopkins(
      johnsHopkinsDeathsParsed.data
    );
    const formattedJohnsHopkinsRecoveriesData = formatJohnsHopkins(
      johnsHopkinsRecoveriesParsed.data
    );

    // Format CTP US states data
    const formattedCtpUsStatesData = formatCtpUsStates(parsedCtpUsStates.data);

    // Object containing all the regions that are part of countries
    const formattedRegions = {
      ...getJohnsHopkinsRegions({
        cases: formattedJohnsHopkinsCasesData,
        deaths: formattedJohnsHopkinsDeathsData,
        recoveries: formattedJohnsHopkinsRecoveriesData,
      }),
      ...formattedCtpUsStatesData,
    };

    // Combine Johns Hopkins states into countries and reformat
    const johnsHopkinsCasesCountryTotals = getCountryTotals(
      formattedJohnsHopkinsCasesData
    );
    const johnsHopkinsAfter100 = getAfter100(johnsHopkinsCasesCountryTotals);

    const johnsHopkinsDeathsCountryTotals = getCountryTotals(
      formattedJohnsHopkinsDeathsData
    );
    const johnsHopkinsRecoveriesCountryTotals = getCountryTotals(
      formattedJohnsHopkinsRecoveriesData
    );

    // Format WHO data
    // const whoCountryTotals = formatWhoOrEcdc(parsedWho.data);
    // const whoAfter100 = getAfter100(whoCountryTotals);

    // Format ECDC data
    // const ecdcCountryTotals = formatWhoOrEcdc(parsedEcdc.data);
    // const ecdcAfter100 = getAfter100(ecdcCountryTotals);

    // Combining Johns Hopkins + DSI + some ECDC
    const hybridData = colectHybridData(
      johnsHopkinsCasesCountryTotals
      // dsiFormatted,
      // ecdcCountryTotals
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
    for (let day in johnsHopkinsCasesCountryTotals.Australia) {
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

    // Format global data
    const formattedJohnsHopkinsGlobal = { name: "Global", type: "aggregate" };

    const globalDates = {};

    for (const dateData of johnsHopkinsGlobal.data) {
      globalDates[dateData.Date] = {
        cases: dateData.Confirmed,
        deaths: dateData.Deaths,
        recoveries: dateData.Recovered,
      };
    }

    formattedJohnsHopkinsGlobal.dates = globalDates;

    // johnsHopkinsGlobal.data.map(
    //   (dateData) => ({
    //     [dateData.Date]: {
    //       cases: dateData.Confirmed,
    //       deaths: dateData.Deaths,
    //       recoveries: dateData.Recovered,
    //     },
    //   })
    // );

    // Write files to temporary directory
    // Clear dir
    rimraf.sync(TEMP_PATH);
    console.log("Cleaning tmp directory...");

    // Write full data
    writeTempJSON("data", formattedJohnsHopkinsCasesData);

    // Write country totals
    writeTempJSON("country-totals", johnsHopkinsCasesCountryTotals);

    // Write country totals after 100
    writeTempJSON("after-100-cases", johnsHopkinsAfter100);

    // Write WHO data
    // writeTempJSON("who-country-totals", whoCountryTotals);
    // writeTempJSON("who-after-100-cases", whoAfter100);

    // Write ECDC data
    // writeTempJSON("ecdc-country-totals", ecdcCountryTotals);
    // writeTempJSON("ecdc-after-100-cases", ecdcAfter100);

    // Write Hybrid data to disk, only if AUS 1 day ahead
    // TODO: Make this the source of truth
    // if (isHybridUpdatable) {
    writeTempJSON("hybrid-country-totals", hybridData);
    writeTempJSON("hybrid-after-100-cases", hybridAfter100);

    // DEPRECATED THIS FILE AS 11MB IS TOO BIG
    // writeTempJSON("places-totals", placesTotals); // <-------
    // }

    // Write countries total with deaths etc
    writeTempJSON("country-totals-extra", hybridExtra);

    // Write countries total with deaths etc
    writeTempJSON("dsi-local-acquisition", dsiSourceOfInfectionParsed);

    // Also upload timestamped data with --timestamp argument
    // eg. node src/index.js --timestamp
    // NOTE: PROBABLY DON'T DO THIS ALL THE TIME TO NOT WASTE DISK SPACE
    if (argv.timestamp) {
      writeTempJSON(
        `data${dayjs.utc().format("--YYYY-MM-DDTHHmmss[Z]")}`,
        formattedJohnsHopkinsCasesData
      );
    }

    // Let's make a static api to save data transfers if
    // people only want a certain country
    const tempPlacesPath = path.join(TEMP_PATH, "places");

    if (!fs.existsSync(tempPlacesPath)) {
      fs.mkdirSync(tempPlacesPath, { recursive: true });
    }

    let lookupKey = {};

    for (const placeName in placesTotals) {
      const individualPlace = { name: placeName, ...placesTotals[placeName] };
      const slugifiedPlaceName = slugify(placeName, {
        replacement: "-", // replace spaces with replacement character, defaults to `-`
        remove: undefined, // remove characters that match regex, defaults to `undefined`
        lower: true, // convert to lower case, defaults to `false`
        strict: true, // strip special characters except replacement, defaults to `false`
      });

      writeTempJSON(`places/${slugifiedPlaceName}`, individualPlace);

      // Add to lookup file name
      lookupKey[placeName] = `${slugifiedPlaceName}.json`;
    }

    // Add Global to lookup key
    lookupKey.Global = "global.json";

    writeTempJSON(`places-lookup`, lookupKey);

    // Write global data
    writeTempJSON(`places/global`, formattedJohnsHopkinsGlobal);
  } catch (e) {
    console.log(e);
    console.log("Story Lab CODE BREAKING!!! Please fix...");
  }
  // DSI CODE
  // - vax charts data
  // - covid charts data
  // - exposure sites data
  try {
    // aus covid data
    const ausDataArr = await getAusCovidData();
    ausDataArr.forEach((d) => {
      writeTempCSV(d.name, d.data);
    });

    // aus vaccinations data
    const {
      ausVaccinationsByAdministration,
      ausIndigenousVaccinations,
      ausDosesBreakdown,
      ausAgeBreakdown,
      ausSA4,
      ausIndigenousSA4Vaccinations,
    } = await getAusVaccinationsData();

    // international vaccinations data
    const {
      intlVaccinations,
      intlVaccinationsCountriesLatest,
      intlVaccinesUsage,
    } = await getIntlVaccinationsData();

    //ACT exposure sites data
    const { actExposureSites } = await getACTExposureSitesData();

    // Vic exposure sites data
    const { vicExposureSites } = await getVicExposureSitesData();

    // NSW exposure site data
    const { nswExposureSites } = await getNSWExposureSitesData();

    // QLD exposure site data
    const { qldExposureSites } = await getQLDExposureSitesData();

    // SA Exposure Site data
    const { saExposureSites } = await getSAExposureSitesData();

    // WA exposre site data
    const { waExposureSites } = await getWAExposureSitesData();

    // NSW Case Data

    const { nswCasesAnnouncements } = await getNSWCasesAnnouncements();
    const { nswCases } = await getNSWCasesData();
    const { nswVax } = await getNSWVaxData();
    const { vicPostcodeVax } = await getVicVaxData();

    if (ausVaccinationsByAdministration) {
      writeTempCSV(
        "aus-vaccinations-by-administration",
        ausVaccinationsByAdministration
      );
    }

    if (ausDosesBreakdown) {
      writeTempCSV("aus-doses-breakdown", ausDosesBreakdown);
    }

    if (ausAgeBreakdown) {
      writeTempJSON("aus-age-breakdown", ausAgeBreakdown);
    }
    if (ausSA4) {
      writeTempCSV("aus-sa4", ausSA4);
    }
    if (ausIndigenousVaccinations) {
      writeTempCSV("aus-indigenous-vaccinations", ausIndigenousVaccinations);
    }
    if (intlVaccinations) {
      writeTempCSV("intl-vaccinations", intlVaccinations);
    }
    if (intlVaccinationsCountriesLatest) {
      writeTempCSV("intl-vaccinations-latest", intlVaccinationsCountriesLatest);
    }
    if (intlVaccinesUsage) {
      writeTempCSV("intl-vaccines-usage", intlVaccinesUsage);
    }
    if (ausIndigenousSA4Vaccinations) {
      writeTempCSV("aus-indigenous-sa4", ausIndigenousSA4Vaccinations);
    }

    if (actExposureSites) {
      writeTempJSON("act-exposure-sites", actExposureSites);
    }

    if (vicExposureSites) {
      writeTempCSV("vic-exposure-sites", vicExposureSites);
    }

    if (nswExposureSites) {
      writeTempJSON("nsw-exposure-sites", nswExposureSites);
    }

    if (qldExposureSites) {
      writeTempCSV("qld-exposure-sites", qldExposureSites);
    }

    if (saExposureSites) {
      writeTempCSV("sa-exposure-sites", saExposureSites);
    }

    if (waExposureSites) {
      writeTempCSV("wa-exposure-sites", waExposureSites);
    }

    if (nswCases) {
      writeTempJSON("nsw-active-cases", nswCases);
    }

    if (nswCasesAnnouncements) {
      writeTempJSON("nsw-case-announcements", nswCasesAnnouncements);
    }

    if (nswVax) {
      writeTempJSON("nsw-vax", nswVax);
    }

    if (vicPostcodeVax) {
      writeTempCSV("vic-postcode-vax", vicPostcodeVax);
    }
  } catch (e) {
    console.log(e);
    console.log("DSI CODE BREAKING");
  }

  // Deploy to FTP by default use --no-ftp to override
  // TODO: Implement a progress monitor
  if (argv.ftp || typeof argv.ftp === "undefined") {
    // Get FTP credentials from ~/.abc-credentials
    const config = JSON.parse(findConfig.read(".abc-credentials"));
    const credentials = config.contentftp;

    // DON'T WAIT FOR USER INPUT ANY MORE (NOT REQUIRED)
    // var answer = query("ABC network (or VPN) access required for backup and upload. Ready?");
    // console.log("You answered:", answer);

    // Use --backup to back up
    if (argv.backup) {
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
        user: credentials.username,
        password: credentials.password,
        host: credentials.host,
        port: 21,
        localRoot: "./tmp",
        remoteRoot: REMOTE_ROOT,
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
      "Data lookup: https://www.abc.net.au/dat/news/interactives/covid19-data/places-lookup.json places-totals.json no longer updated..."
    );
  }

  console.log(
    `Operation took: ${dayjs()
      .diff(startTime, "minutes", true)
      .toFixed(2)} minutes`
  );
};

// Run main async function
main();
