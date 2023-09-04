import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

function renderSfc(input, data) {
    // SFC = Single File Component; hbs file with top level <template>, <style> and <script> tag.
    const sfcSource = fs.readFileSync(input, 'utf8');
    const {html, style, script, module} = parseSfc(sfcSource);
    const moduleIsObject = typeof module === 'object' && module !== null;
    const layout = moduleIsObject ? module.layout ?? 'default' : 'default';
    const extendedData = moduleIsObject ? {...data, ...module.data} : { ...data};
    const layoutData = { content: html, style: style, ...extendedData};
    //console.log({html, style, script, layout, extendedData});
    return renderTemplate(`layouts/${layout}.hbs`, layoutData);
}

function parseSfc(string) {
    const html = string.match(/^<template>([\s\S]*)^<\/template>/m)[1].trim();
    const style = string.match(/^<style>([\s\S]*)^<\/style>/m)[1].trim();
    const script = string.match(/^<script>([\s\S]*)^<\/script>/m)[1].trim();
    const extendedScript = script; // Run script to get output if defined
    const module = eval(extendedScript);
    return ({html, style, script, module});
}

function renderTemplate(input, data) {
    const templateSource = fs.readFileSync(input, 'utf8');
    const template = handlebars.compile(templateSource);
    return template(data);
}

function renderTemplateWithLayout(input, layout, data) {
    const content = renderTemplate(input, data);
    const payload = { ...data, content };
    return renderTemplate(layout, payload);
}

function compile(input, output, layout, data) {
    const renderedHtml = renderTemplateWithLayout(input, layout, data);
    fs.writeFileSync(output, renderedHtml);
    console.log(`Compiled '${input}' to '${output}'. `);
}

function compileSfc(input, output, data) {
    const renderedHtml = renderSfc(input, data);
    fs.writeFileSync(output, renderedHtml);
    console.log(`Compiled SFC '${input}' to '${output}'. `);
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
        ensureDirExists(outputPath);
        compileSfc(filePath, outputFile, data);
    }
    //compile('pages/index.hbs', 'dist/template.html', 'layouts/default.hbs', data);
    //renderSfc('pages/index.hbs', data);
}

function ensureDirExists(directoryPath) {
    const directories = directoryPath.split(path.sep);
    let currentPath = '';
    for (const dir of directories) {
      currentPath = path.join(currentPath, dir);
        if (fs.existsSync(currentPath)) continue;
          fs.mkdirSync(currentPath);
    }
  }

compileSfcDir("pages", "dist", {
    title: 'Handlebars Example',
    name: 'John Doe',
});
