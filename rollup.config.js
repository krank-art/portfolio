import copy from 'rollup-plugin-copy';
import sass from 'rollup-plugin-sass';
import config from './config/config.dev.js';
import { getCompressedTagsFromMedia } from './lib/tag-util.js';

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
            const compressedTags = getCompressedTagsFromMedia(data, 0.9);
            return JSON.stringify(compressedTags);
          },
        },
      ],
    }),
    sass({
      output: true,
    }),
  ],
};
