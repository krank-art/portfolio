import fs from 'fs';
import crypto from 'crypto';

export function getMd5Checksum(string) {
  const md5Hash = crypto.createHash('md5');
  md5Hash.update(string);
  return md5Hash.digest('hex');
}

// Helper function to convert text to binary
function textToBinary(text) {
  return text
    .split("")
    .map(char => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

// Convert arbitrary data to a binary string
function dataToBinary(data) {
  return Array.from(data)
    .map(byte => byte.toString(2).padStart(8, "0"))
    .join("");
}
