const axios = require("axios");
const to = require("await-to-js").default;
const Papa = require("papaparse");

const ORIGINAL_DATA_URL =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";

exports.dataImport = async (req, res) => {
  const [err, response] = await to(
    axios({
      method: "get",
      url: ORIGINAL_DATA_URL
    })
  );

  if (err) {
    console.log(err);
    res.json("Error...");
    return;
  } else {
    const parsed = Papa.parse(response.data, {
      header: true,
      dynamicTyping: true
    });
    console.log(parsed);
    res.json("OK!");
    return;
  }
};
