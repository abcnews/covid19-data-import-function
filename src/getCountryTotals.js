// Transform data adding together country totals
const getCountryTotals = countries => {
  const newCountries = {};

  for (const country of countries) {
    newCountries[country["Country/Region"]] = {};
  }

  for (const country of countries) {
    for (const total of country.Cases) {
      if (
        typeof newCountries[country["Country/Region"]][total.Date] ===
        "undefined"
      ) {
        newCountries[country["Country/Region"]][total.Date] = total.Confirmed;
      } else {
        newCountries[country["Country/Region"]][total.Date] += total.Confirmed;
      }
    }
  }

  return newCountries;
};

module.exports = getCountryTotals;
