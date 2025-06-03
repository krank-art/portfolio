import { GlobalShortcuts } from "./shortcuts";
import { loadStorage, saveStorage } from "./storage";
import Swiper, { SwipeDir } from "./swiper";

const expansionClass = "info-expanded";
const SaveFile = Object.freeze({
  SidebarExpanded: "krank.sidebarExpanded",
});

function setupGallerySwiping(container, nextButton, previousButton) {
  const swiper = new Swiper({ container });
  swiper.addCallback(({ direction }) => {
    if (direction === SwipeDir.Left && nextButton) {
      nextButton.click();
      return;
    }
    if (direction === SwipeDir.Right && previousButton) {
      previousButton.click();
      return;
    }
  });
}

function setupGalleryShortcuts(closeButton, toggleButton, nextButton, previousButton) {
  const shortcuts = new GlobalShortcuts(document);
  shortcuts.add("Escape", () => closeButton.click());
  shortcuts.add("k", () => toggleButton.click());
  if (previousButton)
    shortcuts.add("j", () => previousButton.click());
  if (nextButton)
    shortcuts.add("l", () => nextButton.click());
}

class GallerySidebar {
  constructor(container, button) {
    this.container = container;
    this.button = button;
    this.button.addEventListener("click", ((event) => { this.toggle() }).bind(this));
    this.button.disabled = false;
    this.load();
  }

  get isOpen() {
    return this.container.classList.contains(expansionClass);
  }

  load() {
    const galleryToggleMemory = loadStorage(SaveFile.SidebarExpanded);
    if (!!galleryToggleMemory)
      this.open();
  }

  setOpened(opened) {
    if (opened)
      this.container.classList.add(expansionClass);
    else
      this.container.classList.remove(expansionClass);
    saveStorage(SaveFile.SidebarExpanded, opened);
  }

  open() {
    this.setOpened(true);
  }

  close() {
    this.setOpened(false);
  }

  toggle() {
    this.setOpened(!this.isOpen);
  }
}

export function setupGallery() {
  const container = document.getElementById("gallery-container");
  if (!container) return { sidebar: null };
  const toggleButton = document.getElementById("gallery-toggle");
  const nextButton = document.getElementById("gallery-next");
  const previousButton = document.getElementById("gallery-previous");
  const closeButton = document.getElementById("gallery-close");
  const sidebar = new GallerySidebar(container, toggleButton);
  setupGallerySwiping(container, nextButton, previousButton);
  setupGalleryShortcuts(closeButton, toggleButton, nextButton, previousButton);
  return { sidebar };
}
