import fs from 'fs';
import { parseJsonFile, writeObjectToFile } from "../lib/filesystem.js";

export default function readTags(mediaFile, tagFile, pathPrefix = "") {
  if (!fs.existsSync(mediaFile)) {
    console.warn(`There is no media file at '${mediaFile}', aborting. `);
    return;
  }
  if (!fs.existsSync(tagFile)) {
    console.warn(`There is no tag file at '${tagFile}', aborting. `);
    return;
  }
  const media = parseJsonFile(mediaFile);
  const rawTags = parseJsonFile(tagFile);
  const mediaByPath = new Map();
  for (const entry of media)
    mediaByPath.set(pathPrefix + entry.path, entry);
  const unknownPaths = {};
  for (const path in rawTags) {
    const tags = rawTags[path];
    if (unknownPaths.hasOwnProperty(path)) {
      console.warn(`The path '${path}' appears multiple times in the tag list, skipping. `);
      continue;
    }
    if (!mediaByPath.has(path)) {
      unknownPaths[path] = tags;
      continue;
    }
    const mediaEntry = mediaByPath.get(path);
    mediaEntry.tags = tags.sort();
  }
  writeObjectToFile(mediaFile, media, true);
  console.log(`Overridden tags in '${mediaFile}' with '${tagFile}'. `);
}
