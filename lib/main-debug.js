import "./main-base";
import { TagHelper } from "./tag-helper";

(async () => {
  return; // Remove if you wanna use tag helper in dev build
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
