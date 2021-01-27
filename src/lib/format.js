const dayjs = require("dayjs");

const formatJohnsHopkins = (inputData) => {
  const formattedData = inputData.map((area) => {
    const newArea = {};
    const cases = [];

    for (const key in area) {
      if (
        key === "Province/State" ||
        key === "Country/Region" ||
        key === "Lat" ||
        key === "Long"
      )
        newArea[key] = area[key];
      else {
        cases.push({
          Date: dayjs(key).format("YYYY-MM-DD"),
          Confirmed: area[key],
        });
      }
    }

    newArea.Cases = cases;

    return newArea;
  });
  return formattedData;
};

const formatWhoOrEcdc = (inputData) => {
  const formattedData = {};

  for (const day of inputData) {
    if (typeof day.location === "undefined") continue;

    formattedData[day.location] = {};
  }

  for (const day of inputData) {
    if (typeof day.location === "undefined") continue;
    formattedData[day.location][day.date] = day.total_cases;
  }

  return formattedData;
};

const dateKeyFromDateNumber = (dateNumber) => {
  const dateString = String(dateNumber);

  return [
    dateString.slice(0, 4),
    dateString.slice(4, 6),
    dateString.slice(6),
  ].join("-");
};

const US_STATES_CODES_TO_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AS: "American Samoa",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District Of Columbia",
  FM: "Federated States Of Micronesia",
  FL: "Florida",
  GA: "Georgia",
  GU: "Guam",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MH: "Marshall Islands",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  MP: "Northern Mariana Islands",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PW: "Palau",
  PA: "Pennsylvania",
  PR: "Puerto Rico",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VI: "Virgin Islands",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const formatCtpUsStates = (inputData) => {
  return [...inputData]
    .sort((a, b) => a.date - b.date)
    .reduce((memo, inputDatum) => {
      const { date, state, positive, recovered, death } = inputDatum;
      const dateKey = dateKeyFromDateNumber(date);
      const placeKey = US_STATES_CODES_TO_NAMES[state];

      if (!memo[placeKey]) {
        memo[placeKey] = {
          type: "region",
          country: "US",
          dates: {},
        };
      }

      memo[placeKey].dates[dateKey] = {
        cases: positive || 0,
        deaths: death || 0,
        recoveries: recovered || 0,
      };

      return memo;
    }, {});
};

module.exports = {
  formatJohnsHopkins,
  formatWhoOrEcdc,
  formatCtpUsStates,
};
