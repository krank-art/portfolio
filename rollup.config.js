import copy from 'rollup-plugin-copy';
import sass from 'rollup-plugin-sass';
import config from './config/config.dev.js';

export default {
  input: config.debug ? 'lib/main-debug.js' : 'lib/main-base.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
  },
  plugins: [
    copy({
      targets: [
        { src: 'static/favicon/*', dest: 'dist' },
        { src: 'static/blog/*', dest: 'dist/media/blog' },
        {
          src: 'data/media-art.json',
          dest: 'dist/data',
          rename: (name, extension, fullPath) => `art-tags.json`,
          transform: (contents, filename) => {
            // We reduce file size by a lot by throwing out whitespace and unnecessary properties.
            const data = JSON.parse(contents.toString());
            const truncatedData = {};
            data.forEach(entry => {
              const { path, tags } = entry;
              const newPath = `/art/${path}`;
              truncatedData[newPath] = tags;
            });
            return JSON.stringify(truncatedData);
          },
        },
      ],
    }),
    sass({
      output: true,
    }),
  ],
};
