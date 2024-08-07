import { deepMergeSafely } from "../lib/object.js";
import { Color } from "../lib/terminal.js";

// Extremely braindead testing, but sufficient for now.

function testMerge(label, inputA, inputB, desiredOutcome) {
  const mergedObject = deepMergeSafely(inputA, inputB);
  const isSame = JSON.stringify(mergedObject) === JSON.stringify(desiredOutcome);
  if (!isSame) {
    console.warn(Color.Red + `Test '${label}' failed, objects differ. ` + Color.Reset);
    return;
  }
  console.warn(Color.Green + `Test '${label}' succeeded, objects got merged successfully. ` + Color.Reset);
}

testMerge("1 simple", 
  { a: [32, 1] }, 
  { a: [74] }, 
  { a: [32, 1, 74] });
testMerge("2 path",
  { a: 42, path: { base: "http://localhost:3000" } },
  { b: "banana", path: { relative: "../../", absolute: "art/fart/bear-jump" } },
  { a: 42, path: { base: "http://localhost:3000", relative: "../../", absolute: "art/fart/bear-jump" }, b: "banana" });
