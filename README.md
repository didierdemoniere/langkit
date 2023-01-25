# langkit

A compact and expressive DSL and expression interpreter toolkit

## Install

```
$ npm install langkit
```

## Usage

```js
import { createLexer, createParser } from 'langkit';

const calcLexer = createLexer({
  plus: /\+/,
  number: /\d+(?:\.\d+)?/,
  space: {
    pattern: /\s+/,
    skip: true,
  },
});

const calculate = createParser(calcLexer, (h) => {
  return h.fromTokens(['number', 'plus', 'number'], ([left, _, right]) => {
    return Number(left.value) + Number(right.value);
  });
});

console.log(calculate('5 + 45'));
// => 50
```

## examples

- [calculator](https://github.com/didierdemoniere/langkit/tree/main/src/examples/calculator.ts)
- [JSON parser](https://github.com/didierdemoniere/langkit/tree/main/src/examples/json.ts)
