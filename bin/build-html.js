import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { marked } from 'marked';
import { ensureDirExists } from '../lib/filesystem.js';
import config from '../config/config.dev.js';
import { interpolateString } from '../lib/string.js';

function renderSfc(input, data, depth = 0) {
  // SFC = Single File Component; hbs file with top level <template>, <style> and <script> tag.
  const output = {};

  // Step 1 -- Parse template, style and script from file
  const sfcSource = fs.readFileSync(input, 'utf8');
  const { html, style, script, module } = parseSfc(sfcSource);
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
  const myHandlebars = getHandlebars();
  for (const path in output) {
    const pathData = isDynamicSfc
      ? { ...extendedData, ...{ modelItem: modelDataByPath.get(path) } }
      : { ...extendedData };
    const renderedHtml = renderHtml(html, pathData, myHandlebars);
    const layoutData = { content: renderedHtml, style: style, ...pathData };
    const renderedTemplate = renderTemplate(`layouts/${layout}.hbs`, layoutData, myHandlebars);
    output[path] = renderedTemplate;
  }
  return output;
}

function getHandlebars() {
  const myHandlebars = handlebars.create();
  myHandlebars.registerHelper('obj', function(string, options) {
    return JSON.parse(string);
  });
  myHandlebars.registerHelper('markdown', function(string, args, options) {
    // Ok, not quite sure how hashes work in handlebars, but this is good enough for now.
    const interpolatedString = interpolateString(string, args.hash.args);
    const html = marked(interpolatedString);
    return new myHandlebars.SafeString(html);
  });
  return myHandlebars;
}

function parseSfc(string) {
  const html = string.match(/^<template>([\s\S]*)^<\/template>/m)[1].trim();
  const style = string.match(/^<style>([\s\S]*)^<\/style>/m)[1].trim();
  const script = string.match(/^<script>([\s\S]*)^<\/script>/m)[1].trim();
  const extendedScript = script; // Run script to get output if defined
  const module = eval(extendedScript);
  return ({ html, style, script, module });
}

function renderHtml(template, data, handlebars) {
  const compiledTemplate = handlebars.compile(template);
  return compiledTemplate(data);
}

function renderTemplate(input, data, handlebars) {
  const templateSource = fs.readFileSync(input, 'utf8');
  return renderHtml(templateSource, data, handlebars);
}

function renderTemplateWithLayout(input, layout, data, handlebars) {
  const content = renderTemplate(input, data, handlebars);
  const payload = { ...data, content };
  return renderTemplate(layout, payload, handlebars);
}

function compile(input, output, layout, data, handlebars) {
  const renderedHtml = renderTemplateWithLayout(input, layout, data, handlebars);
  fs.writeFileSync(output, renderedHtml);
  console.log(`Compiled '${input}' to '${output}'. `);
}

function compileSfc(input, output, data, depth = 0) {
  const renderedHtml = renderSfc(input, data, depth);
  for (const pagePath in renderedHtml) {
    const html = renderedHtml[pagePath];
    const inputFileName = path.basename(input, path.extname(input));
    const outputFileName = pagePath === "/" ? inputFileName : pagePath;
    const outputFile = path.resolve(output, outputFileName + ".html");
    fs.writeFileSync(outputFile, html);
    console.log(`Compiled SFC '${input}' to '${outputFile}'. `);
  }
}

function compileSfcDir(input, output, data, subpath = []) {
  const files = fs.readdirSync(input);
  for (const file of files) {
    const filePath = path.join(input, file);
    const outputName = path.basename(file, path.extname(file)) + ".html";
    const outputPath = path.join(output, ...subpath);
    const outputFile = path.join(outputPath, outputName);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      compileSfcDir(filePath, output, data, [...subpath, file])
      continue;
    }
    if (path.extname(filePath) !== ".hbs")
      continue;
    ensureDirExists(outputPath + path.sep);
    compileSfc(filePath, outputPath, data, subpath.length);
  }
  //compile('pages/index.hbs', 'dist/template.html', 'layouts/default.hbs', data);
  //renderSfc('pages/index.hbs', data);
}

export default function buildHtml({ inputDir, outputDir, data }) {
  compileSfcDir(inputDir, outputDir, {
    ...config,
    ...data,
  });
}
