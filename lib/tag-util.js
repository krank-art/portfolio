function countTags(entries) {
  const countByTags = new Map();
  for (const entry of entries) {
    const { tags } = entry;
    for (const tag of tags) {
      if (countByTags.has(tag)) {
        const count = countByTags.get(tag);
        countByTags.set(tag, count + 1);
        continue;
      }
      countByTags.set(tag, 1);
    }
  }
  const countByTagsArray = Array.from(countByTags, ([tag, count]) => ({ tag, count }));
  return countByTagsArray.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function getCompressedTagDefinitions(entries) {
  const tagDefinitions = [];
  const tagCounts = [];
  const indexByTags = new Map();
  const countedTags = countTags(entries);
  for (let i = 0; i < countedTags.length; i++) {
    const { tag, count } = countedTags[i];
    tagDefinitions[i] = tag;
    tagCounts[i] = count;
    indexByTags.set(tag, i);
  }
  const tagData = {};
  for (const entry of entries) {
    const { path, tags } = entry;
    const newPath = `/art/${path}`;
    const tagIds = tags.map(tag => indexByTags.get(tag));
    tagData[newPath] = tagIds;
  }
  return { defs: tagDefinitions, counts: tagCounts, uses: tagData };
}

function getTagStats(uniqueTagsCount, tagCounts, pageCount, relevance) {
  const assignedTags = tagCounts.reduce((totalCount, count) => totalCount + count, 0);
  // Because there are so many barely used unique tags, we want to find out the index of the tag, 
  //  that represents 90% of all assigned tags. Otherwise the filtering menu has too many options.
  const relevanceLimit = Math.ceil(relevance * assignedTags);
  let relevanceCounter = 0;
  let relevanceIndex = 0;
  for (let i = 0; i < tagCounts.length; i++) {
    relevanceCounter += tagCounts[i];
    relevanceIndex = i;
    if (relevanceCounter >= relevanceLimit) break;
  }
  return {
    assignedTags,
    uniqueTags: uniqueTagsCount,
    pages: pageCount,
    tagCounts: tagCounts,
    relevanceFactor: relevance,
    relevanceCount: relevanceLimit,
    lastRelevantTagIndex: relevanceIndex,
  }
}

export function uncompressTags(compressedTags) {
  const tagData = {};
  const { defs, uses } = compressedTags;
  for (const path in uses) {
    const tagIds = uses[path];
    const readableTags = tagIds.map(id => defs[id]);
    tagData[path] = readableTags;
  }
  return tagData;
}

export function getCompressedTagsFromMedia(entries, relevanceLimit = 0.9) {
  const { defs, counts, uses } = getCompressedTagDefinitions(entries);
  const stats = getTagStats(defs.length, counts, entries.length, relevanceLimit);
  return { defs, stats, uses };
}
