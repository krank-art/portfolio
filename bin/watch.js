import fs from 'fs';
import { pathing } from './cli.js';
import { debounce } from '../lib/async.js';

function watchDir({ dirPath, onChange = () => { }, onError = () => { } }) {
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

const onFileChange = (eventType, fileName) => { 
  console.log(eventType, `File ${fileName} has changed.`);
};

watchDir({
  dirPath: pathing.pages,
  // For some reason, when changing files with VS Code on Windows, there are 3-4 change events fired at once.
  // As comparison, when changing a file with notepad.exe, only one event gets fired.
  // So we debounce the callback for the event to only handle actual changes.
  onChange: debounce(onFileChange, 50),
});
