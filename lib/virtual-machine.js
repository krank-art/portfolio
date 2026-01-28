import vm, { SourceTextModule } from 'vm';
import crypto from "node:crypto";

export class ScriptFunctionCache {
  constructor() {
    this.cache = new Map();
  }

  get(scriptSource, contextKeys) {
    const key = this.makeKey(scriptSource, contextKeys);
    const cachedFunc = this.cache.get(key);
    if (cachedFunc !== undefined) return cachedFunc;
    const createdFunc = this.makeFunction(scriptSource, contextKeys);
    this.cache.set(key, createdFunc);
    return createdFunc;
  }

  makeFunction(code, contextKeys) {
    // The file should always end with `export default { /* ... */ }`!
    const preparedCode = code
      .replace(/export\s+default\s+/, "const __default__ = ")
      .replace(/;\s*$/, ";\nreturn __default__;");
    const functionString = 
      `
      "use strict";
      ${preparedCode}
      `;
    if (contextKeys.length <= 0) return new Function(functionString);
    return new Function(...contextKeys, functionString);
  }

  clear() {
    this.cache.clear();
  }

  makeKey(scriptSource, contextKeys) {
    return crypto
      .createHash("sha1")
      .update(scriptSource)
      .update("\0")
      .update(contextKeys.join(","))
      .digest("base64");
  }
}

// When modules get called in Node, they are loaded once and then cached.
// That means, as long as the module lives, we can simply keep the actual cache in here and
// do not have to manually manage moving it as argument. This is a little bit stinky so keep in mind
// if suddenly the cache seems to fail.
const functionCache = new ScriptFunctionCache();

export async function executeModuleExpensive(code, context = {}) {
  context.console = console; // Make logging available in the output console.
  const moduleContext = vm.createContext(context);
  const module = new SourceTextModule(code, { context: moduleContext  });
  await module.link(() => { });
  await module.evaluate();
  return module.namespace.default;
}

export async function executeModule(code, context = {}) {
  const keys = Object.keys(context);
  const values = Object.values(context);
  // Not sure if I want to keep the cache around. The performance improvements are marginal (about 5% or 1sec)
  // with presumeably a lot higher memory usage. I will keep it in for now, but if it lags out the pc,
  // I need to bypass the function cache.
  const fn = functionCache.get(code, keys);
  return fn(...values);
}

async function runTest() {
  const moduleCode = `
    someObject.fruit.banana += 12;
    export default {
      hello: 'world',
      answer: 21 * 2,
      soup: bobo * 21,
      banana: someObject.fruit.banana,
    }
  `;
  const someObject = {
    fruit: { banana: 24 },
  }
  const module = new SourceTextModule(moduleCode,
    { context: vm.createContext({ bobo: 9, someObject }) }
  );
  await module.link(() => { });
  await module.evaluate();
  console.log(module.namespace.default)
  console.log(someObject.fruit.banana)
}
