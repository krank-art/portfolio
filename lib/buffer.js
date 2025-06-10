export function arrayBufferToHex(buffer) {
  // For debugging hex
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function arrayBufferToReadable(buffer) {
  // For debugging a buffer
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(byte => {
    const hex = byte.toString(16).padStart(2, '0');
    const decimal = byte.toString(10);
    const binary = byte.toString(2).padStart(8, '0');
    return `${binary.slice(0, 4)} ${binary.slice(4)}  ${hex}  ${decimal}`;
  });
}

export function concatArrayBuffers(buffers) {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return result.buffer;
}
