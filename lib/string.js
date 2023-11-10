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
