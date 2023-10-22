import path from 'path';
import buildMedia from './build-media.js';
import { deleteDirRecursive, parseJsonFile } from '../lib/filesystem.js';
import readMedia from './read-media.js';
import buildHtml from './build-html.js';
import buildAssets from './build-assets.js';
import FileWatcher from '../lib/filewatcher.js';
import { Color } from '../lib/terminal.js';
import { inspectMediaTable } from './inspect-media.js';

const pathing = Object.freeze({
  dist: path.resolve('dist'),
  pages: path.resolve("pages"),
  pagesCache: path.resolve(".cache/pages.json"),
  layouts: path.resolve("layouts"),
  components: path.resolve("components"),
  style: path.resolve("style"),
  script: path.resolve("lib"),
  artData: path.resolve('data/media-art.json'),
  artImport: path.resolve("static/art"),
  artProcessed: path.resolve("dist/media"),
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
        resizeSet: [
          { name: "120p", size: 120},
          { name: "240p", size: 240},
          { name: "480p", size: 480},
          { name: "960p", size: 960},
          { name: "1440p", size: 1440},
        ],
      });
      break;
    case "build:html":
      await buildHtml({
        inputDir: pathing.pages,
        outputDir: pathing.dist,
        partialsDir: pathing.components,
        cacheFile: pathing.pagesCache,
        useCache: true,
        data: {
          title: 'Handlebars Example',
          name: 'John Doe',
          mediaArt: parseJsonFile(pathing.artData),
          headerLinks: [
            { link: "/", title: "Home"},
            { link: "art", title: "Art"},
            { link: "changelog", title: "Changelog"},
            { link: "about", title: "About"},
          ],
        },
      });
      break;
    case "build:assets":
      await buildAssets();
      break;
    case "import:art":
      const skipUnchanged = args[0] && args[0] === "force";
      await readMedia({
        dirPath: pathing.artImport,
        outputFileName: "media-art",
        skipUnchanged: skipUnchanged,
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
          pathing.layouts,
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
        target: [
          pathing.script,
          pathing.style,
        ],
        recursive: true,
        onChange: async (eventType, fileName) => {
          console.log(Color.Red + `'${eventType}' on file '${fileName}'. Rebuilding Assets. `
            + Color.Gray + `(${new Date()})` + Color.Reset);
          await handleCommand("build:assets");
        },
      });
      break;
    case "inspect:art":
      const lines = inspectMediaTable(parseJsonFile(pathing.artData));
      console.log(lines.join("\n"));
      break;
    default:
      console.log(`Unknown command '${command}'`);
  }
}

const [, , command, ...args] = process.argv;
if (command) await handleCommand(command, args);
