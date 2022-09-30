const Papa = require("papaparse");

const { format } = require("date-fns");

const { getUrl, getAndParseUrl } = require("../getAndParseUrl");

// https://www.abs.gov.au/statistics/people/population/national-state-and-territory-population/jun-2020#:~:text=ABS.Stat%20datasets-,Key%20statistics,due%20to%20net%20overseas%20migration.
const AUS_POPULATION = {
  "5-11": 2276638,
  "12-15": 1244145,
  "16-29": 4815923,
  "30-39": 3759934,
  "40-49": 3297481,
  "50-59": 3116907,
  "60-69": 2686529,
  "70+": 2934706,
};

const AUS_POPULATION_5_11 = {
  AUS: 2276638,
  VIC: 578499,
  NSW: 716460,
  QLD: 478731,
  WA: 244154,
  SA: 148816,
  TAS: 45033,
  ACT: 39789,
  NT: 24750,
};

// uses data from https://github.com/jxeeno/aust-govt-covid19-vaccine-pdf
function getAusAgeBreakdownData() {
  return Promise.all([
    getAndParseUrl("https://vaccinedata.covid19nearme.com.au/data/air.csv"),
    getAndParseUrl(
      "https://vaccinedata.covid19nearme.com.au/data/air_residence.csv"
    ),
  ])
    .then(async (res) => {
      const parsedData = await parseAusAgeBreakdown(res[0].data, res[1].data);
      return parsedData;
    })

    .catch((e) => {
      console.log(e);
      return undefined;
    });
}

// Takes aus and states age breakdown data and combines it to the following age groups:
// 16-29, 30-39, 40-49, 50-69, 70+
async function parseAusAgeBreakdown(ausBreakdownData, statesBreakdownData) {
  const { nest } = await import("d3-collection");

  const ausCombinedAges = ausBreakdownData.map((date) => {
    const groups = getAusCombinedAgeGroups();

    const ages = groups.map((group) => {
      let totalFirst = 0;
      group.totalFirst.forEach((valName) => {
        totalFirst = totalFirst + +date[valName];
      });
      let totalSecond = 0;
      group.totalSecond.forEach((valName) => {
        totalSecond = totalSecond + +date[valName];
      });

      const population = AUS_POPULATION[group.name];

      return {
        name: group.name,
        totalFirst,
        totalSecond,
        totalFirstPct: (totalFirst / population) * 100,
        totalSecondPct: (totalSecond / population) * 100,
      };
    });

    return {
      // we use date reported instead of date as at, so add one day to the set as date
      date: addDays(new Date(date.DATE_AS_AT), 1),
      ages,
    };
  });

  const ausFlatDates = [];
  ausCombinedAges.forEach(function (date) {
    date.ages.forEach(function (ageGroup) {
      ausFlatDates.push({
        date: format(date.date, "yyyy/MM/dd"),
        ...ageGroup,
      });
    });
  });

  const ausGrouppedByAge = {
    place: "AUS",
    ages: nest()
      .key((d) => d.name)
      .entries(ausFlatDates),
  };

  const grouppedStateData1 = nest()
    .key((d) => d.STATE)
    .entries(statesBreakdownData);

  const grouppedStateData = grouppedStateData1.map((place) => {
    const grouppedByDate = nest()
      .key((d) => d.DATE_AS_AT)
      .entries(place.values);

    const dates = [];
    grouppedByDate.forEach((date) => {
      const ages = [];

      date.values.forEach((val) => {
        if (val.AGE_LOWER == "70" && val.AGE_UPPER == "999") {
          ages.push({
            age: "70+",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "5" && val.AGE_UPPER == "11") {
          ages.push({
            age: "5-11",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_COUNT,
            population: AUS_POPULATION_5_11[val.STATE],
          });
        }
        if (val.AGE_LOWER == "12" && val.AGE_UPPER == "15") {
          ages.push({
            age: "12-15",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "16" && val.AGE_UPPER == "19") {
          ages.push({
            age: "16-19",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "20" && val.AGE_UPPER == "24") {
          ages.push({
            age: "20-24",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "25" && val.AGE_UPPER == "29") {
          ages.push({
            age: "25-29",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "30" && val.AGE_UPPER == "34") {
          ages.push({
            age: "30-34",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "35" && val.AGE_UPPER == "39") {
          ages.push({
            age: "35-39",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "40" && val.AGE_UPPER == "44") {
          ages.push({
            age: "40-44",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "45" && val.AGE_UPPER == "49") {
          ages.push({
            age: "45-49",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "50" && val.AGE_UPPER == "54") {
          ages.push({
            age: "50-54",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "55" && val.AGE_UPPER == "59") {
          ages.push({
            age: "55-59",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "60" && val.AGE_UPPER == "64") {
          ages.push({
            age: "60-64",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
        if (val.AGE_LOWER == "65" && val.AGE_UPPER == "69") {
          ages.push({
            age: "65-69",
            totalFirst: val.AIR_RESIDENCE_FIRST_DOSE_APPROX_COUNT,
            totalSecond: val.AIR_RESIDENCE_SECOND_DOSE_APPROX_COUNT,
            population: val.ABS_ERP_JUN_2020_POP,
          });
        }
      });

      const groups = getAgeGroups();
      const updatedAges = [];
      groups.forEach((group) => {
        let population = 0;
        group.ages.forEach((groupAge) => {
          const foundAge = ages.find((ageData) => ageData.age == groupAge);
          if (!foundAge) {
            return;
          }
          const foundEntry = updatedAges.find((e) => e.name == group.name);
          population = +population + +foundAge.population;
          if (foundEntry) {
            foundEntry.totalFirst =
              +foundEntry.totalFirst + +foundAge.totalFirst;
            foundEntry.totalSecond =
              +foundEntry.totalSecond + +foundAge.totalSecond;
            foundEntry.totalFirstPct =
              (foundEntry.totalFirst / population) * 100;
            foundEntry.totalSecondPct =
              (foundEntry.totalSecond / population) * 100;
          } else {
            updatedAges.push({
              name: group.name,
              totalFirst: +foundAge.totalFirst,
              totalSecond: +foundAge.totalSecond,
              totalFirstPct: (+foundAge.totalFirst / +population) * 100,
              totalSecondPct: (+foundAge.totalSecond / +population) * 100,
            });
          }
        });
      });

      dates.push({ date: date.key, ages: updatedAges });
    });

    const flatDates = [];
    dates.forEach(function (date) {
      date.ages.forEach(function (ageGroup) {
        flatDates.push({
          // we use date reported instead of date as at, so add one day to the set as date
          date: format(addDays(new Date(date.date), 1), "yyyy/MM/dd"),
          ...ageGroup,
        });
      });
    });

    return {
      place: place.key,
      ages: nest()
        .key((d) => d.name)
        .entries(flatDates),
    };
  });

  const flatPlacesData = [];
  [ausGrouppedByAge, ...grouppedStateData].forEach((place) => {
    place.ages.forEach((age) => {
      flatPlacesData.push({
        ...place,
        age,
      });
    });
  });
  return { data: [ausGrouppedByAge, ...grouppedStateData] };
}

//5-11, 16-29, 30-39, 40-49, 50-69, 70+
function getAgeGroups() {
  return [
    { name: "5-11", ages: ["5-11"] },
    { name: "12-15", ages: ["12-15"] },
    { name: "16-29", ages: ["16-19", "20-24", "25-29"] },
    { name: "30-39", ages: ["30-34", "35-39"] },
    { name: "40-49", ages: ["40-44", "45-49"] },
    { name: "50-59", ages: ["50-54", "55-59"] },
    { name: "60-69", ages: ["60-64", "65-69"] },
    { name: "70+", ages: ["70+"] },
  ];
}

function getAusCombinedAgeGroups() {
  return [
    {
      name: "5-11",
      totalFirst: ["AIR_AUS_5_11_FIRST_DOSE_COUNT"],
      totalSecond: ["AIR_AUS_5_11_SECOND_DOSE_COUNT"],
    },
    {
      name: "12-15",
      totalFirst: ["AIR_12_15_FIRST_DOSE_COUNT"],
      totalSecond: ["AIR_12_15_SECOND_DOSE_COUNT"],
    },
    {
      name: "16-29",
      totalFirst: [
        "AIR_16_19_FIRST_DOSE_COUNT",
        "AIR_20_24_FIRST_DOSE_COUNT",
        "AIR_25_29_FIRST_DOSE_COUNT",
      ],
      totalSecond: [
        "AIR_16_19_SECOND_DOSE_COUNT",
        "AIR_20_24_SECOND_DOSE_COUNT",
        "AIR_25_29_SECOND_DOSE_COUNT",
      ],
    },
    {
      name: "30-39",
      totalFirst: ["AIR_30_34_FIRST_DOSE_COUNT", "AIR_35_39_FIRST_DOSE_COUNT"],
      totalSecond: [
        "AIR_30_34_SECOND_DOSE_COUNT",
        "AIR_35_39_SECOND_DOSE_COUNT",
      ],
    },
    {
      name: "40-49",
      totalFirst: ["AIR_40_44_FIRST_DOSE_COUNT", "AIR_45_49_FIRST_DOSE_COUNT"],
      totalSecond: [
        "AIR_40_44_SECOND_DOSE_COUNT",
        "AIR_45_49_SECOND_DOSE_COUNT",
      ],
    },
    {
      name: "50-59",
      totalFirst: ["AIR_50_54_FIRST_DOSE_COUNT", "AIR_55_59_FIRST_DOSE_COUNT"],
      totalSecond: [
        "AIR_50_54_SECOND_DOSE_COUNT",
        "AIR_55_59_SECOND_DOSE_COUNT",
      ],
    },
    {
      name: "60-69",
      totalFirst: ["AIR_60_64_FIRST_DOSE_COUNT", "AIR_65_69_FIRST_DOSE_COUNT"],
      totalSecond: [
        "AIR_60_64_SECOND_DOSE_COUNT",
        "AIR_65_69_SECOND_DOSE_COUNT",
      ],
    },
    {
      name: "70+",
      totalFirst: ["AIR_AUS_70_PLUS_FIRST_DOSE_COUNT"],
      totalSecond: ["AIR_AUS_70_PLUS_SECOND_DOSE_COUNT"],
    },
  ];
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

exports.getAusAgeBreakdownData = getAusAgeBreakdownData;
