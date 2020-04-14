const { sum, min, max, pairs, rollups, ascending } = require("d3-array");
const { parse } = require("date-fns");

const parseLocalAcquisitionData = (data) => {
  const mapped = data
    .map((d) => {
      const date = parse(d["Date"], "dd/MM/yyyy", new Date());

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
        timestamp,
        jurisdiction,
        cumulative,
      }))
    );
  }, []);
};

module.exports = parseLocalAcquisitionData