const fs = require("fs");

const countries = require("./hybrid-country-totals.json");

for (const country in countries) {
  // console.log(countries[country]);
  delete countries[country]["2020-03-27"];
}

// console.log(countries);

fs.writeFileSync(
  "./tmp/hybrid-country-totals-1.json",
  JSON.stringify(countries)
);
console.log("Temporary data written to hybrid-country-totals-1.json");