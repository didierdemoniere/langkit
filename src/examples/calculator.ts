import { createLexer, createParser, createTransformer } from '../index';

/**
 *
 */
export const calcLexer = createLexer({
  plus: /\+/,
  minus: /-/,
  multiply: /\*/,
  divide: /\//,
  number: /\d+(?:\.\d+)?/,
  space: {
    pattern: /\s+/,
    skip: true,
  },
});

/**
 *
 */
export const calcParser = createParser(calcLexer, (h) => {
  const number = h.fromTokens('number', ['number'], ([token]) => token.value);

  const operator = h.or('operator', () => {
    return [
      h.fromTokens('add', ['plus'], ([token]) => token.value),
      h.fromTokens('subtract', ['minus'], ([token]) => token.value),
      h.fromTokens('multiply', ['multiply'], ([token]) => token.value),
      h.fromTokens('divide', ['divide'], ([token]) => token.value),
    ];
  });

  const expression = h.rule(
    'expression',
    (self) => {
      return [number, operator, h.or('exprOrNumber', () => [self, number])];
    },
    ([left, op, right]: any[]) => {
      // operator precedence
      if (op === '*' || op === '/') {
        if (
          typeof right === 'object' &&
          (right.op === '+' || right.op === '-')
        ) {
          return {
            op: right.op,
            left: right.right,
            right: { op, left, right: right.left },
          };
        }
      }

      return {
        op,
        left,
        right,
      };
    },
  );

  return expression;
});

const operations = {
  ['+']: (left: number, right: number) => left + right,
  ['-']: (left: number, right: number) => left - right,
  ['*']: (left: number, right: number) => left * right,
  ['/']: (left: number, right: number) => left / right,
};

function compute(
  node: string | { op: keyof typeof operations; left: number; right: number },
) {
  return typeof node === 'string'
    ? Number(node)
    : operations[node.op](node.left, node.right);
}

export const calculator = createTransformer(calcParser, {
  $: compute,
  left: compute,
  right: compute,
});
