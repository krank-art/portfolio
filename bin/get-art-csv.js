import { parseJsonFile } from '../lib/filesystem.js';

const media = parseJsonFile("./data/media-art.json");

const rows = media.map(entry => {
  const { path, date, title, tags, description, fileNamePublic, fileNameInternal } = entry
  const websiteLink = "https://krank.love/art/" + path;
  const isNsfw = "no";
  return [path, , title, date, fileNameInternal, fileNamePublic, description.join("\\n"), tags, isNsfw, websiteLink].join(";");
});

console.log(rows.join("\n"));
