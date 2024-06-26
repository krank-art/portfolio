import { uncompressTags } from "./tag-util.js";

class AutocompletePopup {
  constructor({ parent, input, suggestions }) {
    this.input = input;
    this.parent = parent;
    this.document = this.parent.ownerDocument;
    this.popup = this.document.createElement("div");
    this.popup.classList.add("tag-helper-popup");
    this.parent.appendChild(this.popup);
    this.suggestions = new Set(suggestions);
    this.activeIndex = -1;
    this.opened = false;

    this.input.addEventListener("input", () => this.handleInput());
    this.input.addEventListener("keydown", (event) => this.handleKeyDown(event));
  }

  get filteredSuggestions() {
    const inputValue = this.input.value;
    const filteredSuggestions = this.filterSuggestions(inputValue);
    return AutocompletePopup.sortSuggestions(filteredSuggestions, inputValue);
  }

  filterSuggestions(input) {
    return Array.from(this.suggestions).filter(suggestion =>
      suggestion.toLowerCase().includes(input.toLowerCase())
    );
  }

  static sortSuggestions(suggestions, substring) {
    return suggestions.sort((a, b) => {
      const startsWithSubstrA = a.startsWith(substring);
      const startsWithSubstrB = b.startsWith(substring);
      if (startsWithSubstrA && !startsWithSubstrB)
        return -1; // a comes first if it starts with the substring
      if (!startsWithSubstrA && startsWithSubstrB)
        return 1; // b comes first if it starts with the substring
      // If both start with or both don't start with, compare based on indexOf
      const indexA = a.indexOf(substring);
      const indexB = b.indexOf(substring);
      return indexA - indexB;
    });
  }

  addSuggestion(string) {
    this.suggestions.add(string);
  }

  removeSuggestion(string) {
    this.suggestions.remove(string);
  }

  showSuggestions(filteredSuggestions) {
    this.popup.innerHTML = '';

    filteredSuggestions.forEach((suggestion, index) => {
      const suggestionElement = this.document.createElement("div");
      suggestionElement.classList.add("tag-helper-suggestion");
      suggestionElement.textContent = suggestion;

      const matchIndex = suggestion.toLowerCase().indexOf(this.input.value.toLowerCase());
      if (matchIndex !== -1) {
        const matchStart = suggestion.substring(0, matchIndex);
        const matchText = suggestion.substring(matchIndex, matchIndex + this.input.value.length);
        const matchEnd = suggestion.substring(matchIndex + this.input.value.length);
        suggestionElement.innerHTML = `${matchStart}<strong>${matchText}</strong>${matchEnd}`;
      }

      suggestionElement.addEventListener("click", () => this.handleSuggestionClick(suggestion));
      suggestionElement.addEventListener("mouseover", () => this.setActiveSuggestion(index));

      this.popup.appendChild(suggestionElement);
    });

    if (filteredSuggestions.length > 0) {
      this.showPopup();
      this.setActiveSuggestion(0);
    } else {
      this.hidePopup();
    }
  }

  showPopup() {
    const inputRect = this.input.getBoundingClientRect();
    this.popup.style.display = "block";
    this.popup.scrollTop = 0;
    this.opened = true;
  }

  hidePopup() {
    this.popup.style.display = "none";
    this.opened = false;
  }

  setActiveSuggestion(index) {
    const suggestionElements = this.popup.querySelectorAll('.tag-helper-suggestion');
    suggestionElements.forEach((element, i) => {
      if (i === index) {
        element.classList.add('active');
        AutocompletePopup.scrollIntoViewIfNeeded(this.popup, element);
      } else {
        element.classList.remove('active');
      }
    });
    this.activeIndex = index;
  }

  static scrollIntoViewIfNeeded(container, element) {
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    if (elementRect.top < containerRect.top) {
      element.scrollIntoView({ block: 'start' });
      return;
    }
    if (elementRect.bottom > containerRect.bottom) {
      element.scrollIntoView({ block: 'end' });
      return;
    }
  }

  handleInput() {
    this.showSuggestions(this.filteredSuggestions);
  }

  handleSuggestionClick(suggestion) {
    this.input.value = suggestion;
    this.hidePopup();
    this.input.focus();
  }

  handleKeyDown(event) {
    const suggestionElements = this.popup.querySelectorAll('.tag-helper-suggestion');

    if (event.key === 'Escape') {
      this.hidePopup();
      return;
    }
    if (!this.opened)
      return;
    const clampIndex = (index) => Math.min(Math.max(index, 0), suggestionElements.length - 1);
    if (event.key === 'ArrowDown') {
      this.setActiveSuggestion(clampIndex(this.activeIndex + 1));
      this.input.value = suggestionElements[this.activeIndex].textContent;
      return;
    } if (event.key === 'ArrowUp') {
      this.setActiveSuggestion(clampIndex(this.activeIndex - 1));
      this.input.value = suggestionElements[this.activeIndex].textContent;
      return;
    }
    if (event.key === 'Enter' && !this.suggestions.has(this.input.value)) {
      return;
    }
    if (event.key === 'Enter' && this.activeIndex !== -1) {
      this.input.value = suggestionElements[this.activeIndex].textContent;
      this.activeIndex = -1;
      this.hidePopup();
    }
  }
}

class TagInput {
  constructor({ document, onSubmit = () => { }, suggestions, parent }) {
    this.document = document;
    this.parent = parent;
    this.element = document.createElement("div");
    this.element.classList.add("tag-helper-input");
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Type here";
    const form = document.createElement("form");
    form.appendChild(searchInput);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      onSubmit(searchInput.value);
      searchInput.value = "";
    });
    const autocompletePopup = new AutocompletePopup({ parent, suggestions, input: searchInput });
    this.element.appendChild(form);
  }
}

class TagViewer {
  constructor({ document, onItemDelete = () => { } }) {
    this.document = document;
    this.onItemDelete = onItemDelete;
    this.element = this.document.createElement("div");
    this.element.classList.add("tag-helper-viewer");
    this.list = this.document.createElement("ul");
    this.element.appendChild(this.list);
  }

  update(...items) {
    this.list.innerHTML = "";
    for (const item of items) {
      const listItem = this.document.createElement("li");
      listItem.textContent = item;
      const deleteButton = this.document.createElement("button");
      deleteButton.type = "button";
      deleteButton.innerHTML = "&times;";
      deleteButton.addEventListener("click", (event) => this.onItemDelete(item));
      listItem.appendChild(deleteButton);
      this.list.appendChild(listItem);
    }
  }
}

export class TagHelper {
  constructor({ document, saveKey, fallbackDataUrl }) {
    this.document = document;
    this.saveKey = saveKey;
    this.fallbackDataUrl = fallbackDataUrl;
    this.suggestedTags = null;
    this.savedTags = null;
    this.storage = null;
    this.element = null;
    this.viewer = null;
    this.input = null;
    this.currentPath = null;
  }

  async initialize() {
    this.element = this.document.createElement("div");
    this.element.classList.add("tag-helper");
    this.storage = new TagStorage(this.saveKey);
    await this.storage.loadWithFallback(this.fallbackDataUrl);
    const uniqueTags = TagStorage.getUniqueTags(this.storage.data);
    this.suggestedTags = new Set(uniqueTags);
    this.currentPath = window.location.pathname;
    const currentTags = this.storage.getTags(this.currentPath);
    this.savedTags = new Set(currentTags);
    this.viewer = new TagViewer({
      document: this.document,
      onItemDelete: (item) => {
        this.storage.removeTag(this.currentPath, item);
        this.storage.save();
        this.savedTags.delete(item);
        this.updateView();
      }
    });
    this.input = new TagInput({
      document: this.document,
      onSubmit: (value) => {
        if (value.trim().length > 0)
          this.savedTags.add(value);
        this.storage.addTag(this.currentPath, value);
        this.storage.save();
        this.updateView();
        console.log(this.savedTags)
      },
      suggestions: this.suggestedTags,
      parent: this.element,
    });
    this.element.appendChild(this.viewer.element);
    this.element.appendChild(this.input.element);
    this.updateView();
  }

  mount(element) {
    element.appendChild(this.element);
  }

  updateView() {
    this.viewer.update(...[...this.savedTags].sort());
  }
}

class TagStorage {
  constructor(saveKey) {
    this.saveKey = saveKey;
    this.data = null;
  }

  load() {
    const item = localStorage.getItem(this.saveKey);
    this.data = JSON.parse(item);
  }

  async loadWithFallback(fallbackUrl) {
    if (localStorage.getItem(this.saveKey) === null) {
      const rawData = await TagStorage.loadJSON(fallbackUrl);
      this.data = uncompressTags(rawData);
      return;
    }
    this.load();
  }

  save() {
    localStorage.setItem(this.saveKey, JSON.stringify(this.data));
  }

  hasPath(path) {
    return this.data.hasOwnProperty(path);
  }

  addTag(path, tag) {
    const tags = this.data[path];
    if (!tags) throw new Error(`There is no known path '${path}' for tags. `);
    const newTagsSet = new Set(tags);
    newTagsSet.add(tag);
    const newTags = [...newTagsSet].sort(); // Make sure tags are unique.
    this.data[path] = newTags;
  }

  removeTag(path, tag) {
    const tags = this.data[path];
    if (!tags) throw new Error(`There is no known path '${path}' for tags. `);
    const newTagsSet = new Set(tags);
    newTagsSet.delete(tag);
    const newTags = [...newTagsSet].sort(); // Make sure tags are unique.
    this.data[path] = newTags;
  }

  getTags(path) {
    const tags = this.data[path];
    if (!tags) throw new Error(`There is no known path '${path}' for tags. `);
    return [...tags];
  }

  static getUniqueTags(data) {
    /* Save data structure is as follows:
     * [ 
     *   { path: "/art/alligator", tags: [ "alligator", "grayscale", "blackAndWhite" ] },
     *   { path: "/art/bear-hug", tags: [ "bear", "deer", "embrace" ] },
     *   // etc...
     * ]
     */
    const uniqueTags = new Set();
    for (const prop in data) {
      const tagsPerPage = data[prop];
      for (const tag of tagsPerPage)
        uniqueTags.add(tag);
    }
    return [...uniqueTags].sort();
  }

  static async loadJSON(url) {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error('Failed to fetch JSON data from ' + url);
    return await response.json();
  }
}
