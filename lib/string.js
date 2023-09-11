export function makeFirstLetterLowerCase(input) {
  if (input.length === 0) return input;
  return input[0].toLowerCase() + input.slice(1);
}
