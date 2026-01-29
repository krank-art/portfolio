import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import { executeModule } from './virtual-machine.js';

const marked = new Marked(
  markedHighlight({
	emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

export default class TemplateLoader {
  static parseSfc(string) {
    const html = string.match(/^<template>([\s\S]*)^<\/template>/m)[1].trim();
    const style = string.match(/^<style>([\s\S]*)^<\/style>/m)[1].trim();
    const script = string.match(/^<script>([\s\S]*)^<\/script>/m)[1].trim();
    return ({ html, style, script });
  }

  static readSfc(filePath) {
    const sfcSource = fs.readFileSync(filePath, 'utf8');
    return this.parseSfc(sfcSource);
  }

  static parseMarkdown(string) {
    // We intentionally avoid `\n` in the regex because of the `\n` and `\r\n` shenanigans.
    const match = string.match(/^---\s*^(.*?)^---\s*(.*)/ms);
    const rawYaml = match ? match[1] : null;
    const rawMarkdown = match ? match[2] : string;
    const yamlContent = yaml.load(rawYaml);
    const markdownContent = marked.parse(rawMarkdown);
    const headlineMatch = rawMarkdown.match(/^# +(.*)\r?\n/m);
    const headline = headlineMatch ? headlineMatch[1].trim() : null;
    const title = yaml?.title ?? headline;
    return { yaml: yamlContent, html: markdownContent, markdown: rawMarkdown, title: title };
  }

  static readMarkdown(filePath) {
    const markdownSource = fs.readFileSync(filePath, 'utf8');
    return this.parseMarkdown(markdownSource);

  }

  static async readPartialsInDir(dirPath) {
    const templateExtension = ".hbs";
    const partials = [];
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        const subPartials = await TemplateLoader.readPartialsInDir(filePath);
        partials.push(...subPartials);
        continue;
      }
      if (path.extname(filePath) !== templateExtension)
        continue;
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { html, style, script } = TemplateLoader.parseSfc(fileContent);
      const module = await executeModule(script, {});
      const basename = path.basename(file, templateExtension);
      partials.push({
        id: basename,
        source: filePath,
        template: html,
        data: module,
      });
    }
    return partials;
  }
}
