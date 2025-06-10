import { invertObject } from "./object";

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

function encodeSignedLEB128_4bit(value) {
  /*
   * Little Endian Base 8 (LEB8)
   * based on LEB128
   * 
   * algorithm for different numbers
   * -------------------------------
   * dec     -1          23                  -319   decimal
   * bin      1       10111             100111111   binary encoding
   * fll    001      010111          000100111111   fill to multiple of 3 (add another 3 bit if MSB is set)
   * neg    110          --          111011000000   (Two's Complement) negate all bits
   * add    111          --          111011000001   (Two's Complement) add one bit
   * spl    111    010  111    111  011  000  001   split bits into groups
   * hbt   0111   0010 1111   0111 1011 1000 1001   low bit to MSN (most significant nibble), high bit to all else
   * srt   0111   1111 0010   1001 1000 1011 0111   sort output (LSN to MSN)
   * 
   * encoding capacity per nibble
   * ----------------------------
   * 000               2^3      -4 to 3
   * 000 000           2^6     -32 to 31
   * 000 000 000       2^9    -256 to 255
   * 000 000 000 000   2^12  -2048 to 2047
   */
  let more = true;
  const nibbles = [];

  while (more) {
    let nibble = value & 0b111; // 3 bits
    value >>= 3;
    /*
     * Determine if more nibbles are needed
     * If the last bit is 1, we need one more bit to denote the sign
     * For example, if we take 0b100111111 (319), we need to split up the number into 3 bit groups.
     * This gives us 100 111 111. We use Two's Complement for our sign notation, so the most significant bit (MSB) gives us
     * the sign (1 = negative, 0 = positive).
     * In this case the MSB is already occupied, so we need to add one more 3 bit group: 000 100 111 111.
     */
    const signBitSet = (nibble & 0b100) !== 0;
    const isLastNibble =
      (value === 0 && !signBitSet) ||
      (value === -1 && signBitSet);
    nibble |= isLastNibble ? 0b0000 : 0b1000;
    nibbles.push(nibble);
    more = !isLastNibble;
  }
  return nibbles;
}

const brushMap = Object.freeze({ "undefined": 0b00, "brush": 0b01, "eraser": 0b10, "clear": 0b11 });
const patternMap = Object.freeze({ "100%": 0b00, "75%": 0b01, "50%": 0b10, "25%": 0b11 });
const brushMapInverted = invertObject(brushMap); // switches key-value to value-key
const patternMapInverted = invertObject(patternMap);

function encodeBrushInfo(brush, pattern, size) {
  const brushType = brushMap[brush] ?? brushMap["undefined"];
  const pat = patternMap[pattern] ?? patternMap["100%"];
  const sz = size ?? 0;
  return (brushType << 6) | (pat << 4) | (sz & 0b1111);
}

function decodeBrushInfo(byte) {
  const brushType = (byte >> 6) & 0b11;
  const pattern = (byte >> 4) & 0b11;
  const size = byte & 0b1111;
  const brush = brushMapInverted[brushType];
  if (brush === "undefined")
    console.warn("Brush 'undefined' should not be set");
  return { brush, pattern: patternMapInverted[pattern], size };
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
    const nibbles = [];
    for (const pt of path) {
      const dx = pt.x - prevX;
      const dy = pt.y - prevY;
      prevX = pt.x;
      prevY = pt.y;
      nibbles.push(...encodeSignedLEB128_4bit(dx));
      nibbles.push(...encodeSignedLEB128_4bit(dy));
    }

    // If odd number of nibbles, pad with 0b0000
    if (nibbles.length % 2 !== 0) {
      nibbles.push(0x0);
    }

    // Pack nibbles into bytes
    for (let i = 0; i < nibbles.length; i += 2) {
      // We want to return least significant nibble (LSN) to most significant nibble (MSN)
      const byte = ((nibbles[i] & 0xF) << 4) | (nibbles[i + 1] & 0xF);
      strokeBytes.push(byte);
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

function decodeStrokes(buffer) {
  const view = new DataView(buffer);
  const strokes = [];
  let offset = 0;

  while (offset < buffer.byteLength) {
    const brushInfo = view.getUint8(offset++);
    const {brush, pattern, size} = decodeBrushInfo(brushInfo);
    const pointCount = view.getUint16(offset, true); offset += 2;
    const crc = view.getUint8(offset++); // TODO: Validate CRC
    const nibbleCount = pointCount * 2;
    const nibbleLEBs = [];
    let currentNibbleLEB = [];
    // Read packed nibbles (2 per byte)
    while (nibbleLEBs.length < nibbleCount && offset < buffer.byteLength) {
      const byte = view.getUint8(offset++);
      const nibbles = [byte & 0xF0, byte & 0x0F];
      for (const nibble of nibbles) {
        if (nibbleLEBs.length >= nibbleCount) break;
        const isLeadingGroup = (nibble & b1000) === b1000;
        if (isLeadingGroup) {
          currentNibbleLEB.push(nibble);
          continue;
        }
        nibbleLEBs.push(currentNibbleLEB);
        currentNibbleLEB = [];
      }
    }

    /*
    // Decode deltas from LEB128 (4-bit version)
    const path = [];
    let prevX = 0, prevY = 0;
    let nibbleOffset = 0;

    const decodeLEB128_4bit = () => {
      let shift = 0, result = 0, byte;
      let sign = 0;

      while (true) {
        byte = nibbles[nibbleOffset++];
        const value = byte & 0x7;
        result |= (value << shift);
        shift += 3;
        if ((byte & 0x8) === 0) break;
      }

      // Sign extend based on last nibble's highest data bit (bit 2)
      if (shift < 32 && (value & 0x4)) {
        result |= (~0 << shift);
      }

      return result;
    };

    for (let i = 0; i < pointCount; i++) {
      const dx = decodeLEB128_4bit();
      const dy = decodeLEB128_4bit();
      const x = prevX + dx;
      const y = prevY + dy;
      path.push({ x, y });
      prevX = x;
      prevY = y;
    }
    */

    strokes.push({
      brush: brush,
      pattern: decodePattern(pattern),
      size,
      //path,
      path: nibbleLEBs,
      crc,
    });
  }

  return strokes;
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
  view.setUint16(offset, 0xABCD, true); offset += 2; //TODO: Generate CRC
  return buffer;
}

function parseFileHeader(buffer) {
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  let offset = 0;
  const magicBytes = [];
  for (let i = 0; i < 4; i++)
    magicBytes.push(view.getUint8(offset++));
  const magic = decoder.decode(new Uint8Array(magicBytes));
  if (magic !== "BRSH")
    throw new Error("Invalid file format: missing magic bytes");
  const version = view.getUint16(offset, true); offset += 2;
  const width = view.getUint16(offset, true); offset += 2;
  const height = view.getUint16(offset, true); offset += 2;
  const strokeCount = view.getUint32(offset, true); offset += 4;
  const crc = view.getUint16(offset, true); offset += 2; //TODO: Generate CRC
  if (version !== 1)
    console.warn("Unsupported brush history file version");
  return { magic, version, width, height, strokeCount, crc };
}

export function encodeCommentHistory({ width, height, strokes }) {
  const headerBuffer = createFileHeader({
    version: 1,
    width: width,
    height: height,
    strokeCount: strokes.length,
  });
  /*
   * const exampleStrokes = [
   *   { brush: "clear", size: null, pattern: null, path: null },
   *   { brush: "brush", size: 5, pattern: "100%", path: [
   *     { x: 39, y: 48 },
   *     { x: 39, y: 48 },
   *     { x: 38, y: 47 }]}];
   */
  const buffer = encodeStrokes(strokes);
  console.log(parseFileHeader(headerBuffer));
  // Convert to Blob for download (optional)
  return new Blob([headerBuffer, buffer], { type: "application/octet-stream" });
}

export function decodeCommentHistory(buffer) {
  
}
