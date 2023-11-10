import { isUniquePropertyInObjects } from "./object.js";
import { getPathSafeName } from "./string.js";

/*
 * Example for faulty heading tree:
 * (double heading 1; missing H3 at "H2 Instructions")
 *   H1 Krank
 *   H1 Chocolate Cream Cake
 *     H2 Ingredients
 *       H3 Chocolate cream
 *       H3 Sponge base
 *     H2 Instructions
 *         H4 Chocolate cream
 *       H3 Sponge base
 *       H3 Putting it together
 */

export function createHeadingTree(element) {
  var headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  var headingTree = [];

  for (const heading of headings) {
    const level = parseInt(heading.tagName.charAt(1), 10);
    let currentLevel = headingTree;
    const lastInCurrentLevel = () => currentLevel[currentLevel.length - 1];

    for (var i = 1; i < level; i++) {
      if (!lastInCurrentLevel())
        currentLevel.push({
          type: "substitute",
          level: i,
          children: [],
        });
      if (!lastInCurrentLevel().children)
        lastInCurrentLevel().children = [];
      currentLevel = lastInCurrentLevel().children;
    }

    currentLevel.push({
      type: "heading",
      level: level,
      text: heading.textContent,
      id: heading.id,
      element: heading,
    });
  }

  return headingTree;
}

export function createHeadingTreeWithUniqueIds(element) {
  const headingTree = createHeadingTree(element);
  const headingsById = new Map();
  const traverseHeading = (heading, parent = null) => {
    const { type, level, element: headingElement, id: rawId, text: rawText, children } = heading;
    const text = rawText ?? '';
    const id = !rawId || rawId.length === 0 ? getPathSafeName(text) : rawId;
    const newChildren = children ? children.map(child => traverseHeading(child, heading)) : [];
    const newHeading = {
      type,
      level,
      element: headingElement ?? null,
      id: id ?? '',
      text: text ?? '',
      parent, // causes circular reference, but useful to go from leaf to root
      children: newChildren,
    };
    if (headingsById.has(id))
      headingsById.get(id).push(newHeading);
    else
      headingsById.set(id, [newHeading]);
    return newHeading;
  }
  const headingTreeWithIds = headingTree.map(heading => traverseHeading(heading));

  // Make IDs unique
  const headingsByIdEntries = Object.entries(headingsById);
  for (const [headingId, headings] of headingsByIdEntries) {
    if (headings.length === 1) continue;
    const duplicates = headings.map(heading => { 
      return { 
        heading, 
        currentId: heading.id,
        currentHeading: heading, 
      };
    });
    const maxIterations = 1000;
    let safetyCounter = 0;
    while (!isUniquePropertyInObjects(duplicates, "currentId")) {
      if (safetyCounter >= maxIterations)
        throw new Error(`Exceeded max depth for headings depth. `);
      if (duplicates.every(duplicate => duplicate.currentHeading === null)) {
        // We could not find unique ids by going up each headings ancestors, abort.
        // In theory, this means there are multiple headings, which have same text AND are siblings.
        // In this case, we will not provide any other help, because this is duplicate headings.
        break;
      }
      duplicates.forEach(duplicate => {
        duplicate.currentHeading = duplicate.heading.parent
        if (duplicate.currentHeading) 
          duplicate.currentId = duplicate.currentHeading.id + "-" + duplicate.currentId; 
      });
      safetyCounter++;
    }
    duplicates.forEach(duplicate => duplicate.heading.id = duplicate.currentId);
  }

  // Return tree
  return headingTreeWithIds;
}
