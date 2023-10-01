import { insideRange } from "./maths.js";

export const SwipeDir = Object.freeze({
  Left: "left",
  Right: "right",
  Unknown: "unknown",
});

export default class Swiper {
  constructor(container) {
    this.container = container;
    this.startX = null;
    this.startY = null;
    this.endX = null;
    this.endY = null;
    this.container.addEventListener
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
    const angle = Math.atan2(deltaY, deltaX);
    const degrees = angle * (180 / Math.PI);
    const threshold = 40;

    let direction = '';
    if (insideRange(degrees, -threshold, threshold))
      direction = SwipeDir.Right;
    else if (insideRange(degrees, 180 - threshold, 180) || insideRange(degrees, -180, -180 + threshold))
      direction = SwipeDir.Left;
    else
      direction = SwipeDir.Unknown;

    for (const callback of this.callbacks)
      callback({
        deltaX,
        deltaY,
        angle,
        degrees,
        threshold,
        direction,
      });
    /*
    if (Math.abs(degrees) < threshold) {
      // Horizontal swipe detected
      if (deltaX > 0) {
        // Right swipe
        alert('Right swipe detected');
      } else {
        // Left swipe
        alert('Left swipe detected');
      }
    }*/
  }

  addCallback(callback) {
    this.callbacks.push(callback);
  }
}
