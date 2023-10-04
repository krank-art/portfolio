import { simplifyBytes } from "../lib/string.js";

export function inspectMedia(media) {
  const lines = media.map(piece => {
    const { fileNamePublic, fileNameInternal, fileSize, width, height, aspectRatio } = piece;
    return `'${fileNameInternal}' (${fileNamePublic}), ${simplifyBytes(fileSize)}, ${width} \u00d7 ${height} (${aspectRatio})`;
  });
  return lines;
}
