const { getUrl } = require("../getAndParseUrl");

/*
Fetch via the NSW Health CKAN Data API.
Details:
https://data.nsw.gov.au/data/api/1/util/snippet/api_info.html?resource_id=2776dbb8-f807-4fb2-b1ed-184a6fc2c8aa
*/

let SQLquery = `SELECT notification_date, postcode from "2776dbb8-f807-4fb2-b1ed-184a6fc2c8aa" WHERE likely_source_of_infection != 'Overseas' AND CAST(notification_date AS date) >= CAST('2021-06-12' AS date)`;
let url = `https://data.nsw.gov.au/data/api/3/action/datastore_search_sql?sql=${SQLquery}`;

function getNSWCasesAnnouncements() {
    return Promise.all([
      getUrl(
        url
      ),
    ])
      .then((res) => {
        if(res[0]?.result?.records) return {nswCasesAnnouncements: res[0].result.records}
        else throw 'Invalid data for NSW case announcement data';

      })
      .catch((e) => {
        console.log(e);
        return {
          nswCasesAnnouncements: undefined,
        };
      });
  }
  
  module.exports = getNSWCasesAnnouncements;
