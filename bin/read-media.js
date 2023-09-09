import fs from 'fs';
import path from 'path';

function toKebabCase(inputString) {
  return inputString
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function readDir(dirPath, onFile = () => {}) {
  const fileNames = fs.readdirSync(dirPath);
  for (const fileName of fileNames) {
    const filePath = path.join(dirPath, fileName);
    const extension = path.extname(filePath);
    const stats = fs.statSync(filePath);
    const fileType = stats.isDirectory() ? 'dir' : 'file';
    onFile({filePath, fileType, fileName, extension});
  }
}

function readMedia(dirPath) {
  const media = [];
  readDir(dirPath, ({filePath, fileType, fileName, extension}) => {
    if (fileType !== 'file') return;
    // For file names like 'Bear Conductor 2021-05-09 Release.png'.
    const fullNameRegex = /(.+)(\d{4}[-.]\d{2}[-.]\d{2}).*\.(.*)/g;
    const match = fullNameRegex.exec(fileName);
    if (match) {
      const [, rawName, rawDate, extension] = match;
      const mediaName = toKebabCase(rawName.trim());
      const mediaDate = rawDate.replaceAll('.', '-');
      media.push({
        path: mediaName, 
        date: mediaDate, 
        fileName: fileName,
        fileType: extension,
        fileSize: 0,
        widthInPx: 0,
        heightInPx: 0,
        aspectRatio: 0,
        fileColors: [],
        title: rawName.trim(),
        description: "",
        tags: [],
        palette: [],
      });
      return;
    }
    //console.log(fileName);
  });
  return media;
}

const [, , rawPath] = process.argv;
const filePath = path.resolve(rawPath);
console.log(readMedia(filePath));
