import fs from 'fs';
import path from 'path';
import TemplateEngine from "./template-engine.js";
import TemplateLoader from './template-loader.js';
import { DataChunk } from './data-chunk.js';

class DirTreeNode {
  constructor( { path, title, extension, source, type, model, absolutePath = null, children = [] }) {
    this.path = path;
    this.title = title;
    this.extension = extension;
    this.source = source;
    this.type = type;
    this.model = model;
    this.absolutePath = absolutePath;
    this.children = children;
  }

  duplicate() {
    return new DirTreeNode( {
      path: this.path,
      title: this.title,
      extension: this.extension,
      source: this.source,
      type: this.type,
      model: this.model,
      absolutePath: this.absolutePath,
      children: this.children,
    });
  }
}

/**
 * @param {string} input Dir path with template files 
 * @param {object} models Object where key is model name and value model data.
 * @param {string[]} subpath Relative starting path, default is []
 * @returns {DirTreeNode[]}
 */
export function loadDirAsTree(input, models, subpath = []) {
  // Setup
  const nodes = [];
  const files = fs.readdirSync(input);
  const findNode = (path) => nodes.find(node => node.path === path) ?? null;
  const addNode = (path, title, extension, source, type, model) => {
    const existingNode = findNode(path);
    if (existingNode && existingNode.type === "group") {
      existingNode.title = title;
      existingNode.extension = extension;
      existingNode.source = source;
      existingNode.type = type;
      existingNode.model = model;
      return existingNode;
    }
    if (existingNode)
      throw new Error(`Cannot override existing page type '${existingNode.type}' of '${existingNode.path}'. `);
    const newNode = new DirTreeNode({ path, title, extension, source, type, model, children: [] });
    nodes.push(newNode);
    return newNode;
  };
  // Iterate over files
  for (const file of files) {
    const filePath = path.join(input, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const parentNode = findNode(file) ?? addNode(file, file, "", filePath, "group");
      const childNodes = loadDirAsTree(filePath, models, [...subpath, file]);
      parentNode.children.push(...childNodes);
      continue;
    }
    const extension = path.extname(filePath);
    const basename = path.basename(file, extension);
    if (extension === ".hbs") {
      const inputSfc = TemplateLoader.readSfc(filePath);
      const model = TemplateEngine.getSfcModel(inputSfc);
      const templateLinkTitle = TemplateEngine.getSfcLinkTitle(inputSfc);
      if (!model) {
        addNode(basename, templateLinkTitle, extension, filePath, "page");
        continue;
      }
      const payload = models[model];
      if (!payload) {
        console.warn(`Could not find payload in data for model '${model}'. `);
        addNode(basename, templateLinkTitle, extension, filePath, "page");
        continue;
      }
      const templateNodes = payload.map(item => item.path);
      templateNodes.forEach(target => addNode(target, templateLinkTitle, extension, filePath, "page", model));
      continue;
    }
    if (extension === ".md") {
      const markdownFileContent = fs.readFileSync(filePath, { encoding: "utf-8" });
      const { yaml, title } = TemplateLoader.parseMarkdown(markdownFileContent);
      const markdownLinkTitle = yaml?.linkTitle ?? title ?? basename;
      if (yaml && yaml.hidden) continue;
      addNode(basename, markdownLinkTitle, extension, filePath, "page");
      continue;
    }
    addNode(basename, basename, extension, filePath, "page");
  }
  return nodes;
}

/**
 * @param {DirTreeNode[]} tree 
 * @returns {DirTreeNode[]}
 */
export function addAbsolutePathsToDirTree(tree) {
  const traverseNode = (node, base = []) => {
    const newNode = node.duplicate();
    const { path, children } = newNode;
    const currentPath = [...base, path];
    newNode.absolutePath = currentPath.join("/");
    if (!children || children.length < 1)
      return newNode;
    const newChildren = children.map(child => traverseNode(child, currentPath));
    newNode.children = newChildren;
    return newNode;
  }
  return tree.map(node => traverseNode(node));
};

/**
 * @typedef {Object} PageChunk
 * @property {DirTreeEntry} page The page entry.
 * @property {DataChunk} chunk The data chunk.
 */

/**
 * @param {DirTreeNode} node 
 * @param {object[]} payloads 
 * @returns {PageChunk[]}
 */
function flattenDirNode (node, payloads) {
  const flattenedEntries = [];
  const dataChunk = new DataChunk();
  for (const payload of payloads) {
    const { id: payloadId, payload: payloadData } = payload;
      // We need to clone the data object, so side effects do not spread from one rendering action to the next.
    dataChunk.addPayload(payloadId, JSON.parse(JSON.stringify(payloadData)));
  }
  flattenedEntries.push({ page: node, chunk: dataChunk });
  for (const child of node.children) {
    const childEntries = flattenDirNode(child, payloads);
    if (childEntries.length > 0)
      flattenedEntries.push(...childEntries);
  }
  return flattenedEntries;
}

/**
 * @param {*} tree 
 * @param {*} payloads 
 * @returns {PageChunk[]}
 */
export function flattenDirTree (tree, payloads) {
  // In the current definition, a tree can have multiple roots.
  // So flattenDirNode() returns a list, so we have to reduce the list of lists into a single list.
  return tree.map(entry => flattenDirNode(entry, payloads))
    .reduce((acc, entries) => acc.concat(entries), []);
}
