import { formatTable, simplifyBytes, truncateEllipsis } from "../lib/string.js";

export function inspectMedia(media) {
  const lines = media.map(piece => {
    const { fileNamePublic, fileNameInternal, fileSize, width, height, aspectRatio } = piece;
    return `'${fileNameInternal}' (${fileNamePublic}), ${simplifyBytes(fileSize)}, ${width} \u00d7 ${height} (${aspectRatio})`;
  });
  return lines;
}


export function inspectMediaTable(media) {
  const fileNameMaxLength = 48;
  const lines = media.map(piece => {
    const { fileNamePublic, fileNameInternal, fileSize, width, height, aspectRatio, orientation } = piece;
    return [
      truncateEllipsis(fileNameInternal, fileNameMaxLength), 
      truncateEllipsis(fileNamePublic, fileNameMaxLength), 
      simplifyBytes(fileSize), 
      width + " \u00d7 " + height, 
      aspectRatio,
      orientation,
    ];
  });
  return formatTable(lines, 2);
}
