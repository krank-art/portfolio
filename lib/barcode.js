// Only supported barcode is Code128C

const CODE128C_PATTERNS = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100", "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110", "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100", "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000", "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
  "11000101000", "11000100010", "10110111000", "10110001110", "10001101110", "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
  "11000101110", "11011101000", "11011100010", "11011101110", "11101011000", "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100", "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
  "10110000100", "10011010000", "10011000010", "10000110100", "10000110010", "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
  "10100111100", "10010111100", "10010011110", "10111100100", "10011110100", "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110", "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
  "10111101110", "11101011110", "11110101110", "11010000100", "11010010000", "11010011100", "1100011101011" // 106 STOP
];

function encodeCode128C(data) {
  if (!/^\d+$/.test(data))
    throw new Error("Input must be all digits");
  if (data.length % 2 !== 0)
    throw new Error("Input must be an even number of digits");

  const encoded = [];
  let checksum = 105; // Start Code C
  encoded.push(105);

  for (let i = 0; i < data.length; i += 2) {
    const pair = parseInt(data.substring(i, i + 2), 10);
    encoded.push(pair);
    checksum += pair * ((i / 2) + 1);
  }

  const checksumValue = checksum % 103;
  encoded.push(checksumValue);
  encoded.push(106); // Stop code

  return encoded.map(code => CODE128C_PATTERNS[code]);
}

export function generateBarcode({ data, scale = 1, height = 80, color = "#000" }) {
  const patterns = encodeCode128C(data);
  const fullPattern = patterns.join('');
  const width = fullPattern.length * scale;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  let x = 0;
  for (let bit of fullPattern) {
    if (bit === "1") ctx.fillRect(x, 0, scale, height);
    x += scale;
  }
  const imageBase64 = canvas.toDataURL('image/png');
  const imageNoLineBreaks = imageBase64.replace(/[\r\n]+/g, '');
  return {
    width: width,
    height: height,
    image: imageNoLineBreaks,
  };
}

export function drawBarcodeOnCanvas({ canvas, data, barWidth = 2, height = 80, spacing = 10, textMargin = 2 }) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const patterns = encodeCode128C(data);
  const fullPattern = patterns.join('');
  let x = spacing;

  // Draw barcode bars
  for (let bit of fullPattern) {
    ctx.fillStyle = bit === "1" ? "#000" : "#fff";
    ctx.fillRect(x, textMargin, barWidth, height);
    x += barWidth;
  }

  // Draw text
  const textSize = 12 * barWidth;
  ctx.font = `${textSize}px sans-serif`;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.fillText(data, canvas.width / 2, height + textSize + 2 * textMargin);
}
