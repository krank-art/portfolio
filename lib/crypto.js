import fs from 'fs';
import crypto from 'crypto';
import { PNG } from "pngjs";

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

/*
encryptImage({
  inputFilePath: 'input_image.png', 
  outputFilePath: 'encrypted_image.png', 
  key: await stringTo16Bytes("butterbrot"),
  iv: await stringTo16Bytes("0123"),
});
*/

// Helper function to convert text to binary
function textToBinary(text) {
  return text
    .split("")
    .map(char => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

/*
// Embed binary data into the 2 MSBs of each channel
export function embedTextInImage({ inputFile, outputFile, text }) {
  const binaryText = textToBinary(text) + "00000000"; // Add null terminator
  let bitIndex = 0;

  fs.createReadStream(inputFile)
    .pipe(new PNG())
    .on("parsed", function () {
      for (let i = 0; i < this.data.length; i++) {
        if (bitIndex < binaryText.length) {
          // Extract the current bit (0 or 1)
          const bit = parseInt(binaryText[bitIndex], 10);

          // Clear the 2 MSBs and set the new bit
          this.data[i] = (this.data[i] & 0b00111111) | (bit << 6);

          bitIndex++;
        }
      }

      // Write the modified PNG to a new file
      this.pack().pipe(fs.createWriteStream(outputFile));
      console.log(`Text embedded into ${outputFile}`);
    })
    .on("error", (err) => {
      console.error("Error processing image:", err);
    });
}
*/

export function embedTextInImage({ inputFile, outputFile, text }) {
  const binaryText = textToBinary(text) + "00000000"; // Add null terminator
  let bitIndex = 0;

  fs.createReadStream(inputFile)
    .pipe(new PNG())
    .on("parsed", function () {
      for (let i = 0; i < this.data.length; i++) {
        if (bitIndex < binaryText.length) {
          // Extract the current bit (0 or 1)
          const bitPair = parseInt(binaryText.slice(bitIndex, bitIndex + 2), 2);

          // Clear the 2 LSBs and set the new bit pair
          this.data[i] = (this.data[i] & 0b11111100) | bitPair;

          bitIndex += 2; // Move to the next pair of bits
        }
      }

      // Write the modified PNG to a new file
      this.pack().pipe(fs.createWriteStream(outputFile));
      console.log(`Text embedded into ${outputFile}`);
    })
    .on("error", (err) => {
      console.error("Error processing image:", err);
    });
}

// Convert arbitrary data to a binary string
function dataToBinary(data) {
  return Array.from(data)
    .map(byte => byte.toString(2).padStart(8, "0"))
    .join("");
}

// Embed binary data into the nth LSBs of the image
export function embedDataInImage(inputFile, outputFile, data, n) {
  if (n < 1 || n > 8) {
    throw new Error("n must be between 1 and 8.");
  }

  const binaryData = dataToBinary(data) + "00000000"; // Null-terminate the data
  const bitMask = ~(1 << (n - 1)); // Mask to clear the nth LSB
  let bitIndex = 0;

  fs.createReadStream(inputFile)
    .pipe(new PNG())
    .on("parsed", function () {
      for (let i = 0; i < this.data.length; i++) {
        if (bitIndex < binaryData.length) {
          // Extract the current bit
          const bit = parseInt(binaryData[bitIndex], 10);

          // Clear the nth LSB and set the new bit
          this.data[i] = (this.data[i] & bitMask) | (bit << (n - 1));

          bitIndex++;
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
