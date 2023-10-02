import fs from 'fs';
import path from 'path';
import { ensureDirExists } from '../lib/filesystem.js';
import config from '../config/config.dev.js';
import TemplateEngine from '../lib/template-engine.js';

function compileSfcDir(input, output, data, subpath = []) {
  const files = fs.readdirSync(input);
  for (const file of files) {
    const filePath = path.join(input, file);
    const outputName = path.basename(file, path.extname(file)) + ".html";
    const outputPath = path.join(output, ...subpath);
    const outputFile = path.join(outputPath, outputName);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      compileSfcDir(filePath, output, data, [...subpath, file])
      continue;
    }
    if (path.extname(filePath) !== ".hbs")
      continue;
    ensureDirExists(outputPath + path.sep);
    TemplateEngine.compileSfc(filePath, outputPath, data, subpath.length);
  }
  //compile('pages/index.hbs', 'dist/template.html', 'layouts/default.hbs', data);
  //renderSfc('pages/index.hbs', data);
}

export default function buildHtml({ inputDir, outputDir, data }) {
  compileSfcDir(inputDir, outputDir, {
    ...config,
    ...data,
  });
}
