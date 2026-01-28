import fs from 'fs';
import path from 'path';
import { AsyncQueue, promisify } from './async.js';
import TemplateEngine from './template-engine.js';
import TemplateLoader from './template-loader.js';
import { ensureDirExists } from './filesystem.js';
import { getMd5Checksum } from './encrypto.js';
import FileCache from './file-cache.js';
import { interpolateString } from './string.js';
import { DataChunk } from './data-chunk.js';
import { SimpleProfiler } from './profiling.js';

export default class TemplateWriter {
  constructor({ partialsDir = undefined, layoutsDir = "layouts", profiler = null }) {
    this.partialsDir = partialsDir;
    this.layoutsDir = layoutsDir;
    this.engine = null;
    this.queue = [];
    this.layouts = new Map();
    this.profiler = profiler;
  }

  async load() {
    const partials = this.partialsDir
      ? await TemplateLoader.readPartialsInDir(this.partialsDir)
      : [];
    this.engine = new TemplateEngine({
      partials: partials,
    });
    this.loadLayouts();
  }

  loadLayouts() {
    const layoutEntries = fs.readdirSync(this.layoutsDir);
    for (const file of layoutEntries) {
      const filePath = path.join(this.layoutsDir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) continue;
      if (path.extname(file) !== '.hbs') continue;
      const basename = path.basename(file, ".hbs");
      const content = fs.readFileSync(filePath, { encoding: "utf8" });
      this.layouts.set(basename, content);
    }
  }

  async executeFile(filePath, dataChunk) {
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    const extension = path.extname(filePath);
    return await this.executeEntry(content, extension, dataChunk);
  }

  async executeEntry(source, extension, dataChunk) {
    if (extension === ".md") {
      const inputMarkdown = TemplateLoader.parseMarkdown(source);
      const { yaml, title: markdownTitle } = inputMarkdown;
      // Title gets overwritten if also specified in YAML because destructuring order.
      return { title: markdownTitle, ...yaml }; 
    }
    if (extension === ".hbs") {
      const inputSfc = TemplateLoader.parseSfc(source);
      const preparedSfc = await TemplateEngine.prepareSfc({
        html: inputSfc.html,
        style: inputSfc.style,
        script: inputSfc.script,
        dataChunk: dataChunk,
        dataSliceName: "module",
        profiler: this.profiler,
      });
      return preparedSfc.dataChunk.flatten();
    }
    throw new Error(`Unsupported entry type '${extension}'`);
  }

  async compileSfc({ input, dataChunk, previousLayout = null }) {
    const inputSfc = TemplateLoader.parseSfc(input);
    const preparedSfc = await TemplateEngine.prepareSfc({
      html: inputSfc.html,
      style: inputSfc.style,
      script: inputSfc.script,
      dataChunk: dataChunk,
      dataSliceName: "module",
      profiler: this.profiler,
    });
    const { html, style, layout, dataChunk: preparedDataChunk } = preparedSfc;
    if (layout === previousLayout)
      throw new Error(`Aborting because endless layout loop '${layout}'`);
    const currentLayout = layout;
    // Compile template content for slots, otherwise when we do it later the context (provided data) is wrong.
    const slotsSlice = preparedDataChunk.getSlice("slots")?.payload;
    if (slotsSlice)
      for (const template of slotsSlice.templates)
        template.content = this.engine.process(template.content, preparedDataChunk.flatten());
    // You HAVE to provide a layout for all pages, even if it's the default layout.
    // The benefit with this approach is, that virtually any SFC (page or not) can have a layout.
    // Probably should be renamed to "extends" and not "layout".
    const renderedHtml = this.engine.process(html, preparedDataChunk.flatten());
    if (!layout)
      return renderedHtml;
    preparedDataChunk.addPayload("sfc", { content: renderedHtml, style });
    const layoutRaw = this.layouts.get(layout);
    if (!layoutRaw)
      throw new Error(`Unknown layout '${layout}' in SFC. `);
    return await this.compileSfc({
      input: layoutRaw,
      dataChunk: preparedDataChunk,
      previousLayout: currentLayout,
    });
  }

  async compileMarkdown({ input, dataChunk, defaultLayout = "blog", middleware = [] }) {
    const inputMarkdown = TemplateLoader.parseMarkdown(input);
    const { yaml, html: template, markdown, title: rawtitle } = inputMarkdown;
    const titleFormat = dataChunk.flatten().titleTemplate;
    const title = titleFormat ? interpolateString(titleFormat, { title: rawtitle }) : rawtitle;
    const preparedDataChunk = dataChunk.duplicate();
    preparedDataChunk.addPayload("md-title", { title, pageTitle: title });
    const renderedHtml = this.engine.process(template, preparedDataChunk.flatten());
    preparedDataChunk.addPayload("md-sfc", { ...yaml, content: renderedHtml });
    // Markdown documents have an optional default layout
    const layout = yaml?.layout ?? defaultLayout;
    const layoutRaw = this.layouts.get(layout);
    if (!layoutRaw)
      throw new Error(`Unknown layout '${layout}' in Markdown document. `);
    const renderedTemplate = await this.compileSfc({
      input: layoutRaw,
      dataChunk: preparedDataChunk,
    });
    return middleware.length > 0
      ? middleware.reduce((result, currentFunction) => currentFunction(result), renderedTemplate)
      : renderedTemplate;
  }

  /**
   * @param {Object} options
   * @param {string} options.source SFC string input
   * @param {string} options.target file path output
   * @param {string} options.extension
   * @param {DataChunk} options.dataChunk
   * @param {string} [options.checksum] MD5 hash
   * @param {boolean} [options.silent]
   * @returns {string} MD5 hash
   */
  async writeEntry({ source, target, extension, dataChunk, checksum = undefined, silent = false }) {
    const html = await this.compileEntry(source, extension, dataChunk);
    const htmlChecksum = getMd5Checksum(html);
    // Do not write to file if checksum is provided AND it is the same as the previous run.
    if (htmlChecksum === checksum)
      return htmlChecksum;
    fs.writeFileSync(target, html);
    if (!silent)
      console.log(`Compiled ${extension} file to '${target}'. `);
    return htmlChecksum;
  }

  /**
   * 
   * @param {object} options 
   * @param {import('./dir-tree.js').PageChunk[]} options.queue 
   * @param {string} options.output
   * @param {string} [options.cachePath] path to cache file
   * @param {boolean} [options.silent] 
  */
  async readAndWriteQueue({ queue, output, cachePath = null, silent = false, profiler = null }) {
    const entryCache = new FileCache();
    const outputCache = new FileCache();
    if (cachePath) entryCache.loadSafely(cachePath);
    for (const entry of queue) {
      // Read in input
      const { page, chunk } = entry;
      const { source: inputPath, absolutePath: pagePath, type: pageType} = page;
      if (pageType !== "page") continue;
      //if (pagePath !== "art/kageki-creampie")
      //  continue;
      const input = fs.readFileSync(inputPath, { encoding: "utf8" });
      // Compile file
      const extension = path.extname(inputPath);
      let html = "";
      try {
        profiler?.start("compileEntry()");
        html = await this.compileEntry(input, extension, chunk, profiler);
        profiler?.stop("compileEntry()");
      } catch (error) {
        console.error(page.absolutePath); // problems with circular references
        throw error;
      }

      // TODO: fix memory getting higher and higher with more pages

      // Write output (when using caching, only write when changed)
      const outputPath = path.join(output, ...pagePath.split("/")) + ".html";
      if (cachePath) {
        const oldFileChecksum = entryCache.get(outputPath);
        const newFileChecksum = getMd5Checksum(html);
        outputCache.add([outputPath, newFileChecksum]);
        if (oldFileChecksum === newFileChecksum && fs.existsSync(outputPath))
          continue;
      }
      ensureDirExists(outputPath);
      fs.writeFileSync(outputPath, html);
      if (!silent)
        console.log(`Compiled '${inputPath}' to '${outputPath}'. `);
    }
    if (cachePath) {
      outputCache.flush(cachePath);
      const entryCacheString = JSON.stringify(entryCache.flatten());
      const outputCacheString = JSON.stringify(outputCache.flatten());
      if ((entryCacheString === outputCacheString) && !silent)
        console.log("No changes detected in generated HTML. ");
    }
  }

  /**
   * @param {string} source template string of SFC, markdown document, etc.
   * @param {string} extension determines how to handle the specified template string
   * @param {DataChunk} dataChunk data that gets inserted into the template string
   * @param {SimpleProfiler} profiler optional; profiler to measure time
   * @returns {string} HTML string
   */
  async compileEntry(source, extension, dataChunk, profiler = null) {
    profiler?.start("dataChunk duplication");
    const duplicatedChunk = dataChunk.duplicate(); // duplicate to prevent side effects
    profiler?.stop("dataChunk duplication");
    if (extension === ".md") {
      profiler?.start("  compileMarkdown()");
      const markdownResult = await this.compileMarkdown({
        input: source,
        dataChunk: duplicatedChunk,
        middleware: [
          (rawHtml) => TemplateEngine.addAnchorsToHeadings(rawHtml),
        ],
      });
      profiler?.stop("  compileMarkdown()");
      return markdownResult;
    }
    if (extension === ".hbs") {
      profiler?.start("  compileSfc()");
      const handlebarsResult = await this.compileSfc({
        input: source,
        dataChunk: duplicatedChunk,
      });
      profiler?.stop("  compileSfc()");
      return handlebarsResult;
    }
    throw new Error(`Unsupported entry type '${extension}'`);
  }
}
