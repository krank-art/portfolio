// This is intended to be included in the client JS

import { deriveAES128Key } from "./encrypto-common.js";
import { parseDateYYYYMMDD } from "./string.js";

export async function setupNsfwDecryption() {
  const exampleUrl = "/media/nsfw/my-fanastic-file.png.enc";
  try {
    const imageBlob = await getEncryptedFile({ url: exampleUrl, password: "supersecret123" });
    const objectURL = URL.createObjectURL(imageBlob);
    const img = document.createElement("img");
    img.src = objectURL;
    document.body.appendChild(img);
  } catch (error) {
    console.error(`Could not decrypt file '${exampleUrl}'`);
    console.error(error);
  }
}

export function setupPostDecryption() {
  document.addEventListener("DOMContentLoaded", () => {
    const unlockingMask = document.querySelector(".unlocker");
    if (!unlockingMask) return;
    const unlocker = new PostUnlocker(unlockingMask);
  });
}

class PostUnlocker {
  constructor(element) {
    this.element = element;
    // Members sorted by importance
    this.input = element.querySelector(".unlocker-password");
    this.button = element.querySelector(".unlocker-button");
    this.status = element.querySelector(".unlocker-status");
    this.progress = element.querySelector(".unlocker-progress-value");
    this.icon = element.querySelector(".unlocker-icon");

    // Setup
    this.button.addEventListener("click", () => {
      const value = this.input.value;
      if (!value || value.length <= 0) {
        this.input.classList.add("error");
        this.status.textContent = "No key provided, please insert one";
        return;
      }
      this.input.classList.remove("error");
    });
  }
}

async function getEncryptedFile({ url, password, key = null }) {
  const match = url.match(/\.([a-z0-9]+)\.enc$/i);
  if (!match) throw new Error("URL does not have a valid .ext.enc pattern");
  const fileType = match[1].toLowerCase(); // e.g. "jpg", "png", "webm"
  const decryptedFile = await fetchAndDecryptFile({ url, password, key });
  if (decryptedFile === null) throw new Error(`Failed to decrypt '${url}'`);
  if (fileType === "json") {
    const decoder = new TextDecoder("utf-8");
    const jsonString = decoder.decode(decryptedFile);
    return JSON.parse(jsonString);
  }
  const mimeTypes = Object.freeze({
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
  });
  const mimeType = mimeTypes[fileType];
  if (mimeType === undefined) throw new Error("Unsupported file fileType: " + fileType);
  return new Blob([decryptedFile.buffer], { type: mimeType });
}

async function fetchAndDecryptFile({ url, password, key = null }) {
  const { salt, iv, authTag, fileHeader, payload, authTagOffset } = await fetchAndParseEncFile(url);
  const fileHeaderWithEmptyAuthTag = fileHeader.slice(); // We need to copy or else underlying ArrayBuffer is mutated
  fileHeaderWithEmptyAuthTag.fill(0, authTagOffset, authTagOffset + 16); // Placeholder of 16 zero bytes for auth tag
  /*
   * We know that all files for a post have the same salt + password, meaning the same key. 
   * Deriving the key is what takes most time, not the actual deciphering WITH the key.
   * On the overview page we iterate through all images and need to generate the key each time anyway.
   * But on a post page, we have the same key for all encrypted files (post-data.json, full-image.png, thumbnail.png, etc).
   * So if a key gets passed into the function, we will skip deriving one and try decrypting immediately.
   */
  const keyAES = key ?? await deriveAES128Key({ cryptoLib: crypto.subtle, password, salt });
  const rawKeyAES = await crypto.subtle.exportKey("raw", keyAES);
  const readableKeyAES = Array.from(new Uint8Array(rawKeyAES)).map(b => b.toString(16).padStart(2, "0")).join("");
  console.log(readableKeyAES);
  return decryptAES128GCM({ ciphertext: payload, key: keyAES, iv, authTag, aad: fileHeaderWithEmptyAuthTag });
}

async function fetchAndParseEncFile(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const view = new DataView(buffer);
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
  const authTagOffset = offset;
  const authTag = new Uint8Array(buffer, offset, 16); offset += 16;
  const fileHeader = new Uint8Array(buffer, 0, offset);
  const payload = new Uint8Array(buffer, offset, payloadLength); offset += payloadLength;
  if (payload.length !== payloadLength) throw new Error("Mismatch in payload length");
  return {
    magicBytes,
    version,
    encryptionDate,
    author,
    payloadLength,
    salt,
    iv,
    authTag,
    authTagOffset,
    fileHeader,
    payload,
  };
}

/**
 * @param {object} options 
 * @param {Uint8Array} options.ciphertext - Encrypted payload, arbitrary length
 * @param {CryptoKey} options.key - AES-128 key (16 bytes)
 * @param {Uint8Array} options.iv - Initialization vector (12 bytes)
 * @param {Uint8Array} options.authTag - Authentification tag (16 bytes)
 * @param {Uint8Array} options.aad - Optional. Arbitrary length additional authentification data
 * @returns {Uint8Array | false} - Plaintext if successful, otherwise false
 */
async function decryptAES128GCM({ ciphertext, key, iv, authTag, aad = null }) {
  try {
    //const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "AES-GCM" }, false, ["decrypt"]);
    const algorithm = { name: "AES-GCM", iv, tagLength: 128 };
    if (aad) algorithm.additionalData = aad;
    const ciphertextWithTag = new Uint8Array(ciphertext.length + authTag.length);
    ciphertextWithTag.set(ciphertext, 0);
    ciphertextWithTag.set(authTag, ciphertext.length);
    const plaintext = await crypto.subtle.decrypt(algorithm, key, ciphertextWithTag.buffer);
    return new Uint8Array(plaintext);
  } catch (err) {
    console.error(err);
    return null;
  }
}
