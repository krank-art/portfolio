import { rollup } from 'rollup';
import rollupConfig from '../rollup.config.js';

async function build() {
  const bundle = await rollup(rollupConfig);
  await bundle.write(rollupConfig.output);
  console.log('Rollup completed successfully.');
}

build().catch((error) => {
  console.error('Rollup encountered an error:', error);
  process.exit(1);
});
