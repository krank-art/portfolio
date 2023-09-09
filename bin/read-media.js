import fs from 'fs';
import path from 'path';

function toKebabCase(inputString) {
  return inputString
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function readDir(dirPath, onFile = () => { }) {
  const fileNames = fs.readdirSync(dirPath);
  for (const fileName of fileNames) {
    const filePath = path.join(dirPath, fileName);
    const extension = path.extname(filePath);
    const stats = fs.statSync(filePath);
    const fileType = stats.isDirectory() ? 'dir' : 'file';
    onFile({ filePath, fileType, fileName, extension });
  }
}

function writeObjectToFile(path, object) {
  // depending on object size, it would be better to stream this
  const content = JSON.stringify(object);
  fs.writeFileSync(path, content, { encoding: 'utf-8' });
}

function readMediaInDir(dirPath) {
  const media = [];
  readDir(dirPath, ({ filePath, fileType, fileName, extension }) => {
    if (fileType !== 'file') return;
    // For file names like 'Bear Conductor 2021-05-09 Release.png'.
    const fullNameRegex = /(.+)(\d{4}[-.]\d{2}[-.]\d{2}).*\.(.*)/g;
    const simpleNameRegex = /(.+)()\.(.*)/g;
    const match = fullNameRegex.exec(fileName) ?? simpleNameRegex.exec(fileName);
    const [, rawName, rawDate, fileExtension] = match;
    const mediaName = toKebabCase(rawName.trim());
    const mediaDate = rawDate.replaceAll('.', '-');
    media.push({
      path: mediaName,
      date: mediaDate,
      fileName: fileName,
      fileType: fileExtension,
      // TODO: Read meta data from image with 'sharp'
      //fileSize: 0,
      //widthInPx: 0,
      //heightInPx: 0,
      //aspectRatio: 0,
      //imageColors: [],
      title: rawName.trim(),
      description: "",
      tags: [],
      palette: [],
    });
  });
  return media;
}

function readMedia(dirPath) {
  if (!dirPath) {
    console.error(`No directory for media files specified. Aborting. `);
    return;
  }
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory '${dirPath}' does not exist. Aborting. `);
    return;
  }
  const filePath = path.resolve(dirPath);
  const media = readMediaInDir(filePath);
  const targetFile = path.resolve(process.cwd(), 'media.json');
  writeObjectToFile(targetFile, media);
}

const [, , rawPath] = process.argv;
readMedia(rawPath);
