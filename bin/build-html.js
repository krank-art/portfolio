import fs from 'fs';
import config from '../config/config.dev.js';
import { ensureDirExists, parseJsonFile, writeObjectToFile } from '../lib/filesystem.js';
import TemplateWriter from '../lib/template-writer.js';
import FileCache from '../lib/file-cache.js';

export default async function buildHtml({ inputDir, outputDir, data, partialsDir, cacheFile, useCache = false }) {
  const templating = new TemplateWriter({ partialsDir });
  await templating.load();
  const entryCache = new FileCache();
  if (useCache) entryCache.loadSafely(cacheFile);
  const outputCache = await templating.compileSfcDir({
    input: inputDir,
    output: outputDir,
    buildCache: useCache ? entryCache : null,
    data: {
      ...config,
      ...data,
    },
  });
  if (useCache) { 
    outputCache.flush(cacheFile);
    const entryCacheString = JSON.stringify(entryCache.flatten());
    const outputCacheString = JSON.stringify(outputCache.flatten());
    if (entryCacheString === outputCacheString)
      console.log("No changes detected in generated HTML. ");
  }
}
