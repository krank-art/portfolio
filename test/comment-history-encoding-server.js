import assert from "assert";
import { resolve } from 'path';
import { encodeCommentHistory } from "../lib/comment-file.js";
import { parseJsonFile } from '../lib/filesystem.js';
import config from './test-config.js';

const target = "/test/comment-history-decoding.php";
const inputPath = resolve("test", "comment-history-payload.json");

const testHistory = parseJsonFile(inputPath);
const encodedHistory = encodeCommentHistory(testHistory);
const historyFile = new Blob([encodedHistory], { type: 'application/octet-stream' });
const commentData = new FormData();
commentData.append('history', historyFile);
const response = await fetch(config.host + target, { method: 'POST', body: commentData });
if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
const decodedHistory = await response.json();
assert.deepStrictEqual(decodedHistory, testHistory);
console.log("Yay, successfully encoded on client and decoded on server!");
