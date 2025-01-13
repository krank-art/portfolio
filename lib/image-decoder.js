async function readNthLSBs(imageSrc, n) {
  if (n < 1 || n > 8) {
    throw new Error("n must be between 1 and 8.");
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Allow cross-origin images
    img.src = imageSrc;

    img.onload = () => {
      // Create a canvas and draw the image
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Get image pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Mask to extract the last n bits
      const bitMask = (1 << n) - 1; // E.g., for n=2, mask = 0b11

      const nthLSBs = [];
      for (let i = 0; i < data.length; i += 4) {
        // Extract last n LSBs from each channel
        const r = data[i] & bitMask;       // Red
        const g = data[i + 1] & bitMask;   // Green
        const b = data[i + 2] & bitMask;   // Blue
        const a = data[i + 3] & bitMask;   // Alpha

        nthLSBs.push({ r, g, b, a });
      }

      resolve(nthLSBs);
    };

    img.onerror = (err) => {
      reject(new Error("Failed to load image: " + err.message));
    };
  });
}

/*
// Usage Example
(async () => {
  try {
    const imageSrc = "path_to_image.png"; // Path to the PNG file
    const n = 2; // nth LSB to read
    const nthLSBs = await readNthLSBs(imageSrc, n);
    console.log(nthLSBs);
  } catch (error) {
    console.error(error.message);
  }
})();
*/

// Usage Example:
//readNthLSBs("path_to_image.png", 2, (nthLSBs) => {
//  console.log(nthLSBs);
//});

export async function setupImageDecoder() {
  const images = Array.from(document.querySelectorAll("img"));
  for (const image of images) {
    if (!image.classList.contains("encoded-image"))
      continue;
    const leastSignificantBits = await readNthLSBs(image.src, 2);
    console.log(image.src, leastSignificantBits);
  }
}
