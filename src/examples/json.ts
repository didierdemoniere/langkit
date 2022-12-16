import { createLexer, createParser, Rule } from '../index';

export const jsonLexer = createLexer({
  true: /true/,
  false: /false/,
  null: /null/,
  lCurly: /{/,
  rCurly: /}/,
  lSquare: /\[/,
  rSquare: /\]/,
  comma: /,/,
  colon: /:/,
  string: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/,
  number: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
  space: {
    pattern: /\s+/,
    skip: true,
  },
});

export const jsonParser = createParser(jsonLexer, (h) => {
  let object: Rule<{ [k: string]: any }>;
  let array: Rule<any[]>;

  h.or('value', (value) => {
    const stringLiteral = h.fromTokens(
      'StringLiteral',
      ['string'],
      ([quoted]) => quoted.value.slice(1, -1),
    );

    object = h.rule(
      'object',
      () => {
        const entry = h.rule(
          'entry',
          () => [stringLiteral, h.fromTokens('colon', ['colon']), value],
          ([key, _, value]) => [key, value] as const,
        );

        return [
          h.fromTokens('lCurly', ['lCurly']),
          h.list('entries', entry, 'comma'),
          h.fromTokens('rCurly', ['rCurly']),
        ];
      },
      ([_, entries]) => Object.fromEntries(entries),
    );

    array = h.rule(
      'array',
      () => {
        return [
          h.fromTokens('lSquare', ['lSquare']),
          h.list('values', value, 'comma'),
          h.fromTokens('rSquare', ['rSquare']),
        ];
      },
      ([_, values]) => values,
    );

    return [
      stringLiteral,
      h.fromTokens('NumberLiteral', ['number'], ([t]) => Number(t.value)),
      h.fromTokens('True', ['true'], () => true),
      h.fromTokens('False', ['false'], () => false),
      h.fromTokens('Null', ['null'], () => null),
      object,
      array,
    ];
  });

  return h.or('object or array', () => [object, array]);
});
