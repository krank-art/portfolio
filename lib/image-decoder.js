function readNthLSBs(image, n) {
  if (n < 1 || n > 8)
    throw new Error("n must be between 1 and 8.");

  // Create a canvas and draw the image
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const ctx = canvas.getContext("2d", { colorSpace: 'srgb' });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);

  // Get image pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  console.log(imageData);
  const data = imageData.data;

  // Mask to extract the last n bits
  const bitMask = (1 << n) - 1; // E.g., for n=2, mask = 0b11

  const nthLSBs = [];
  for (let i = 0; i < data.length; i += 4) {
    if (i === 24)
      console.log("lol");
    // Extract last n LSBs from each channel
    const r = data[i] & bitMask;       // Red
    const g = data[i + 1] & bitMask;   // Green
    const b = data[i + 2] & bitMask;   // Blue
    const a = data[i + 3] & bitMask;   // Alpha

    nthLSBs.push({ r, g, b, a });
  }

  return nthLSBs;
}

function consolidateRGBAArrayToUint8Array(rgbaArray, bitLength) {
  if (bitLength < 1 || bitLength > 8)
    throw new Error("bitLength must be between 1 and 8.");
  const bitsPerPixel = 4 * bitLength; // r, g, b, a
  const totalBits = rgbaArray.length * bitsPerPixel;
  const totalBytes = Math.ceil(totalBits / 8);
  const uint8Array = new Uint8Array(totalBytes);

  let currentByteIndex = 0; // Byte index in the Uint8Array
  let bitOffset = 0;        // Current bit position within the byte

  for (const pixel of rgbaArray) {
    const { r, g, b, a } = pixel;
    for (const value of [r, g, b, a]) {
      if (value >= (1 << bitLength))
        throw new Error(`Value ${value} exceeds maximum for ${bitLength} bits.`);
      // Write the bits of the channel to the Uint8Array
      for (let bit = 0; bit < bitLength; bit++) {
        const bitValue = (value >> (bitLength - bit - 1)) & 1; // Extract bit
        uint8Array[currentByteIndex] |= bitValue << (7 - bitOffset); // Write bit
        bitOffset++;
        if (bitOffset === 8) {
          bitOffset = 0;
          currentByteIndex++;
        }
      }
    }
  }
  return uint8Array;
}

function bytesToString(bytes) {
  const decoder = new TextDecoder("utf-8"); // Specify encoding (default is "utf-8")
  return decoder.decode(bytes);
}

export async function setupImageDecoder() {
  document.addEventListener("DOMContentLoaded", (event) => {
    const images = Array.from(document.querySelectorAll("img"));
    for (const image of images) {
      if (!image.classList.contains("encoded-image"))
        continue;

      const leastSignificantBits = readNthLSBs(image, 2);
      const payload = consolidateRGBAArrayToUint8Array(leastSignificantBits, 2);
      console.log(leastSignificantBits);
      console.log(image.src, payload, bytesToString(payload));
      console.log([...payload].slice(0, 40).map(item => item.toString(2).padStart(8, "0")));

      const encoder = new TextEncoder();
      const data = encoder.encode("This is a super secret message.");
      console.log("data before ", data)
      console.log([...data].map(item => item.toString(2).padStart(8, "0")));
    }
  });
}
