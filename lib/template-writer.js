import fs from 'fs';
import path from 'path';
import { AsyncQueue, promisify } from './async.js';
import TemplateEngine from './template-engine.js';
import TemplateLoader from './template-loader.js';
import { ensureDirExists } from './filesystem.js';
import { getMd5Checksum } from './crypto.js';

export default class TemplateWriter {
  constructor({partialsDir = undefined}) {
    this.partialsDir = partialsDir;
    this.engine = null;
  }

  async load() {
    const partials = this.partialsDir 
      ? await TemplateLoader.readPartialsInDir(this.partialsDir)
      : [];
    this.engine = new TemplateEngine({
      partials: partials,
    });
  }

  renderTemplate(input, data) {
    const templateSource = fs.readFileSync(input, 'utf8');
    return this.engine.process(templateSource, data);
  }

  renderTemplateWithLayout(input, layout, data) {
    const content = this.renderTemplate(input, data);
    const payload = { ...data, content };
    return this.renderTemplate(layout, payload);
  }

  compile(input, output, layout, data) {
    const renderedHtml = this.renderTemplateWithLayout(input, layout, data);
    fs.writeFileSync(output, renderedHtml);
    console.log(`Compiled '${input}' to '${output}'. `);
  }

  async compileSfc(input, output, data, depth = 0, buildCache = null) {
    const outputChecksums = {};
    const inputSfc = TemplateLoader.readSfc(input);
    const pageByPath = await TemplateEngine.prepareSfc(inputSfc, data, depth);
    for (const pagePath in pageByPath) {
      // Step 1 -- Generate html
      const payload = pageByPath[pagePath];
      const renderedHtml = this.engine.process(payload.template, payload.data);
      const layoutData = { content: renderedHtml, ...payload.data };
      const renderedTemplate = this.renderTemplate(`layouts/${payload.layout}.hbs`, layoutData);

      // Step 2 -- Get output file name
      const inputFileName = path.basename(input, path.extname(input));
      const outputFileName = pagePath === "/" ? inputFileName : pagePath;
      const outputFile = path.resolve(output, outputFileName + ".html");

      // Step 3 -- Check build cache (we want to only write CHANGES to disk)
      const newFileChecksum = getMd5Checksum(renderedTemplate);
      outputChecksums[outputFile] = newFileChecksum;
      const cacheEntry = buildCache ? buildCache[outputFile] : null;
      if (cacheEntry) {
        const {checksum: oldFileChecksum} = cacheEntry;
        if (oldFileChecksum === newFileChecksum) 
          continue;
      }

      // Step 4 -- Write to disk
      fs.writeFileSync(outputFile, renderedTemplate);
      console.log(`Compiled SFC '${input}' to '${outputFile}'. `);
    }
    return outputChecksums;
  }

  async compileSfcDir({input, output, data, subpath = [], buildCache = undefined}) {
    const files = fs.readdirSync(input);
    const checksums = [];
    for (const file of files) {
      const filePath = path.join(input, file);
      const outputName = path.basename(file, path.extname(file)) + ".html";
      const outputPath = path.join(output, ...subpath);
      const outputFile = path.join(outputPath, outputName);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        await this.compileSfcDir({
          input: filePath,
          output: output,
          data: data,
          subpath: [...subpath, file],
          buildCache: buildCache,
        });
        continue;
      }
      if (path.extname(filePath) !== ".hbs")
        continue;
      ensureDirExists(outputPath + path.sep);
      const outputChecksums = await this.compileSfc(filePath, outputPath, data, subpath.length, buildCache);
      checksums.push(outputChecksums);
    }
    return checksums.reduce((accumulator, currentObject) => {
      return { ...accumulator, ...currentObject };
    }, {});
    //compile('pages/index.hbs', 'dist/template.html', 'layouts/default.hbs', data);
    //renderSfc('pages/index.hbs', data);
  }
}
