import { loadStorage, saveStorage } from "./storage";
import Swiper, { SwipeDir } from "./swiper";

const expansionClass = "info-expanded";
const SaveFile = Object.freeze({
  SidebarExpanded: "krank.sidebarExpanded",
});

function setupGallerySidebar(container, button) {
  const galleryToggleMemory = loadStorage(SaveFile.SidebarExpanded);
  if (!!galleryToggleMemory)
    container.classList.add(expansionClass);
  button.disabled = false;
  button.addEventListener("click", (event) => {
    container.classList.toggle(expansionClass);
    const hasClass = container.classList.contains(expansionClass);
    saveStorage(SaveFile.SidebarExpanded, hasClass);
  });
}

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

export function setupGallery() {
  const container = document.getElementById("gallery-container");
  if (!container) return;
  const toggleButton = document.getElementById("gallery-toggle");
  const nextButton = document.getElementById("gallery-next");
  const previousButton = document.getElementById("gallery-previous");
  setupGallerySidebar(container, toggleButton);
  setupGallerySwiping(container, nextButton, previousButton);
}
