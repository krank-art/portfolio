import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getVibrantColorsInImage } from '../lib/image.js';
import { toKebabCase } from '../lib/string.js';
import { writeObjectToFile } from '../lib/filesystem.js';

async function processMediaFile({ filePath, fileType, fileName, extension, fileSize }) {
  console.log(filePath);
  if (fileType !== 'file') return;
  // For file names like 'Bear Conductor 2021-05-09 Release.png'.
  const fullNameRegex = /(.+)(\d{4}[-.]\d{2}[-.]\d{2}).*\.(.*)/g;
  const simpleNameRegex = /(.+)()\.(.*)/g;
  const match = fullNameRegex.exec(fileName) ?? simpleNameRegex.exec(fileName);
  const [, rawName, rawDate, fileExtension] = match;
  const mediaName = toKebabCase(rawName.trim());
  const mediaDate = rawDate.replaceAll('.', '-');
  const metadata = await sharp(filePath).metadata();
  return Promise.resolve({
    path: mediaName,
    date: mediaDate,
    fileName: fileName,
    fileType: fileExtension,
    fileSize: fileSize,
    width: metadata.width,
    height: metadata.height,
    aspectRatio: metadata.width / metadata.height,
    vibrantColors: await getVibrantColorsInImage(filePath),
    title: rawName.trim(),
    description: "",
    tags: [],
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
  const files = await fs.promises.readdir(dirPath);
  for (const file of files) {
    const filePath = path.resolve(dirPath, file);
    const mediaItem = await readMediaItem(filePath).then(processMediaFile);
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
