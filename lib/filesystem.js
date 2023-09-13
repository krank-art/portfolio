import fs from 'fs';
import path from 'path';

export function readDirSync(dirPath, onFile = () => { }) {
  const fileNames = fs.readdirSync(dirPath);
  for (const fileName of fileNames) {
    const filePath = path.join(dirPath, fileName);
    const extension = path.extname(filePath);
    const stats = fs.statSync(filePath);
    const fileType = stats.isDirectory() ? 'dir' : 'file';
    onFile({ filePath, fileType, fileName, extension });
  }
}

export async function readDir(dirPath, onFile = async () => { }) {
  const files = await fs.promises.readdir(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const extension = path.extname(filePath);
    const stats = fs.statSync(filePath);
    const fileType = stats.isDirectory() ? 'dir' : 'file';
    onFile({ filePath, fileType, fileName: file, extension });
  }
}

export function writeObjectToFile(path, object) {
  // depending on object size, it would be better to stream this
  const content = JSON.stringify(object);
  fs.writeFileSync(path, content, { encoding: 'utf-8' });
}

export function ensureDirExists(directoryPath) {
  const directories = directoryPath.split(path.sep);
  let currentPath = '';
  for (const dir of directories) {
    currentPath = path.join(currentPath, dir);
    if (fs.existsSync(currentPath)) continue;
    fs.mkdirSync(currentPath);
  }
}
