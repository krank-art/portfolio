import fs from 'fs';
import config from '../config/config.dev.js';
import { ensureDirExists, parseJsonFile, writeObjectToFile } from '../lib/filesystem.js';
import TemplateWriter from '../lib/template-writer.js';

export default async function buildHtml({ inputDir, outputDir, data, partialsDir, cacheFile }) {
  const templating = new TemplateWriter({ partialsDir });
  await templating.load();
  ensureDirExists(cacheFile);
  const hasCacheFile = cacheFile && fs.existsSync(cacheFile);
  const oldChecksumsRaw = hasCacheFile ? parseJsonFile(cacheFile) : null;
  const oldChecksums = oldChecksumsRaw ?
    oldChecksumsRaw.reduce((accumulator, currentObject) => {
      const { checksum, file } = currentObject;
      const checksumObject = {};
      checksumObject[file] = checksum;
      return { ...accumulator, ...checksumObject };
    }, {})
    : null;
  const newChecksums = await templating.compileSfcDir({
    input: inputDir,
    output: outputDir,
    data: {
      ...config,
      ...data,
    },
    buildCache: oldChecksums,
  });
  if (cacheFile) {
    const newChecksumsRaw = Object.keys(newChecksums).map(key => ({
      file: key,
      checksum: newChecksums[key],
    }));
    writeObjectToFile(cacheFile, newChecksumsRaw, true);
    console.log(`Updated build cache '${cacheFile}'. `);
  }
}
