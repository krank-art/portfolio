class Lightbox {
  constructor() {
    this.dialog = document.createElement("dialog");
    this.dialog.classList.add("lightbox");
    document.querySelector("body").appendChild(this.dialog);
    this.margin = 0.05; // 5% margin on all edges for 90% action safe zone
    this.scrollY = 0;
  }

  static setElementRect(element, x, y, w, h) {
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = `${w}px`;
    element.style.height = `${h}px`;
  }

  open(img) {
    this.lockScroll();
    const sourceRect = img.getBoundingClientRect();
    const clone = img.cloneNode(true);
    clone.classList.add("lightbox-image");
    const { left: sx, top: sy, width: sw, height: sh } = sourceRect;
    Lightbox.setElementRect(clone, sx, sy, sw, sh);
    this.dialog.innerHTML = "";
    this.dialog.appendChild(clone);
    this.dialog.showModal();
    this.dialog.classList.add("opened");
    clone.getBoundingClientRect(); // force layout so the transition triggers
    const target = this.getTargetRect(img);
    const { left: tx, top: ty, width: tw, height: th } = target;
    Lightbox.setElementRect(clone, tx, ty, tw, th);

    const close = () => {
      Lightbox.setElementRect(clone, sx, sy, sw, sh);
      this.dialog.classList.remove("opened");
      clone.addEventListener(
        "transitionend",
        () => {
          this.dialog.close();
          this.unlockScroll();
        },
        { once: true }
      );
    }

    clone.addEventListener("click", close);
    this.dialog.addEventListener("click", close, { once: true });
    window.addEventListener("keydown", e => {
      e.preventDefault();
      if (e.key === "Escape") close();
    }, { once: true });
  }

  getTargetRect(img) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const maxW = vw * (1 - this.margin * 2);
    const maxH = vh * (1 - this.margin * 2);

    const scale = Math.min(
      maxW / img.naturalWidth,
      maxH / img.naturalHeight
    );

    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;

    return {
      width,
      height,
      left: (vw - width) / 2,
      top: (vh - height) / 2,
    };
  }

  lockScroll() {
    this.scrollY = window.scrollY;
    document.body.classList.add("scroll-locked");
    document.body.style.top = `-${this.scrollY}px`;
  }

  unlockScroll() {
    document.body.classList.remove("scroll-locked");
    document.body.style.top = "";
    window.scrollTo(0, this.scrollY);
  }
}

export function setupLightbox() {
  const lightbox = new Lightbox();
  const galleries = Array.from(document.querySelectorAll("[data-lightbox-area='true']"));
  for (const gallery of galleries) {
    document.querySelectorAll("img").forEach(img => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => lightbox.open(img));
    });
  }
}
