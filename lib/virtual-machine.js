import vm, { SourceTextModule } from 'vm';

export async function executeModuleExpensive(code, context = {}) {
  context.console = console; // Make logging available in the output console.
  const moduleContext = vm.createContext(context);
  const module = new SourceTextModule(code, { context: moduleContext  });
  await module.link(() => { });
  await module.evaluate();
  return module.namespace.default;
}

export async function executeModule(code, context = {}) {
  // The file must always end with `export default { /* ... */ }`!
  const preparedCode = code
    .replace(/export\s+default\s+/, "const __default__ = ")
    .replace(/;\s*$/, ";\nreturn __default__;");
  const functionString = 
    `
    "use strict";
    ${preparedCode}
    `;
  const contextKeys = Object.keys(context);
  const contextValues = Object.values(context);
  if (contextKeys.length <= 0)
    return (new Function(functionString))();
  return (new Function(...contextKeys, functionString))(...contextValues);
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
