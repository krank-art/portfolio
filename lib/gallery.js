import { loadStorage, saveStorage } from "./storage";
import Swiper from "./swiper";

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

function setupGallerySwiping(container) {
  const swiper = new Swiper(container);
  swiper.addCallback(({ direction, length}) => alert(direction + '' + length));
}

export function setupGallery() {
  const container = document.getElementById("gallery-container");
  if (!container) return;
  const button = document.getElementById("gallery-toggle");
  setupGallerySidebar(container, button);
  setupGallerySwiping({container});
}
