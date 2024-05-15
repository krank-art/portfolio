const FilterListSelector = Object.freeze({
  TagId: "[data-tag-id]",
  Tags: "[data-tags]",
  TagListId: "[data-tag-list-id]",
  TagListFor: "[data-tag-list-for]",
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

  getActiveTagIds() {
    const activeTags = this.tags.filter(tag => tag.active);
    return activeTags.map(tag => tag.id);
  }
}

export function setupFilterList() {
  const tagLists = Array.from(document.querySelectorAll(FilterListSelector.TagListId));
  const itemLists = Array.from(document.querySelectorAll(FilterListSelector.TagListFor));
  for (const tagList of tagLists) {
    const tagListId = tagList.dataset.tagListId;
    const itemList = itemLists.find(list => list.dataset.tagListFor === tagListId);
    if (!itemList) {
      console.warn(`Could not find appropriate item list for tag list id "${tagListId}". `);
      continue;
    }
    new FilterList(tagList, itemList);
  }
}
