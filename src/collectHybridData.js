const dayjs = require("dayjs");

const collectHybridData = (
  johnsHopkinsCountryTotals
  // dsiFormatted,
  // ecdcCountryTotals
) => {
  // Collect hybrid data from Johns Hopkins
  const hybridData = { ...johnsHopkinsCountryTotals };

  // Replace Australia with DSI data
  // NOTE: ******* DSI DATA NO LONGER BEING UPDATED ********
  // hybridData.Australia = dsiFormatted.Australia;

  // Fill in missing China data from ECDC
  // NOTE: ******* ECDC DATA NO LONGER BEING UPDATED ********
  // for (let day in ecdcCountryTotals.China) {
  //   // Don't process after a certain date
  //   if (dayjs(day).isAfter("2020-03-22", "day")) continue;

  //   // Store missing dates
  //   if (typeof hybridData.China[day] === "undefined") {
  //     hybridData.China[day] = ecdcCountryTotals.China[day];
  //   }
  // }

  // Sort keys
  const sortedChina = {};
  Object.keys(hybridData.China)
    .sort()
    .forEach(function (key) {
      sortedChina[key] = hybridData.China[key];
    });

  hybridData.China = sortedChina;

  // Account for missing days in DSI
  let currentDsiCount = 0;

  for (let day in johnsHopkinsCountryTotals.Australia) {
    if (typeof hybridData.Australia[day] === "undefined") {
      hybridData.Australia[day] = currentDsiCount;
    } else {
      currentDsiCount = hybridData.Australia[day];
    }
  }

  // Sort Hybrid data keys for added days
  let sortedHybridAustralia = {};
  Object.keys(hybridData.Australia)
    .sort()
    .forEach(function (key) {
      sortedHybridAustralia[key] = hybridData.Australia[key];
    });

  hybridData.Australia = sortedHybridAustralia;

  return hybridData;
};

module.exports = collectHybridData;
