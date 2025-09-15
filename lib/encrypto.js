import path from "path";
import crypto from 'crypto';
import { readFile, writeFile, access, constants, mkdir } from "fs/promises";
import { formatDateYYYYMMDD } from './string.js';

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

function bufferToHexGrouped(buf) {
  const hex = buf.toString("hex");
  return hex.match(/.{1,8}/g).join(" "); // Split every 8 hex chars (4 bytes)
}

/**
 * @typedef {Object} EncryptionSet
 * @property {string} password - The password for this set
 * @property {string} title - Title of the set (will not be included in output, only to help discern sets)
 * @property {string[][]} posts - Each post is an array of *relative* file paths e.g. [ preview, fullImage, metadataJson ]
 */

/**
 * @param {EncryptionSet[]} sets 
 * @param {string} outputDir 
 * @description
 * Example input for 'sets':
 * ```js
 * const exampleSets = [
 *   { password: "supersecret123",
 *     title: "General naughty art",
 *     posts: [
 *       [ "nsfw/240p/my-image.png", "nsfw/my-image.png", "nsfw/data/my-image.json"],
 *       [ "nsfw/240p/spicy.jpg",    "nsfw/spicy.jpg",    "nsfw/data/spicy.json"],
 *     ]},
 *   { password: "bananabread42",
 *     title: "Experimental",
 *     posts: [
 *       [ "nsfw/240p/crazy-art.webm", "nsfw/crazy-art.png", "nsfw/data/crazy-art.json"],
 *     ]}];
 * ```
*/
export async function encryptSets({ sets, inputDir, outputDir, silent = true }) {
  const ivIdentifier = crypto.randomBytes(4);
  const logger = silent ? null : [];
  let ivCounter = 0;
  for (const set of sets) {
    const { password, title, posts } = set;
    logger?.push(`=== SET "${title}" ===`);
    for (const post of posts) {
      const salt = crypto.randomBytes(16);
      const key = await generateKeyAES128(password, salt);
      logger?.push(`pass: ${password} \nkey:  ${bufferToHexGrouped(key)} \nsalt: ${bufferToHexGrouped(salt)}`);
      for (const relativePath of post) {
        const filepath = path.join(inputDir, relativePath);
        if ((await access(filepath, constants.R_OK)) !== undefined)
          throw new Exception(`Cannot read file to be encrypted '${filepath}'`);
        const outputPath = path.join(outputDir, relativePath);
        await mkdir(path.dirname(outputPath), { recursive: true });
        const payload = await readFile(filepath, { encoding: null });
        // 4 Bytes Fixed Field + 8 Bytes Variable Field are recommended by NIST SP 800-38D
        // We will use a random number to differentiate between different encryption runs.
        const counterBuffer = Buffer.alloc(8);
        // JS number type can only safely represent integers up to 2^53-1. 
        // We have 8 bytes for the variable field, so we could count up to 2^64 - 1.
        // We don't need a BigInt in the foreseeable future, so we will limit the count to 2^32 - 1.
        counterBuffer.writeUInt32BE(ivCounter++);
        const iv = Buffer.concat([ivIdentifier, counterBuffer], 12);
        const { ciphertextContainer, authTag } = encryptData({ data: payload, key, iv, salt }); // For larger files use stream
        await writeFile(outputPath, ciphertextContainer, { encoding: null });
        logger?.push(`- file: ${filepath} \n  enc:  ${outputPath} \n`
          + `  iv:   ${bufferToHexGrouped(iv)} \n  auth: ${bufferToHexGrouped(authTag)}`);
      }
    }
  }
  if (logger)
    console.log([
      `Successfully encrypted batch of files: ${ivCounter} \n`,
      ...logger,
    ].join("\n"));
}

async function generateKeyAES128(password, salt = crypto.randomBytes(16)) {
  // Asynchronous because key generation can take significant time
  return new Promise((resolve, reject) => {
    const iterations = 100_000; // Should be 100k-600k; update file version if this number changes
    const keyLength = 16;
    const digest = "sha256";
    crypto.pbkdf2(password, salt, iterations, keyLength, digest, (err, key) => {
      if (err) return reject(err);
      resolve(key);
    });
  });
}

/**
 * Encrypt arbitrary data with AES-128-GCM.
 * @param {Object} options - Encryption options 
 * @param {Buffer} options.data - Arbitrary binary data
 * @param {Buffer} options.key - 16-byte AES-128 key
 * @param {Buffer} options.iv - 12-byte initialization vector (MUST BE UNIQUE PER KEY OR ELSE ENCRYPTION IS COMPROMISED)
 * @param {Buffer} options.salt - 16-byte salt, make sure it's the same salt used to derive the key
 * @param {String} options.author - Author string, must be exactly 19 chars long
 * @param {Date} options.encryptionDate - Date of encryption
 * @param {number} options.version - Encrypted file container version, must be 1
 * @param {String} options.magicBytes - Magic bytes to identify encrypted file container, must be "KENC"
 * @returns {Buffer} Encrypted file container
 */
function encryptData({
  data, key, iv, salt, author = "https://krank.love/", encryptionDate = new Date(), version = 1, magicBytes = "KENC"
}) {
  if (magicBytes !== "KENC") throw new Error("Magic bytes must be 'KENC'");
  if (version !== 1) throw new Error("Unsupported file version, must be 1");
  if (key.length !== 16) throw new Error("Key must be 16 bytes");
  if (iv.length !== 12) throw new Error("IV must be 12 bytes for GCM");
  if (salt.length !== 16) throw new Error("Salt must be 16 bytes");
  // Author should only be ASCII chars bc we will truncate the chars to the low 7/8 bits
  if (author.length !== 19) throw new Error("Author must be 19 chars long");
  // Auth tag length defaults to 16 anyway but we really want to be sure that the default does not change in the future.
  const cipher = crypto.createCipheriv("aes-128-gcm", key, iv, { authTagLength: 16 });
  const { fileHeader, authTagOffset } =
    createFileHeader({ salt, iv, payloadLength: data.length, author, encryptionDate, version, magicBytes });
  cipher.setAAD(fileHeader);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  authTag.copy(fileHeader, authTagOffset);
  return {
    ciphertextContainer: Buffer.concat([fileHeader, ciphertext]),
    authTag,
  };
}

function createFileHeader({ salt, iv, payloadLength, author, encryptionDate, version, magicBytes }) {
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
  return {
    fileHeader: Buffer.from(fileHeader),
    authTagOffset: totalLength - 16,
  };
}
