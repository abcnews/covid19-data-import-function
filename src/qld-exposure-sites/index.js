const { getUrl } = require("../getAndParseUrl");

// https://www.qld.gov.au/health/conditions/health-alerts/coronavirus-covid-19/current-status/contact-tracing

function getQLDExposureSitesData() {
  return Promise.all([
    getUrl(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQF4BxY3lB13S1-2bnz4h2cb1w1tuhCKgPJiQrxFjtKIeJZzi45AO_YteXHU6egkBvShE0YLgWmYGI/pub?output=csv"
    ),
  ])
    .then((res) => {
      return {
        qldExposureSites: Array.isArray(res) ? res[0] : res,
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        qldExposureSites: undefined,
      };
    });
}

module.exports = getQLDExposureSitesData;
