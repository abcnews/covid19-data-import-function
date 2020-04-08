const getPlacesTotals = (dataObject) => {
  const { countries } = dataObject;

  const placeTotals = {};

  for (const countryName in countries) {
    placeTotals[countryName] = {
      type: countryName === "Diamond Princess" ? "ship" : "country",
      dates: countries[countryName],
    };
  }

  return placeTotals;
};

module.exports = getPlacesTotals;
