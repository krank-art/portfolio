const FilterListSelector = Object.freeze({
  TagId: "[data-tag-id]",
  Tags: "[data-tags]",
  TagListId: "[data-tag-list-id]",
  TagListFor: "[data-tag-list-for]",
});

class FilterList {
  constructor(tagList, itemList) {
    this.tagList = tagList;
    this.tags = FilterList.getTags(tagList);
    this.itemList = itemList;
    this.items = FilterList.getItems(itemList);
  }

  static getTags(tagList) {
    const rawTags = Array.from(tagList.querySelectorAll(FilterListSelector.TagId));
    if (rawTags.length === 0)
      console.warn("Filter list didn't find any tags! ");
    return rawTags.map(rawTag => {
      const populatedTag = {
        id: rawTag.dataset.tagId,
        element: rawTag,
        active: false,
      }
      populatedTag.element.addEventListener("click", (event) => { FilterList.onTagClicked(populatedTag, event) });
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

  static onTagClicked(tag, event) {
    console.log(tag.id);
  }
}

export function setupFilterList() {
  const tagLists = Array.from(document.querySelectorAll(FilterListSelector.TagListId));
  const itemLists = Array.from(document.querySelectorAll(FilterListSelector.TagListFor));
  //if (tagLists.length !== itemLists.length)
  //  console.warn(`Mismatch between the tag list count (${tagLists.length}) and the item list count (${itemLists.length}). `);
  //const listPairCount = Math.min(tagLists.length, itemLists.length);
  //for (let i = 0; i < listPairCount; i++)
  //  new FilterList(tagLists[i], itemLists[i]);
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
