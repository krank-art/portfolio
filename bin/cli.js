import path from 'path';
import { fileURLToPath } from 'url';
import buildMedia from './build-media.js';
import { deleteDirRecursive } from '../lib/filesystem.js';
import readMedia from './read-media.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handleCommand(command, ...args) {
  switch (command) {
    case "clean":
      deleteDirRecursive(path.resolve('dist'));
      break;
    case "build:art":
      await buildMedia({
        dataInput: path.resolve('data/media-art.json'),
        mediaInput: path.resolve("static/art"),
        mediaOutput: path.resolve("dist/media"),
        thumbnailsInput: path.resolve("dist/media"),
        thumbnailsOutput: path.resolve("dist/media/thumbnail"),
      });
      break;
    case "import:art":
      await readMedia({
        dirPath: path.resolve("static/art"),
        outputFileName: "media-art",
        skipUnchanged: true,
      });
      break;
    default:
      console.log(`Unknown command '${command}'`);
  }
}

const [, , command, ...args] = process.argv;
await handleCommand(command, args);
