import { camelToKebabCase } from "./string";

export function setupClickableTags() {
  const tags = Array.from(document.querySelectorAll("[data-tag-id]"));
  for (const tag of tags) {
    const target = tag.dataset.target;
    if (!target) continue;
    tag.addEventListener("click", (event) => {
      const url = new URL(window.location.href);
      url.searchParams.set('t', camelToKebabCase(tag.dataset.tagId));
      url.pathname = "/"+ target;
      window.location.href = url.href;
    });
  }
}
