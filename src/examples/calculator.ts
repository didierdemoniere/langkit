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
  const number = h.fromTokens(['number'], ([token]) => token.value);

  const operator = h.or(() => {
    return [
      h.fromTokens(['plus'], ([token]) => token.value),
      h.fromTokens(['minus'], ([token]) => token.value),
      h.fromTokens(['multiply'], ([token]) => token.value),
      h.fromTokens(['divide'], ([token]) => token.value),
    ];
  });

  const expression = h.rule(
    (expression) => {
      return [number, operator, h.or(() => [expression, number])];
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

export const calculator = createTransformer(
  calcParser,
  (
    children: number[],
    node: string | { op: keyof typeof operations; left: number; right: number },
    path: Array<string | number>,
  ) => {
    const key = path[path.length - 1];
    const isRoot = !key;

    if (isRoot || key === 'right' || key === 'left') {
      return typeof node === 'string'
        ? Number(node)
        : operations[node.op](children[0], children[1]);
    }
  },
);
