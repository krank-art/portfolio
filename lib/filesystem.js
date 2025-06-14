import fs from 'fs';
import path from 'path';
import { Color } from '../lib/terminal.js'

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

export function writeObjectToFile(path, object, pretty = false) {
  // depending on object size, it would be better to stream this
  const content = pretty ? JSON.stringify(object, null, 2) : JSON.stringify(object);
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

function fileIsNewer(source, target) {
  const getTime = (path) => fs.statSync(path).mtime;
  if (!fs.existsSync(target)) return true;
  if (!fs.existsSync(source)) return false;
  return getTime(source) > getTime(target);
}

export function handleFileIfNewer({sourcePath, targetPath, onFile = () => {}, onSkip = () => {}}) {
  if (!fileIsNewer(sourcePath, targetPath)) {
    onSkip(sourcePath, targetPath);
    return;
  }
  onFile(sourcePath, targetPath);
}

export async function handleFileIfNewerAsync({sourcePath, targetPath, onFile = async () => {}, onSkip = async () => {}}) {
  if (!fileIsNewer(sourcePath, targetPath)) {
    await onSkip(sourcePath, targetPath);
    return;
  }
  await onFile(sourcePath, targetPath);
}

export function copyFileIfNewer(sourcePath, targetPath, silent = false) {
  handleFileIfNewer({
    sourcePath: sourcePath,
    targetPath: targetPath,
    onSkip: (sourcePath) => {
      if (silent) return;
      console.log(`${Color.Gray}Skipping '${sourcePath}'. ${Color.Reset}`);
    },
    onFile: (sourcePath, targetPath) => {
      if (!silent)
        console.log(`${Color.Green}Copying '${Color.Blue + sourcePath + Color.Green}' to '${targetPath}'. ${Color.Reset}`);
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

export function copyIfNewer(sourceDir, targetDir, silent = false) {
  const files = fs.readdirSync(sourceDir);
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    copyFileIfNewer(sourcePath, targetPath, silent);
  }
}

export function copyAndRenameFilesIfNewer(targetsBySources, silent = false) {
}

export function parseJsonFile(filePath) {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

export function deleteDirRecursive(dirPath) {
  if (!fs.existsSync(dirPath))
    return;
  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      deleteDirRecursive(filePath);
      continue;
    }
    fs.unlinkSync(filePath);
  }
  fs.rmdirSync(dirPath);
}

export async function copyRecursive(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}
