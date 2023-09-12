import fs from 'fs';
import path from 'path';
import { getVibrantColorsInImage } from '../lib/image.js';
import { toKebabCase } from '../lib/string.js';
import { writeObjectToFile } from '../lib/filesystem.js';

async function readMediaItem(filePath) {
  const stats = await fs.promises.stat(filePath);
  if (stats.isDirectory()) 
    return Promise.reject(`Received directory but must be file '${filePath}'. `);
  const fileName = path.basename(filePath);
  const extension = path.extname(filePath);
  const fileType = stats.isDirectory() ? 'dir' : 'file';
  return Promise.resolve({ filePath, fileType, fileName, extension });
}

async function readMediaInDir(dirPath) {
  const media = [];
  const files = await fs.promises.readdir(dirPath);
  for (const file of files) {
    const filePath = path.resolve(dirPath, file);
    const mediaItem = await readMediaItem(filePath).then(
      async ({ filePath, fileType, fileName, extension }) => {
        console.log(filePath);
        if (fileType !== 'file') return;
        // For file names like 'Bear Conductor 2021-05-09 Release.png'.
        const fullNameRegex = /(.+)(\d{4}[-.]\d{2}[-.]\d{2}).*\.(.*)/g;
        const simpleNameRegex = /(.+)()\.(.*)/g;
        const match = fullNameRegex.exec(fileName) ?? simpleNameRegex.exec(fileName);
        const [, rawName, rawDate, fileExtension] = match;
        const mediaName = toKebabCase(rawName.trim());
        const mediaDate = rawDate.replaceAll('.', '-');
        return Promise.resolve({
          path: mediaName,
          date: mediaDate,
          fileName: fileName,
          fileType: fileExtension,
          // TODO: Read meta data from image with 'sharp'
          //fileSize: 0,
          //widthInPx: 0,
          //heightInPx: 0,
          aspectRatio: 0,
          vibrantColors: await getVibrantColorsInImage(filePath),
          title: rawName.trim(),
          description: "",
          tags: [],
          palette: [],
        });
      });
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
