import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { copyAndRenameFilesIfNewer, ensureDirExists, parseJsonFile } from '../lib/filesystem.js';
import { fileURLToPath } from 'url';
import { Color } from '../lib/terminal.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createThumbnail(imagePath, outputPath, sizeInPixel) {
  // https://sharp.pixelplumbing.com/api-resize
  sharp(imagePath)
    .resize({
      width: sizeInPixel,
      height: sizeInPixel,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toFile(outputPath, (err, info) => {
      if (err) {
        console.error('Error creating thumbnail:', err);
      } else {
        //console.log('Thumbnail created successfully.');
        //console.log('Thumbnail dimensions:', info.width, 'x', info.height);
      }
    });
}

async function createThumbnailsForImages(input, output) {
  const files = fs.readdirSync(input);
  ensureDirExists(output + path.sep);
  for (const file of files) {
    const filePath = path.join(input, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory())
      continue;
    if (![".png", ".jpg", ".jpeg"].includes(path.extname(filePath)))
      continue;
    const fileName = path.basename(file);
    const outputFile = path.join(output, fileName);
    await createThumbnail(filePath, outputFile, 240);
  }
}
function getTargetsBySourcesFromMedia(inputDir, outputDir, media) {
  const targetsBySources = new Map();
  const sourcesByTargets = new Map();
  for (const mediaItem of media) {
    const { fileNamePublic, fileNameInternal } = mediaItem;
    const input = path.resolve(inputDir, fileNameInternal);
    const output = path.resolve(outputDir, fileNamePublic);
    if (targetsBySources.has(input))
      console.warn(Color.Red + `File name '${input}' appears twice as SOURCE.` + Color.Reset);
    if (sourcesByTargets.has(output))
      console.warn(Color.Red + `File name '${output}' appears twice as TARGET.` + Color.Reset);
    targetsBySources.set(input, output);
    sourcesByTargets.set(output, input);
  }
  return targetsBySources;
}

function copyMediaIntoDir(inputDir, outputDir, media) {
  const targetsBySources = getTargetsBySourcesFromMedia(inputDir, outputDir, media);
  copyAndRenameFilesIfNewer(targetsBySources);
}

const mediaPaths = {
  mediaInput: path.resolve("static/art"),
  mediaOutput: path.resolve("dist/media"),
  thumbnailsInput: path.resolve("dist/media"),
  thumbnailsOutput: path.resolve("dist/media/thumbnail"),
};

console.log("Copying and renaming images...");
const mediaArt = parseJsonFile(path.join(__dirname, '../data/media-art.json'));
ensureDirExists(mediaPaths.mediaOutput + path.sep);
copyMediaIntoDir(mediaPaths.mediaInput, mediaPaths.mediaOutput, mediaArt);

console.log("Creating thumbnails...");
ensureDirExists(mediaPaths.thumbnailsOutput + path.sep);
await createThumbnailsForImages(mediaPaths.thumbnailsInput, mediaPaths.thumbnailsOutput);
