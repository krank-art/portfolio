import path from 'path';
import { access, constants, mkdir, writeFile, copyFile } from 'fs/promises';
import { parseJsonFile } from '../lib/filesystem.js';
import { encryptSets } from '../lib/encrypto.js';
import { toBase32 } from '../lib/string.js';

export default async function buildNsfw({ nsfwDir, outputDir, resizeSet = null }) {
  const hasDir = await access(nsfwDir, constants.F_OK);
  if ((await access(nsfwDir, constants.F_OK)) !== undefined) {
    console.warn(`No nsfw dir found. You need to manually clone the submodule from a bundle file.`);
    return;
  }
  const nsfwData = parseJsonFile(path.join(nsfwDir, "media-nsfw.json"));
  const nsfwSets = parseJsonFile(path.join(nsfwDir, "encryption-sets.json"));
  const postQueue = getEncryptionQueue(nsfwData, nsfwSets);
  const nsfwTempDir = path.join(nsfwDir, "temp");
  if ((await access(nsfwTempDir, constants.F_OK)) !== undefined)
    await mkdir(nsfwTempDir); // This will be the starting point for all file encryptions
  const postQueueByPath = new Map();
  for (const post of postQueue)
    postQueueByPath.set(post.path, post);
  const encryptionSets = await Promise.all(nsfwSets.map(async (nsfwSet) => {
    const { password, title, posts } = nsfwSet;
    const encryptionTasks = await Promise.all(posts.map(async (postPath) => {
      const post = postQueueByPath.get(postPath);
      const postDataPath = path.join(nsfwTempDir, `${postPath}.json`);
      await writeFile(postDataPath, JSON.stringify(post));
      const { fileNamePublic, fileNameInternal } = post;
      const fileInput = path.join(nsfwDir, "static", fileNameInternal);
      const fileOutput = path.join(nsfwTempDir, fileNamePublic);
      await copyFile(fileInput, fileOutput);
      // TODO: Implement resize set
      return [
        path.relative(nsfwTempDir, postDataPath),
        path.relative(nsfwTempDir, fileOutput),
      ];
    }));
    return { password, title, posts: encryptionTasks };
  }));
  await encryptSets({
    sets: encryptionSets,
    inputDir: nsfwTempDir,
    outputDir: outputDir,
    silent: false,
  });
}

function getEncryptionQueue(mediaRecords, encryptionSets) {
  const postsByPath = new Map();
  for (const record of mediaRecords) {
    const { path: recordPath } = record;
    if (postsByPath.has(recordPath)) {
      console.warn(`The path '${recordPath}' has already been defined. Skipping. `);
      continue;
    }
    postsByPath.set(recordPath, record);
  }
  const postPathsToBeEncrypted = new Set();
  for (const set of encryptionSets) {
    const { posts: postPaths } = set;
    for (const postPath of postPaths) {
      if (postPathsToBeEncrypted.has(postPath)) {
        console.warn(`Post with path '${postPath}' has already been included in a different encryption set. Skipping. `);
        continue;
      }
      const post = postsByPath.get(postPath);
      if (!post) {
        console.warn(`Post with path '${postPath}' does not exist in media list. Skipping. `);
        continue;
      }
      if (post.active === false) {
        console.warn(`Post with path '${postPath}' is inactive and should not be included in encryption set. Skipping. `);
        continue;
      }
      postPathsToBeEncrypted.add(postPath);
    }
  }
  const specifiedPostsButNotGettingEncrypted = [];
  for (const post of mediaRecords) {
    const { active, path: postPath } = post;
    if (active !== true) continue;
    if (postPathsToBeEncrypted.has(postPath)) continue;
    specifiedPostsButNotGettingEncrypted.push(post);
  }
  if (specifiedPostsButNotGettingEncrypted.length > 0)
    console.warn([
      `Active posts that are not staged for encryption (${specifiedPostsButNotGettingEncrypted.length}):`,
      ...specifiedPostsButNotGettingEncrypted.map(post => post.path),
    ].join('\n'));
  return Array.from(postPathsToBeEncrypted).map(postPath => postsByPath.get(postPath));
}

function getPathHash(knownCodes = new Set()) {
  // Based on the blacklisted words in Minecraft Bedrock Edition
  const profaneHashes = new Set([
    "4ID5", "4IDS", "5TD5", "5TDS", "88AD", "88HH", "8HH8", "AD88",
    "AID5", "AIDS", "BAMF", "D4GO", "DAGO", "DYKE", "GOOK", "H88H",
    "HH88", "HITL", "JOTO", "KIK3", "KIKE", "M3TH", "METH", "MONG",
    "N4ZI", "N4ZL", "N66R", "N6GR", "NAZI", "NAZL", "NG6R", "NGGR",
    "NI66", "NI6G", "NIG6", "NIGG", "P3DO", "P4KI", "PAKI", "PEDO",
    "R4IP", "R4P3", "R4PE", "RAIP", "RAP3", "RAPE", "STD5", "STDS",
  ]);
  // https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#file-and-directory-names
  const reservedHashes = new Set([
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    "NULL",
  ]);
  const digits = 4;
  for (let attempt = 0; attempt < 10; attempt++) {
    let hash = "";
    const randomNumber = Math.floor(Math.random() * (32 ** digits));
    hash = toBase32(randomNumber).padStart(digits, "A");
    if (knownCodes.has(hash)) continue;
    if (reservedHashes.has(hash)) continue;
    if (profaneHashes.has(hash)) continue;
    return hash;
  }
  throw new Error(`Exceeded max tries to generate a ${digits} digit Base32 hash. `);
}
