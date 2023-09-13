import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getVibrantColorsInImage } from '../lib/image.js';
import { replaceUmlauts, toKebabCase } from '../lib/string.js';
import { writeObjectToFile } from '../lib/filesystem.js';
import { Color } from '../lib/terminal.js';

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

async function processMediaFile({ filePath, fileType, fileName, extension, fileSize }) {
  if (fileType !== 'file') return;
  console.log(`${Color.Gray}Processing file '${Color.Reset + fileName + Color.Gray}' (${filePath}).${Color.Reset}`);
  // For file names like 'Bear Conductor 2021-05-09 Release.png'.
  const fullNameRegex = /(.+)(\d{4}[-.]\d{2}[-.]\d{2}).*\.(.*)/g;
  const simpleNameRegex = /(.+)()\.(.*)/g;
  const match = fullNameRegex.exec(fileName) ?? simpleNameRegex.exec(fileName);
  const [, rawName, rawDate, fileExtension] = match;
  const title = rawName.trim();
  const mediaName = replaceUmlauts(toKebabCase(title));
  const mediaDate = rawDate.replaceAll('.', '-');
  const fileNamePublic = mediaDate.length > 0 
    ? (mediaName + "_" + mediaDate + extension) 
    : mediaName + extension;
  const imageTypeIsSupported = [".png", ".jpg", ".jpeg"].includes(extension);
  if (!imageTypeIsSupported)
    console.log(`${Color.Cyan}  The file type '${Color.Reset + extension + Color.Cyan}' `
      + `is only partially supported (${filePath}).${Color.Reset}`);
  const metadata = imageTypeIsSupported ? await sharp(filePath).metadata() : { width: null, height: null };
  const aspectRatio = imageTypeIsSupported ? (metadata.width / metadata.height) : null;
  const vibrantColors = imageTypeIsSupported ? await getVibrantColorsInImage(filePath) : null;
  return Promise.resolve({
    active: imageTypeIsSupported,
    path: mediaName,
    date: mediaDate,
    fileNamePublic: fileNamePublic,
    fileNameInternal: fileName,
    fileType: fileExtension,
    fileSize: fileSize,
    width: metadata.width,
    height: metadata.height,
    aspectRatio: aspectRatio,
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
  return Promise.resolve({ filePath, fileType, fileName, extension, fileSize });
}

async function readMediaInDir(dirPath) {
  const media = [];
  const pathing = new UniquePathing();
  const files = await fs.promises.readdir(dirPath);
  for (const file of files) {
    const filePath = path.resolve(dirPath, file);
    const mediaItem = await readMediaItem(filePath).then(processMediaFile);
    // Guarantee uniqueness of paths
    const uniquePath = pathing.getUniquePath(mediaItem.path);
    const uniqueFileName = mediaItem.fileNameInternal.replace(mediaItem.path, uniquePath);
    mediaItem.fileNameInternal = uniqueFileName;
    mediaItem.path = uniquePath;
    // Add to media list
    media.push(mediaItem);
  }
  return media;
}

async function readMedia(dirPath) {
  if (!dirPath) {
    console.error(`No directory for media files specified. Aborting. `);
    return;
  }
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory '${dirPath}' does not exist. Aborting. `);
    return;
  }
  const filePath = path.resolve(dirPath);
  const media = await readMediaInDir(filePath);
  const targetFile = path.resolve(process.cwd(), 'media.json');
  writeObjectToFile(targetFile, media);
}

const [, , rawPath] = process.argv;
readMedia(rawPath);
