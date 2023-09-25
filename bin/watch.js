import { pathing } from './cli.js';
import FileWatcher from '../lib/filewatcher.js';
import { Color } from '../lib/terminal.js';

const templateWatcher = new FileWatcher({
  dirPath: pathing.pages,
  onChange: (eventType, fileName) => {
    console.log(Color.Orange + `'${eventType}' on file '${fileName}'. Rebuilding HTML. `
      + Color.Gray + `(${new Date()})` + Color.Reset);
  },
  recursive: true,
});
