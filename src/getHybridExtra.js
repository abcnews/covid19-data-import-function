

const getHybridExtra = (dataObject) => {
const {originalData, deaths, recovered} = dataObject


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
      hybridExtra[country][date]["deaths"] =
      deaths[country][date];
    }
  }

  // Include recovered as own key
  for (const country in recovered) {
    if (country === "undefined") continue;

    for (const date in recovered[country]) {
      hybridExtra[country][date]["recovered"] =
      recovered[country][date];
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

  hybridExtra.China["2019-12-31"]["recovered"] = 0;
  hybridExtra.China["2020-01-01"]["recovered"] = 0;
  hybridExtra.China["2020-01-02"]["recovered"] = 0;
  hybridExtra.China["2020-01-03"]["recovered"] = 0;
  hybridExtra.China["2020-01-04"]["recovered"] = 0;
  hybridExtra.China["2020-01-05"]["recovered"] = 0;
  hybridExtra.China["2020-01-06"]["recovered"] = 0;
  hybridExtra.China["2020-01-07"]["recovered"] = 0;
  hybridExtra.China["2020-01-08"]["recovered"] = 0;
  hybridExtra.China["2020-01-09"]["recovered"] = 0;
  hybridExtra.China["2020-01-10"]["recovered"] = 0;
  hybridExtra.China["2020-01-11"]["recovered"] = 0;
  hybridExtra.China["2020-01-12"]["recovered"] = 0;
  hybridExtra.China["2020-01-13"]["recovered"] = 0;
  hybridExtra.China["2020-01-14"]["recovered"] = 0;
  hybridExtra.China["2020-01-15"]["recovered"] = 0;
  hybridExtra.China["2020-01-16"]["recovered"] = 0;
  hybridExtra.China["2020-01-17"]["recovered"] = 0;
  hybridExtra.China["2020-01-18"]["recovered"] = 0;
  hybridExtra.China["2020-01-19"]["recovered"] = 0;
  hybridExtra.China["2020-01-20"]["recovered"] = 0;
  hybridExtra.China["2020-01-21"]["recovered"] = 0;

  return hybridExtra;
};

module.exports = getHybridExtra;
