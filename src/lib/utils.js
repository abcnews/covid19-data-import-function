export function sortKeys(unsortedObject) {
  sortedObject = {};

  Object.keys(unsortedObject)
    .sort()
    .forEach(function (key) {
      sortedObject[key] = unsortedObject[key];
    });

  return sortedObject;
}

