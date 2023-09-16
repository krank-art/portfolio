const fs = require('fs');

const filePath = 'path/to/watched/file-or-directory';

const watcher = fs.watch(filePath, (eventType, filename) => {
  if (eventType === 'change') {
    console.log(`File ${filename} has changed.`);
    // Perform actions here when the file changes.
  }
});

watcher.on('error', (error) => {
  console.error(`Watcher error: ${error}`);
});

// To stop watching the file, you can call watcher.close() when needed.
// watcher.close();
