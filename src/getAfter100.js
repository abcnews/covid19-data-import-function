const getAfter100 = countries => {
  const newCountries = {};

  for (const country in countries) {
    const caseArray = Object.values(countries[country]);

    if (caseArray[caseArray.length - 1] >= 100) {
      newCountries[country] = {};

      for (const day in countries[country]) {
        if (countries[country][day] >= 100) {
          newCountries[country][day] = countries[country][day];
        }
      }
    }
  }

  return newCountries;
};

module.exports = getAfter100;
