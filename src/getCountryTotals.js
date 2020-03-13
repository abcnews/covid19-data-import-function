const getCountryTotals = data => {
  // const countries = data.filter(area => {
  //   return area["Province/State"] !== null;
  // });

  // Don't filter countries
  const countries = data;

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

  console.log(newCountries);
  return newCountries;
};

module.exports = getCountryTotals;
