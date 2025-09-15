// This is intended to be included in the client JS

import { parseDateYYYYMMDD } from "./string.js";

async function fetchAndParseEncFile(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const view = new DataView(buffer);

  // Parse header
  const decoder = new TextDecoder();
  let offset = 0;
  const magicBytes = decoder.decode(new Uint8Array(buffer, 0, 4)); offset += 4;
  if (magicBytes !== "KENC") throw new Error("Invalid magic bytes");
  const version = view.getUint8(offset++);
  if (version !== 1) throw new Error(`Unsupported version: ${version}`);
  const dateRaw = decoder.decode(new Uint8Array(buffer, offset, 8)); offset += 8;
  const encryptionDate = parseDateYYYYMMDD(dateRaw);
  const author = decoder.decode(new Uint8Array(buffer, offset, 19)); offset += 19;
  if (author !== "https://krank.love/") throw new Error("Invalid author");
  const payloadLength = view.getUint32(offset, false); offset += 4;
  const salt = new Uint8Array(buffer, offset, 16); offset += 16;
  const iv = new Uint8Array(buffer, offset, 12); offset += 12;
  const authTag = new Uint8Array(buffer, offset, 16); offset += 16;

  // Parse payload
  const payload = new Uint8Array(buffer, offset, payloadLength); offset += payloadLength;

  return {
    magicBytes,
    version,
    encryptionDate,
    author,
    payloadLength,
    salt,
    iv,
    authTag,
    payload,
  };
}
