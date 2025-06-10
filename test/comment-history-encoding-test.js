import { arrayBufferToReadable } from "../lib/buffer.js";
import { encodeCommentHistory, decodeCommentHistory } from "../lib/comment-file.js";
import { parseJsonFile } from '../lib/filesystem.js';
import { resolve } from 'path';

/*
 * When looking at the hex editor it might be a bit confusing, as to why sometimes the nibbles have a numeric value of
 * [1000, 1110, 0000] (8, 14, 0). You would expect it to be sorted from high values or to low values in decimal.
 * Lets examine this example:
 *
 *  1000 1110 0000   Sorted from least significant nibble (LSN) to most significant nibble (MSN)
 *  0000 1110 1000   Sorted from MSN to LSN (reversed)
 *   000  110  000   Actual payload of bits (filled)
 *     0  110  000   Minimum amount of bits
 *
 * Because values are signed, we need to add another bit in front to indicate the sign.
 * In this cause we now have 7 bits, which we need 3 groups of 3 bits for.
 */

const inputPath = resolve("test", "comment-history-payload.json");
const testHistory = parseJsonFile(inputPath);
const encodedHistory = encodeCommentHistory(testHistory);
const decodedHistory = decodeCommentHistory(encodedHistory);
const encodedHistoryReadable = arrayBufferToReadable(encodedHistory);
console.log("lol");
