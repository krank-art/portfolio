import path from 'path';
import buildMedia from './build-media.js';
import { deleteDirRecursive, parseJsonFile } from '../lib/filesystem.js';
import readMedia from './read-media.js';
import buildHtml from './build-html.js';
import buildAssets from './build-assets.js';
import FileWatcher from '../lib/filewatcher.js';
import { Color } from '../lib/terminal.js';

export const pathing = Object.freeze({
  dist: path.resolve('dist'),
  pages: path.resolve("pages"),
  assetsEntry: path.resolve("lib/main.js"),
  artData: path.resolve('data/media-art.json'),
  artImport: path.resolve("static/art"),
  artProcessed: path.resolve("dist/media"),
  artThumbnails: path.resolve("dist/media/thumbnail"),
});

export async function handleCommand(command, ...args) {
  switch (command) {
    case "build":
      await handleCommand("build:assets");
      await handleCommand("build:html");
      await handleCommand("build:art");
      break;
    case "clean":
      deleteDirRecursive(pathing.dist);
      break;
    case "build:art":
      await buildMedia({
        dataInput: pathing.artData,
        mediaInput: pathing.artImport,
        mediaOutput: pathing.artProcessed,
        thumbnailsInput: pathing.artProcessed,
        thumbnailsOutput: pathing.artThumbnails,
      });
      break;
    case "build:html":
      buildHtml({
        inputDir: pathing.pages,
        outputDir: pathing.dist,
        data: {
          title: 'Handlebars Example',
          name: 'John Doe',
          mediaArt: parseJsonFile(pathing.artData),
        },
      });
      break;
    case "build:assets":
      await buildAssets();
      break;
    case "import:art":
      await readMedia({
        dirPath: pathing.artImport,
        outputFileName: "media-art",
        skipUnchanged: true,
      });
      break;
    case "watch":
      await handleCommand("watch:assets");
      await handleCommand("watch:html");
      await handleCommand("watch:art");
      break;
    case "watch:art":
      console.log("Press Ctrl + C to abort watcher. ");
      new FileWatcher({
        target: [
          pathing.artData,
          pathing.artImport,
        ],
        recursive: true,
        onChange: async (eventType, fileName) => {
          console.log(Color.Blue + `'${eventType}' on file '${fileName}'. Rebuilding art files. `
            + Color.Gray + `(${new Date()})` + Color.Reset);
          await handleCommand("build:art");
        },
      });
      break;
    case "watch:html":
      console.log("Press Ctrl + C to abort watcher. ");
      new FileWatcher({
        target: [
          pathing.pages,
          pathing.artData,
        ],
        recursive: true,
        onChange: async (eventType, fileName) => {
          console.log(Color.Orange + `'${eventType}' on file '${fileName}'. Rebuilding HTML. `
            + Color.Gray + `(${new Date()})` + Color.Reset);
          await handleCommand("build:html");
        },
      });
      break;
    case "watch:assets":
      console.log("Press Ctrl + C to abort watcher. ");
      new FileWatcher({
        target: pathing.assetsEntry,
        recursive: true,
        onChange: async (eventType, fileName) => {
          console.log(Color.Red + `'${eventType}' on file '${fileName}'. Rebuilding Assets. `
            + Color.Gray + `(${new Date()})` + Color.Reset);
          await handleCommand("build:assets");
        },
      });
      break;
    default:
      console.log(`Unknown command '${command}'`);
  }
}

const [, , command, ...args] = process.argv;
if (command) await handleCommand(command, args);
