import path from 'path';
import config from '../config/config.dev.js';
import TemplateWriter from '../lib/template-writer.js';
import { addAbsolutePathsToDirTree, flattenDirTree, loadDirAsTree } from '../lib/dir-tree.js';

export default async function buildHtml({ inputDir, outputDir, data, partialsDir, cacheFile = null, ignoredFiles = [] }) {
  const templating = new TemplateWriter({ partialsDir });
  await templating.load();
  // Step 1 -- Landmarking
  const dirTreeRaw = loadDirAsTree({
    input: inputDir, 
    models: data,
    ignoredFiles: ignoredFiles.map(filePath => path.join(inputDir, filePath)),
  });
  const dirTree = addAbsolutePathsToDirTree(dirTreeRaw);
  const queue = flattenDirTree(dirTree);
  // Add current model to data slice
  const artModelByPath = new Map();
  data.mediaArt.forEach(entry => artModelByPath.set(entry.path, entry));
  for (const entry of queue) {
    const { page, chunk } = entry;
    const { path: pathName, model: modelName, type: pageType, source } = page;
    if (pageType !== "page") continue;
    // Add config to data chunk
    chunk.addPayload("config", config);
    // Add global to data chunk
    chunk.addPayload("global", data);
    // Add navigation
    const nextPage = page.nextSibling;
    page.test = "bobo-bär"
    const previousPage = page.previousSibling;
    chunk.addPayload("navigation", {
      path: {
        relative: "../".repeat(page.depth - 1),
        absolute: page.absolutePath,
        tree: dirTree, //dirTree.map(page => page.duplicateWithoutParent()),
        next: nextPage ? { path: nextPage.path, title: nextPage.title } : null,
        previous: previousPage ? { path: previousPage.path, title: previousPage.title } : null,
      }
    });
    // Add model to data chunk (if model page)
    if (modelName && modelName === "mediaArt") {
      const modelPayload = artModelByPath.get(pathName);
      chunk.addPayload("model", { modelItem: modelPayload });
    } else if (modelName) {
      console.warn(`The model '${modelName}' is not supported so far. `);
    }
    // Add page title
    const module = await templating.executeFile(source, chunk);
    page.title = module.title ?? page.path;
  }
  const pageEntries = queue.filter(entry => entry.page.type === "page");
  for (let i = 0; i < pageEntries.length; i++) {
    // Has to be done afterwards otherwise we would reach ahead when looking for "nextPage".
    // For some reason, accessing "page.nextSibling" and "page.previousSibling" accesses an outdated copy of DirTreeNodes, 
    // which do not have their title set. I tried long and hard, but I'm not sure why it's not stored as an object references,
    // which then can easily be accessed and modified. For now we will simply just access the next and previous page via the loop.
    const entry = pageEntries[i];
    const nextSibling = pageEntries[i + 1]?.page;
    const previousSibling = pageEntries[i - 1]?.page;
    const { page, chunk } = entry;
    const navigationSlice = chunk.getSlice("navigation").payload;
    const navPath = navigationSlice.path;
    if (navPath.next && nextSibling && nextSibling.depth === page.depth)
      navPath.next.title = nextSibling.title;
    if (navPath.previous && previousSibling && previousSibling.depth === page.depth)
      navPath.previous.title = previousSibling.title;
  }
  await templating.readAndWriteQueue({
    queue: queue,
    output: outputDir,
    cachePath: cacheFile,
    silent: false,
  });
}
