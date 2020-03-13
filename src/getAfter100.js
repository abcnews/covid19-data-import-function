const getAfter100 = data => {
  const areasOver100 = data.filter(area => {
    return area.Cases[area.Cases.length - 1].Confirmed >= 100;
  });

  console.log(areasOver100);
};

module.exports = getAfter100;
