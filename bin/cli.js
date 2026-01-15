import fs from 'fs';
import path from 'path';
import buildMedia from './build-media.js';
import { copyRecursive, deleteDirRecursive, ensureDirExists, parseJsonFile } from '../lib/filesystem.js';
import readMedia from './read-media.js';
import buildHtml from './build-html.js';
import buildAssets from './build-assets.js';
import FileWatcher from '../lib/filewatcher.js';
import { Color } from '../lib/terminal.js';
import { inspectMediaTable } from './inspect-media.js';
import sortMedia from './sort-media.js';
import readTags from './read-tags.js';
import { getTagDefinitionsFromMedia } from '../lib/tag-util.js';
import buildNsfw from './build-nsfw.js';

const pathing = Object.freeze({
  //dist: path.resolve('dist'),
  dist: path.resolve('www/php/public'),
  pages: path.resolve("pages"),
  cache: path.resolve(".cache"),
  pagesCache: path.resolve(".cache/pages.json"),
  layouts: path.resolve("layouts"),
  components: path.resolve("components"),
  style: path.resolve("style"),
  script: path.resolve("lib"),
  artData: path.resolve('data/media-art.json'),
  artTags: path.resolve('data/art-tags.json'),
  artImport: path.resolve("static/art"),
  artProcessed: path.resolve("dist/media/art"),
  nsfwImport: path.resolve("nsfw/static"),
  nsfwInput: path.resolve("nsfw"),
  nsfwOutput: path.resolve("dist/media/nsfw"),
  nsfwData: path.resolve("nsfw/media-nsfw.json"),
});

const resizeSet = [
  { name: "s160p", size: 160, method: "squared" }, // The "s" stands for "square"
  { name: "120p", size: 120 },
  { name: "240p", size: 240 },
  { name: "480p", size: 480 },
  { name: "960p", size: 960 },
  { name: "1440p", size: 1440 },
];

export async function handleCommand(command, ...args) {
  switch (command) {
    case "build":
      await handleCommand("build:assets");
      await handleCommand("build:html");
      await handleCommand("build:art");
      break;
    case "clean":
      deleteDirRecursive(pathing.cache);
      deleteDirRecursive(pathing.dist);
      break;
    case "build:art":
      await buildMedia({
        dataInput: pathing.artData,
        mediaInput: pathing.artImport,
        mediaOutput: pathing.artProcessed,
        resizeSet: resizeSet,
      });
      break;
    case "build:html":
      const skippedHtmlFiles = args[0] ? args[0].split(",") : [];
      const mediaArtBuildHtml = parseJsonFile(pathing.artData);
      const mediaArtByPath = {};
      mediaArtBuildHtml.forEach(entry => mediaArtByPath[entry.path] = entry);
      const mediaNsfw = fs.existsSync(pathing.nsfwData) ? parseJsonFile(pathing.nsfwData) : null;
      if (mediaNsfw === null ) console.warn('Could not read data for NSFW entries. Check if submodule exists. ');
      await buildHtml({
        inputDir: pathing.pages,
        outputDir: pathing.dist,
        partialsDir: pathing.components,
        cacheFile: pathing.pagesCache,
        ignoredFiles: skippedHtmlFiles,
        data: {
          title: 'Handlebars Example',
          name: 'John Doe',
          mediaArt: mediaArtBuildHtml,
          mediaNsfw: mediaNsfw,
          mediaArtByPath,
          tagsArt: getTagDefinitionsFromMedia(mediaArtBuildHtml, 1),
          headerLinks: [
            { link: "/", title: "Home" },
            { link: "/art", title: "Art" },
            { link: "/blog", title: "Blog" },
            { link: "/about", title: "About" },
          ],
          footerLinks: [
            { link: "/", title: "Home" },
            { link: "/art", title: "Art" },
            { link: "/blog", title: "Blog" },
            { link: "/about", title: "About" },
            { link: "/changelog", title: "Changelog" },
            { link: "/sitemap", title: "Sitemap" },
            { link: "/admin/", title: "Admin" },
          ],
          resizeSet: resizeSet,
          currentYear: new Date().getFullYear(),
        },
      });
      break;
    case "build:assets":
      await buildAssets({ outputDir: pathing.dist });
      break;
    case "import:art":
      const updateAllMediaImport = args[0] && args[0] === "force";
      await readMedia({
        mediaDir: pathing.artImport,
        dataPath: pathing.artData,
        skipUnchanged: !updateAllMediaImport,
      });
      break;
    case "import:nsfw":
      const updateAllNsfwImport = args[0] && args[0] === "force";
      await readMedia({
        mediaDir: pathing.nsfwImport,
        dataPath: pathing.nsfwData,
        skipUnchanged: !updateAllNsfwImport,
        isEncrypted: true,
      });
      break;
    case "watch":
      await handleCommand("watch:assets");
      await handleCommand("watch:html", ...args);
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
          pathing.components,
          pathing.artData,
        ],
        recursive: true,
        onChange: async (eventType, fileName) => {
          console.log(Color.Orange + `'${eventType}' on file '${fileName}'. Rebuilding HTML. `
            + Color.Gray + `(${new Date()})` + Color.Reset);
          await handleCommand("build:html", ...args);
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
    case "sort:art":
      await sortMedia(pathing.artData, args[0] ?? 'name');
      break;
    case "tags:art":
      await readTags(pathing.artData, pathing.artTags, "/art/");
      break;
    case "build:nsfw":
      await buildNsfw({
        nsfwDir: pathing.nsfwInput,
        outputDir: pathing.nsfwOutput,
        resizeSet: null,
      });
      break;
    case "build:png":
      createTestPNG();
      break;
    case "dev:copy:php":
      const phpDevServerTarget = path.resolve("www/php/public");
      ensureDirExists(phpDevServerTarget);
      await copyRecursive(path.resolve("dist"), phpDevServerTarget);
      break;
    default:
      console.log(`Unknown command '${command}'`);
  }
}

const [, , command, ...args] = process.argv;
if (command) await handleCommand(command, ...args);
