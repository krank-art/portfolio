import { rollup } from 'rollup';
import createRollupConfig from '../rollup.config.js';

async function build({ outputDir }) {
  const rollupConfig = await createRollupConfig({ outputDir });
  const bundle = await rollup(rollupConfig);
  await bundle.write(rollupConfig.output);
  console.log('Rollup completed successfully.');
}

export default async function buildAssets({ outputDir = "dist"}) {
  await build({ outputDir }).catch((error) => {
    console.error('Rollup encountered an error:', error);
    process.exit(1);
  });
}
