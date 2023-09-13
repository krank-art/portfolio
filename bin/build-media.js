import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { copyIfNewer, ensureDirExists } from '../lib/filesystem.js';

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

copyIfNewer(path.resolve("static/art"), path.resolve("dist/media"));
console.log("Creating thumbnails...");
await createThumbnailsForImages(path.resolve("static/art"), path.resolve("dist/media/thumbnail"));
