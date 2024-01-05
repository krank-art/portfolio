export class GlobalShortcuts {
  constructor(document) {
    this.document = document;
    this.shortcuts = new Map();
    this.document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  add(keyCombo, callback) {
    this.shortcuts.set(keyCombo, callback);
  }

  remove(keyCombo) {
    this.shortcuts.delete(keyCombo);
  }

  handleKeyDown(event) {
    const keyCombo = GlobalShortcuts.getKeyName(event);
    if (!this.shortcuts.has(keyCombo)) return;
    const callback = this.shortcuts.get(keyCombo);
    // Clutch so we dont scoop up key events from input fields
    if (this.document.activeElement && this.document.activeElement.tagName === "INPUT")
      return;
    callback();
  }

  static getKeyName(event) {
    const keyName = [];
    if (event.ctrlKey) keyName.push('Ctrl');
    if (event.shiftKey) keyName.push('Shift');
    if (event.altKey) keyName.push('Alt');
    keyName.push(event.key);
    return keyName.join('+');
  }
  /*
   * // Example usage:
   * const shortcuts = new GlobalShortcuts();
   * 
   * // Register a global shortcut
   * shortcuts.add('Ctrl+Shift+D', () => {
   *   console.log('Ctrl+Shift+D pressed!');
   *   // Add your action here
   * });
   */
}
