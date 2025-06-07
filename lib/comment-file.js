// --- Helper: Encode LEB128 for signed integers ---
function encodeLEB128(value) {
  const result = [];
  let more = true;
  const isNegative = value < 0;
  let byte;

  while (more) {
    byte = value & 0x7F;
    value >>= 7;

    if ((value === 0 && (byte & 0x40) === 0) || (value === -1 && (byte & 0x40) !== 0)) {
      more = false;
    } else {
      byte |= 0x80;
    }

    result.push(byte);
  }

  return result;
}

function encodeBrushInfo(brush, pattern, size) {
  const brushMap = { /* undefined: 0b00, */ brush: 0b01, eraser: 0b10, clear: 0b11 };
  const patternMap = { "100%": 0b00, "75%": 0b01, "50%": 0b10, "25%": 0b11 };
  const brushType = brushMap[brush] ?? 0b00;
  const pat = patternMap[pattern] ?? 0b00;
  const sz = size ?? 0;
  return (brushType << 6) | (pat << 4) | (sz & 0b1111);
}

function crc8Placeholder(data) {
  return 0xAA; // fixed dummy for now
}

function encodeStrokes(strokes) {
  const chunks = [];
  for (const stroke of strokes) {
    const path = stroke.path || [];
    const brushInfo = encodeBrushInfo(stroke.brush, stroke.pattern, stroke.size);
    const strokeBytes = [];
    strokeBytes.push(brushInfo);
    strokeBytes.push(path.length & 0xFF, (path.length >> 8) & 0xFF); // Point count (uint16, little-endian)
    strokeBytes.push(0x00); // Placeholder CRC (to be updated later)

    // Encode points using LEB128 deltas
    let prevX = 0, prevY = 0;
    for (const point of path) {
      const dx = point.x - prevX;
      const dy = point.y - prevY;
      prevX = point.x;
      prevY = point.y;
      strokeBytes.push(...encodeLEB128(dx));
      strokeBytes.push(...encodeLEB128(dy));
    }

    // Calculate CRC for stroke (excluding placeholder)
    const crc = crc8Placeholder(strokeBytes.slice(0, strokeBytes.length));
    strokeBytes[3] = crc; // insert CRC at correct position
    chunks.push(...strokeBytes);
  }

  // Convert to ArrayBuffer
  const buffer = new ArrayBuffer(chunks.length);
  const view = new DataView(buffer);
  chunks.forEach((byte, i) => view.setUint8(i, byte));

  return buffer;
}

function createFileHeader({ version, width, height, strokeCount }) {
  const buffer = new ArrayBuffer(4 + 2 + 2 + 2 + 4 + 2); // 16 bytes total
  const view = new DataView(buffer);
  const encoder = new TextEncoder();
  let offset = 0;
  const magicBytes = encoder.encode("BRSH");
  for (let i = 0; i < 4; i++) {
    view.setUint8(offset++, magicBytes[i]);
  }
  view.setUint16(offset, version, true); offset += 2;
  view.setUint16(offset, width, true); offset += 2;
  view.setUint16(offset, height, true); offset += 2;
  view.setUint32(offset, strokeCount, true); offset += 4;
  view.setUint16(offset, 0xABCD, true); offset += 2;
  return buffer;
}

export function createBinaryFile() {
  // Example usage
  const headerBuffer = createFileHeader({
    version: 1,
    width: 800,
    height: 600,
    strokeCount: 1234
  });
  const strokes = [
    { brush: "clear", size: null, pattern: null, path: null },
    {
      brush: "brush", size: 5, pattern: "100%", path: [
        { x: 39, y: 48 },
        { x: 39, y: 48 },
        { x: 38, y: 47 },
      ]
    }
  ];
  const buffer = encodeStrokes(strokes);

  // Convert to Blob for download (optional)
  const blob = new Blob([headerBuffer, buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "brush_history.bin";
  a.click();
  URL.revokeObjectURL(url);
}
