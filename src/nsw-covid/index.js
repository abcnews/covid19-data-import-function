const { getUrl } = require("../getAndParseUrl");

//https://www.nsw.gov.au/covid-19/find-the-facts-about-covid-19
function getNSWCasesData() {
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
        nswCases: { latestDate, data: res[0].data},
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        nswCases: undefined,
      };
    });
}

function cleanupVal(rate) {
  return rate.replace(/%/g, '');
}

//https://www.nsw.gov.au/covid-19/find-the-facts-about-covid-19
function getNSWVaxData() {
  return Promise.all([
    getUrl(
      "https://nswdac-covid-19-postcode-heatmap.azurewebsites.net/datafiles/vaccination_metrics-v3.json"
    ),
  ])
    .then((res) => {
      const data = res[0];
      const parsedData = {}; 
      Object.keys(data).map(postcode => {
        const postcodeDates = data[postcode];
        const parsedPostcodeData = {};
        Object.keys(postcodeDates).map(date => {
          parsedPostcodeData[date] = {
            atLeastFirstPct: cleanupVal(postcodeDates[date].percPopAtLeastFirstDose10WidthRange),
            fullyPct: cleanupVal(postcodeDates[date].percPopFullyVaccinated10WidthRange),
          }
        });
        parsedData[postcode] = parsedPostcodeData;
      });
      
      return {
        nswVax: parsedData,
      };
    })
    .catch((e) => {
      console.log(e);
      return {
        nswCases: undefined,
      };
    });
}


/*
Fetch via the NSW Health CKAN Data API.
Details:
https://data.nsw.gov.au/data/api/1/util/snippet/api_info.html?resource_id=2776dbb8-f807-4fb2-b1ed-184a6fc2c8aa
*/

let SQLquery = `SELECT notification_date, postcode from "2776dbb8-f807-4fb2-b1ed-184a6fc2c8aa" WHERE likely_source_of_infection != 'Overseas' AND CAST(notification_date AS date) >= CAST('2021-06-12' AS date)`;
let announcementURL = `https://data.nsw.gov.au/data/api/3/action/datastore_search_sql?sql=${SQLquery}`;

function getNSWCasesAnnouncements() {
    return Promise.all([
      getUrl(
        announcementURL
      ),
    ])
      .then((res) => {
        if(res[0]?.result?.records) return {nswCasesAnnouncements: {records:res[0].result.records}}
        else throw 'Invalid data for NSW case announcement data';

      })
      .catch((e) => {
        console.log(e);
        return {
          nswCasesAnnouncements: undefined,
        };
      });
  }
  


exports.getNSWCasesData = getNSWCasesData;
exports.getNSWVaxData = getNSWVaxData;
exports.getNSWCasesAnnouncements = getNSWCasesAnnouncements;