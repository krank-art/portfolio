function getDistanceIncludingMargin(elem1, elem2) {
  // TODO: What if elem2 is actually to the left of elem1? (direction reversed)
  const rect1 = elem1.getBoundingClientRect();
  const rect2 = elem2.getBoundingClientRect();
  const style1 = getComputedStyle(elem1);
  const style2 = getComputedStyle(elem2);
  const marginRight1 = parseFloat(style1.marginRight);
  const marginLeft2 = parseFloat(style2.marginLeft);
  return rect2.right + marginLeft2 - (rect1.left - marginRight1);
}

function getWidthOfElements(elements) {
  const firstItem = elements[0];
  const lastItem = elements[elements.length - 1];
  return getDistanceIncludingMargin(firstItem, lastItem);
}

function animateElement(element, boundsLeft, boundsRight) {
  /*
   * We have a row with a list of items.
   * We want to infinitely scroll the list of items in the parent container.
   * Let's say for example that  the parent container is 800 pixels wide.
   * It has three child items, one 300 pixels 400 pixels and 200 pixels wide.
   * This means that the total number of children has a bigger width than the parent container.
   * 
   * The items in the  parent container can have variable lengths.
   * Also the items can be ordered in any arbitrary way, so predicting how large the gap on the left is difficult.
   * There is the worst case, that the parent container has exactly one item which takes up all off the parent width.
   * When an item slides off the screen to the right, a gap starts growing on the left.
   * So this gap on the left is at max a little bit smaller than the whole width of the parent container.
   * If you don't want to do complicated calculations, we have to guarantee that all items are duplicated.
   * If the current items do not fill up the parent container, we have to repeat them till they do.
   * 
   *  +--------------------------------+
   *  | [1   ] [2   ] [3   ]           |
   *  +--------------------------------+
   * (1) This is bad, because there's always a gap visible.
   * 
   *  +--------------------------------+
   *  | [1   ] [2   ] [3   ] [1   ] [2   ] ==>
   *  +--------------------------------+
   * (2) The minimum required a mount of repetition would be to fill up the parent container.
   * 
   *  +--------------------------------+
   *  |   [1   ] [2   ] [3   ] [1   ] [2   ] ==>
   *  +--------------------------------+
   * (3) this doesn't work out as soon as the items start sliding to the right.
   * A gap stars growing to the left, because there are no items to slide back in.
   * 
   *  +--------------------------------+
   *  |     [1   ] [2   ] [3   ] [1   ]|[2   ] ==>
   *  +--------------------------------+
   *  +--------------------------------+
   * [2   ] [1   ] [2   ] [3   ] [1   ]| ==>
   *  +--------------------------------+
   * (4) Once the last item is fully offscreen, it starts wrapping around to the front.
   * At least now the gap on the left is filled, but the ordering is also messed up.
   * There should be an item 3 and not an item 2.
   * 
   *  +--------------------------------+
   *  | [1   ] [2   ] [3   ] [1   ] [2   ] [3   ] ==>
   *  +--------------------------------+
   * (5) This means, we always have to repeat all items  so upon wrapping the order is kept.
   * 
   *  +--------------------------------+
   *  | [1                 ] ==>       |
   *  +--------------------------------+
   * (6) It can happen that we have a single item that does not fully fill up the parent.
   * 
   *  +--------------------------------+
   *  | [1                 ] [1                 ] ==>
   *  +--------------------------------+
   * (7) Like we saw earlier, we have to repeat all items to fill up the whole parent.
   * 
   *  +--------------------------------+
   *  |     [1                 ] [1                 ] ==>
   *  +--------------------------------+
   * (8) If we now start sliding the item across, we still have the problem of the gap to the left.
   * We always have to repeat the items 1) once for the front of the list and N times to fill up the right gap.
   * 
   * 
   *  +--------------------------------+
   * ...  ] [1                 ] [1                 ] ==>
   *  +--------------------------------+
   * (9) This configuration allows to safely slide across all the items.
   * 
   *            +--------------------------------+
   *            | [1] [2] [3]                    |
   *            +--------------------------------+
   * (10) Now we will look at a list of items that barely take up any space.
   * 
   *            +--------------------------------+
   *            | [1] [2] [3] [1] [2] [3] [1] [2] [3]
   *            +--------------------------------+
   * (11) First we have to repeat the  group of items  so they fill up the  right gap.
   * 
   *            +--------------------------------+
   *  [1] [2] [3] [1] [2] [3] [1] [2] [3] [1] [2] [3]
   *            +--------------------------------+
   * (12) Next we have to repeat the items to the left so there's is no gap when sliding items in.
   * 
   *            +--------------------------------+
   *  -1- -2- [3] [1] [2] [3] [1] [2] [3] [1] [2] -3-
   *            +--------------------------------+
   * (13) For optimization reasons, we can stop displaying items when they are outside of the parent container.
   * But we still have to update their position for movement.
   * 
   *            +--------------------------------+
   *  ... -2- [3] [1] [2] [3] [1] [2] [3] [1] [2]
   *            +--------------------------------+
   * (14) A simple approach would be to wrap around whole groups of items, which got previously repeated.
   * The problem  is that the pixel values for the movement on each animation frame  can take weird values.
   * This means there's a risk of flashing  when a movement increment is not perfectly aligned with the width of the items.
   * It is safer to wrap around each item individually that went offscreen on the right.
   * 
   *            +-----------------------------------------+
   *            | [1] [2    ] [3  ]                       |
   *            +-----------------------------------------+
   * (15) Here is a full example of items with non uniform widths, that barely take up the parent container.
   * 
   *            +-----------------------------------------+
   *            | [1] [2    ] [3  ] [1] [2    ] [3  ] [1] [2    ] [3  ]
   *            +-----------------------------------------+
   * (16) We repeat the group of items twice to the right to fill up the right gap.
   * 
   *            +-----------------------------------------+
   * ...  ] [3  ] [1] [2    ] [3  ] [1] [2    ] [3  ] [1] [2    ] [3  ]
   *            +-----------------------------------------+
   * (17) Next we repeat the group of items to the left once.
   * So from the original three items with varying width, we now have created three copies that keep their respective order.
   * 
   *                         +-----------------------------------------+
   *   [3  ] [1] [2    ] [3  ] [1] [2    ] [3  ] [1] [2    ] [3  ] [1] [2    ]
   *                         +-----------------------------------------+
   * (18) We wrap around the items, that go offscreen to the right.
   * For clarity's sake we shifted the diagram to the left, so the wrapping is better visible.
   * 
   *                         +-----------------------------------------+
   * ..] [3  ] [1] [2    ] [3  ] [1] [2    ] [3  ] [1] [2    ] [3  ] [1]  ==>
   *                         +-----------------------------------------+
   * (19) We can now start sliding the items to the right.
   * We now have a continuously sliding carousel! 
   * Items can have non-uniform widths and do no need to take up the whole width of the container.
   * The requirement for the carousel to be built is that there is at least one child item.
   * 
   *                   +---------------+
   *   [1] [2    ] [3  ] [1] [2    ] [3  ]
   *                   +---------------+
   * (20) If the group of items take ups the full (or more) width of the parent, we do not need to repeat the items to the right.
   * We can just proceed by repeating the group of items to the left once.
   * 
   * (21) There is a possible optimization technique whereas little elements possible copied by looking at the maximum  Size to the left and maximum with of an item.
   *  for now I will skip talking about this optimism they than tiny because it dost seem a little bit more complicated.
   * 
   * (22) The whole thing also needs to be responsive, meaning that if the parent width changes, we also have to rebuild the carousel.
   * To not overload the client, we have to use some debouncing + 500ms timeout when the parent size changes.
   * 
   * (23) When the carousel is built, it also looks for a negative margin(?) on the first element.
   * We need to use this so we can offset the rows a little bit of each other.
   * We have to hand over the offset from the CSS, because if we do the offset based only on JavaScript, 
   * there will be a jump once the JavaScript finishes loading and gets executed.
   * CSS will be done rendering earlier than JavaScript (JS executes here on DOMContentLoaded).
   * 
   * 1. We take the total width of the children (300 + 400 + 200),  which is nine hundred pixels.
   * 2. Should the total width of the children be smaller than the total of the parent container, 
   * 2.  each item in the parent container scrolls  to the right, where it wraps around and starts at the beginning again when it reaches the end.
   */
  let start, previousTimeStamp;

  function step(timeStamp) {
    if (start === undefined)
      start = timeStamp;
    const elapsed = timeStamp - start;
    if (previousTimeStamp !== timeStamp) {
      // Math.min() is used here to make sure the element stops at exactly 200px
      element.style.transform = `translateX(${0.1 * elapsed}px)`;
    }
    previousTimeStamp = timeStamp;
    window.requestAnimationFrame(step);
  }

  window.requestAnimationFrame(step);
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function animateDeltaTime(element, speed = 100, startX = 0, endX = 800) {
  let leftOffset = startX;
  let lastTimestamp = undefined;

  function animate(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = timestamp - lastTimestamp;
    const newLeft = leftOffset + speed * deltaTime / 1000;
    leftOffset = mod(newLeft, endX);
    element.style.transform = `translateX(${leftOffset}px)`;
    lastTimestamp = timestamp;
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function ItemCarousel(element, speed = 100) {
  this.element = element;
  this.speed = speed;
  this.children = Array.from(element.children);
  this.childClones = [];
  this.itemWidths = this.children.map(child => child.getBoundingClientRect().width);
}

ItemCarousel.prototype.setup = function setup() {
  this.prependChildrenWithClones();
  this.fillUpGapWithChildClones();
  const childWidth = this.getWidthOfChildren();
  for (const child of this.element.children) {
    //const startX = this.speed >= 0 ? 0 : childWidth;
    //const endX = this.speed >= 0 ? childWidth : 0;
    //animateDeltaTime(child, this.speed, startX, endX);
    animateDeltaTime(child, this.speed, 0, childWidth);
  }
}

ItemCarousel.prototype.fillUpGapWithChildClones = function fillUpGapWithChildClones() {
  const childrenWidth = this.getWidthOfChildren();
  const parentWidth = this.element.getBoundingClientRect().width;
  const unfilledWidth = parentWidth - childrenWidth;
  const missingChildrenGroups = unfilledWidth <= 0 ? 0 : Math.ceil(unfilledWidth / childrenWidth);
  for (let i = 0; i < missingChildrenGroups; i++) {
    for (const child of this.children) {
      const clone = child.cloneNode(true);
      this.element.appendChild(clone);
      this.childClones.push(clone);
    }
  }
}

ItemCarousel.prototype.getWidthOfChildren = function getWidthOfChildren() {
  return getWidthOfElements(this.children);
}

ItemCarousel.prototype.prependChildrenWithClones = function prependChildrenWithClones() {
  const reversedChildren = [...this.children].reverse();
  for (const child of reversedChildren) {
    const clone = child.cloneNode(true);
    this.element.prepend(clone);
    this.childClones.push(clone);
  }
  const childWidth = this.getWidthOfChildren();
  this.element.firstChild.style["margin-left"] = -1 * childWidth + "px";
}

export function setupItemCarousels() {
  addEventListener("DOMContentLoaded", (event) => {
    const artRows = document.querySelectorAll(".item-carousel");
    for (let i = 0; i < artRows.length; i++) {
      const artRow = artRows[i];
      const direction = i % 2 === 0 ? 1 : -1;
      const carousel = new ItemCarousel(artRow, 100 * direction);
      carousel.setup();
    }
  });
}
