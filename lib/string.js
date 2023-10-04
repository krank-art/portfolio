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

export function interpolateString(template, values = {}) {
  return template.replace(/\#\{([^{}]+)\}/g, function(match, key) {
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
