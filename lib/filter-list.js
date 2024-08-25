import { camelToKebabCase, kebabToCamelCase } from "./string";

const FilterListSelector = Object.freeze({
  TagId: "[data-tag-id]",
  Tags: "[data-tags]",
  TagListId: "[data-tag-list-id]",
  TagListFor: "[data-tag-list-for]",
  SortDirection: "[data-tag-sorter]",
});

const FilterListSorter = Object.freeze({
  Ascending: "ascending",
  Descending: "descending",
});

function saveToUrl(prop, delimiter, keywords) {
  if (keywords.length === 0) {
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }
  const kebabCaseKeywords = keywords.map(camelToKebabCase).join(delimiter);
  // Get the current URL parameters and update 't'
  const params = new URLSearchParams(window.location.search);
  params.set(prop, kebabCaseKeywords);
  // Update the URL without reloading the page
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

function loadFromUrl(prop, delimiter) {
  const params = new URLSearchParams(window.location.search);
  const kebabKeywords = params.get(prop);
  if (!kebabKeywords) return [];
  return kebabKeywords.split(delimiter).map(kebabToCamelCase);
}

class FilterList {
  constructor(tagList, itemList) {
    this.tagList = tagList;
    this.tagsById = this.getTagsById(tagList);
    this.itemList = itemList;
    this.items = FilterList.getItems(itemList);
  }

  getTagsById(tagList) {
    const tagsById = new Map();
    const rawTags = Array.from(tagList.querySelectorAll(FilterListSelector.TagId));
    if (rawTags.length === 0)
      console.warn("Filter list didn't find any tags! ");
    for (const rawTag of rawTags) {
      const populatedTag = {
        id: rawTag.dataset.tagId,
        element: rawTag,
        active: false,
      }
      populatedTag.element.addEventListener("click", (event) => { this.onTagClicked(populatedTag.id, event) });
      tagsById.set(populatedTag.id, populatedTag);
    }
    return tagsById;
  }

  static getItems(itemList) {
    const rawItems = Array.from(itemList.querySelectorAll(FilterListSelector.Tags));
    if (rawItems.length === 0)
      console.warn("Filter list didn't find any items! ");
    return rawItems.map(rawItem => {
      return {
        tags: rawItem.dataset.tags.split(","),
        date: rawItem.dataset.date ?? "unknown",
        element: rawItem,
      }
    });
  }

  toggleTag(tagId) {
    const tag = this.tagsById.get(tagId);
    tag.active = !tag.active;
    tag.element.setAttribute('aria-pressed', tag.active);
    tag.element.classList.toggle('active', tag.active);
  }

  onTagClicked(tagId, event) {
    this.toggleTag(tagId);
    this.update();
  }

  loadFromUrl() {
    const loadedTags = loadFromUrl("t", " ");
    for (const tag of loadedTags)
      this.toggleTag(tag);
    this.update();
  }

  update() {
    const activeTagIds = this.getActiveTagIds();
    saveToUrl("t", " ", activeTagIds);
    if (activeTagIds.length === 0) {
      for (const item of this.items)
        item.element.parentElement.style.display = "";
      return;
    }
    for (const item of this.items) {
      const fitsFilter = activeTagIds.every(tagId => item.tags.includes(tagId));
      item.element.parentElement.style.display = fitsFilter ? "" : "none";
    }
  }

  rebuild() {
    for (const item of this.items) {
      const { element: child } = item;
      const listItem = child.parentElement; // The <li> element
      this.itemList.appendChild(listItem);
    }
  }

  getActiveTagIds() {
    const allTags = [... this.tagsById.values()];
    const activeTags = allTags.filter(tag => tag.active);
    return activeTags.map(tag => tag.id);
  }

  sortByDate(direction = FilterListSorter.Descending) {
    if (direction === FilterListSorter.Descending) {
      this.items.sort((a, b) => {
        if (a.date === "unknown" && b.date === "unknown") return 0;
        if (a.date === "unknown") return 1;
        if (b.date === "unknown") return -1;
        return b.date.localeCompare(a.date)
      });
      return;
    }
    if (direction === FilterListSorter.Ascending) {
      console.log("ascending")
      this.items.sort((a, b) => {
        if (a.date === "unknown" && b.date === "unknown") return 0;
        if (a.date === "unknown") return 1;
        if (b.date === "unknown") return -1;
        return a.date.localeCompare(b.date)
      });
      return;
    }
    throw new Error(`Unknown sorting direction '${direction}'`);
  }

  sortList(direction = FilterListSorter.Descending) {
    if (Object.values(FilterListSorter).includes(direction)) {
      this.sortByDate(direction);
      this.rebuild();
      return;
    }
    throw new Error(`Unknown sorting direction '${direction}'`);
  }
}

export function setupFilterList() {
  const tagLists = Array.from(document.querySelectorAll(FilterListSelector.TagListId));
  const itemLists = Array.from(document.querySelectorAll(FilterListSelector.TagListFor));
  // TODO: this will prolly break when using multiple sorted lists per page
  const sorterRadios = Array.from(document.querySelectorAll(FilterListSelector.SortDirection));
  for (const tagList of tagLists) {
    const tagListId = tagList.dataset.tagListId;
    const itemList = itemLists.find(list => list.dataset.tagListFor === tagListId);
    if (!itemList) {
      console.warn(`Could not find appropriate item list for tag list id "${tagListId}". `);
      continue;
    }
    const filterList = new FilterList(tagList, itemList);
    document.addEventListener("DOMContentLoaded", (event) => { filterList.loadFromUrl() });
    for (const radio of sorterRadios)
      // When clicking directly on the radio circle, only "click" is fired. Otherwise "change" is fired.
      for (const eventName of ["click", "change"])
        radio.addEventListener(eventName, (event) => {
          const direction = radio.dataset.tagSorter;
          filterList.sortList(direction);
        });
  }
}
