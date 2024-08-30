import fs from 'fs';
import path from 'path';
import TemplateEngine from "./template-engine.js";
import TemplateLoader from './template-loader.js';
import { DataChunk } from './data-chunk.js';

class DirTreeNode {
  constructor({ path, title, extension, source, type, model, absolutePath = null, children = [] }) {
    this.path = path;
    this.title = title;
    this.extension = extension;
    this.source = source;
    this.type = type;
    this.model = model;
    this.absolutePath = absolutePath;
    this.children = children;
    //this.parent = parent;
  }

  get depth() {
    return this.absolutePath.split("/").length;
  }

  /**
   * Deprecated due to performance reasons.
   * @deprecated
   */
  get nextSibling() {
    return this.getSiblingAtNextPosition(1);
  }

  /**
   * Deprecated due to performance reasons.
   * @deprecated
   */
  get previousSibling() {
    return this.getSiblingAtNextPosition(-1);
  }

  /**
   * Deprecated due to performance reasons.
   * @deprecated
   */
  getNextSibling() {
    return this.getSiblingAtNextPosition(1);
  }

  /**
   * Deprecated due to performance reasons.
   * @deprecated
   */
  getSiblingAtNextPosition(distance) {
    return null;
    if (this.parent === null)
      return null;
    const siblings = this.parent.children;
    if (!siblings)
      throw new Error(`Cant have parent, but parent has the node not as child ` + this.parent.path);
    const pageSiblings = siblings.filter(sibling => sibling.type === "page");
    const ownIndex = pageSiblings.findIndex(sibling => sibling.path === this.path); //TODO: Rewrite to be less expensive.
    const newIndex = ownIndex + distance;
    if (newIndex < 0 || newIndex > pageSiblings.length - 1) return null;
    return pageSiblings[newIndex];
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
      //parent: this.parent,
    });
  }

  /**
   * Deprecated due to performance reasons.
   * @deprecated
   */
  duplicateWithoutParent() {
    return null;
    // Necessary to prevent cyclic dependency
    return new DirTreeNode({
      path: this.path,
      title: this.title,
      extension: this.extension,
      source: this.source,
      type: this.type,
      model: this.model,
      absolutePath: this.absolutePath,
      children: this.children.map(child => child.duplicateWithoutParent()),
    });
  }

  /**
   * Deprecated due to performance reasons.
   * @deprecated
   */
  removeParentRecursively() {
    return;
    for (const child of this.children)
      child.removeParentRecursively();
    this.parent = null;
  }
}

/**
 * @param {string} input Dir path with template files 
 * @param {object} models Object where key is model name and value model data.
 * @param {string[]} subpath Relative starting path, default is []
 * @returns {DirTreeNode[]}
 */
export function loadDirAsTree({input, models, subpath = [], ignoredFiles = []}) {
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
    if (ignoredFiles.includes(filePath)) {
      console.log(`Skipping '${filePath}'`);
      continue;
    }
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const parentNode = findNode(file) ?? addNode(file, file, "", filePath, "group", undefined);
      const childNodes = loadDirAsTree({
        input: filePath, 
        models: models, 
        subpath: [...subpath, file], 
        ignoredFiles: ignoredFiles,
      });
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
        addNode(basename, templateLinkTitle, extension, filePath, "page", undefined);
        continue;
      }
      const payload = models[model];
      if (!payload) {
        console.warn(`Could not find payload in data for model '${model}'. `);
        addNode(basename, templateLinkTitle, extension, filePath, "page", undefined);
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
      addNode(basename, markdownLinkTitle, extension, filePath, "page", undefined);
      continue;
    }
    addNode(basename, basename, extension, filePath, "page", undefined);
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
function flattenDirNode(node) {
  const flattenedEntries = [];
  const dataChunk = new DataChunk();
  flattenedEntries.push({ page: node, chunk: dataChunk });
  for (const child of node.children) {
    const childEntries = flattenDirNode(child);
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
