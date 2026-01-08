import fs from 'fs';
import path from 'path';
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import sharp from 'sharp';
import { getVibrantColorsInImage } from '../lib/image.js';
import { getPathSafeName, replaceUmlauts, toKebabCase } from '../lib/string.js';
import { parseJsonFile, writeObjectToFile } from '../lib/filesystem.js';
import { Color } from '../lib/terminal.js';
import { simplifyFraction } from '../lib/maths.js';


class UniquePathing {
  constructor() {
    this.paths = new Set();
  }

  getUniquePath(path) {
    if (!this.paths.has(path)) {
      this.paths.add(path);
      return path;
    }
    let currentPath = path;
    let index = 2;
    while (this.paths.has(currentPath)) {
      currentPath = path + "-" + index;
      index++;
    }
    this.paths.add(currentPath);
    return currentPath;
  }
}

const Orientation = Object.freeze({
  Landscape: 'landscape',
  Portrait: 'portrait',
  Square: 'square',
});

function getOrientation(width, height) {
  if (width === height) return Orientation.Square;
  if (width > height) return Orientation.Landscape;
  return Orientation.Portrait;
}

function getAspectRatio(width, height) {
  // We sort the array, because it would be weird to denote aspect ratios in '9:16', etc.
  const [simplifiedWidth, simplifiedHeight] = simplifyFraction(width, height).sort((a, b) => b - a);
  return {
    aspectRatio: simplifiedWidth + ":" + simplifiedHeight,
    orientation: getOrientation(width, height),
    ratioFactor: width / height,
  }
}

function normalizeTime(time, resolution = 1000) {
  const normalizedTime = Math.floor(time / resolution) * resolution;
  return new Date(normalizedTime);
}

async function hashFile(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("base64url")));
    stream.on("error", reject);
  });
}

async function processMediaFile({ filePath, fileType, fileName, extension, fileSize, fileHash }) {
  if (fileType !== 'file') return;
  console.log(`${Color.Gray}Processing file '${Color.Reset + fileName + Color.Gray}' (${filePath}).${Color.Reset}`);
  // For file names like 'Bear Conductor 2021-05-09 Release.png'.
  const fullNameRegex = /(.+)(\d{4}[-.]\d{2}[-.]\d{2}).*\.(.*)/g;
  const simpleNameRegex = /(.+)()\.(.*)/g;
  const match = fullNameRegex.exec(fileName) ?? simpleNameRegex.exec(fileName);
  const [, rawName, rawDate, fileExtension] = match;
  const title = rawName.trim();
  const mediaName = getPathSafeName(title);
  const mediaDate = rawDate.replaceAll('.', '-');
  const fileNamePublic = mediaDate.length > 0
    ? (mediaName + "_" + mediaDate + extension)
    : mediaName + extension;
  const imageTypeIsSupported = [".png", ".jpg", ".jpeg"].includes(extension);
  if (!imageTypeIsSupported)
    console.log(`${Color.Cyan}  The file type '${Color.Reset + extension + Color.Cyan}' `
      + `is only partially supported (${filePath}).${Color.Reset}`);
  const metadata = imageTypeIsSupported ? await sharp(filePath).metadata() : { width: null, height: null };
  const aspectRatioInfo = imageTypeIsSupported ? getAspectRatio(metadata.width, metadata.height) : null;
  const vibrantColors = imageTypeIsSupported ? await getVibrantColorsInImage(filePath) : null;
  return Promise.resolve({
    active: imageTypeIsSupported,
    path: mediaName,
    date: mediaDate,
    fileNamePublic: fileNamePublic,
    fileNameInternal: fileName,
    fileType: fileExtension,
    fileSize: fileSize,
    // We used to have fileModified (mtime) here, but it is unreliable. Copy and pasting the file to a new repository
    // also updates the mtime and it's impossible to sync up the different mtimes. Hash should be a lot more robust
    // detecting if a file has changed (it's also more expensive to compute, but this doesn't happen often).
    fileHash: fileHash,
    width: metadata.width,
    height: metadata.height,
    aspectRatio: aspectRatioInfo?.aspectRatio ?? null,
    orientation: aspectRatioInfo?.orientation ?? null,
    ratioFactor: aspectRatioInfo?.ratioFactor ?? null,
    vibrantColors: vibrantColors,
    // The following props are intended to be extended manually.
    title: title,
    description: [title], // supposed to be Markdown
    tags: title.split(" ").map(tag => tag.toLowerCase()),
    imageAlt: title,
    palette: [],
  });
}

async function readMediaItem(filePath) {
  const stats = await fs.promises.stat(filePath);
  if (stats.isDirectory())
    return Promise.reject(`Received directory but must be file '${filePath}'. `);
  const fileName = path.basename(filePath);
  const extension = path.extname(filePath);
  const fileType = stats.isDirectory() ? 'dir' : 'file';
  const fileSize = stats.size;
  const fileHash = await hashFile(filePath);
  return Promise.resolve({ filePath, fileType, fileName, extension, fileSize, fileHash });
}

async function readMediaInDir(dirPath, fileInfoByName = undefined) {
  const media = [];
  const pathing = new UniquePathing();
  const files = await fs.promises.readdir(dirPath);
  for (const file of files) {
    const filePath = path.resolve(dirPath, file);
    // Optimization to skip unchanged files
    if (fileInfoByName && fileInfoByName.has(file)) {
      const targetStats = fs.statSync(filePath);
      const { size: targetSize } = targetStats;
      // It is very inefficient that we need to read the whole binary file. But otherwise I see no easy and reliable
      // method to detect if the file has changed. mtime changes if files are copied, fingerprinting (reading first
      // 64 KB and last 64 KB for the hash) only works *MOST* of the time, reading the headers + CRC of each chunk
      // in the raw image files is finicky and error-prone (also needs external libraries to read custom formats).
      // Usually importing art is only done a couple of times, since the two years this project has going on I've
      // only done it about 10 times. So in that case it is fine to have heavy disk I/O.
      const targetHash = await hashFile(filePath);
      const fileInfo = fileInfoByName.get(file);
      const { size: sourceSize, fileHash: sourceHash } = fileInfo;
      const sameSize = targetSize === sourceSize;
      const sameHash = targetHash === sourceHash;
      if (sameSize && sameHash) continue;
    }
    if (file === "firefox_2020-03-17_23-56-08.png")
      1 + 1 // TODO: For some reason, the optimization does not work with this particular file. Gets read every time.
    const mediaItem = await readMediaItem(filePath).then(processMediaFile);
    // Guarantee uniqueness of paths
    const uniquePath = pathing.getUniquePath(mediaItem.path);
    const uniqueFileName = mediaItem.fileNamePublic.replace(mediaItem.path, uniquePath);
    mediaItem.fileNamePublic = uniqueFileName;
    mediaItem.path = uniquePath;
    // Add to media list
    media.push(mediaItem);
  }
  return media;
}

function mergeMediaItems(oldMediaItem, newMediaItem, preservedProps) {
  const mergedMediaItem = {};
  for (const prop in newMediaItem) {
    const isPreservedProp = preservedProps.includes(prop);
    mergedMediaItem[prop] = isPreservedProp ? oldMediaItem[prop] : newMediaItem[prop];
  }
  return mergedMediaItem;
}

function mergeMedia(oldMedia, newMedia, preservedProps) {
  const oldMediaItemsByPath = new Map();
  oldMedia.forEach(mediaItem => oldMediaItemsByPath.set(mediaItem.path, mediaItem));
  const newMediaItemsByPath = new Map();
  newMedia.forEach(mediaItem => newMediaItemsByPath.set(mediaItem.path, mediaItem));
  const mergedMediaByPath = new Map();
  for (const [path, oldMediaItem] of oldMediaItemsByPath)
    mergedMediaByPath.set(path, oldMediaItem);
  for (const [path, newMediaItem] of newMediaItemsByPath) {
    if (!mergedMediaByPath.has(path)) {
      mergedMediaByPath.set(path, newMediaItem);
      continue;
    }
    const oldMediaItem = oldMediaItemsByPath.get(path);
    const mergedMediaItem = mergeMediaItems(oldMediaItem, newMediaItem, preservedProps);
    mergedMediaByPath.set(path, mergedMediaItem);
  }
  return Array.from(mergedMediaByPath.values());
}

export default async function readMedia({ dirPath, outputFileName, skipUnchanged = false }) {
  // Step 1 -- Check parameters and setup source + target
  if (!dirPath) {
    console.error(`No directory for media files specified. Aborting. `);
    return;
  }
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory '${dirPath}' does not exist. Aborting. `);
    return;
  }
  const filePath = path.resolve(dirPath);
  const targetFile = path.resolve(process.cwd(), "data", outputFileName + '.json');
  const mediaSorter = (a, b) => b.path < a.path;

  // Step 2 -- Read in all files if no media
  if (!fs.existsSync(targetFile)) {
    const media = await readMediaInDir(filePath);
    console.log(Color.Green + `Creating media file '${targetFile}'. ` + Color.Reset);
    writeObjectToFile(targetFile, media.sort(mediaSorter), true);
    return;
  }

  // Step 3 -- Read in changed or new files and exit if nothing new
  const oldMedia = parseJsonFile(targetFile);
  const oldMediaInfoByName = new Map();
  if (skipUnchanged) {
    for (const oldMediaItem of oldMedia)
      oldMediaInfoByName.set(oldMediaItem.fileNameInternal, {
        size: oldMediaItem.fileSize,
        fileHash: oldMediaItem.fileHash,
      });
  }
  const rereadMedia = await readMediaInDir(filePath, oldMediaInfoByName);
  if (rereadMedia.length === 0) {
    console.log(Color.Gray + `No new media found. Unchanged '${targetFile}'. ` + Color.Reset);
    return;
  }

  // Step 4 - Merge with manual edits if media already exists
  const manualProps = ["description", "imageAlt", "palette", "tags", "title"];
  const mergedMedia = mergeMedia(oldMedia, rereadMedia, manualProps);
  console.log(Color.Blue + `Updating media file '${targetFile}'. ` + Color.Reset);
  writeObjectToFile(targetFile, mergedMedia.sort(mediaSorter), true);
}
