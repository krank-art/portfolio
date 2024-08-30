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

export function flattenObject(object, replacer = null) {
  return JSON.parse(JSON.stringify(object, replacer));
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

export function deepMergeSafely(target, source, replacer = null) {
  // WARNING: This function is so very expensive, so use with caution.
  // Returns a new object (good!)
  return deepMerge(flattenObject(target, replacer), flattenObject(source, replacer));
}

export function mergeObjects(...objects) {
  return objects.reduce((acc, obj) => {
    for (let key in obj) {
      if (Array.isArray(obj[key])) {
        acc[key] = acc[key] ? acc[key].concat(obj[key]) : [...obj[key]];
        continue;
      }
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}
