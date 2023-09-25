import fs from 'fs';
import { AsyncQueue, debounce, promisify } from '../lib/async.js';

export default class FileWatcher {
  /**
   * Constructor for a FileWatcher object.
   * @param {Object} options
   * @param {string | string[]} options.target
   * @param {Function} options.onChange
   * @param {Function} options.onError
   * @param {boolean} options.recursive
   */
  constructor({ target, onChange = () => { }, onError = () => { }, recursive = false }) {
    this.queue = new AsyncQueue();
    this.target = target;
    this.onChange = (...args) => {
      const promisifedOnChange = promisify(onChange);
      // I'm not quite sure why, but we have to include the curly braces for the arrow function on the next line.
      // Otherwise the queue only executes the first task and nothing else.
      this.queue.enqueue(async () => { promisifedOnChange(...args) });
    };
    this.onError = onError;
    this.watchers = [];
    const rawWatchers = Array.isArray(target) ? target : [target];
    for (const rawWatcher of rawWatchers) {
      const watcher = FileWatcher.watchDir({
        dirPath: rawWatcher,
        // For some reason, when changing files with VS Code on Windows, there are 3-4 change events fired at once.
        // As comparison, when changing a file with notepad.exe, only one event gets fired.
        // So we debounce the callback for the event to only handle actual changes.
        onChange: debounce(this.onChange, 50),
        onError: this.onError,
        recursive: recursive,
      });
      this.watchers.push(watcher);
    }
  }

  static watchDir({ dirPath, onChange = () => { }, onError = () => { }, recursive = false }) {
    const watcher = fs.watch(dirPath, {
      recursive: recursive,
    }, (eventType, filename) => {
      if (eventType === 'change') {
        onChange(eventType, filename);
      }
    });
    watcher.on('error', (error) => {
      console.error(`Watcher error: ${error}`);
      onError(error);
    });
    return watcher;
  }

  clear() {
    for (const watcher of this.watchers)
      watcher.close();
    this.queue.clear();
  }
}
