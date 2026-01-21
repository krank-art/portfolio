// We could also use Crockford Base32 for human-readable/error-resistant, but for now I will prefer an actual internet
// standard. When displaying the code to the user, we need to make sure to actually use a monospaced font.
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // RFC 4648

export function makeFirstLetterLowerCase(input) {
  if (input.length === 0) return input;
  return input[0].toLowerCase() + input.slice(1);
}

export function toKebabCase(inputString) {
  return inputString
    .replace(/\s+-+\s+/g, '-')           // replaces " - "
    .replace(/([a-z])([A-Z])/g, '$1-$2') // replaces camelCase
    .replace(/\s+/g, '-')                // replaces spaces
    .toLowerCase();
}

export function camelCaseToTitleCase(inputString) {
  return inputString
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase() );
}

export function camelToKebabCase(keyword) {
  return keyword.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function kebabToCamelCase(keyword) {
  return keyword.replace(/-./g, match => match.charAt(1).toUpperCase());
}

export function replaceUmlauts(inputString) {
  return inputString
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss');
}

export function getPathSafeName(string) {
  return replaceUmlauts(toKebabCase(string))
    .replace(/^_*(.+?)_*$/g, '$1')
    .replace(/[',.]/g, '');
}

export function interpolateString(template, values = {}) {
  return template.replace(/\#\{([^{}]+)\}/g, function (match, key) {
    return values[key.trim()] || match;
  });
}

export function simplifyBytes(bytes) {
  if (bytes === 0) return '0 Byte';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  const simplifiedSize = Math.round((bytes / Math.pow(1024, i)) * 100) / 100;
  return `${simplifiedSize} ${sizes[i]}`;
}

export function formatTable(table, padding = 2, tabWidth = undefined) {
  // To get a formatted table, where each column is 8 spaces wide and has a guaranteed spacing of 2, 
  // enter 'formatTable(table, 2, 6)'
  const maxCols = table.reduce((max, row) => Math.max(max, row.length), 0);
  const colWidths = new Array(maxCols).fill(0);
  table.forEach(row => {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i], String(row[i]).length);
    }
  });
  return table.map(row => {
    let rowStr = '';
    for (let i = 0; i < row.length; i++) {
      const isLast = i === row.length - 1;
      const cell = String(row[i]);
      let paddingCount = tabWidth
        ? Math.ceil(cell.length / tabWidth) * tabWidth - cell.length
        : colWidths[i] - cell.length;
      if (!isLast) paddingCount += padding;
      const stringPadding = ' '.repeat(paddingCount);
      rowStr += cell + stringPadding;
    }
    return rowStr
  });
}

export function truncateEllipsis(str, maxLength) {
  const ellipsis = "...";
  if (maxLength < ellipsis.length)
    return ellipsis.slice(0, maxLength);
  if (str.length <= maxLength)
    return str;
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

export function formatDateYYYYMMDD(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function parseDateYYYYMMDD(str) {
  if (!/^\d{8}$/.test(str))
    throw new Error("Invalid date string, expected YYYYMMDD");
  const year = Number(str.slice(0, 4));
  const month = Number(str.slice(4, 6)) - 1; // JS months are 0–11
  const day = Number(str.slice(6, 8));
  return new Date(Date.UTC(year, month, day)); // Force construction in UTC
}

export function toBase32(num) {
  if (typeof num !== "bigint") num = BigInt(num);
  if (num === 0n) return BASE32[0];
  let loopCounter = 0;
  let out = "";
  while (num > 0n) {
    out = BASE32[Number(num & 31n)] + out;
    num >>= 5n;
    if (loopCounter++ > 10000)
      throw new Exception("Exceeded base32 loop limit");
  }
  return out;
}

export function base32ToInt(str) {
  let value = 0;
  for (const ch of str.toUpperCase()) {
    const idx = BASE32.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid base32 char: ${ch}`);
    value = (value << 5) | idx;
  }
  return value;
}
