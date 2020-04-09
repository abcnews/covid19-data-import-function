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
    // Regional data for Diamond Princess is all zeros (and probably incorrect)
    if (regionName === "Diamond Princess") continue;

    placeTotals[regionName] = regions[regionName];
  }

  return placeTotals;
};

module.exports = getPlacesTotals;
