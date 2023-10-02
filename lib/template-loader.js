import fs from 'fs';

export default class TemplateLoader { 
  static parseSfc(string) {
    const html = string.match(/^<template>([\s\S]*)^<\/template>/m)[1].trim();
    const style = string.match(/^<style>([\s\S]*)^<\/style>/m)[1].trim();
    const script = string.match(/^<script>([\s\S]*)^<\/script>/m)[1].trim();
    const extendedScript = script; // Run script to get output if defined
    const module = eval(extendedScript);
    return ({ html, style, script, module });
  }

  static readSfc(filePath) {
    const sfcSource = fs.readFileSync(filePath, 'utf8');
    return this.parseSfc(sfcSource);
  }
}
