import { JSDOM } from 'jsdom';

function test() {
    const xmlString = '<root><element>Hello, World!</element></root>';
    const dom = new JSDOM(xmlString, { contentType: 'text/xml' });
    const document = dom.window.document;
    const rootElement = document.querySelector('root');
    console.log('Contents of the <root> element:', rootElement.textContent);
}

function handleDirectives(dom) {
    const doc = dom.window.document;
    const { children ) = doc;
}

function traverseElements() {

}
