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
  for (const area of cases) {
    if (area["Province/State"] === null) continue;
    console.log(area);
  }

  return newRegions;
};

module.exports = getRegions;
