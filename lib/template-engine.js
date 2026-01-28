import handlebars from 'handlebars';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import crypto from "node:crypto";
import { interpolateString, simplifyBytes } from './string.js';
import { executeModule } from './virtual-machine.js';
import { createHeadingTreeWithUniqueIds } from './document.js';
import { DataChunk } from './data-chunk.js';
import { SimpleProfiler } from './profiling.js';

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
    this.templateCache = new Map();
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

  processSlots(html, data) {
    // Optimization so we only construct the JSDOm if we actually have slot or template tag literals.
    if (!/<(?:slot|template)[^>]*>/.test(html))
      return html;
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const { templates: slotTemplates } = data;
    const slots = document.querySelectorAll('slot');
    for (const slot of slots) {
      const slotName = slot.getAttribute('name') || 'default';
      const slotContent = TemplateEngine.unescapeTemplate(slot.innerHTML.trim());
      // When a data chunk gets flattened and there are multiple slot templates, they get consolidated into one array 
      // under "templates". This array has the corret order of the deepest slot template in the template hierarchy 
      // coming first, thus guaranteeing we always have the correct template when they have the same name (e.g. "default").
      const slotTemplate = slotTemplates ? slotTemplates.find((slotTemplate) => slotTemplate.name === slotName) : null;
      const insertedContent = slotTemplate ? slotTemplate.content : slotContent;
      const slotHtml = (this.compileCached(insertedContent))(data);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = slotHtml;
      while (tempDiv.firstChild)
        slot.parentNode.insertBefore(tempDiv.firstChild, slot);
      slot.remove();
    }
    // We don't need templates from the current template, we need 'em from the template that includes this one.
    const templates = document.querySelectorAll('template');
    for (const template of templates)
      template.remove();
    const output = document.body.innerHTML;
    // JSDOM escapes '{{> partialName }}' to '{{&gt; partialName }}' ugh.
    return TemplateEngine.unescapeTemplate(output); 
  }

  process(template, data) {
    const processedHtml = this.processSlots(template, data);
    const compiledTemplate = this.compileCached(processedHtml);
    return compiledTemplate(data);
  }

  hashTemplate(source) {
    return crypto.createHash("sha1").update(source).digest("hex");
  }

  compileCached(source) {
    const key = this.hashTemplate(source);
    const cachedCompilation = this.templateCache.get(key);
    if (cachedCompilation !== undefined) return cachedCompilation;
    const freshCompilation = this.handlebars.compile(source);
    this.templateCache.set(key, freshCompilation);
    return freshCompilation
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
   * @param {SimpleProfiler} [options.profiler]
   * @returns {PreparedSfc}
   */
  static async prepareSfc({ html, style, script, dataChunk, dataSliceName = "module", profiler = null }) {
    // SFC = Single File Component; hbs file with top level <template>, <style> and <script> tag.
    // Step 1 -- Parse template, style and script from file
    const flattenedData = dataChunk.flatten();
    profiler?.start("executeModule");
    const module = await executeModule(script, flattenedData); // TODO: Provide context
    profiler?.stop("executeModule");
    const layout = module?.layout;
    profiler?.start("dataChunk duplication 2");
    const newData = dataChunk.duplicate();
    profiler?.stop("dataChunk duplication 2");
    newData.addPayload(dataSliceName, module);
    const templates = TemplateEngine.getTemplatesFromHtml(html);
    if (templates.length > 0) 
      newData.addPayload("slots", { templates });
    return {
      html: html,
      style: style,
      script: script,
      layout: layout,
      dataChunk: newData,
    };
  }

  static unescapeTemplate(string) {
    return string.replaceAll("{{&gt;", "{{>")
  }

  static getTemplatesFromHtml(string, data) {
    // Optimization so we only construct the JSDOm if we actually have slot or template tag literals.
    if (!/<template[^>]*>/.test(string))
      return [];
    const dom = new JSDOM(string);
    const document = dom.window.document;
    const templates = document.querySelectorAll('template');
    const templateData = [];
    for (const template of templates) {
      const templateName = template.getAttribute('for') || 'default';
      const templateContent = TemplateEngine.unescapeTemplate(template.innerHTML.trim());
      //const renderedContent = (this.engine.compile(templateContent))(data);
      //templateData.push({ name: templateName, content: renderedContent });
      templateData.push({ name: templateName, content: templateContent });
    }
    return templateData;
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
