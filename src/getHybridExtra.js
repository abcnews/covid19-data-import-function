const getHybridExtra = (dataObject) => {
  const { originalData, deaths, recoveries } = dataObject;

  const hybridExtra = {};

  // Move cases to own object
  for (const country in originalData) {
    if (country === "undefined") continue;

    hybridExtra[country] = {};

    for (const date in originalData[country]) {
      hybridExtra[country][date] = { cases: originalData[country][date] };
    }
  }

  // Include deaths as own key
  for (const country in deaths) {
    if (country === "undefined") continue;

    for (const date in deaths[country]) {
      hybridExtra[country][date]["deaths"] = deaths[country][date];
    }
  }

  // Include recoveries as own key
  for (const country in recoveries) {
    if (country === "undefined") continue;

    for (const date in recoveries[country]) {
      hybridExtra[country][date]["recoveries"] = recoveries[country][date];
    }
  }

  return hybridExtra;
};

module.exports = getHybridExtra;
