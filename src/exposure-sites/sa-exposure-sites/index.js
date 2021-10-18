const { getUrl } = require("../../getAndParseUrl");

//Source:
//https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/conditions/infectious+diseases/covid-19/testing+and+tracing/contact+tracing/contact+tracing
//(Usually sent as email to producers)

function getSAExposureSitesData() {
  return Promise.all([
    getUrl(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSVDvOVaVyPDkTkfKx0f9DYZ0uJeszB1_x7wFKfvw1acAUWishzjh580gYos6_y9CTDOmF_wFCxbSBm/pub?output=csv"
    ),
  ])
    .then((res) => {
      return {
        saExposureSites: Array.isArray(res) ? res[0] : res,
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        saExposureSites: undefined,
      };
    });
}

module.exports = getSAExposureSitesData;
