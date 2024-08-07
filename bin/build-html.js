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
    { id: "global", payload: data, augmentor: (node, data) => {
      const previousPage = node.previousSibling;
      const nextPage = node.nextSibling;
      // TODO: get page title from dir tree
      return {
        ... data,
        path: {
          relative: "../".repeat(node.depth - 1),
          absolute: node.absolutePath,
          next: { 
            path: nextPage ? nextPage.path : null,
            title: nextPage ? nextPage.title : null,
          },
          previous: { 
            path: previousPage ? previousPage.path : null,
            title: previousPage ? previousPage.title : null,
          },
        }
      }
    } },
  ]);
  // Add current model to data slice
  const artModelByPath = new Map();
  data.mediaArt.forEach(entry => artModelByPath.set(entry.path, entry));
  for (const entry of queue) {
    const { page, chunk } = entry;
    const { path: pathName, model: modelName } = page;
    if (!modelName) continue;
    if (modelName !== "mediaArt") {
      console.warn(`The model '${modelName}' is not supported so far. `);
      continue;
    }
    const modelPayload = artModelByPath.get(pathName);
    chunk.addPayload("model", modelPayload);
  }
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
