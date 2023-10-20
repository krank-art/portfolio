import fs from 'fs';
import { ensureDirExists, parseJsonFile, writeObjectToFile } from "./filesystem.js";

export default class FileCache {
  constructor() {
    this.checksumsByFile = new Map();
  }

  has(file) {
    return this.checksumsByFile.has(file);
  }
  
  get(file) {
    return this.checksumsByFile.get(file);
  }

  merge(fileCache) {
    const cache = new this.constructor();
    const checksumEntries = Array.from(fileCache.checksumsByFile.entries());
    cache.add(...checksumEntries);
    return cache;
  }

  add(...checksums) {
    for (const checksumEntry of checksums) {
      const [file, checksum] = checksumEntry;
      if (this.checksumsByFile.has(file))
        throw new Error(`Can't add file '${file}', the file is already registered in the cache. `);
      this.checksumsByFile.set(file, checksum);
    }
  }

  addCache(...caches) {
    for (const cache of caches) {
      const checksumEntries = Array.from(cache.checksumsByFile.entries());
      this.add(...checksumEntries);
    }
  }

  loadSafely(cacheFile) {
    ensureDirExists(cacheFile);
    if (!fs.existsSync(cacheFile))
      writeObjectToFile(cacheFile, []);
    this.load(cacheFile);
  }

  load(cacheFile) {
    const cacheRaw = parseJsonFile(cacheFile);
    cacheRaw.forEach(cacheEntry => {
      const { checksum, file } = cacheEntry;
      if (this.checksumsByFile.has(file))
        throw new Error(`The file '${file}' is already registered in the cache. `);
      this.checksumsByFile.set(file, checksum);
    });
  }

  flush(outputFile) {
    writeObjectToFile(outputFile, this.flatten(), true);
  }

  flatten() {
    const checksumEntries = Array.from(this.checksumsByFile.entries());
    const output = checksumEntries.map(([file, checksum]) => {
      return { file, checksum };
    });
    return output.sort((a, b) => a[0] - b[0]);
  }

}
