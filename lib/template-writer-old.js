import fs from 'fs';
import path from 'path';
import TemplateEngine from './template-engine.js';
import TemplateLoader from './template-loader.js';
import { ensureDirExists } from './filesystem.js';
import { getMd5Checksum } from './crypto.js';
import FileCache from './file-cache.js';
import { interpolateString } from './string.js';

export default class TemplateWriterOld {
  constructor({ partialsDir = undefined }) {
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

  async renderLayoutSfc(layoutName, data, defaultLayout = "default") {
    const layoutPath = path.join("layouts", layoutName + ".hbs");
    const inputSfc = TemplateLoader.readSfc(layoutPath);
    const pageByPath = await TemplateEngine.prepareSfc(inputSfc, data, defaultLayout);
    const compiledPage = pageByPath["/"];
    const { layout, template, data: templateData } = compiledPage;
    const renderedHtml = this.engine.process(template, templateData);
    if (!layout || layout === layoutName)
      return renderedHtml;
    return await this.renderLayoutSfc(layout, { ...templateData, content: renderedHtml });
  }

  compileFile(input, output, layout, data) {
    const renderedHtml = this.renderTemplateWithLayout(input, layout, data);
    fs.writeFileSync(output, renderedHtml);
    console.log(`Compiled '${input}' to '${output}'. `);
  }

  async compileSfc(input, output, data, buildCache = null) {
    const outputCache = new FileCache();
    const inputSfc = TemplateLoader.readSfc(input);
    const pageByPath = await TemplateEngine.prepareSfc(inputSfc, data);
    for (const pagePath in pageByPath) {
      // Step 1 -- Generate html
      const payload = pageByPath[pagePath];
      const renderedHtml = this.engine.process(payload.template, payload.data);
      const layoutData = { content: renderedHtml, ...payload.data };
      const renderedTemplate = await this.renderLayoutSfc(payload.layout, layoutData);

      // Step 2 -- Get output file name
      const inputFileName = path.basename(input, path.extname(input));
      const outputFileName = pagePath === "/" ? inputFileName : pagePath;
      const outputFile = path.resolve(output, outputFileName + ".html");

      // Step 3 -- Check build cache (we want to only write CHANGES to disk)
      const oldFileChecksum = buildCache.get(outputFile);
      const newFileChecksum = getMd5Checksum(renderedTemplate);
      outputCache.add([outputFile, newFileChecksum]);
      if (buildCache && oldFileChecksum === newFileChecksum && fs.existsSync(outputFile))
        continue;

      // Step 4 -- Write to disk
      fs.writeFileSync(outputFile, renderedTemplate);
      console.log(`Compiled SFC '${input}' to '${outputFile}'. `);
    }
    return outputCache;
  }

  async compileMarkdown({ input, output, data, buildCache = null, defaultLayout = "blog", middleware = [] }) {
    // Step 1 -- Read markdown
    const outputCache = new FileCache();
    const inputMarkdown = TemplateLoader.readMarkdown(input);
    const { yaml, html: template, markdown, title: rawtitle } = inputMarkdown;

    // Step 2 -- Process markdown
    const title = interpolateString(data.titleTemplate, { title: rawtitle });
    const layout = yaml?.layout ?? defaultLayout;
    const extendedData = { ...data, title };
    const renderedHtml = this.engine.process(template, extendedData);
    const layoutData = { content: renderedHtml, ...extendedData };
    const renderedTemplate = await this.renderLayoutSfc(layout, layoutData, defaultLayout);
    const finalTemplate = middleware.length > 0
      ? middleware.reduce((result, currentFunction) => currentFunction(result), renderedTemplate)
      : renderedTemplate;
    const inputFileName = path.basename(input, path.extname(input));
    const outputFile = path.resolve(output, inputFileName + ".html");

    // Step 3 -- Check build cache (we want to only write CHANGES to disk)
    const oldFileChecksum = buildCache.get(outputFile);
    const newFileChecksum = getMd5Checksum(finalTemplate);
    outputCache.add([outputFile, newFileChecksum]);
    if (buildCache && oldFileChecksum === newFileChecksum && fs.existsSync(outputFile))
      return outputCache;

    // Step 4 -- Write to disk
    fs.writeFileSync(outputFile, finalTemplate);
    console.log(`Compiled Markdown '${input}' to '${outputFile}'. `);
    return outputCache;
  }

  async compileDir({ input, output, data, subpath = [], buildCache = undefined }) {
    const files = fs.readdirSync(input);
    const outputCaches = [];
    for (const file of files) {
      const filePath = path.join(input, file);
      const extension = path.extname(filePath);
      const basename = path.basename(file, extension);
      const outputName = basename + ".html";
      const outputPath = path.join(output, ...subpath);
      const outputFile = path.join(outputPath, outputName);
      const stats = fs.statSync(filePath);
      // TODO: If necessary, we should clone this object so side effects do not spread from one rendering action to the next.
      const newData = data;
      newData.path.relative = "../".repeat(subpath.length);
      newData.path.absolute = [...subpath, basename].join("/"); // does not handle dynamic SFC names yet
      if (stats.isDirectory()) {
        const childCache = await this.compileDir({
          input: filePath,
          output: output,
          data: newData,
          subpath: [...subpath, file],
          buildCache: buildCache,
        });
        outputCaches.push(childCache);
        continue;
      }
      if (extension === ".md") {
        const markdownOutput = path.join(output, ...subpath);
        ensureDirExists(markdownOutput + path.sep);
        const markdownCache = await this.compileMarkdown({
          input: filePath,
          output: markdownOutput,
          data: newData,
          buildCache: buildCache,
          middleware: [
            (rawHtml) => TemplateEngine.addAnchorsToHeadings(rawHtml),
          ],
        });
        outputCaches.push(markdownCache);
        continue;
      }
      if (extension !== ".hbs")
        continue;
      ensureDirExists(outputPath + path.sep);
      const outputCache = await this.compileSfc(filePath, outputPath, newData, buildCache);
      outputCaches.push(outputCache);
    }
    const combinedCache = new FileCache();
    combinedCache.addCache(...outputCaches);
    return combinedCache;
    //compile('pages/index.hbs', 'dist/template.html', 'layouts/default.hbs', data);
    //renderSfc('pages/index.hbs', data);
  }
}
