const { getUrl } = require("../getAndParseUrl");

// https://discover.data.vic.gov.au/dataset/all-victorian-sars-cov-2-covid-19-current-exposure-sites
function getVicExposureSitesData() {
  return Promise.all([
    getUrl(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSNouXrJ8UQ-tn6bAxzrOdLINuoOtn01fSjooql0O3XQlj4_ldFiglzOmDm--t2jy1k-ABK6LMzPScs/pub?gid=1075463302&single=true&output=csv"
    ),
  ])
    .then((res) => {
      return {
        vicExposureSites: res,
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        vicExposureSites: undefined,
      };
    });
}

module.exports = getVicExposureSitesData;
