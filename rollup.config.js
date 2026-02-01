import copy from 'rollup-plugin-copy';
import sass from 'rollup-plugin-sass';
import nodeResolve from '@rollup/plugin-node-resolve';
import config from './config/config.dev.js';
import { getCompressedTagsFromMedia } from './lib/tag-util.js';
import crypto from "node:crypto";

const buildId = crypto.createHash("sha256").update(Date.now().toString()).digest("hex").slice(0, 8);

export default ({ outputDir }) => {
  return {
    input: config.debug ? 'lib/main-debug.js' : 'lib/main-base.js',
    output: {
      file: outputDir + "/bundle.js",
      format: 'iife',
    },
    plugins: [
      nodeResolve(),
      {
        name: "build-id",
        resolveId(id) {
          if (id === "virtual:build-id") return id;
        },
        load(id) {
          if (id === "virtual:build-id") {
            return `export default "${buildId}";`;
          }
        },
      },
      copy({
        targets: [
          { src: 'static/favicon/*', dest: outputDir },
          { src: 'static/font/*', dest: outputDir + '/font' },
          { src: 'static/blog/*', dest: outputDir + '/media/blog' },
          { src: 'static/tools/*', dest: outputDir + '/media/tools' },
          {
            src: 'data/media-art.json',
            dest: outputDir + '/data',
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
  }
};
