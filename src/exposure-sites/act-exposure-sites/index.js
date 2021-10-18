const puppeteer = require("puppeteer");

/*
Pull ACT exposure data from:
https://www.covid19.act.gov.au/act-status-and-response/act-covid-19-exposure-locations
*/
const ACT_HEALTH_URL = 'https://www.covid19.act.gov.au/act-status-and-response/act-covid-19-exposure-locations';

let browser;

async function scrapeACTData(){
    
  browser = await puppeteer.launch();
  const page = await browser.newPage();

  //Wait for JS and table to load before scrape
  await page.goto(ACT_HEALTH_URL, { waitUntil: "networkidle2" });
  await page.waitForSelector('#tableResults1822887 > tbody > tr')

  //Scrape all rows of #tableResults1822887 table
  //TODO: Keep an eye on #tableResults1822887 ID so it doesn't change

  let results = []
  results = results.concat(await page.$$eval( '#tableResults1822887 > tbody > tr', (trows) => {

      let rowList = []
      for(var i in trows){
          const tdList = Array.from(trows[i].querySelectorAll('td'), column => column.innerText) 
          /*
          TABLE COLUMNS
          0: Status
          1: Exposure Location
          2: Street
          3: Suburb
          4: Date
          5: Arrival Time
          6: Departure Time
          7: Contact
          */

          //Organise td data into data row
          let [status,location,street,suburb,date,arrival,departure,contact] = tdList;
          let siteData = {status,location,street,suburb,date,arrival,departure,contact};

          rowList.push(siteData);
      }
      return rowList;

  }))

  browser.close();
  return results;

} 

async function getACTExposureSitesData() {
  let actExposureSites;
  try {
    let actExposureSites = await scrapeACTData();
    return { actExposureSites };
  } catch (e) {
    console.error(e);
    if(browser) browser.close();
    actExposureSites = undefined;
  }
  return {actExposureSites}
}

module.exports = getACTExposureSitesData;
