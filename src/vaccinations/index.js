const Papa = require("papaparse");
const { format } = require("date-fns");

const { getUrl, getAndParseUrl } = require("../getAndParseUrl");
const { getAusAgeBreakdownData } = require("./aus-age-breakdown");
const COUNTRIES = require("./countries");
const {
  INTERNATIONAL_VACCINATIONS,
  INTERNATIONAL_VACCINES_USAGE,
} = require("../urls");

function getIntlVaccinationsData() {
  return Promise.all([
    getAndParseUrl(INTERNATIONAL_VACCINATIONS),
    getUrl(INTERNATIONAL_VACCINES_USAGE),
  ])
    .then((res) => {
      const vaccinationsData = res[0];
      const usage = res[1];

      const { vaccinationsAll, countriesLatestValues } = formatVaccinations(
        vaccinationsData.data
      );

      return {
        intlVaccinations: Papa.unparse(vaccinationsAll),
        intlVaccinationsCountriesLatest: Papa.unparse(countriesLatestValues),
        intlVaccinesUsage: usage,
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        intlVaccinations: undefined,
        intlVaccinationsCountriesLatest: undefined,
        intlVaccinesUsage: undefined,
      };
    });
}

function getVicVaxData() {
  return Promise.all([
    getUrl("https://vicvaxdata.covid19nearme.com.au/data/vic_poa.csv"),
  ])
    .then((res) => {
      const data = res[0];

      return {
        vicPostcodeVax: data,
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        vicPostcodeVax: undefined,
      };
    });
}

exports.getVicVaxData = getVicVaxData;

exports.getIntlVaccinationsData = getIntlVaccinationsData;

function formatVaccinations(data) {
  const vaccinations = [];
  const countriesLatestValues = {};

  [...data].forEach((entry) => {
    const isoCode = entry["iso_code"]
      ? entry["iso_code"].toLowerCase()
      : undefined;
    const country = COUNTRIES.find(
      (country) =>
        country["alpha3"] && country["alpha3"].toLocaleLowerCase() == isoCode
    );

    if ((isoCode && country) || entry["location"] == "World" || entry["location"] == 'Taiwan') {
      const val = {
        location: entry["location"],
        continent: country && country.continent,
        code: entry["iso_code"],
        date: entry["date"],
        doses: +entry["total_vaccinations"],
        dosesPer100: +entry["total_vaccinations_per_hundred"],
        dailyDosesRaw: +entry["daily_vaccinations_raw"],
        dailyDoses: +entry["daily_vaccinations"],
        dailyDosesPerMillion: +entry["daily_vaccinations_per_million"],
        dailyDosesPer100: +entry["daily_vaccinations_per_million"] / 10000,
        atLeastOneDose: +entry["people_vaccinated"],
        atLeastOneDosePer100: +entry["people_vaccinated_per_hundred"],
        fullDoses: +entry["people_fully_vaccinated"],
        partialDoses:
          +entry["people_vaccinated"] - +entry["people_fully_vaccinated"],
        fullDosesPer100: +entry["people_fully_vaccinated_per_hundred"],
        partialDosesPer100:
          entry["people_vaccinated_per_hundred"] -
          entry["people_fully_vaccinated_per_hundred"],
      };

      vaccinations.push(val);

      const latestVal = countriesLatestValues[entry["location"]] || {};

      const newLatestVal = {
        location: val.location,
        continent: country && country.continent,
        date: val.date,
        doses: val.doses || latestVal.doses,
        dosesPer100: val.dosesPer100 || latestVal.dosesPer100,
        dailyDosesRaw: val.dailyDosesRaw || latestVal.dailyDosesRaw,
        dailyDoses: val.dailyDoses || latestVal.dailyDoses,
        atLeastOneDose: val.atLeastOneDose || latestVal.atLeastOneDose,
        atLeastOneDosePer100:
          val.atLeastOneDosePer100 || latestVal.atLeastOneDosePer100,
        fullDoses: val.fullDoses || latestVal.fullDoses,
        fullDosesPer100: val.fullDosesPer100 || latestVal.fullDosesPer100,
        partialDoses: val.partialDoses || latestVal.partialDoses,
        partialDosesPer100:
          val.partialDosesPer100 || latestVal.partialDosesPer100,
        dailyDosesPerMillion:
          val.dailyDosesPerMillion || latestVal.dailyDosesPerMillion,
        dailyDosesPer100: val.dailyDosesPer100 || latestVal.dailyDosesPer100,
      };
      countriesLatestValues[val.location] = newLatestVal;
    }
  });

  return {
    vaccinationsAll: vaccinations,
    countriesLatestValues: Object.values(countriesLatestValues),
  };
}

// uses data from https://github.com/jxeeno/aust-govt-covid19-vaccine-pdf
function getAusVaccinationsData() {
  return Promise.all([
    getAndParseUrl("https://vaccinedata.covid19nearme.com.au/data/all.csv"),
    getAndParseUrl("https://vaccinedata.covid19nearme.com.au/data/air.csv"),
    getAusAgeBreakdownData(),
    getAndParseUrl("https://vaccinedata.covid19nearme.com.au/data/geo/air_sa4.csv"),
    getAndParseUrl("https://vaccinedata.covid19nearme.com.au/data/geo/air_sa4_indigenous.csv"),
  ])
    .then((res) => {
      const { administrationData, locationTotals } = parseDataByAdministration(
        res[0].data
      );

      const ausIndigenousVaccinations = parseIndigenousData(res[0].data);

      const ausDosesBreakdown = parseDosesBreakdownData(res[1].data, locationTotals);

      const ausAgeBreakdown = res[2];

      const ausIndigenousSA4Vaccinations = parseAusIndigenousSA4Data(res[4].data);

      const ausSA4 = parseAusSA4(res[3].data);

      return {
        ausVaccinationsByAdministration: Papa.unparse(
          administrationData
        ),
        ausIndigenousVaccinations: Papa.unparse(ausIndigenousVaccinations),
        ausDosesBreakdown: Papa.unparse(ausDosesBreakdown),
        ausAgeBreakdown,
        ausSA4: Papa.unparse(ausSA4),
        ausIndigenousSA4Vaccinations: Papa.unparse(ausIndigenousSA4Vaccinations),
      };
    })

    .catch((e) => {
      console.log(e);
      return {
        ausVaccinationsByAdministration: undefined,
        ausDosesBreakdown: undefined,
        ausAgeBreakdown: undefined,
      };
    });
}

exports.getAusVaccinationsData = getAusVaccinationsData;

function parseAusSA4(data) {
  return data.map((d) => {
    return {
      DATE_AS_AT: d.DATE_AS_AT,
      STATE: d.STATE,
      ABS_NAME: d.ABS_NAME, 
      AIR_FIRST_DOSE_PCT: d.AIR_FIRST_DOSE_PCT,
      AIR_SECOND_DOSE_PCT: d.AIR_SECOND_DOSE_PCT,
      ABS_ERP_2019_POPULATION: d.AIR_INDIGENOUS_POPULATION
    }
    // keep the last 3 entries of each SA4
  }).slice(data.length - 3 * 90)
}

function parseAusIndigenousSA4Data(data) {
  return data.map((d) => {
    return {
      DATE_AS_AT: d.DATE_AS_AT,
      STATE: d.STATE,
      ABS_NAME: d.ABS_NAME, 
      AIR_FIRST_DOSE_PCT: d.AIR_FIRST_DOSE_PCT,
      AIR_SECOND_DOSE_PCT: d.AIR_SECOND_DOSE_PCT,
      ABS_ERP_2019_POPULATION: d.AIR_INDIGENOUS_POPULATION
    }
    // keep the last 3 entries of each SA4
  }).slice(data.length - 3 * 90)
}

function parseIndigenousData(data) {
  const array = [];
  const props = [
    "FIRST_NATIONS_AUS",
    "FIRST_NATIONS_VIC",
    "FIRST_NATIONS_QLD",
    "FIRST_NATIONS_WA",
    "FIRST_NATIONS_TAS",
    "FIRST_NATIONS_SA",
    "FIRST_NATIONS_ACT",
    "FIRST_NATIONS_NT",
    "FIRST_NATIONS_NSW",
  ];

  data.forEach((entry) => {
    // we use date reported instead of date as at, so add one day to the set as date
    let date = addDays(new Date(entry["DATE_AS_AT"]), 1);

    if (!entry["FIRST_NATIONS_VIC_FIRST_DOSE_TOTAL"]) {
      // no data
      return;
    }
    date = format(date, "yyyy/MM/dd");

    props.forEach((p) => {
      array.push({
        date,
        place: p.split("FIRST_NATIONS_")[1],
        totalFirst: entry[`${p}_FIRST_DOSE_TOTAL`],
        totalSecond: entry[`${p}_SECOND_DOSE_TOTAL`],
        totalFirstPct: entry[`${p}_FIRST_PCT_TOTAL`],
        totalSecondPct: entry[`${p}_SECOND_PCT_TOTAL`],
      });
    });
  });
  // keep the last 14 entries of each state
  return array.slice(array.length - 14 * 9);
}

function parseDataByAdministration(data) {
  const array = [];
  const locationTotalsArray = [];

  let agedCarePrevDayFirst = 0;
  let agedCarePrevDaySecond = 0;
  data.forEach((entry) => {
    // we use date reported instead of date as at, so add one day to the set as date
    let date = addDays(new Date(entry["DATE_AS_AT"]), 1);

    if (date < new Date("2021/07/02")) {
      // a static csv is used for data before 2021/07/02
      return;
    }
    date = format(date, "yyyy/MM/dd");

    array.push({
      date,
      place: "NATIONAL",
      total: entry["TOTALS_NATIONAL_TOTAL"],
      daily: entry["TOTALS_NATIONAL_LAST_24HR"],
      totalFirst: undefined,
      totalSecond: undefined,
      dailyFirst: undefined,
      dailySecond: undefined,
    });

    array.push({
      date,
      place: "CWTH_ALL",
      total: entry["TOTALS_CWTH_ALL_TOTAL"],
      daily: entry["TOTALS_CWTH_ALL_LAST_24HR"],
      totalFirst: undefined,
      totalSecond: undefined,
      dailyFirst: undefined,
      dailySecond: undefined,
    });

    const totalFirst = entry["CWTH_AGED_CARE_DOSES_FIRST_DOSE"];
    const totalSecond = entry["CWTH_AGED_CARE_DOSES_SECOND_DOSE"];
    const agedCareDailyFirst = totalFirst - agedCarePrevDayFirst;
    const agedCareDailySecond = totalSecond - agedCarePrevDaySecond;
    agedCarePrevDayFirst = totalFirst;
    agedCarePrevDaySecond = totalSecond;

    array.push({
      date,
      place: "CWTH_AGED_CARE",
      total: entry["TOTALS_CWTH_AGED_CARE_TOTAL"],
      daily: entry["TOTALS_CWTH_AGED_CARE_LAST_24HR"],
      totalFirst,
      totalSecond,
      dailyFirst: agedCareDailyFirst,
      dailySecond: agedCareDailySecond,
    });

    array.push({
      date,
      place: "CWTH_PRIMARY_CARE",
      total: entry["TOTALS_CWTH_PRIMARY_CARE_TOTAL"],
      daily: entry["TOTALS_CWTH_PRIMARY_CARE_LAST_24HR"],
    });
    array.push({
      date,
      place: "STATE_ACT",
      total: entry["STATE_CLINICS_ACT_TOTAL"],
      daily: entry["STATE_CLINICS_ACT_LAST_24HR"],
    });
    array.push({
      date,
      place: "STATE_NT",
      total: entry["STATE_CLINICS_NT_TOTAL"],
      daily: entry["STATE_CLINICS_NT_LAST_24HR"],
    });
    array.push({
      date,
      place: "STATE_NSW",
      total: entry["STATE_CLINICS_NSW_TOTAL"],
      daily: entry["STATE_CLINICS_NSW_LAST_24HR"],
    });
    array.push({
      date,
      place: "STATE_SA",
      total: entry["STATE_CLINICS_SA_TOTAL"],
      daily: entry["STATE_CLINICS_SA_LAST_24HR"],
    });
    array.push({
      date,
      place: "STATE_TAS",
      total: entry["STATE_CLINICS_TAS_TOTAL"],
      daily: entry["STATE_CLINICS_TAS_LAST_24HR"],
    });
    array.push({
      date,
      place: "STATE_VIC",
      total: entry["STATE_CLINICS_VIC_TOTAL"],
      daily: entry["STATE_CLINICS_VIC_LAST_24HR"],
    });
    array.push({
      date,
      place: "STATE_QLD",
      total: entry["STATE_CLINICS_QLD_TOTAL"],
      daily: entry["STATE_CLINICS_QLD_LAST_24HR"],
    });
    array.push({
      date,
      place: "STATE_WA",
      total: entry["STATE_CLINICS_WA_TOTAL"],
      daily: entry["STATE_CLINICS_WA_LAST_24HR"],
    });

    locationTotalsArray.push({
      date,
      place: "NATIONAL",
      total: entry["TOTALS_NATIONAL_TOTAL"],
      daily: entry["TOTALS_NATIONAL_LAST_24HR"],
    });
  
    const locations = ['ACT', 'NT', 'VIC', 'NSW', 'SA', 'TAS', 'QLD', 'WA'];
    locations.forEach(location => {
      locationTotalsArray.push({
        date,
        place: location,
        total: entry[`STATE_CLINICS_${location}_TOTAL`] + entry[`CWTH_AGED_CARE_${location}_TOTAL`] + entry[`CWTH_PRIMARY_CARE_${location}_TOTAL`],
        daily: entry[`STATE_CLINICS_${location}_LAST_24HR`] + entry[`CWTH_AGED_CARE_${location}_LAST_24HR`] + entry[`CWTH_PRIMARY_CARE_${location}_LAST_24HR`],
      });
    });
  });

  return { administrationData: array, locationTotals: locationTotalsArray };
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function parseDosesBreakdownData(data, locationTotals) {
  const array = [];
  data.forEach((entry) => {
    // we use date reported instead of date as at, so add one day to the set as date
    let date = format(addDays(new Date(entry["DATE_AS_AT"]), 1), "yyyy/MM/dd");

    const locations = ['ACT', 'NT', 'VIC', 'NSW', 'SA', 'TAS', 'QLD', 'WA'];

    let ausPopulation12to15 = 0;

    // THIS NEEDS FURTHER WORK
    locations.forEach(location => {
      ausPopulation12to15  = ausPopulation12to15 + entry[`AIR_${location}_12_15_POPULATION`];

      population12plus = entry[`AIR_${location}_12_15_POPULATION`] + entry[`AIR${location}_16_PLUS_POPULATION`]

      array.push({
        date,
        place: location,
        totalFirst: entry[`AIR_${location}_16_PLUS_FIRST_DOSE_COUNT`],
        totalFirstPct: entry[`AIR_${location}_16_PLUS_FIRST_DOSE_PCT`],
        totalSecond: entry[`AIR_${location}_16_PLUS_SECOND_DOSE_COUNT`],
        totalSecondPct: entry[`AIR_${location}_16_PLUS_SECOND_DOSE_PCT`],


        totalFirst_12_15: entry[`AIR_${location}_12_15_FIRST_DOSE_COUNT`],
        totalFirstPct_12_15: entry[`AIR_${location}_12_15_FIRST_DOSE_PCT`],
  
        totalFirst_12_plus:  (entry[`AIR_${location}_16_PLUS_FIRST_DOSE_COUNT`] + entry[`AIR_${location}12_15_SECOND_DOSE_COUNT`]),
        totalFirstPct_12_plus:  (entry[`AIR_${location}_16_PLUS_FIRST_DOSE_COUNT`] + entry[`AIR_${location}_12_15_SECOND_DOSE_COUNT`]) / population12plus,
  
        totalFirst_16_plus: entry[`AIR_${location}_16_PLUS_FIRST_DOSE_COUNT`],
        totalFirstPct_16_plus: entry[`AIR_${location}_16_PLUS_FIRST_DOSE_PCT`],
  
  
        totalSecond_12_15: entry[`AIR_${location}_12_15_SECOND_DOSE_COUNT`],
        totalSecondPct_12_15: entry[`AIR_${location}_12_15_SECOND_DOSE_PCT`],
  
        totalSecond_12_plus:  (entry[`AIR_${location}_16_PLUS_SECOND_DOSE_COUNT`] + entry[`AIR_12_15_SECOND_DOSE_COUNT`]),
        totalSecondPct_12_plus:  (entry[`AIR_${location}_16_PLUS_SECOND_DOSE_COUNT`] + entry[`AIR_12_15_SECOND_DOSE_COUNT`]) / population12plus,
  
        totalSecond_16_plus: entry[`AIR_${location}_16_PLUS_SECOND_DOSE_COUNT`],
        totalSecondPct_16_plus: entry[`AIR_${location}_16_PLUS_SECOND_DOSE_PCT`],


        total: locationTotals.find(d => d.date == date && d.place == location)?.total,
        daily: locationTotals.find(d => d.date == date && d.place == location)?.daily,
      });
    });

    array.push({
      date,
      place: "NATIONAL",
      // 16 plus legacy values (to be removed)
      totalFirst: entry["AIR_AUS_16_PLUS_FIRST_DOSE_COUNT"],
      totalFirstPct: entry["AIR_AUS_16_PLUS_FIRST_DOSE_PCT"],
      totalSecond: entry["AIR_AUS_16_PLUS_SECOND_DOSE_COUNT"],
      totalSecondPct: entry["AIR_AUS_16_PLUS_SECOND_DOSE_PCT"],

      
      totalFirst_12_15: entry["AIR_12_15_FIRST_DOSE_COUNT"],
      totalFirstPct_12_15: entry["AIR_12_15_FIRST_DOSE_PCT"],

      totalFirst_12_plus:  (entry["AIR_AUS_16_PLUS_FIRST_DOSE_COUNT"] + entry["AIR_12_15_SECOND_DOSE_COUNT"]),
      // totalFirstPct_12_plus:  (entry["AIR_AUS_16_PLUS_FIRST_DOSE_COUNT"] + entry["AIR_12_15_SECOND_DOSE_COUNT"]) / population12to15,

      totalFirst_16_plus: entry["AIR_AUS_16_PLUS_FIRST_DOSE_COUNT"],
      totalFirstPct_16_plus: entry["AIR_AUS_16_PLUS_FIRST_DOSE_PCT"],


      totalSecond_12_15: entry["AIR_12_15_SECOND_DOSE_COUNT"],
      totalSecondPct_12_15: entry["AIR_12_15_SECOND_DOSE_PCT"],

      totalSecond_12_plus:  (entry["AIR_AUS_16_PLUS_SECOND_DOSE_COUNT"] + entry["AIR_12_15_SECOND_DOSE_COUNT"]),
      // totalSecondPct_12_plus:  (entry["AIR_AUS_16_PLUS_SECOND_DOSE_COUNT"] + entry["AIR_12_15_SECOND_DOSE_COUNT"]) / population12to15,

      totalSecond_16_plus: entry["AIR_AUS_16_PLUS_SECOND_DOSE_COUNT"],
      totalSecondPct_16_plus: entry["AIR_AUS_16_PLUS_SECOND_DOSE_PCT"],

      // sum of first and second doses does not equal to doses totals due to some 
      // people receiving a third dose
      total: locationTotals.find(d => d.date == date && d.place == "NATIONAL")?.total,
      daily: locationTotals.find(d => d.date == date && d.place == "NATIONAL")?.daily,
    });

    // array.push({
    //   date,
    //   place: "NSW",
    //   totalFirst: entry["AIR_NSW_16_PLUS_FIRST_DOSE_COUNT"],
    //   totalFirstPct: entry["AIR_NSW_16_PLUS_FIRST_DOSE_PCT"],
    //   totalSecond: entry["AIR_NSW_16_PLUS_SECOND_DOSE_COUNT"],
    //   totalSecondPct: entry["AIR_NSW_16_PLUS_SECOND_DOSE_PCT"],
    //   total: locationTotals.find(d => d.date == date && d.place == "NSW")?.total,
    //   daily: locationTotals.find(d => d.date == date && d.place == "NSW")?.daily,
    // });
    // array.push({
    //   date,
    //   place: "VIC",
    //   totalFirst: entry["AIR_VIC_16_PLUS_FIRST_DOSE_COUNT"],
    //   totalFirstPct: entry["AIR_VIC_16_PLUS_FIRST_DOSE_PCT"],
    //   totalSecond: entry["AIR_VIC_16_PLUS_SECOND_DOSE_COUNT"],
    //   totalSecondPct: entry["AIR_VIC_16_PLUS_SECOND_DOSE_PCT"],
    //   total: locationTotals.find(d => d.date == date && d.place == "VIC")?.total,
    //   daily: locationTotals.find(d => d.date == date && d.place == "VIC")?.daily,
    // });
    // array.push({
    //   date,
    //   place: "QLD",
    //   totalFirst: entry["AIR_QLD_16_PLUS_FIRST_DOSE_COUNT"],
    //   totalFirstPct: entry["AIR_QLD_16_PLUS_FIRST_DOSE_PCT"],
    //   totalSecond: entry["AIR_QLD_16_PLUS_SECOND_DOSE_COUNT"],
    //   totalSecondPct: entry["AIR_QLD_16_PLUS_SECOND_DOSE_PCT"],
    //   total: locationTotals.find(d => d.date == date && d.place == "QLD")?.total,
    //   daily: locationTotals.find(d => d.date == date && d.place == "QLD")?.daily,
    // });
    // array.push({
    //   date,
    //   place: "WA",
    //   totalFirst: entry["AIR_WA_16_PLUS_FIRST_DOSE_COUNT"],
    //   totalFirstPct: entry["AIR_WA_16_PLUS_FIRST_DOSE_PCT"],
    //   totalSecond: entry["AIR_WA_16_PLUS_SECOND_DOSE_COUNT"],
    //   totalSecondPct: entry["AIR_WA_16_PLUS_SECOND_DOSE_PCT"],
    //   total: locationTotals.find(d => d.date == date && d.place == "WA")?.total,
    //   daily: locationTotals.find(d => d.date == date && d.place == "WA")?.daily,
    // });
    // array.push({
    //   date,
    //   place: "TAS",
    //   totalFirst: entry["AIR_TAS_16_PLUS_FIRST_DOSE_COUNT"],
    //   totalFirstPct: entry["AIR_TAS_16_PLUS_FIRST_DOSE_PCT"],
    //   totalSecond: entry["AIR_TAS_16_PLUS_SECOND_DOSE_COUNT"],
    //   totalSecondPct: entry["AIR_TAS_16_PLUS_SECOND_DOSE_PCT"],
    //   total: locationTotals.find(d => d.date == date && d.place == "TAS")?.total,
    //   daily: locationTotals.find(d => d.date == date && d.place == "TAS")?.daily,
    // });
    // array.push({
    //   date,
    //   place: "SA",
    //   totalFirst: entry["AIR_SA_16_PLUS_FIRST_DOSE_COUNT"],
    //   totalFirstPct: entry["AIR_SA_16_PLUS_FIRST_DOSE_PCT"],
    //   totalSecond: entry["AIR_SA_16_PLUS_SECOND_DOSE_COUNT"],
    //   totalSecondPct: entry["AIR_SA_16_PLUS_SECOND_DOSE_PCT"],
    //   total: locationTotals.find(d => d.date == date && d.place == "SA")?.total,
    //   daily: locationTotals.find(d => d.date == date && d.place == "SA")?.daily,
    // });
    // array.push({
    //   date,
    //   place: "ACT",
    //   totalFirst: entry["AIR_ACT_16_PLUS_FIRST_DOSE_COUNT"],
    //   totalFirstPct: entry["AIR_ACT_16_PLUS_FIRST_DOSE_PCT"],
    //   totalSecond: entry["AIR_ACT_16_PLUS_SECOND_DOSE_COUNT"],
    //   totalSecondPct: entry["AIR_ACT_16_PLUS_SECOND_DOSE_PCT"],
    //   total: locationTotals.find(d => d.date == date && d.place == "ACT")?.total,
    //   daily: locationTotals.find(d => d.date == date && d.place == "ACT")?.daily,
    // });
    // array.push({
    //   date,
    //   place: "NT",
    //   totalFirst: entry["AIR_NT_16_PLUS_FIRST_DOSE_COUNT"],
    //   totalFirstPct: entry["AIR_NT_16_PLUS_FIRST_DOSE_PCT"],
    //   totalSecond: entry["AIR_NT_16_PLUS_SECOND_DOSE_COUNT"],
    //   totalSecondPct: entry["AIR_NT_16_PLUS_SECOND_DOSE_PCT"],
    //   total: locationTotals.find(d => d.date == date && d.place == "NT")?.total,
    //   daily: locationTotals.find(d => d.date == date && d.place == "NT")?.daily,
    // });
  });

  return array;
}
