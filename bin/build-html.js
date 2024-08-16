import fs from 'fs';
import config from '../config/config.dev.js';
import { ensureDirExists, parseJsonFile, writeObjectToFile } from '../lib/filesystem.js';
import TemplateWriter from '../lib/template-writer.js';
import FileCache from '../lib/file-cache.js';
import { DataChunk } from '../lib/data-chunk.js';
import { addAbsolutePathsToDirTree, flattenDirTreeSafely, loadDirAsTree } from '../lib/dir-tree.js';

export default async function buildHtml({ inputDir, outputDir, data, partialsDir, cacheFile = null }) {
  const templating = new TemplateWriter({ partialsDir });
  await templating.load();
  // Step 1 -- Landmarking
  const dirTreeRaw = loadDirAsTree(inputDir, data);
  const dirTree = addAbsolutePathsToDirTree(dirTreeRaw);
  const queue = flattenDirTreeSafely(dirTree, [
    { id: "config", payload: config },
    {
      id: "global",
      payload: data,
      augmentor: (node, data) => {
        // TODO: get page title from dir tree
        const nextPage = node.nextSibling;
        const previousPage = node.previousSibling;
        return {
          ...data, 
          path: {
            relative: "../".repeat(node.depth - 1),
            absolute: node.absolutePath,
            tree: dirTree.map(node => node.duplicateWithoutParent()),
            next: nextPage ? { path: nextPage.path, title: nextPage.title } : null,
            previous: previousPage ? { path: previousPage.path, title: previousPage.title } : null,
          }
        }
      }
    },
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
    chunk.addPayload("model", {modelItem: modelPayload});
  }

  await templating.readAndWriteQueue({ 
    queue: queue, 
    output: outputDir,
    cachePath: cacheFile,
    silent: false,
  });
}
