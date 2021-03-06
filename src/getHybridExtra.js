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

  // Small hacky way to manually include China deaths
  hybridExtra.China["2019-12-31"]["deaths"] = 0;
  hybridExtra.China["2020-01-01"]["deaths"] = 0;
  hybridExtra.China["2020-01-02"]["deaths"] = 0;
  hybridExtra.China["2020-01-03"]["deaths"] = 0;
  hybridExtra.China["2020-01-04"]["deaths"] = 0;
  hybridExtra.China["2020-01-05"]["deaths"] = 0;
  hybridExtra.China["2020-01-06"]["deaths"] = 0;
  hybridExtra.China["2020-01-07"]["deaths"] = 0;
  hybridExtra.China["2020-01-08"]["deaths"] = 0;
  hybridExtra.China["2020-01-09"]["deaths"] = 0;
  hybridExtra.China["2020-01-10"]["deaths"] = 0;
  hybridExtra.China["2020-01-11"]["deaths"] = 0;
  hybridExtra.China["2020-01-12"]["deaths"] = 0;
  hybridExtra.China["2020-01-13"]["deaths"] = 1;
  hybridExtra.China["2020-01-14"]["deaths"] = 1;
  hybridExtra.China["2020-01-15"]["deaths"] = 1;
  hybridExtra.China["2020-01-16"]["deaths"] = 1;
  hybridExtra.China["2020-01-17"]["deaths"] = 2;
  hybridExtra.China["2020-01-18"]["deaths"] = 2;
  hybridExtra.China["2020-01-19"]["deaths"] = 2;
  hybridExtra.China["2020-01-20"]["deaths"] = 2;
  hybridExtra.China["2020-01-21"]["deaths"] = 3;

  hybridExtra.China["2019-12-31"]["recoveries"] = 0;
  hybridExtra.China["2020-01-01"]["recoveries"] = 0;
  hybridExtra.China["2020-01-02"]["recoveries"] = 0;
  hybridExtra.China["2020-01-03"]["recoveries"] = 0;
  hybridExtra.China["2020-01-04"]["recoveries"] = 0;
  hybridExtra.China["2020-01-05"]["recoveries"] = 0;
  hybridExtra.China["2020-01-06"]["recoveries"] = 0;
  hybridExtra.China["2020-01-07"]["recoveries"] = 0;
  hybridExtra.China["2020-01-08"]["recoveries"] = 0;
  hybridExtra.China["2020-01-09"]["recoveries"] = 0;
  hybridExtra.China["2020-01-10"]["recoveries"] = 0;
  hybridExtra.China["2020-01-11"]["recoveries"] = 0;
  hybridExtra.China["2020-01-12"]["recoveries"] = 0;
  hybridExtra.China["2020-01-13"]["recoveries"] = 0;
  hybridExtra.China["2020-01-14"]["recoveries"] = 0;
  hybridExtra.China["2020-01-15"]["recoveries"] = 0;
  hybridExtra.China["2020-01-16"]["recoveries"] = 0;
  hybridExtra.China["2020-01-17"]["recoveries"] = 0;
  hybridExtra.China["2020-01-18"]["recoveries"] = 0;
  hybridExtra.China["2020-01-19"]["recoveries"] = 0;
  hybridExtra.China["2020-01-20"]["recoveries"] = 0;
  hybridExtra.China["2020-01-21"]["recoveries"] = 0;

  return hybridExtra;
};

module.exports = getHybridExtra;
