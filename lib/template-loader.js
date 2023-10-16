import fs from 'fs';
import path from 'path';
import { executeModule } from './virtual-machine.js';

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
