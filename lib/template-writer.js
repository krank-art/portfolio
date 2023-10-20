import fs from 'fs';
import path from 'path';
import { AsyncQueue, promisify } from './async.js';
import TemplateEngine from './template-engine.js';
import TemplateLoader from './template-loader.js';
import { ensureDirExists } from './filesystem.js';
import { getMd5Checksum } from './crypto.js';
import FileCache from './file-cache.js';

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
    const outputCache = new FileCache();
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
      const oldFileChecksum = buildCache.get(outputFile);
      const newFileChecksum = getMd5Checksum(renderedTemplate);
      outputCache.add([outputFile, newFileChecksum]);
      if (buildCache && oldFileChecksum === newFileChecksum)
          continue;

      // Step 4 -- Write to disk
      fs.writeFileSync(outputFile, renderedTemplate);
      console.log(`Compiled SFC '${input}' to '${outputFile}'. `);
    }
    return outputCache;
  }

  async compileSfcDir({input, output, data, subpath = [], buildCache = undefined}) {
    const files = fs.readdirSync(input);
    const outputCaches = [];
    for (const file of files) {
      const filePath = path.join(input, file);
      const outputName = path.basename(file, path.extname(file)) + ".html";
      const outputPath = path.join(output, ...subpath);
      const outputFile = path.join(outputPath, outputName);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        const childCache = await this.compileSfcDir({
          input: filePath,
          output: output,
          data: data,
          subpath: [...subpath, file],
          buildCache: buildCache,
        });
        outputCaches.push(childCache);
        continue;
      }
      if (path.extname(filePath) !== ".hbs")
        continue;
      ensureDirExists(outputPath + path.sep);
      const outputCache = await this.compileSfc(filePath, outputPath, data, subpath.length, buildCache);
      outputCaches.push(outputCache);
    }
    const combinedCache = new FileCache();
    combinedCache.addCache(...outputCaches);
    return combinedCache;
    //compile('pages/index.hbs', 'dist/template.html', 'layouts/default.hbs', data);
    //renderSfc('pages/index.hbs', data);
  }
}
