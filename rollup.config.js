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
            // Step 1 -- Count tags
            const countByTags = new Map();
            data.forEach(entry => {
              const { tags } = entry;
              for (const tag of tags) {
                if (countByTags.has(tag)) {
                  const count = countByTags.get(tag);
                  countByTags.set(tag, count + 1);
                  continue;
                }
                countByTags.set(tag, 1);
              }
            });
            // Step 2 -- Sort tags by count
            const countByTagsArray = Array.from(countByTags, ([tag, count]) => ({ tag, count }));
            const countByTagsArraySorted = countByTagsArray.sort(
              (a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
            //console.log(countByTagsArraySorted); //TODO: write as separate file
            // Step 3 -- Setup tag definitions
            const tagDefinitions = [];
            const tagCounts = [];
            const indexByTags = new Map();
            for (let i = 0; i < countByTagsArraySorted.length; i++) {
              const { tag, count } = countByTagsArraySorted[i];
              tagDefinitions[i] = tag;
              tagCounts[i] = count;
              indexByTags.set(tag, i);
            }
            // Step 4 -- Replace tag strings with numbers to save characters
            const tagData = {};
            data.forEach(entry => {
              const { path, tags } = entry;
              const newPath = `/art/${path}`;
              const tagIds = tags.map(tag => indexByTags.get(tag));
              tagData[newPath] = tagIds;
            });
            // Step 5 -- Accumulate stats
            const stats = {
              assignedTags: tagCounts.reduce((totalCount, count) => totalCount + count, 0),
              uniqueTags: tagDefinitions.length,
              pages: data.length,
              tagCounts: tagCounts,
            };
            // Step 6 -- Get last relevant tag id
            //  Because there are so many barely used unique tags, we want to find out the index of the tag, 
            //  that represents 90% of all assigned tags. Otherwise the filtering menu has too many options.
            const relevance = 0.9;
            const relevanceLimit = Math.ceil(relevance * stats.assignedTags);
            let relevanceCounter = 0;
            let relevanceIndex = 0;
            for (let i = 0; i < tagCounts.length; i++) {
              relevanceCounter += tagCounts[i];
              relevanceIndex = i;
              if (relevanceCounter >= relevanceLimit) break;
            }
            stats.relevanceFactor = relevance;
            stats.relevanceCount = relevanceLimit;
            stats.lastRelevantTagIndex = relevanceIndex;
            // Step 7 -- Return tag data
            return JSON.stringify({ defs: tagDefinitions, stats, tags: tagData });
          },
        },
      ],
    }),
    sass({
      output: true,
    }),
  ],
};
