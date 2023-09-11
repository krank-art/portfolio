import sharp from 'sharp';
import Vibrant from 'node-vibrant';
import path from 'path';
import { makeFirstLetterLowerCase } from './string.js';

async function getMainColorsInImage(imagePath, options = {}) {
  const defaultOptions = {
    resolution: 10,
    maxColors: 5,
  }
  const runOptions = { ...defaultOptions, ...options };
  return await sharp(imagePath)
    .resize(runOptions.resolution, runOptions.resolution)
    .raw()
    .toBuffer()
    .then((buffer) => {
      const pixels = [];
      for (let i = 0; i < buffer.length; i += 3) {
        const r = buffer[i];
        const g = buffer[i + 1];
        const b = buffer[i + 2];
        pixels.push([r, g, b]);
      }

      // Analyze the pixel data to determine main colors
      const colorCounts = {};
      for (const pixel of pixels) {
        const color = pixel.join(',');
        if (colorCounts[color] === undefined)
          colorCounts[color] = 0;
        colorCounts[color] += 1;
      }
      const sortedColors = Object.keys(colorCounts).sort(
        (a, b) => colorCounts[b] - colorCounts[a]
      );
      const mainColors = sortedColors.slice(0, runOptions.maxColors);
      return mainColors;
    })
    .catch((err) => {
      console.error('Error analyzing image:', err);
    });
}

const imagePath = path.resolve("static/art/ayumi color-corrected cropped.png");
console.log(await getMainColorsInImage(imagePath));
//const palette = await Vibrant.from(imagePath).getPalette((err, palette) => console.log(palette));
const palette = await Vibrant.from(imagePath).getPalette();
const colors = {};
for (const color in palette) {
  const prop = makeFirstLetterLowerCase(color);
  colors[prop] = palette[color].hex;
}
console.log(colors);