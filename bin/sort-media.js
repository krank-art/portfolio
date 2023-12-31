import fs from 'fs';
import { parseJsonFile, writeObjectToFile } from '../lib/filesystem.js';

export const SorterType = Object.freeze({
  Name: 'name',
  Date: 'date',
});

function getSortedMedia (entries, sorterName) {
  const nameSorter = (a, b) => a.path.localeCompare(b.path);
  switch (sorterName) {
    case SorterType.Name:
      return entries.sort(nameSorter);
    case SorterType.Date:
      return entries.sort((a, b) => {
        // If date is equal, sort by name
        if (a.date.localeCompare(b.date) === 0) return nameSorter(a, b);
        // Sort undated entries last
        if (a.date.length === 0) return 1;
        if (b.date.length === 0) return -1;
        // Finally, sort by date
        return b.date.localeCompare(a.date)
      });
    default:
      console.warn(`Unknown sorter '${sorterName}', no sorting. `);
      return [...entries];
  }
};

export default async function sortMedia(jsonFile, sorter = "name") {
  if (!fs.existsSync(jsonFile)) {
    console.warn(`There is no media file at '${jsonFile}', aborting. `);
    return;
  }
  if (!Object.values(SorterType).includes(sorter)) {
    console.warn(`Unknown sorter '${sorter}', aborting. `);
    return;
  }
  const media = parseJsonFile(jsonFile);
  const newMedia = getSortedMedia(media, sorter);
  writeObjectToFile(jsonFile, newMedia, true);
}
