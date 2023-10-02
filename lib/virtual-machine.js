// execute.js
import vm from 'vm';


const moduleCode = `
  someObject.fruit.banana += 12;
  export default {
    hello: 'world',
    answer: 21 * 2,
    soup: bobo * 21,
    banana: someObject.fruit.banana,
  }
`
/*
const context2 = new vm.SourceTextModule(moduleCode);
await context2.evaluate();
console.log(context2);
*/
/*
const context = vm.createContext({});
vm.runInContext(moduleCode, context);
const exportedValue = context.exports.default;
console.log(exportedValue);
*/

import { SourceTextModule, createScript } from 'vm';

/*
const code = `
  export default {
    greeting: 'Hello from the module!',
  };
`;
*/
const someObject = {
  fruit: { banana: 24 },
}

const module = new SourceTextModule(moduleCode, 
    { context: vm.createContext({ bobo: 9, someObject})}
//    {
//  context: 'sandbox', // 'global' or 'sandbox'
//}
);

await module.link(() => {});
await module.evaluate();
console.log(module.namespace.default)
console.log(someObject.fruit.banana)
/*
// Create a context for the module execution
const context = vm.createContext({
  console,
});

// Instantiate the module to obtain the exports
const { exports } = await module.instantiate({
  async importModuleDynamically(specifier) {
    // Handle dynamic imports if needed
    // Return the dynamically imported module
  },
});

// Evaluate the module in the context
await exports.default.link(() => {});
const script = createScript(exports.default.getNamespaceInit(), {
  context,
  filename: module.url,
});

// Run the script to execute the module
script.runInContext(context);

// Access the exported value
const exportedValue = context.exports.default;
console.log(exportedValue.greeting);
*/