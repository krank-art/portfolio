import fs from 'fs';
import path from 'path';
import { AsyncQueue, promisify } from './async.js';
import TemplateEngine from './template-engine.js';
import TemplateLoader from './template-loader.js';
import { ensureDirExists } from './filesystem.js';

export default class TemplateWriter {
  constructor() {
    this.handlebars = TemplateEngine.getHandlebars();
  }

  static renderTemplate(input, data, handlebars) {
    const templateSource = fs.readFileSync(input, 'utf8');
    return TemplateWriter.renderHtml(templateSource, data, handlebars);
  }

  static renderHtml(template, data, handlebars) {
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(data);
  }

  static renderTemplateWithLayout(input, layout, data, handlebars) {
    const content = TemplateWriter.renderTemplate(input, data, handlebars);
    const payload = { ...data, content };
    return TemplateWriter.renderTemplate(layout, payload, handlebars);
  }

  static compile(input, output, layout, data) {
    const renderedHtml = TemplateWriter.renderTemplateWithLayout(input, layout, data, handlebars);
    fs.writeFileSync(output, renderedHtml);
    console.log(`Compiled '${input}' to '${output}'. `);
  }

  static compileSfc(input, output, data, depth = 0) {
    const inputSfc = TemplateLoader.readSfc(input);;
    const renderedHtml = TemplateEngine.processSfc(inputSfc, data, depth);
    for (const pagePath in renderedHtml) {
      const html = renderedHtml[pagePath];
      const inputFileName = path.basename(input, path.extname(input));
      const outputFileName = pagePath === "/" ? inputFileName : pagePath;
      const outputFile = path.resolve(output, outputFileName + ".html");
      fs.writeFileSync(outputFile, html);
      console.log(`Compiled SFC '${input}' to '${outputFile}'. `);
    }
  }

  static compileSfcDir(input, output, data, subpath = []) {
    const files = fs.readdirSync(input);
    for (const file of files) {
      const filePath = path.join(input, file);
      const outputName = path.basename(file, path.extname(file)) + ".html";
      const outputPath = path.join(output, ...subpath);
      const outputFile = path.join(outputPath, outputName);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        TemplateWriter.compileSfcDir(filePath, output, data, [...subpath, file])
        continue;
      }
      if (path.extname(filePath) !== ".hbs")
        continue;
      ensureDirExists(outputPath + path.sep);
      TemplateWriter.compileSfc(filePath, outputPath, data, subpath.length);
    }
    //compile('pages/index.hbs', 'dist/template.html', 'layouts/default.hbs', data);
    //renderSfc('pages/index.hbs', data);
  }
}
