const dayjs = require("dayjs");

const format = inputData => {
  const formattedData = inputData.map(area => {
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
        cases.push({ Date: dayjs(key).format("YYYY-MM-DD"), Confirmed: area[key] });
      }
    }

    newArea.Cases = cases;

    return newArea;
  });
  return formattedData;
};

module.exports = format;
