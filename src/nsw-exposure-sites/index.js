const { getUrl } = require("../getAndParseUrl");

//https://www.nsw.gov.au/covid-19/latest-news-and-updates
function getNSWExposureSitesData() {
  return Promise.all([
    getUrl(
      "https://data.nsw.gov.au/data/dataset/0a52e6c1-bc0b-48af-8b45-d791a6d8e289/resource/f3a28eed-8c2a-437b-8ac1-2dab3cf760f9/download/venue-data.json"
    ),
  ])
    .then((res) => {
      return {
        nswExposureSites: res,
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        nswExposureSites: undefined,
      };
    });
}

module.exports = getNSWExposureSitesData;
