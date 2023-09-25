import fs from 'fs';
import { AsyncQueue, debounce, promisify, sleep } from '../lib/async.js';

export default class FileWatcher {
  constructor({ dirPath, onChange = () => { }, onError = () => { } }) {
    this.queue = new AsyncQueue();
    this.target = dirPath;
    this.onChange = (...args) => {
      const promisifedOnChange = promisify(onChange);
      // I'm not quite sure why, but we have to include the curly braces for the arrow function on the next line.
      // Otherwise the queue only executes the first task and nothing else.
      this.queue.enqueue(async () => { promisifedOnChange(...args) });
    };
    this.onError = onError;
    this.watcher = FileWatcher.watchDir({
      dirPath: this.target,
      // For some reason, when changing files with VS Code on Windows, there are 3-4 change events fired at once.
      // As comparison, when changing a file with notepad.exe, only one event gets fired.
      // So we debounce the callback for the event to only handle actual changes.
      onChange: debounce(this.onChange, 50),
      onError: this.onError,
    });
  }

  static watchDir({ dirPath, onChange = () => { }, onError = () => { } }) {
    const watcher = fs.watch(dirPath, (eventType, filename) => {
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
    this.watcher.close();
    this.queue.clear();
  }
}
