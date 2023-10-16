import config from '../config/config.dev.js';
import TemplateWriter from '../lib/template-writer.js';

export default async function buildHtml({ inputDir, outputDir, data, partialsDir }) {
  const templating = new TemplateWriter({ partialsDir });
  await templating.load();
  await templating.compileSfcDir(inputDir, outputDir, {
    ...config,
    ...data,
  });
}
