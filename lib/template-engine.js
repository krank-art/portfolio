import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { marked } from 'marked';
import { interpolateString } from './string.js';
import TemplateLoader from './template-loader.js';

export default class TemplateEngine {
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


  static renderHtml(template, data, handlebars) {
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(data);
  }

  static renderTemplate(input, data, handlebars) {
    const templateSource = fs.readFileSync(input, 'utf8');
    return TemplateEngine.renderHtml(templateSource, data, handlebars);
  }

  static renderTemplateWithLayout(input, layout, data, handlebars) {
    const content = TemplateEngine.renderTemplate(input, data, handlebars);
    const payload = { ...data, content };
    return TemplateEngine.renderTemplate(layout, payload, handlebars);
  }

  static compile(input, output, layout, data, handlebars) {
    const renderedHtml = TemplateEngine.renderTemplateWithLayout(input, layout, data, handlebars);
    fs.writeFileSync(output, renderedHtml);
    console.log(`Compiled '${input}' to '${output}'. `);
  }

  static compileSfc(input, output, data, depth = 0) {
    const renderedHtml = TemplateEngine.renderSfc(input, data, depth);
    for (const pagePath in renderedHtml) {
      const html = renderedHtml[pagePath];
      const inputFileName = path.basename(input, path.extname(input));
      const outputFileName = pagePath === "/" ? inputFileName : pagePath;
      const outputFile = path.resolve(output, outputFileName + ".html");
      fs.writeFileSync(outputFile, html);
      console.log(`Compiled SFC '${input}' to '${outputFile}'. `);
    }
  }

  static renderSfc(input, data, depth = 0) {
    // SFC = Single File Component; hbs file with top level <template>, <style> and <script> tag.
    const output = {};

    // Step 1 -- Parse template, style and script from file
    const { html, style, script, module } = TemplateLoader.readSfc(input);
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

    // Step 3 -- Render template for each path
    const myHandlebars = TemplateEngine.getHandlebars();
    for (const path in output) {
      const pathData = isDynamicSfc
        ? { ...extendedData, ...{ modelItem: modelDataByPath.get(path) } }
        : { ...extendedData };
      const renderedHtml = TemplateEngine.renderHtml(html, pathData, myHandlebars);
      const layoutData = { content: renderedHtml, style: style, ...pathData };
      const renderedTemplate = TemplateEngine.renderTemplate(`layouts/${layout}.hbs`, layoutData, myHandlebars);
      output[path] = renderedTemplate;
    }
    return output;
  }
}