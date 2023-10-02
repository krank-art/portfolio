import vm, { SourceTextModule} from 'vm';

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
    { context: vm.createContext({ bobo: 9, someObject})}
);

await module.link(() => {});
await module.evaluate();
console.log(module.namespace.default)
console.log(someObject.fruit.banana)
