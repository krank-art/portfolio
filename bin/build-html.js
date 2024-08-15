import fs from 'fs';
import config from '../config/config.dev.js';
import { ensureDirExists, parseJsonFile, writeObjectToFile } from '../lib/filesystem.js';
import TemplateWriter from '../lib/template-writer.js';
import FileCache from '../lib/file-cache.js';
import { DataChunk } from '../lib/data-chunk.js';
import { addAbsolutePathsToDirTree, flattenDirTree, loadDirAsTree } from '../lib/dir-tree.js';

export default async function buildHtml({ inputDir, outputDir, data, partialsDir, cacheFile = null }) {
  const templating = new TemplateWriter({ partialsDir });
  await templating.load();
  // Step 1 -- Landmarking
  const dirTreeRaw = loadDirAsTree(inputDir, data);
  const dirTree = addAbsolutePathsToDirTree(dirTreeRaw);
  const queue = flattenDirTree(dirTree, [
    { id: "config", payload: config },
    {
      id: "global",
      payload: data,
      augmentor: (node, data) => {
        const previousPage = node.previousSibling ?? { path: null, title: null };
        const nextPage = node.nextSibling ?? { path: null, title: null };
        // TODO: get page title from dir tree
        return {
          ...data,
          path: {
            relative: "../".repeat(node.depth - 1),
            absolute: node.absolutePath,
            //tree: dirTree,
            next: { path: nextPage.path, title: nextPage.title },
            previous: { path: previousPage.path, title: previousPage.title },
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
    chunk.addPayload("model", modelPayload);
  }

  await templating.readAndWriteQueue({ 
    queue: queue, 
    output: outputDir,
    cachePath: cacheFile,
    silent: false,
  });
}
