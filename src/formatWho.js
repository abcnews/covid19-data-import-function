const formatWho = inputData => {
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

module.exports = formatWho;
