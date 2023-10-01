import "../style/main.scss";

function loadStorage(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : item;
}

function saveStorage(key, value) {
  localStorage.setItem(key, value);
}

function setupGallery() {
  const expansionClass = "info-expanded";
  const SaveFile = Object.freeze({
    SidebarExpanded: "krank.sidebarExpanded",
  });

  const galleryContainer = document.getElementById("gallery-container");
  if (!galleryContainer) return;
  const galleryToggleMemory = loadStorage(SaveFile.SidebarExpanded);
  if (!!galleryToggleMemory)
    galleryContainer.classList.add(expansionClass);
  const galleryToggle = document.getElementById("gallery-toggle");
  galleryToggle.disabled = false;
  galleryToggle.addEventListener("click", (event) => {
    galleryContainer.classList.toggle(expansionClass);
    const hasClass = galleryContainer.classList.contains(expansionClass);
    saveStorage(SaveFile.SidebarExpanded, hasClass);
  });
}

setupGallery();
