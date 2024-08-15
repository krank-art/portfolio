import fs from 'fs';
import path from 'path';
import TemplateEngine from "./template-engine.js";
import TemplateLoader from './template-loader.js';
import { DataChunk } from './data-chunk.js';

class DirTreeNode {
  constructor({ path, title, extension, source, type, model, absolutePath = null, children = [], parent = null }) {
    this.path = path;
    this.title = title;
    this.extension = extension;
    this.source = source;
    this.type = type;
    this.model = model;
    this.absolutePath = absolutePath;
    this.children = children;
    this.parent = parent;
  }

  get depth() {
    return this.absolutePath.split("/").length;
  }

  get nextSibling() {
    return this.getSiblingAtNextPosition(1);
  }

  get previousSibling() {
    return this.getSiblingAtNextPosition(-1);
  }

  getSiblingAtNextPosition(distance) {
    if (this.parent === null)
      return null;
    const siblings = this.parent.children;
    if (!siblings)
      throw new Error(`Cant have parent, but parent has the node not as child ` + this.parent.path);
    const ownIndex = siblings.findIndex(sibling => sibling.path === this.path);
    const newIndex = ownIndex + distance;
    if (newIndex < 0 || newIndex > siblings.length - 1) return null;
    return siblings[newIndex];
  }

  duplicate() {
    return new DirTreeNode({
      path: this.path,
      title: this.title,
      extension: this.extension,
      source: this.source,
      type: this.type,
      model: this.model,
      absolutePath: this.absolutePath,
      children: this.children,
      parent: this.parent,
    });
  }
}

/**
 * @param {string} input Dir path with template files 
 * @param {object} models Object where key is model name and value model data.
 * @param {string[]} subpath Relative starting path, default is []
 * @returns {DirTreeNode[]}
 */
export function loadDirAsTree(input, models, subpath = [], parent = null) {
  // Setup
  const nodes = [];
  const files = fs.readdirSync(input);
  const findNode = (path) => nodes.find(node => node.path === path) ?? null;
  const addNode = (path, title, extension, source, type, model, parent) => {
    const existingNode = findNode(path);
    if (existingNode && existingNode.type === "group") {
      existingNode.title = title;
      existingNode.extension = extension;
      existingNode.source = source;
      existingNode.type = type;
      existingNode.model = model;
      existingNode.parent = parent;
      return existingNode;
    }
    if (existingNode)
      throw new Error(`Cannot override existing page type '${existingNode.type}' of '${existingNode.path}'. `);
    const newNode = new DirTreeNode({ path, title, extension, source, type, model, children: [], parent });
    nodes.push(newNode);
    return newNode;
  };
  // Iterate over files
  for (const file of files) {
    const filePath = path.join(input, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const parentNode = findNode(file) ?? addNode(file, file, "", filePath, "group", undefined, parent);
      const childNodes = loadDirAsTree(filePath, models, [...subpath, file], parentNode);
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
        addNode(basename, templateLinkTitle, extension, filePath, "page", undefined, parent);
        continue;
      }
      const payload = models[model];
      if (!payload) {
        console.warn(`Could not find payload in data for model '${model}'. `);
        addNode(basename, templateLinkTitle, extension, filePath, "page", undefined, parent);
        continue;
      }
      const templateNodes = payload.map(item => item.path);
      templateNodes.forEach(target => addNode(target, templateLinkTitle, extension, filePath, "page", model, parent));
      continue;
    }
    if (extension === ".md") {
      const markdownFileContent = fs.readFileSync(filePath, { encoding: "utf-8" });
      const { yaml, title } = TemplateLoader.parseMarkdown(markdownFileContent);
      const markdownLinkTitle = yaml?.linkTitle ?? title ?? basename;
      if (yaml && yaml.hidden) continue;
      addNode(basename, markdownLinkTitle, extension, filePath, "page", undefined, parent);
      continue;
    }
    addNode(basename, basename, extension, filePath, "page", undefined, parent);
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
 * @property {DirTreeNode} page The page entry.
 * @property {DataChunk} chunk The data chunk.
 */

/**
 * @callback DirEntryAugmentor
 * @param {DirTreeNode} node
 * @param {object} data Actual attached data, object can have any content.
 * @param {number} index
 * @param {number} length
 * @returns {object}
 */

/**
 * @typedef {Object} DirEntryPayload
 * @property {string} id Id of the data slice, should be descriptive.
 * @property {object} payload Actual attached data, object can have any content.
 * @property {DirEntryAugmentor} [augmentor] Actual attached data, object can have any content.
 */

/**
 * @param {DirTreeNode} node 
 * @param {DirEntryPayload[]} payloads 
 * @returns {PageChunk[]}
 */
function flattenDirNode(node, payloads) {
  const flattenedEntries = [];
  const dataChunk = new DataChunk();
  const payloadsLength = payloads.length;
  for (let i = 0; i < payloadsLength; i++) {
    const payload = payloads[i];
    // The augmentor allows us to add dir entry specific data per entry (the data gets 'augmented').
    const { id: payloadId, payload: payloadData, augmentor } = payload;
    const augmentedData = augmentor ? augmentor(node, payloadData, i, payloadsLength) : payloadData;
    // We need to clone the data object, so side effects do not spread from one rendering action to the next.
    dataChunk.addPayload(payloadId, JSON.parse(JSON.stringify(augmentedData)));
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
 * @param {DirTreeNode} tree 
 * @param {DirEntryPayload[]} payloads 
 * @returns {PageChunk[]}
 */
export function flattenDirTree(tree, payloads) {
  // In the current definition, a tree can have multiple roots.
  // So flattenDirNode() returns a list, so we have to reduce the list of lists into a single list.
  return tree.map(entry => flattenDirNode(entry, payloads))
    .reduce((acc, entries) => acc.concat(entries), []);
}
