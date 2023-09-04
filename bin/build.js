const fs = require('fs');
const handlebars = require('handlebars');

function renderSfc(input, data) {
    // SFC = Single File Component; hbs file with top level <template>, <style> and <script> tag.
    const sfcSource = fs.readFileSync(input, 'utf8');
    const rawHtml = sfcSource.match(/^<template>([\s\S]*)^<\/template>/m)[1].trim();
    const rawStyle = sfcSource.match(/^<style>([\s\S]*)^<\/style>/m)[1].trim();
    const rawScript = sfcSource.match(/^<script>([\s\S]*)^<\/script>/m)[1].trim();
    const extendedScript = rawScript + " module"; // Run variable 'page' to get output if defined
    const module = eval(extendedScript);
    const moduleIsObject = typeof module === 'object' && module !== null;
    const extendedData = moduleIsObject ? {...data, ...module.data} : { ...data};
    console.log({rawHtml, rawStyle, rawScript, extendedData});
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


const data = {
    title: 'Handlebars Example',
    name: 'John Doe',
};
compile('pages/index.hbs', 'dist/template.html', 'layouts/default.hbs', data);

renderSfc('pages/index.hbs', data);
