const { getUrl } = require("../getAndParseUrl");

/*
Mirror data from Kenneth Tsang's government data scraper:
https://github.com/jxeeno/aust-govt-covid19-stats
*/



function getCovid19NearMeGovtData() {
  return Promise.all([
    getUrl(
      "https://govtstats.covid19nearme.com.au/data/all.csv"
    ),
  ])
    .then((res) => {
      return {
        covid19NearMeGovtData: Array.isArray(res) ? res[0] : res,
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        covid19NearMeGovtData: undefined,
      };
    });
}

module.exports = getCovid19NearMeGovtData;
