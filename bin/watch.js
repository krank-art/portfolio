import { pathing } from './cli.js';
import FileWatcher from '../lib/filewatcher.js';

const testWatcher = new FileWatcher({
  dirPath: pathing.pages,
  onChange: (eventType, fileName) => {
    console.log(eventType, `File ${fileName} has changed.`);
  },
  recursive: true,
});
