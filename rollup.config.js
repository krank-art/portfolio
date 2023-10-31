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
        { src: 'static/blog/*', dest: 'dist/media/blog' },
      ],
    }),
    sass({
      output: true,
    }),
  ],
};
