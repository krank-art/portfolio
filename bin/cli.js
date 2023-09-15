import path from 'path';
import { fileURLToPath } from 'url';
import buildMedia from './build-media.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mediaPaths = {
  dataInput: path.join(__dirname, '../data/media-art.json'),
  mediaInput: path.resolve("static/art"),
  mediaOutput: path.resolve("dist/media"),
  thumbnailsInput: path.resolve("dist/media"),
  thumbnailsOutput: path.resolve("dist/media/thumbnail"),
};

async function handleCommand(command, ...args) {
  switch (command) {
    case "media:build":
      await buildMedia({
        dataInput: mediaPaths.dataInput,
        mediaInput: mediaPaths.mediaInput,
        mediaOutput: mediaPaths.mediaOutput,
        thumbnailsInput: mediaPaths.thumbnailsInput,
        thumbnailsOutput: mediaPaths.thumbnailsOutput,
      });
      break;
    default:
      console.log(`Unknown command '${command}'`);
  }
}

const [, , command, ...args] = process.argv;
await handleCommand(command, args);
