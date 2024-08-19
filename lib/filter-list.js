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

class FilterList {
  constructor(tagList, itemList) {
    this.tagList = tagList;
    this.tags = this.getTags(tagList);
    this.itemList = itemList;
    this.items = FilterList.getItems(itemList);
  }

  getTags(tagList) {
    const rawTags = Array.from(tagList.querySelectorAll(FilterListSelector.TagId));
    if (rawTags.length === 0)
      console.warn("Filter list didn't find any tags! ");
    return rawTags.map(rawTag => {
      const populatedTag = {
        id: rawTag.dataset.tagId,
        element: rawTag,
        active: false,
      }
      populatedTag.element.addEventListener("click", (event) => { this.onTagClicked(populatedTag, event) });
      return populatedTag;
    });
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

  onTagClicked(tag, event) {
    tag.active = !tag.active;
    tag.element.setAttribute('aria-pressed', tag.active);
    tag.element.classList.toggle('active', tag.active);
    this.update();
  }

  update() {
    const activeTagIds = this.getActiveTagIds();
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
    const activeTags = this.tags.filter(tag => tag.active);
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
  const sorterRadios = Array.from(document.querySelectorAll(FilterListSelector.SortDirection));
  for (const tagList of tagLists) {
    const tagListId = tagList.dataset.tagListId;
    const itemList = itemLists.find(list => list.dataset.tagListFor === tagListId);
    if (!itemList) {
      console.warn(`Could not find appropriate item list for tag list id "${tagListId}". `);
      continue;
    }
    const filterList = new FilterList(tagList, itemList);
    for (const radio of sorterRadios)
      radio.addEventListener("change", (event) => {
        const direction = radio.dataset.tagSorter;
        filterList.sortList(direction);
      });
  }
}
