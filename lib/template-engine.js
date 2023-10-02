import handlebars from 'handlebars';
import { marked } from 'marked';
import { interpolateString } from './string.js';

export default class TemplateEngine {
  constructor() {
    this.handlebars = TemplateEngine.getHandlebars();
    this.layouts = null;
  }

  static getHandlebars() {
    const myHandlebars = handlebars.create();
    myHandlebars.registerHelper('obj', function (string, options) {
      return JSON.parse(string);
    });
    myHandlebars.registerHelper('join', function (array, sep, options) {
      const separator = sep ? sep.hash.sep : '';
      return array.join(separator);
    });
    myHandlebars.registerHelper('markdown', function (string, args, options) {
      // Example: `{{{markdown 'this **awesome** text is #{nice}' args=(obj '{"nice": "good"}') }}}`
      // Ok, not quite sure how hashes work in handlebars, but this is good enough for now.
      const interpolatedString = interpolateString(string, args.hash.args);
      const html = marked(interpolatedString);
      return new myHandlebars.SafeString(html);
    });
    return myHandlebars;
  }
  
  process(template, data) {
    const compiledTemplate = this.handlebars.compile(template);
    return compiledTemplate(data);
  }

  static prepareSfc(input, data, depth = 0) {
    const output = {};
    
    // SFC = Single File Component; hbs file with top level <template>, <style> and <script> tag.
    // Step 1 -- Parse template, style and script from file
    const { html, style, script, module } = input;
    const moduleIsObject = typeof module === 'object' && module !== null;
    const layout = moduleIsObject ? module.layout ?? 'default' : 'default';
    const extendedData = moduleIsObject ? { ...data, ...module.data } : { ...data };
    extendedData.path.relative = "../".repeat(depth);

    // Step 2 -- Prefill output render based on 1-to-1 or 1-to-many SFC type
    const isDynamicSfc = module && module.type && module.type === "dynamic";
    const modelDataByPath = new Map();
    if (isDynamicSfc) {
      const { model: modelName } = module;
      const payload = extendedData[modelName]; // has to be an array of objects, which have an path prop
      if (!payload) console.error(`No data model '${modelName}' could be found. `);
      for (let i = 0; i < payload.length; i++) {
        const item = payload[i];
        const previousItem = payload[i - 1] ?? null;
        const nextItem = payload[i + 1] ?? null;
        output[item.path] = null;
        const modelData = {
          ...item,
          meta: {
            previous: previousItem,
            next: nextItem,
          },
        };
        modelDataByPath.set(item.path, modelData);
      }
    } else {
      output["/"] = null;
    }

    // Step 3 -- Prepare data and everything to be rendered
    for (const path in output) {
      const pathData = isDynamicSfc
        ? { ...extendedData, ...{ modelItem: modelDataByPath.get(path) } }
        : { ...extendedData };
      output[path] = {
        layout: layout,
        template: html,
        data: { style: style, ...pathData },
      }
    }
    return output;
  }
}
