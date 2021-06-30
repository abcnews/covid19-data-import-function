const { getUrl } = require("../getAndParseUrl");

//https://healthywa.wa.gov.au/Articles/A_E/Coronavirus/Locations-visited-by-confirmed-cases

function getWAExposureSitesData() {
  return Promise.all([
    getUrl(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vS54jBPIzSKz5a6YIBBgE1JrXBcJ2-JEoUR_h7XqN5CEftHQlfJG5nWlafp23HRAc9UrEy7fjv0TGar/pub?gid=1296527917&single=true&output=csv"
    ),
  ])
    .then((res) => {
      return {
        waExposureSites: res,
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        waExposureSites: undefined,
      };
    });
}

module.exports = getWAExposureSitesData;
