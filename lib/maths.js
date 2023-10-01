export function insideRange(value, min, max) {
  return value > min && value < max;
}

export function distance(x1, y1, x2, y2) {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  return Math.sqrt(deltaX ** 2 + deltaY ** 2);
}
