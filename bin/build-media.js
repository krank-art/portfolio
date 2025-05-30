import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { ensureDirExists, handleFileIfNewerAsync, parseJsonFile } from '../lib/filesystem.js';
import { Color } from '../lib/terminal.js';

async function resizeImage(imagePath, sizeInPixel) {
  // https://sharp.pixelplumbing.com/api-resize
  const { width, height } = await sharp(imagePath).metadata();
  // When we provide both width and height, the output image will have both sizes.
  // So instead we'll determine the biggest dimension (width OR height) and scale it depending on that.
  // Also we do NOT upscale an image if it is are smaller than the specified resize dimension.
  const resizedWidth = width >= height ? Math.min(sizeInPixel, width) : null;
  const resizedHeight = width < height ? Math.min(sizeInPixel, height) : null;
  return sharp(imagePath)
    .resize({
      width: resizedWidth,
      height: resizedHeight,
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()
    .catch(err => { 
      console.error('Error creating thumbnail:', err);
      throw err;
    });
}

async function cropAndSquareImage(imagePath, sizeInPixel) {
  return sharp(imagePath)
    .resize({
      width: sizeInPixel,
      height: sizeInPixel,
      fit: "cover",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()
    .catch(err => { 
      console.error('Error creating thumbnail:', err);
      throw err;
    });
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

async function processMediaList({ inputDir, outputDir, media, resizeSet = [], transformer = null }) {
  const targetsBySources = getTargetsBySourcesFromMedia(inputDir, outputDir, media);
  let skipCount = 0, processCount = 0;
  for (const [sourcePath, targetPath] of targetsBySources)
    await handleFileIfNewerAsync({
      sourcePath: sourcePath,
      targetPath: targetPath,
      onSkip: (sourcePath) => { skipCount++ },
      onFile: async (sourcePath, targetPath) => {
        processCount++;
        const suffix = resizeSet.length > 0
          ? ` (+ thumbnails ${resizeSet.map(set => set.name).join(", ")})`
          : "";
        console.log(
          `${Color.Green}Copying '${Color.Blue + sourcePath + Color.Green}' to '${targetPath}'${suffix}. ${Color.Reset}`
        );
        fs.copyFileSync(sourcePath, targetPath);
        for (const resizeEntry of resizeSet) {
          const { name, size, method } = resizeEntry;
          const outputBase = path.dirname(targetPath);
          const baseName = path.basename(targetPath);
          const resizedPath = path.join(outputBase, name, baseName);
          ensureDirExists(resizedPath);
          if (![".png", ".jpg", ".jpeg"].includes(path.extname(sourcePath)))
            continue;
          const resizedImageBuffer = method === "squared"
            ? await cropAndSquareImage(sourcePath, size)
            : await resizeImage(sourcePath, size);
          const transformedResizedImage = transformer ? transformer(resizedImageBuffer) : resizedImageBuffer;
          fs.writeFileSync(resizedPath, transformedResizedImage);
        }
      },
    });
  console.log(`Processed ${processCount} images (skipped ${skipCount}). `);
}

export default async function buildMedia({ dataInput, mediaInput, mediaOutput, resizeSet }) {
  const mediaArt = parseJsonFile(dataInput);
  ensureDirExists(mediaOutput + path.sep);
  await processMediaList({
    inputDir: mediaInput,
    outputDir: mediaOutput,
    media: mediaArt,
    resizeSet: resizeSet,
  });
}
