import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { copyAndRenameFilesIfNewer, copyFileIfNewer, ensureDirExists, parseJsonFile } from '../lib/filesystem.js';
import { Color } from '../lib/terminal.js';

async function createThumbnail(imagePath, outputPath, sizeInPixel) {
  // https://sharp.pixelplumbing.com/api-resize
  const { width, height } = await sharp(imagePath).metadata();
  // When we provide both width and height, the output image will have both sizes.
  // So instead we'll determine the biggest dimension (width OR height) and scale it depending on that.
  const resizedWidth = width >= height ? sizeInPixel : null;
  const resizedHeight = width < height ? sizeInPixel : null;
  sharp(imagePath)
    .resize({
      width: resizedWidth,
      height: resizedHeight,
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
  for (const [sourcePath, targetPath] of targetsBySources)
    copyFileIfNewer(sourcePath, targetPath, false);
}

export default async function buildMedia({dataInput, mediaInput, mediaOutput, thumbnailsInput, thumbnailsOutput}) {
  console.log("Copying and renaming images...");
  const mediaArt = parseJsonFile(dataInput);
  ensureDirExists(mediaOutput + path.sep);
  copyMediaIntoDir(mediaInput, mediaOutput, mediaArt);

  console.log("Creating thumbnails...");
  ensureDirExists(thumbnailsOutput + path.sep);
  await createThumbnailsForImages(thumbnailsInput, thumbnailsOutput);
}
