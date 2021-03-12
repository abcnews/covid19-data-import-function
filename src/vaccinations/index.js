const Papa = require("papaparse");

const { getUrl, getAndParseUrl } = require("../getAndParseUrl");
const COUNTRIES = require("./countries");
const {
  INTERNATIONAL_VACCINATIONS,
  INTERNATIONAL_VACCINES_USAGE,
} = require("../urls");

function getIntlVacciationsData() {
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

module.exports = getIntlVacciationsData;

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

    if ((isoCode && country) || entry["location"] == "World") {
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
