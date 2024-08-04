export class DataChunk {
  /**
   * @param {DataSlice[]} slices 
   */
  constructor(slices = []) {
    /**
      * The individual data slices that make up a single chunk.
      * @type {DataSlice[]}
      */
    this.slices = slices;
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

  flatten() {
    return this.slices.reduce((acc, slice) => {
      const flattenedSlice = JSON.parse(JSON.stringify(slice.payload));
      return { ...acc, ...flattenedSlice };
    }, {});
  }
}

export class DataSlice {
  constructor(id = "", payload = {}) {
    this.id = id;
    this.payload = payload;
  }
}
