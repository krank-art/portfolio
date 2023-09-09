import copy from 'rollup-plugin-copy';
import sass from 'rollup-plugin-sass';

export default {
  input: 'lib/main.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
  },
  plugins: [
    copy({
      targets: [
        { src: 'static/favicon/*', dest: 'dist' },
        { src: 'static/art/*', dest: 'dist/media' },
      ],
    }),
    sass({
      output: true,
    }),
  ],
};
