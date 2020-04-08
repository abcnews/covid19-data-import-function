// Transform data adding together country totals
const getRegions = ({ cases, deaths, recovered }) => {
  const newRegions = {};

  // Lets do cases totals
  for (const area of cases) {
    if (area["Province/State"] === null) continue;

    newRegions[area["Province/State"]] = {
      country: area["Country/Region"],
      type: "region",
      dates: {},
    };

    for (const total of area.Cases) {
      newRegions[area["Province/State"]].dates[total.Date] = {
        cases: total.Confirmed,
      };
    }
  }

  // Now add deaths
  for (const area of deaths) {
    if (area["Province/State"] === null) continue;
    
    for (const total of area.Cases) {
      newRegions[area["Province/State"]].dates[total.Date].deaths = total.Confirmed
    }
  }

  // Now do recovered
  for (const area of recovered) {
    if (area["Province/State"] === null) continue;
    
    for (const total of area.Cases) {
      newRegions[area["Province/State"]].dates[total.Date].recovered = total.Confirmed
    }
  }

  return newRegions;
};

module.exports = getRegions;
