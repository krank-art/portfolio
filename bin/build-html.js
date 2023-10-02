import fs from 'fs';
import path from 'path';
import { ensureDirExists } from '../lib/filesystem.js';
import config from '../config/config.dev.js';
import TemplateWriter from '../lib/template-writer.js';

export default function buildHtml({ inputDir, outputDir, data }) {
  TemplateWriter.compileSfcDir(inputDir, outputDir, {
    ...config,
    ...data,
  });
}
