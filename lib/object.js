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

function flattenObject(object) {
  return JSON.parse(JSON.stringify(object));
}

/**
 * Deeply merges two objects.
 * @param {Object} target - The target object.
 * @param {Object} source - The source object.
 * @returns {Object} The merged object.
 */
export function deepMerge(target, source) {
  for (const key in source) {
    if (!source.hasOwnProperty(key))
      continue;
    const sourceValue = source[key];
    const targetValue = target[key];
    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      target[key] = [...targetValue, ...sourceValue];
      continue;
    }
    if (sourceValue instanceof Object && targetValue instanceof Object) {
      target[key] = deepMerge({ ...targetValue }, sourceValue);
      continue;
    }
    target[key] = sourceValue;
  }
  return target;
}

export function deepMergeSafely(target, source) {
  // Returns a new object (good!)
  return deepMerge(flattenObject(target), flattenObject(source));
}
