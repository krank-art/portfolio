export function isUniquePropertyInObjects(arr, property) {
  const values = new Set();

  for (const obj of arr) {
    if (!obj.hasOwnProperty(property))
      throw new Error(`Object does not have property '${property}'. `);
    const value = obj[property];
    if (values.has(value))
      return false;
    values.add(value);
  }

  return true;
}
