import { deepMergeSafely, flattenObject } from "./object.js";

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
    this.shorthands.push({propName, sliceId});
  }

  flatten() {
    const flattenedData = this.slices.reduce((acc, slice) => deepMergeSafely(acc, slice.payload), {});
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
