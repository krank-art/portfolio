import fs from 'fs';
import crypto from 'crypto';
import { PNG } from "pngjs";
import { numberToUint32BitString } from './maths.js';

export function getMd5Checksum(string) {
  const md5Hash = crypto.createHash('md5');
  md5Hash.update(string);
  return md5Hash.digest('hex');
}

function encryptImage({ inputFilePath, outputFilePath, key, iv }) {
  const imageBuffer = fs.readFileSync(inputFilePath);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  const encryptedImage = Buffer.concat([cipher.update(imageBuffer), cipher.final()]);
  fs.writeFileSync(outputFilePath, encryptedImage);
  console.log(`Encrypted image saved to ${outputFilePath}`);
}

async function stringTo16Bytes(inputString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString); // Convert the string to a Uint8Array (encoded as UTF-8)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  const truncatedHash = hashArray.slice(0, 16);
  return truncatedHash;
}

export async function encryptImageWithKey({ inputFilePath, outputFilePath, key, iv }) {
  return encryptImage({
    inputFilePath: inputFilePath,
    outputFilePath: outputFilePath,
    key: await stringTo16Bytes(key),
    iv: await stringTo16Bytes(iv),
  });
}

// Helper function to convert text to binary
function textToBinary(text) {
  return text
    .split("")
    .map(char => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

export function embedTextInImage({ inputFile, outputFile, text, n = 2 }) {
  const encoder = new TextEncoder("utf-8");
  embedDataInImage({ inputFile, outputFile, data: encoder.encode(text), n })
}

// Convert arbitrary data to a binary string
function dataToBinary(data) {
  return Array.from(data)
    .map(byte => byte.toString(2).padStart(8, "0"))
    .join("");
}

// Embed binary data into the nth LSBs of the image
export function embedDataInImage({ inputFile, outputFile, data, n }) {
  if (n < 1 || n > 8) {
    throw new Error("n must be between 1 and 8.");
  }

  const requiredBytes = data.length + 4 // We need 4 bytes for uint32 to set length at start
  const binaryData = numberToUint32BitString(data.length) + dataToBinary(data);
  const bitMask = 0xFF << n & 0xFF; // Mask to clear starting from the nth LSB and going to the topmost LSB, e.g. 1111 1100 if n = 2
  let bitIndex = 0;

  fs.createReadStream(inputFile)
    .pipe(new PNG())
    .on("parsed", function () {
      const availableBits = this.width * this.height * n * 4;
      const availableBytes = Math.floor(availableBits / 8);
      if (requiredBytes > availableBytes)
        throw new Error(`Data (${requiredBytes}) does not fit into image (${availableBytes}). `);
      if (this.gamma) {
        delete this.gamma;
        console.log(`Removing gamma from encrypted image because it changes color values in client. `);
      }
      if (!this.srgb)
        this.srgb = true;
      for (let i = 0; i < this.data.length; i++) {
        if (bitIndex < binaryData.length) {
          const bitGroup = parseInt(binaryData.slice(bitIndex, bitIndex + n), 2);
          this.data[i] = (this.data[i] & bitMask) | bitGroup;
          bitIndex += n;
        }
      }

      // Write the modified PNG to a new file
      this.pack().pipe(fs.createWriteStream(outputFile));
      console.log(`Data embedded into ${outputFile}`);
    })
    .on("error", (err) => {
      console.error("Error processing image:", err);
    });
}

export function createTestPNG() {
  const width = 16;
  const height = 16;
  const png = new PNG({ width, height });

  // Fill the image data
  for (let i = 0; i < width * height; i++) {
    const byteValue = i; // Sequential byte value (0-255)

    // Distribute the 8 bits across the RGBA channels (2 bits per channel)
    const r = (byteValue >> 6) & 0x03; // Bits 6-7
    const g = (byteValue >> 4) & 0x03; // Bits 4-5
    const b = (byteValue >> 2) & 0x03; // Bits 2-3
    const a = byteValue & 0x03;        // Bits 0-1

    // Write the pixel data
    const idx = i * 4; // Each pixel takes 4 bytes (RGBA)
    png.data[idx] = r << 6;      // Store R with last two bits as `r`
    png.data[idx + 1] = g << 6;  // Store G with last two bits as `g`
    png.data[idx + 2] = b << 6;  // Store B with last two bits as `b`
    png.data[idx + 3] = a << 6;  // Store A with last two bits as `a`
  }

  // Save the PNG to a file
  png.pack().pipe(fs.createWriteStream('output.png')).on('finish', () => {
    console.log('PNG created successfully: output.png');
  });
}
