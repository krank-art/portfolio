import vm, { SourceTextModule } from 'vm';

export async function executeModule(code, context = {}) {
  const moduleContext = vm.createContext(context);
  const module = new SourceTextModule(code, { context: moduleContext  });
  await module.link(() => { });
  await module.evaluate();
  return module.namespace.default;
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
