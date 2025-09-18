// Both for NodeJS and browser JS

import { formatDateYYYYMMDD } from './string.js';

/**
 * @param {object} options
 * @param {Uint8Array} options.salt
 * @param {Uint8Array} options.iv
 * @param {number} options.payloadLength
 * @param {string} options.author
 * @param {Date} options.encryptionDate
 * @param {number} options.version
 * @param {string} options.magicBytes
 * @returns {{fileHeader: Uint8Array, authTagOffset: number}}
 */
export function createFileHeader({ salt, iv, payloadLength, author, encryptionDate, version, magicBytes }) {
  if (salt.length !== 16) throw new Error("Salt must be 16 bytes");
  if (iv.length !== 12) throw new Error("IV must be 12 bytes for GCM");

  // Create meta data part
  const metaDataLength = 4 + 1 + 8 + 19 + 4; // 36 bytes
  const metaDataBuffer = new ArrayBuffer(metaDataLength);
  const view = new DataView(metaDataBuffer);
  const encoder = new TextEncoder();
  let metaOffset = 0;
  const encodeAsAscii = (text, length) => {
    // Length is explicitly defined because it's *SO* important to keep correct offset when writing header.
    const rawText = encoder.encode(text);
    for (let i = 0; i < length; i++)
      view.setUint8(metaOffset++, rawText[i]);
  }
  encodeAsAscii(magicBytes, 4);
  view.setUint8(metaOffset++, version);
  encodeAsAscii(formatDateYYYYMMDD(encryptionDate), 8);
  encodeAsAscii(author, 19);
  view.setUint32(metaOffset, payloadLength, false); metaOffset += 4; // Big-Endian is common with crypto files.

  // Concat meta data with salt, iv and authentification tag placeholder
  const totalLength = metaDataLength + 16 + 12 + 16; // 80 bytes total
  const fileHeader = new Uint8Array(totalLength);
  let headerOffset = 0;
  const metaData = new Uint8Array(view.buffer);
  fileHeader.set(metaData, headerOffset); headerOffset += metaData.length;
  fileHeader.set(salt, headerOffset); headerOffset += salt.length;
  fileHeader.set(iv, headerOffset); headerOffset += iv.length;
  const authTagPlaceholder = new Uint8Array(16); // 16 zeros
  fileHeader.set(authTagPlaceholder, headerOffset); headerOffset += authTagPlaceholder.length;
  return { fileHeader, authTagOffset: totalLength - 16 };
}

/**
 * Derive a 128-bit AES-GCM key from a password using PBKDF2
 * @param {Object} cryptoLib - Crypto library module to use (changes if NodeJS or Client JS)
 * @param {string} password - The password
 * @param {Uint8Array} salt - 16-byte salt
 * @param {number} iterations - e.g., 100_000
 * @returns {Promise<CryptoKey>} - AES-GCM key
 */
export async function deriveAES128Key({password, salt, iterations = 100_000, cryptoLib}) {
  const encoder = new TextEncoder();
  const baseKey = await cryptoLib.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  const aesKey = await cryptoLib.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 128 },
    true,
    ["encrypt", "decrypt"]
  );
  return aesKey;
}
