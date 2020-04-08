const getPlacesTotals = (dataObject) => {
  const { countries, regions } = dataObject;

  const placeTotals = {};

  for (const countryName in countries) {
    placeTotals[countryName] = {
      type: countryName === "Diamond Princess" ? "ship" : "country",
      dates: countries[countryName],
    };
  }

  for (const regionName in regions) {
    placeTotals[regionName] = regions[regionName];
  }

  // Cool except Diamond Princess is returning as a region....... fix this

  return placeTotals;
};

module.exports = getPlacesTotals;
