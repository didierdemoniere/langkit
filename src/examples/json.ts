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

  h.or((value) => {
    const stringLiteral = h.fromTokens(['string'], ([quoted]) =>
      quoted.value.slice(1, -1),
    );

    object = h.rule(
      () => {
        const entry = h.rule(
          () => [stringLiteral, h.fromTokens(['colon']), value],
          ([key, _, value]) => [key, value] as const,
        );

        return [
          h.fromTokens(['lCurly']),
          h.list(entry, 'comma'),
          h.fromTokens(['rCurly']),
        ];
      },
      ([_, entries]) => Object.fromEntries(entries),
    );

    array = h.rule(
      () => {
        return [
          h.fromTokens(['lSquare']),
          h.list(value, 'comma'),
          h.fromTokens(['rSquare']),
        ];
      },
      ([_, values]) => values,
    );

    return [
      stringLiteral,
      h.fromTokens(['number'], ([t]) => Number(t.value)),
      h.fromTokens(['true'], () => true),
      h.fromTokens(['false'], () => false),
      h.fromTokens(['null'], () => null),
      object,
      array,
    ];
  });

  return h.or(() => [object, array]);
});
