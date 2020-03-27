const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const getAndParseUrl = require("./getAndParseUrl");

const getDsiData = async dataUrl => {
  const parsedDsi = await getAndParseUrl(dataUrl);

  // DSI needs extra processing
  const dsiFormatted = { Australia: {} };

  // Set up initial dates
  for (const item of parsedDsi.data) {
    if (item["Date announced"] === null) continue;

    // Parse custom format
    const actualDate = dayjs(item["Date announced"], "DD-MM-YYYY")
      .locale("en-au")
      .format();

    dsiFormatted.Australia[dayjs(actualDate).format("YYYY-MM-DD")] = 0;
  }

  // Add totals
  for (const item of parsedDsi.data) {
    if (item["Date announced"] === null) continue;
    // If undefined don't try to += because you will get NaN
    if (!item["Cumulative confirmed"]) continue;

    // Parse custom format
    const actualDate = dayjs(item["Date announced"], "DD-MM-YYYY")
      .locale("en-au")
      .format();

    dsiFormatted.Australia[dayjs(actualDate).format("YYYY-MM-DD")] +=
      item["Cumulative confirmed"];
  }

  // Sort keys
  const sortedAustralia = {};
  Object.keys(dsiFormatted.Australia)
    .sort()
    .forEach(function(key) {
      sortedAustralia[key] = dsiFormatted.Australia[key];
    });

  dsiFormatted.Australia = sortedAustralia;

  return dsiFormatted;
};

module.exports = getDsiData;
