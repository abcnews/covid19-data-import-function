const cheerio = require("cheerio");
const Papa = require("papaparse");
const { getAndParseUrl, getUrl } = require("../getAndParseUrl");

const isValidDate = (d) => {
  return d instanceof Date && !isNaN(d);
};

const cleanNumber = (string) => {
  return string.replace(/\D/g, "");
};

function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

const ALLOWED_COLUMNS_PREFIXES = [
  "AUS",
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
];

module.exports.getAusCovidData = () => {
  return Promise.all([
    getUrl(
      "https://www.health.gov.au/health-alerts/covid-19/case-numbers-and-statistics"
    ),
    getAndParseUrl(
      "https://abcnewsdata.sgp1.digitaloceanspaces.com/covid-data/federal-government-data.csv"
    ),
  ])
    .then((res) => {
      const $ = cheerio.load(res[0]);
      const casesRecent = parseCasesRecent($);
      const totals = parseTotals($);
      const testsRecent = parseTestsRecent($);
      const agedCareInHome = parseAgedCareInHome($);
      const agedCareResidential = parseAgedCareResidential($);
      const casesByAgeAndGender = parseCasesByAgeAndGender($);
      const deathsByAgeAndGender = parseDeathsByAgeAndGender($);
      const hospitalisations = parseHospitalisations($);

      const date =
        $(".date-display-single").first().attr("content") ||
        $(".date-display-single").first().text();

      const dateObj = new Date(date);

      if (!date || !isValidDate(dateObj)) {
        return [];
      }

      const dateString = formatDate(dateObj);

      const entry = {
        DATE: dateString,
        ...casesRecent,
        ...totals,
        ...testsRecent,
        ...agedCareInHome,
        ...agedCareResidential,
        ...casesByAgeAndGender,
        ...hospitalisations,
        ...deathsByAgeAndGender,
      };

      const entries = res[1]?.data ? res[1].data : [];

      if (!entries.length) {
        return [];
      }

      const entryExists = entries.find((d) => d.DATE == entry.DATE);

      if (entryExists) {
        const index = entries.indexOf(entryExists);

        if (index !== -1) {
          entries[index] = entry;
        }
      } else {
        entries.push(entry);
      }

      // Make sure that new fields are in the first entry
      // because papaparse will create columns based on the first entry

      const firstEntry = entries[0];
      Object.keys(entry).forEach((d) => {
        if (!firstEntry[d]) {
          firstEntry[d] = undefined;
        }
      });

      return [
        {
          name: "federal-government-data",
          data: Papa.unparse(entries),
        },
        {
          name: `${dateString}-federal-government-data`,
          data: Papa.unparse(entries),
        },
      ];
    })
    .catch((e) => {
      console.log(e);
      return [];
    });
};

function parseCasesRecent($) {
  const TABLE_NUMBER = 42357;

  // ${PLACE}_CASES_ACTIVE
  // ${PLACE}_CASES_LOCAL_LAST_24H
  // ${PLACE}_CASES_OVERSEAS_ACQUIRED_LAST_24H
  // ${PLACE}_CASES_UNDER_INVESTIGATION_LAST_24H
  // ${PLACE}_CASES_LOCAL_LAST_7D
  // ${PLACE}_CASES_OVERSEAS_ACQUIRED_LAST_7D
  // ${PLACE}_CASES_UNDER_INVESTIGATION_LAST_7D

  const entry = {};

  $(`table[data-tablenumber="${TABLE_NUMBER}"] > tbody > tr`).each(
    (index, element) => {
      const tds = $(element).find("td");

      const jurisdiction = $(tds[0]).text();
      const columnPlace = jurisdiction == "Australia" ? "AUS" : jurisdiction;
      if (!ALLOWED_COLUMNS_PREFIXES.includes(columnPlace)) {
        return;
      }
      entry[`${columnPlace}_CASES_ACTIVE`] = cleanNumber($(tds[1]).text());
      entry[`${columnPlace}_CASES_LOCAL_LAST_24H`] = cleanNumber(
        $(tds[2]).text()
      );
      entry[`${columnPlace}_CASES_OVERSEAS_ACQUIRED_LAST_24H`] = cleanNumber(
        $(tds[3]).text()
      );
      entry[`${columnPlace}_CASES_UNDER_INVESTIGATION_LAST_24H`] = cleanNumber(
        $(tds[4]).text()
      );
      entry[`${columnPlace}_CASES_LOCAL_LAST_7D`] = cleanNumber(
        $(tds[5]).text()
      );
      entry[`${columnPlace}_CASES_OVERSEAS_ACQUIRED_LAST_7D`] = cleanNumber(
        $(tds[6]).text()
      );
      entry[`${columnPlace}_CASES_UNDER_INVESTIGATION_LAST_7D`] = cleanNumber(
        $(tds[7]).text()
      );
    }
  );

  return entry;
}

function parseTotals($) {
  const TABLE_NUMBER = 42361;

  // ${PLACE}_SOURCE_OVERSEAS
  // ${PLACE}_SOURCE_LOCAL_CONFIRMED_CASE
  // ${PLACE}_SOURCE_LOCAL_UNKNOWN_CONTACT
  // ${PLACE}_SOURCE_LOCAL_INTERSTATE_TRAVEL
  // ${PLACE}_SOURCE_UNDER_INVESTIGATION
  // ${PLACE}_CASES_TOTAL
  // ${PLACE}_DEATHS_TOTAL

  const entry = {};

  $(`table[data-tablenumber="${TABLE_NUMBER}"] > tbody > tr`).each(
    (index, element) => {
      const tds = $(element).find("td");

      const jurisdiction = $(tds[0]).text();
      const columnPlace = jurisdiction == "Australia" ? "AUS" : jurisdiction;
      if (!ALLOWED_COLUMNS_PREFIXES.includes(columnPlace)) {
        return;
      }
      entry[`${columnPlace}_SOURCE_OVERSEAS`] = cleanNumber($(tds[1]).text());
      entry[`${columnPlace}_SOURCE_LOCAL_CONFIRMED_CASE`] = cleanNumber(
        $(tds[2]).text()
      );
      entry[`${columnPlace}_SOURCE_LOCAL_UNKNOWN_CONTACT`] = cleanNumber(
        $(tds[3]).text()
      );
      entry[`${columnPlace}_SOURCE_LOCAL_INTERSTATE_TRAVEL`] = cleanNumber(
        $(tds[4]).text()
      );
      entry[`${columnPlace}_SOURCE_UNDER_INVESTIGATION`] = cleanNumber(
        $(tds[5]).text()
      );
      entry[`${columnPlace}_CASES_TOTAL`] = cleanNumber($(tds[6]).text());
      entry[`${columnPlace}_DEATHS_TOTAL`] = cleanNumber($(tds[7]).text());
    }
  );

  return entry;
}

function parseTestsRecent($) {
  const TABLE_NUMBER = 42375;

  // ${PLACE}_TESTS_LAST_7D
  // ${PLACE}_TESTS_PER_100K_LAST_7D
  // ${PLACE}_TESTS_TOTAL
  // ${PLACE}_TESTS_POSITIVE_PCT

  const entry = {};

  $(`table[data-tablenumber="${TABLE_NUMBER}"] > tbody > tr`).each(
    (index, element) => {
      const tds = $(element).find("td");

      const jurisdiction = $(tds[0]).text();
      const columnPlace = jurisdiction == "Australia" ? "AUS" : jurisdiction;
      if (!ALLOWED_COLUMNS_PREFIXES.includes(columnPlace)) {
        return;
      }
      entry[`${columnPlace}_TESTS_LAST_7D`] = cleanNumber($(tds[1]).text());
      entry[`${columnPlace}_TESTS_PER_100K_LAST_7D`] = cleanNumber(
        $(tds[2]).text()
      );
      entry[`${columnPlace}_TESTS_TOTAL`] = cleanNumber($(tds[3]).text());
      entry[`${columnPlace}_TESTS_POSITIVE_PCT`] = cleanNumber(
        $(tds[4]).text()
      );
    }
  );

  return entry;
}

function parseAgedCareInHome($) {
  const TABLE_NUMBER = 42410;

  // ${PLACE}_AGED_CARE_IN_HOME_ACTIVE_AND_RECOVERED - this is a new field
  // ${PLACE}_AGED_CARE_IN_HOME_ACTIVE - this field is no longer available
  // ${PLACE}_AGED_CARE_IN_HOME_RECOVERED - this field is not longer available
  // ${PLACE}_AGED_CARE_IN_HOME_DEATHS

  const entry = {};

  $(`table[data-tablenumber="${TABLE_NUMBER}"] > tbody > tr`).each(
    (index, element) => {
      const tds = $(element).find("td");

      const jurisdiction = $(tds[0]).text();
      const columnPlace = jurisdiction == "Australia" ? "AUS" : jurisdiction;
      if (!ALLOWED_COLUMNS_PREFIXES.includes(columnPlace)) {
        return;
      }
      entry[`${columnPlace}_AGED_CARE_IN_HOME_ACTIVE_AND_RECOVERED`] =
        cleanNumber($(tds[1]).text());
      // Keep these unavailable fields for consistency
      entry[`${columnPlace}_AGED_CARE_IN_HOME_ACTIVE`] = undefined;
      entry[`${columnPlace}_AGED_CARE_IN_HOME_RECOVERED`] = undefined;
      entry[`${columnPlace}_AGED_CARE_IN_HOME_DEATHS`] = cleanNumber(
        $(tds[2]).text()
      );
    }
  );

  return entry;
}

function parseAgedCareResidential($) {
  const TABLE_NUMBER = 42408;

  // ${PLACE}_AGED_CARE_RESIDENTIAL_ACTIVE_AND_RECOVERED - this is a new field
  // ${PLACE}_AGED_CARE_RESIDENTIAL_ACTIVE - this field is no longer available
  // ${PLACE}_AGED_CARE_RESIDENTIAL_RECOVERED - this field is not longer available
  // ${PLACE}_AGED_CARE_RESIDENTIAL_DEATHS

  const entry = {};

  $(`table[data-tablenumber="${TABLE_NUMBER}"] > tbody > tr`).each(
    (index, element) => {
      const tds = $(element).find("td");

      const jurisdiction = $(tds[0]).text();
      const columnPlace = jurisdiction == "Australia" ? "AUS" : jurisdiction;
      if (!ALLOWED_COLUMNS_PREFIXES.includes(columnPlace)) {
        return;
      }
      entry[`${columnPlace}_AGED_CARE_RESIDENTIAL_ACTIVE_AND_RECOVERED`] =
        cleanNumber($(tds[1]).text());
      // Keep these unavailable fields for consistency
      entry[`${columnPlace}_AGED_CARE_RESIDENTIAL_ACTIVE`] = undefined;
      entry[`${columnPlace}_AGED_CARE_RESIDENTIAL_RECOVERED`] = undefined;
      entry[`${columnPlace}_AGED_CARE_RESIDENTIAL_DEATHS`] = cleanNumber(
        $(tds[2]).text()
      );
    }
  );

  return entry;
}

function parseCasesByAgeAndGender($) {
  const TABLE_NUMBER = 42404;

  const ageMap = {
    "0-9": "0_9",
    "10-19": "10_19",
    "20-29": "20_29",
    "30-39": "30_39",
    "40-49": "40_49",
    "50-59": "50_59",
    "60-69": "60_69",
    "70-79": "70_79",
    "80-89": "80_89",
    "90+": "90+",
  };

  // AUS_CASES_AGE_0_9_SEX_M
  // AUS_CASES_AGE_0_9_SEX_F
  // AUS_CASES_AGE_10_19_SEX_M
  // AUS_CASES_AGE_10_19_SEX_F
  // AUS_CASES_AGE_20_29_SEX_M
  // AUS_CASES_AGE_20_29_SEX_F
  // AUS_CASES_AGE_30_39_SEX_M
  // AUS_CASES_AGE_30_39_SEX_F
  // AUS_CASES_AGE_40_49_SEX_M
  // AUS_CASES_AGE_40_49_SEX_F
  // AUS_CASES_AGE_50_59_SEX_M
  // AUS_CASES_AGE_50_59_SEX_F
  // AUS_CASES_AGE_60_69_SEX_M
  // AUS_CASES_AGE_60_69_SEX_F
  // AUS_CASES_AGE_70_79_SEX_M
  // AUS_CASES_AGE_70_79_SEX_F
  // AUS_CASES_AGE_80_89_SEX_M
  // AUS_CASES_AGE_80_89_SEX_F
  // AUS_CASES_AGE_90+_SEX_M
  // AUS_CASES_AGE_90+_SEX_F

  const entry = {};

  $(`table[data-tablenumber="${TABLE_NUMBER}"] > tbody > tr`).each(
    (index, element) => {
      const tds = $(element).find("td");

      const age = $(tds[0]).text();
      const agePrefix = ageMap[age];
      if (!agePrefix) {
        return;
      }
      entry[`AUS_CASES_AGE_${agePrefix}_SEX_M`] = cleanNumber($(tds[1]).text());
      entry[`AUS_CASES_AGE_${agePrefix}_SEX_F`] = cleanNumber($(tds[2]).text());
    }
  );

  return entry;
}

function parseDeathsByAgeAndGender($) {
  const TABLE_NUMBER = 42406;

  const ageMap = {
    "0-9": "0_9",
    "10-19": "10_19",
    "20-29": "20_29",
    "30-39": "30_39",
    "40-49": "40_49",
    "50-59": "50_59",
    "60-69": "60_69",
    "70-79": "70_79",
    "80-89": "80_89",
    "90+": "90+",
  };

  const entry = {};

  $(`table[data-tablenumber="${TABLE_NUMBER}"] > tbody > tr`).each(
    (index, element) => {
      const tds = $(element).find("td");

      const age = $(tds[0]).text();
      const agePrefix = ageMap[age];
      if (!agePrefix) {
        return;
      }
      entry[`AUS_DEATHS_AGE_${agePrefix}_SEX_M`] = cleanNumber(
        $(tds[1]).text()
      );
      entry[`AUS_DEATHS_AGE_${agePrefix}_SEX_F`] = cleanNumber(
        $(tds[2]).text()
      );
    }
  );

  return entry;
}

function parseHospitalisations($) {
  const TABLE_NUMBER = 42380;

  // ${PLACE}_CASES_HOSPITAL_NOT_ICU
  // ${PLACE}_CASES_HOSPITAL_ICU

  const entry = {};

  $(`table[data-tablenumber="${TABLE_NUMBER}"] > tbody > tr`).each(
    (index, element) => {
      const tds = $(element).find("td");

      const jurisdiction = $(tds[0]).text();
      const columnPlace = jurisdiction == "Australia" ? "AUS" : jurisdiction;
      if (!ALLOWED_COLUMNS_PREFIXES.includes(columnPlace)) {
        return;
      }
      entry[`${columnPlace}_CASES_HOSPITAL_NOT_ICU`] = cleanNumber(
        $(tds[1]).text()
      );
      entry[`${columnPlace}_CASES_HOSPITAL_ICU`] = cleanNumber(
        $(tds[2]).text()
      );
    }
  );

  return entry;
}
