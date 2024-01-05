import "../style/main.scss";
import { setupBlogNav } from "./blog-nav";
import { setupGallery } from "./gallery";
import { TagHelper } from "./tag-helper";

setupGallery();
setupBlogNav();
(async () => {
  if (!window.location.pathname.startsWith("/art/")) return;
  const tagHelper = new TagHelper({
    document,
    saveKey: "krank.tagHelper.art",
    fallbackDataUrl: "/data/art-tags.json",
  });
  await tagHelper.initialize();
  const sideBar = document.querySelector(".gallery-info");
  tagHelper.mount(sideBar ?? document.body);
})();
