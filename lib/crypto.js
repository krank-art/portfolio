import fs from 'fs';
import crypto from 'crypto';

export function getMd5Checksum(string) {
  const md5Hash = crypto.createHash('md5');
  md5Hash.update(string);
  return md5Hash.digest('hex');
}

function encryptImage({inputFilePath, outputFilePath, key, iv}) {
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

export async function encryptImageWithKey({inputFilePath, outputFilePath, key, iv}) {
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