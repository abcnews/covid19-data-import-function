// Code taken from Simon Elvery
// https://github.com/abcnews/interactive-coronavirus-growth-factor/commit/0a1334fb417c4dc5697c9fe19ecbcf3448ca9ef8#diff-2b4ca49d4bb0a774c4d4c1672d7aa781

const dayjs = require("dayjs");

const { sum, min, max, pairs, rollups, ascending } = require("d3-array");
const { parse } = require("date-fns");

const parseLocalAcquisitionData = (data) => {
  const mapped = data
    .map((d) => {
      const date = parse(d["Date"], "dd/MM/yyyy", new Date());

      console.log(d["Date"])

      return {
        date,
        timestamp: date.getTime(),
        jurisdiction: d["State/territory"],
        cumulative: +d["Cumulative cases"],
        mode: d["Mode of transmission (Origins)"],
      };
    })
    .filter((d) => {
      return d.jurisdiction === "AUS";
    })
    .sort((a, b) => ascending(a.timestamp, b.timestamp));

  const rolled = rollups(
    mapped,
    (v) => sum(v, (d) => d.cumulative),
    (d) => +d.date,
    (d) => {
      let key = "Australia (unknown)";
      switch (d.mode) {
        case "Overseas":
          key = "Australia (imported)";
          break;
        case "Local - known link":
        case "Local - unknown link":
        case "Local - unknown link, travelled interstate":
          key = "Australia (local spread)";
          break;
      }
      return key;
    }
  );

  return rolled.reduce((acc, [timestamp, data]) => {
    return acc.concat(
      data.map(([jurisdiction, cumulative]) => ({
        date: new Date(timestamp),
        // timestamp,
        jurisdiction,
        cumulative,
      }))
    );
  }, []);
};

module.exports = parseLocalAcquisitionData;
