import path from 'path';
import { fileURLToPath } from 'url';
import buildMedia from './build-media.js';
import { deleteDirRecursive, parseJsonFile } from '../lib/filesystem.js';
import readMedia from './read-media.js';
import buildHtml from './build-html.js';
import buildAssets from './build-assets.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handleCommand(command, ...args) {
  switch (command) {
    case "build":
      await handleCommand("build:assets");
      await handleCommand("build:html");
      await handleCommand("build:art");
      break;
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
    case "build:html":
      buildHtml({
        inputDir: path.resolve("pages"),
        outputDir: path.resolve("dist"),
        data: {
          title: 'Handlebars Example',
          name: 'John Doe',
          mediaArt: parseJsonFile(path.resolve('data/media-art.json')),
        },
      });
      break;
    case "build:assets":
      await buildAssets();
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
