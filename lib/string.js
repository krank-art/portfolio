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
