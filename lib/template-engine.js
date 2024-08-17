import handlebars from 'handlebars';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import { interpolateString, simplifyBytes } from './string.js';
import { executeModule } from './virtual-machine.js';
import { createHeadingTreeWithUniqueIds } from './document.js';
import { DataChunk } from './data-chunk.js';

export default class TemplateEngine {
  constructor(config = {}) {
    const defaultConfig = {
      partials: [],
    };
    const formattedConfig = { ...defaultConfig, ...config };
    this.handlebars = TemplateEngine.getHandlebars({
      partials: formattedConfig.partials,
    });
    this.layouts = null;
  }

  static getHandlebars({ partials = [] }) {
    const myHandlebars = handlebars.create();
    TemplateEngine.registerHelpers(myHandlebars);
    if (partials && partials.length > 0)
      TemplateEngine.registerPartials(myHandlebars, partials);
    return myHandlebars;
  }

  static registerHelpers(myHandlebars) {
    myHandlebars.registerHelper('eq', function (expressionA, expressionB, options) {
      return expressionA == expressionB;
    });
    myHandlebars.registerHelper('when', function (expression, ifTrue, ifFalse, options) {
      return !!expression ? ifTrue : ifFalse;
    });
    myHandlebars.registerHelper('obj', function (string, options) {
      return JSON.parse(string);
    });
    myHandlebars.registerHelper('join', function (array, sep, options) {
      const separator = typeof sep === "object" ? "" : sep;
      return array.join(separator);
    });
    myHandlebars.registerHelper('markdown', function (string, args, options) {
      // Example: `{{{markdown 'this **awesome** text is #{nice}' args=(obj '{"nice": "good"}') }}}`
      // Ok, not quite sure how hashes work in handlebars, but this is good enough for now.
      const interpolatedString = interpolateString(string, args.hash.args);
      const html = marked(interpolatedString);
      return new myHandlebars.SafeString(html);
    });
    myHandlebars.registerHelper('filesize', function (string, options) {
      return simplifyBytes(string);
    });
    myHandlebars.registerHelper('fallback', function (object, fallback, options) {
      return object ? object : fallback;
    });
    myHandlebars.registerHelper('hasItems', function (array, options) {
      return Array.isArray(array) && array.length > 0;
    });
  }

  static registerPartials(myHandlebars, partials) {
    const partialsById = new Map();
    for (const partial of partials) {
      const { id, source, template, data } = partial;
      const knownPartial = partialsById.get(id);
      if (knownPartial) {
        console.warn(`There already is a registered partial '${id}' (${knownPartial.source}). Skipping partial '${source}'. `);
        continue;
      }
      partialsById.set(id, partial);
      myHandlebars.registerPartial(id, template);
      //TODO: Handle partial data
    }
  }

  process(template, data) {
    const compiledTemplate = this.handlebars.compile(template);
    return compiledTemplate(data);
  }

  static getSfcModel(rawSfc) {
    const { html, style, script } = rawSfc;
    const modelRegex = /export default {[\s\S]*model:\s*"(.*)"[\s\S]*}/;
    const match = script.match(modelRegex);
    return match ? match[1] : null;
  }

  static getSfcLinkTitle(rawSfc) {
    const { html, style, script } = rawSfc;
    const modelRegex = /export default {[\s\S]*linkTitle:\s*"(.*)"[\s\S]*}/;
    const match = script.match(modelRegex);
    return match ? match[1] : null;
  }

  /**
   * @typedef {Object} PreparedSfc
   * @property {string} html
   * @property {string} style
   * @property {string} script
   * @property {string} layout
   * @property {DataChunk} dataChunk
   */

  /**
   * 
   * @param {object} options
   * @param {string} options.html
   * @param {string} options.style
   * @param {string} options.script
   * @param {DataChunk} options.dataChunk
   * @param {string} [options.defaultLayout]
   * @param {string} [options.dataSliceName]
   * @returns {PreparedSfc}
   */
  static async prepareSfc({ html, style, script, dataChunk, dataSliceName = "module" }) {
    // SFC = Single File Component; hbs file with top level <template>, <style> and <script> tag.
    // Step 1 -- Parse template, style and script from file
    const flattenedData = dataChunk.flatten();
    const module = await executeModule(script, flattenedData); // TODO: Provide context
    const layout = module?.layout;
    const newData = dataChunk.duplicate();
    newData.addPayload(dataSliceName, module);
    return {
      html: html,
      style: style,
      script: script,
      layout: layout,
      dataChunk: newData,
    };
  }

  static addAnchorsToHeadings(rawHtml) {
    const dom = new JSDOM(rawHtml);
    const document = dom.window.document;
    const blogContainer = document.querySelector('.container-blog');
    if (!blogContainer) return rawHtml;
    const headingTree = createHeadingTreeWithUniqueIds(blogContainer);
    const addAnchorToHeading = (heading) => {
      const { type, level, id, element, children } = heading;
      for (const child of children)
        addAnchorToHeading(child);
      if (type !== "heading") return;
      if (level < 2) return;
      const anchor = document.createElement("a");
      anchor.classList.add("blog-heading-anchor");
      anchor.href = "#" + id;
      anchor.textContent = "#";
      element.id = id;
      element.appendChild(anchor);
    };
    for (const node of headingTree)
      addAnchorToHeading(node);
    return dom.serialize();
  }
}
