import { flattenObject, mergeObjects } from "./object.js";

export class DataChunk {
  /**
   * @param {DataSlice[]} slices 
   */
  constructor(slices = [], shorthands = []) {
    // Dont forget to add new fields to the this.duplicate() method.
    /**
      * The individual data slices that make up a single chunk.
      * @type {DataSlice[]}
      */
    this.slices = slices;
    this.shorthands = shorthands;
  }

  get depth() {
    return this.slices.length;
  }

  get(prop) {
    for (const slice of this.slices)
      if (slice.payload.hasOwnProperty(prop))
        return slice.payload[prop];
    return undefined;
  }

  has(prop) {
    for (const slice of this.slices)
      if (slice.payload.hasOwnProperty(prop))
        return true;
    return false;
  }

  addSlice(slice) {
    this.slices.unshift(slice);
  }

  addPayload(id, payload) {
    const slice = new DataSlice(id, payload);
    this.addSlice(slice);
  }

  hasSlice(id) {
    return !!this.getSlice(id);
  }

  getSlice(id) {
    return this.slices.find(slice => slice.id === id);
  }

  addShorthand(propName, sliceId) {
    this.shorthands.push({ propName, sliceId });
  }

  flatten() {
     // We have to reverse so lower slices get covered by higher slices.
    const payloads = [...this.slices].reverse().map(slice => slice.payload);
    const flattenedData = mergeObjects(...payloads);
    // Previously we used 'deepMergeSafely()', but that function is soooo slow.
    // Now only arrays get merged if slices have a prop with same name and also array.
    for (const shorthand of this.shorthands) {
      const { propName, sliceId } = shorthand;
      if (!this.hasSlice(sliceId))
        throw new Error(`Unkown slice '${sliceId}'`);
      flattenedData[propName] = flattenObject(this.getSlice(sliceId).payload);
    }
    return flattenedData;
  }

  duplicate() {
    return new DataChunk(
      this.slices.map(slice => slice.duplicate()),
      JSON.parse(JSON.stringify(this.shorthands)),
    );
  }

  
  /**
   * Deprecated due to performance reasons.
   * @deprecated
   */
  static parentAnnihilator(key, value) {
    return value;
    // Prevents cyclic dependency issues
    // 2024-08: As of right now, the parent property is not really used anywhere.
    //   We will keep this special parent annihilator for now if we need a parent again.
    //   If any problems arise, this *little-stinky hack* will be yeeted.
    return key === "parent" ? undefined : value;
  }
}

export class DataSlice {
  constructor(id = "", payload = {}) {
    this.id = id;
    this.payload = payload;
  }

  duplicate() {
    return new DataSlice(this.id, flattenObject(this.payload));
  }
}
