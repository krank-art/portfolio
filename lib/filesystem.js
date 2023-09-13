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

export function ensureDirExists(filePath) {
  // Based on https://stackoverflow.com/a/34509653/create-directory-when-writing-to-file-in-node-js by Tiago Peres França, 2015-12-29
  // `path.dirname() removes trailing separators, so we make sure to add an arbitrary character when input is a directory.
  const objectPath = filePath.endsWith(path.sep) ? `${filePath}.` : filePath;
  const dirname = path.dirname(objectPath);
  if (fs.existsSync(dirname)) return true;
  ensureDirExists(dirname);
  fs.mkdirSync(dirname);
}

export function ensureDirExists2(directoryPath) {
  throw new Error(`This function runs unreliably. Use ensureDirExists() instead. `);
  const directories = directoryPath.split(path.sep);
  let currentPath = '';
  for (const dir of directories) {
    currentPath = path.join(currentPath, dir);
    if (fs.existsSync(currentPath)) continue;
    fs.mkdirSync(currentPath);
  }
}
