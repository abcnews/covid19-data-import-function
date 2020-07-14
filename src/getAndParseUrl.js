const axios = require("axios");
const to = require("await-to-js").default;
const Papa = require("papaparse");
const https = require('https');

// Allows self-signed certs (as ABC Network sometimes
// creates.)
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
});

const getAndParseUrl = async (url) => {
  // Fetch John Hopkins data
  const [fetchErr, fetchResponse] = await to(
    axiosInstance({
      method: "get",
      url: url,
    })
  );

  // Catch fetch errors
  if (fetchErr) {
    console.error("Fetch error...", fetchErr);
    return false;
  } else {
    console.log("File fetched:", getUrlFileName(url));
  }

  // Parse the Johns Hopkins CSV data
  const parsed = Papa.parse(fetchResponse.data, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  return parsed;
};

module.exports = getAndParseUrl;

function getUrlFileName(url) {
  return url.substring(url.lastIndexOf('/')+1);
}