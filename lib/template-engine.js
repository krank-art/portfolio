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

  processSlots(html, data) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const { slots, templates } = TemplateEngine.getSlotsAndTemplatesFromHtml(html);
    if (slots.length === 0)
      return html;
    const { templates: slotTemplates } = data;
    for (const slot of slots) {
      // When a data chunk gets flattened and there are multiple slot templates, they get consolidated into one array 
      // under "templates". This array has the corret order of the deepest slot template in the template hierarchy 
      // coming first, thus guaranteeing we always have the correct template when they have the same name (e.g. "default").
      const slotTemplate = slotTemplates ? slotTemplates.find((slotTemplate) => slotTemplate.name === slot.name) : null;
      const slotContent = slotTemplate ? slotTemplate.content : slot.content;
      const slotHtml = (this.handlebars.compile(slotContent))(data);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = slotHtml;
      while (tempDiv.firstChild)
        slot.parentNode.insertBefore(tempDiv.firstChild, slot);
      slot.remove();
    }
    // We don't need templates from the current template, we need 'em from the template that includes this one.
    for (const template of templates)
      template.remove();
    return dom.serialize();
  }

  process(template, data) {
    const processedHtml = this.processSlots(template, data);
    const compiledTemplate = this.handlebars.compile(processedHtml);
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
    const { templates } = TemplateEngine.getSlotsAndTemplatesFromHtml(html);
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

  static htmlHasSlotsOrTemplates(string) {
    return /<(?:slot|template)[^>]*>/.test(string);
  }

  static getSlotsAndTemplatesFromHtml(string) {
    // Optimization so we only construct the JSDOm if we actually have slot or template tag literals.
    if (!TemplateEngine.htmlHasSlotsOrTemplates(string))
      return { slots: [], templates: [] };
    const dom = new JSDOM(string);
    const document = dom.window.document;
    // Get slots
    const slots = document.querySelectorAll('slot');
    const slotData = [];
    for (const slot of slots) {
      const slotName = slot.getAttribute('name') || 'default';
      const slotContent = slot.innerHTML.trim();
      slotData.push({ name: slotName, content: slotContent });
    }
    // Get templates
    const templates = document.querySelectorAll('template');
    const templateData = [];
    for (const template of templates) {
      const templateName = template.getAttribute('for') || 'default';
      const templateContent = template.innerHTML.trim();
      templateData.push({ name: templateName, content: templateContent });
    }
    return { slots: slotData, templates: templateData };
  }


  static getTemplatesFromHtml(string) {
    // Optimization so we only construct the JSDOm if we actually have slot or template tag literals.
    if (!/<template[^>]*>/.test(string))
      return [];
    const dom = new JSDOM(string);
    const document = dom.window.document;
    // Get slots
    const slots = document.querySelectorAll('slot');
    const slotData = [];
    for (const slot of slots) {
      const slotName = slot.getAttribute('name') || 'default';
      const slotContent = slot.innerHTML.trim();
      slotData.push({ name: slotName, content: slotContent });
    }
    // Get templates
    const templates = document.querySelectorAll('template');
    const templateData = [];
    for (const template of templates) {
      const templateName = template.getAttribute('for') || 'default';
      const templateContent = template.innerHTML.trim();
      templateData.push({ name: templateName, content: templateContent });
    }
    return { slots: slotData, templates: templateData };
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
