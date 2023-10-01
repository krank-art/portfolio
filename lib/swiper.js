import { distance, insideRange } from "./maths.js";

export const SwipeDir = Object.freeze({
  Left: "left",
  Right: "right",
  Unknown: "unknown",
});

export default class Swiper {
  constructor({ container, lengthThreshold = 75, directionThreshold = 40 }) {
    this.container = container;
    this.lengthThreshold = lengthThreshold;
    this.directionThreshold = directionThreshold;
    this.startX = null;
    this.startY = null;
    this.endX = null;
    this.endY = null;
    this.container.addEventListener('touchstart', this.onSwipeStart.bind(this));
    this.container.addEventListener('touchmove', this.onSwipeMove.bind(this));
    this.container.addEventListener('touchend', this.onSwipeEnd.bind(this));
    this.callbacks = [];
  }

  onSwipeStart(event) {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.endX = this.startX;
    this.endY = this.startY;
  }

  onSwipeMove(event) {
    this.endX = event.touches[0].clientX;
    this.endY = event.touches[0].clientY;
  }

  onSwipeEnd() {
    const deltaX = this.endX - this.startX;
    const deltaY = this.endY - this.startY;
    const length = distance(this.startX, this.startY, this.endX, this.endY);
    if (length < this.lengthThreshold) return;
    const angle = Math.atan2(deltaY, deltaX);
    const degrees = angle * (180 / Math.PI);
    const threshold = this.directionThreshold;
    const direction = Swiper.getDirection(threshold, degrees);
    for (const callback of this.callbacks)
      callback({
        deltaX,
        deltaY,
        length,
        angle,
        degrees,
        threshold,
        direction,
      });
  }

  static getDirection(threshold, degrees) {
    if (insideRange(degrees, -threshold, threshold))
      return SwipeDir.Right;
    if (insideRange(degrees, 180 - threshold, 180) || insideRange(degrees, -180, -180 + threshold))
      return SwipeDir.Left;
    return SwipeDir.Unknown;
  }

  addCallback(callback) {
    this.callbacks.push(callback);
  }
}
