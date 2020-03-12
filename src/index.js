const axios = require("axios");
const to = require("await-to-js").default;
const Papa = require("papaparse");

const ORIGINAL_DATA_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";

exports.main = async (req, res) => {
  const [err, response] = await to(
    axios({
      method: "get",
      url: ORIGINAL_DATA_URL
    })
  );

  // Catch fetch errors
  if (err) {
    console.log(err);
    res.json("Fetch error...");
    return;
  }

  // Parse the CSV data
  const parsed = Papa.parse(response.data, {
    header: true,
    dynamicTyping: true
  });

  // Return the data (just in case)
  res.json(parsed.data);
};
