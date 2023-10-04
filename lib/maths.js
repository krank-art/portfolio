export function insideRange(value, min, max) {
  return value > min && value < max;
}

export function distance(x1, y1, x2, y2) {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  return Math.sqrt(deltaX ** 2 + deltaY ** 2);
}

function getGreatestCommonDivisor(a, b) {
  if (b === 0) return a;
  return getGreatestCommonDivisor(b, a % b);
}

function getLowestCommonMultiple(a, b) {
  return (a * b) / getGreatestCommonDivisor(a, b);
}

function getLowestCommonDenominator(...numbers) {
  if (numbers.length < 2)
      throw new Error('At least two numbers are required to find the Lowest Common Denominator.');
  let result = numbers[0];
  for (let i = 1; i < numbers.length; i++)
      result = getLowestCommonMultiple(result, numbers[i]);
  return result;
}

export function simplifyFraction(numerator, denominator) {
  if (denominator === 0)
      throw new Error('Denominator cannot be zero.');
  const commonDivisor = getGreatestCommonDivisor(Math.abs(numerator), Math.abs(denominator));
  const simplifiedNumerator = numerator / commonDivisor;
  const simplifiedDenominator = denominator / commonDivisor;
  return [simplifiedNumerator, simplifiedDenominator];
}
