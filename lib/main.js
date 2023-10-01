import "../style/main.scss";

function setupGallery() {
  const galleryContainer = document.getElementById("gallery-container");
  if (!galleryContainer) return;
  const galleryToggle = document.getElementById("gallery-toggle");
  galleryToggle.disabled = false;
  galleryToggle.addEventListener("click", (event) => {
    galleryContainer.classList.toggle("info-expanded");
  });
}

setupGallery();
