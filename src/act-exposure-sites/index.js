const { getUrl } = require("../getAndParseUrl");

// https://www.covid19.act.gov.au/act-status-and-response/act-covid-19-exposure-locations

function getACTExposureSitesData() {
  return Promise.all([
    getUrl(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTfnvUtQwYiMkH_Nt_vrS9exYO9BCXChNg75coYkPm0zQQSbyAggJLoD3NLSG-7CLAMOdVJXYwLPmbA/pub?output=csv"
    ),
  ])
    .then((res) => {
      return {
        actExposureSites: Array.isArray(res) ? res[0] : res,
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        actExposureSites: undefined,
      };
    });
}

module.exports = getACTExposureSitesData;
