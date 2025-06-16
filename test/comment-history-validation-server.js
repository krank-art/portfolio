import { readFileSync} from 'fs';
import { resolve } from 'path';
import config from './test-config.js';

const target = "/test/comment-history-validation.php";
const inputPath = resolve("test", "annoying-dog.png");

const arbitraryData = readFileSync(inputPath);
const malformedHistoryFile = new Blob([arbitraryData], { type: 'application/octet-stream' });
const commentData = new FormData();
commentData.append('history', malformedHistoryFile);
const response = await fetch(config.host + target, { method: 'POST', body: commentData });
if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
const report = await response.text();
console.log(report);
