Lit - Simple. Fast. Web Components. 

[Home](https://lit.dev/) [Documentation](https://lit.dev/docs/) [Playground](https://lit.dev/playground/) [Blog](https://lit.dev/blog/)

# Lit

Simple. Fast. Web Components.

[\> npm i lit](https://www.npmjs.com/package/lit) [Get Started](https://lit.dev/docs/getting-started/)

## Why Lit?

### Simple

Skip the boilerplate. Lit adds just what you need: reactivity, declarative templates, and thoughtful features.

### Fast

~5 KB (minified). Blazing fast rendering that touches only dynamic parts of your UI.

### Web Components

Interoperable & future-ready. Works anywhere you use HTML, with any framework or none at all.

## Example Code

```js

import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
  static styles = css`p { color: blue }`;
  
  @property()
  name = 'Somebody';

  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
      
```

Use it in HTML: `<simple-greeting name="World"></simple-greeting>`

## Used by

*   Google
*   Microsoft
*   IBM
*   Adobe
*   SAP

Copyright Google LLC. Code licensed under BSD-3-Clause.

[GitHub](https://github.com/lit/lit/) [Discord](https://lit.dev/discord/) [X](https://x.com/buildWithLit)