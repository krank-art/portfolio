import fs from 'fs';
import config from '../config/config.dev.js';
import { ensureDirExists, parseJsonFile, writeObjectToFile } from '../lib/filesystem.js';
import TemplateWriter from '../lib/template-writer.js';
import FileCache from '../lib/file-cache.js';
import { DataChunk } from '../lib/data-chunk.js';
import { addAbsolutePathsToDirTree, flattenDirTree, loadDirAsTree } from '../lib/dir-tree.js';

export default async function buildHtml({ inputDir, outputDir, data, partialsDir, cacheFile, useCache = false }) {
  const templating = new TemplateWriter({ partialsDir });
  await templating.load();
  const entryCache = new FileCache();
  if (useCache) entryCache.loadSafely(cacheFile);
  // Step 1 -- Landmarking
  const dirTreeRaw = loadDirAsTree(inputDir, data);
  const dirTree = addAbsolutePathsToDirTree(dirTreeRaw);
  const queue = flattenDirTree(dirTree, [
    { id: "config", payload: config },
    { id: "global", payload: data },
  ]);
  const templateData = { ...config, ...data };
  templateData.path.tree = dirTree; // Inject page tree into data
  const outputCache = await templating.compileDir({
    input: inputDir,
    output: outputDir,
    buildCache: useCache ? entryCache : null,
    data: templateData,
  });
  if (useCache) {
    outputCache.flush(cacheFile);
    const entryCacheString = JSON.stringify(entryCache.flatten());
    const outputCacheString = JSON.stringify(outputCache.flatten());
    if (entryCacheString === outputCacheString)
      console.log("No changes detected in generated HTML. ");
  }
}
