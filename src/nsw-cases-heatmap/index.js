const { getUrl } = require("../getAndParseUrl");

//https://www.nsw.gov.au/covid-19/find-the-facts-about-covid-19
function getNSWCasesHeatmapData() {
  return Promise.all([
    getUrl(
      "https://nswdac-covid-19-postcode-heatmap.azurewebsites.net/datafiles/active_cases.json"
    ),
    getUrl(
      "https://nswdac-covid-19-postcode-heatmap.azurewebsites.net/datafiles/data_Cases2.json"
    ),
  ])
    .then((res) => {
      // active cases json does not include the date, grab the date from another json which is used in the same nsw vis 
      // as active cases 🤞
      // https://nswdac-covid-19-postcode-heatmap.azurewebsites.net/index.html
      const latestDate = res[1].data && res[1].data.length ? res[1].data[res[1].data.length - 1].Date : undefined;
      return {
        nswCasesHeatmap: { latestDate, data: res[0].data},
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        nswCasesHeatmap: undefined,
      };
    });
}

module.exports = getNSWCasesHeatmapData;
