import { Token } from './Token';

/**
 * create a lexer
 * @param definitions an object where the keys are the token names and the values a regexp to match them
 */
export function createLexer<
  T extends { [key: string]: RegExp | { pattern: RegExp; skip?: boolean } },
>(definitions: T) {
  const tokenTypes = Object.keys(definitions) as Array<keyof T>;
  const patterns: { [K in keyof T]: RegExp } = {} as any;
  const options: { [K in keyof T]: { skip?: boolean } } = {} as any;

  for (const tokenType of tokenTypes) {
    if (definitions[tokenType] instanceof RegExp) {
      patterns[tokenType] = definitions[tokenType] as RegExp;
      options[tokenType] = {};
    } else {
      const { pattern, ...opts } = definitions[tokenType] as {
        pattern: RegExp;
        skip?: boolean;
      };
      patterns[tokenType] = pattern;
      options[tokenType] = opts;
    }
  }

  const splitter = new RegExp(
    `(${tokenTypes.map((name) => patterns[name].source).join('|')})`,
  );
  const newLine = /\n/gi;

  return (pattern: string) => {
    const chunks = pattern.split(splitter).filter(Boolean);
    const tokens: Array<Token<keyof T>> = [];

    for (let index = 0, line = 0, col = 0; index < chunks.length; index++) {
      const value = chunks[index];
      const type = tokenTypes.find((name) => patterns[name].test(value));
      if (!type) {
        throw new Error(`unexpected token '${value}' line ${line}, col ${col}`);
      }

      const start = { line, col };
      let result,
        lastIdx = 0;
      while ((result = newLine.exec(value))) {
        lastIdx = result.index;
        line++;
        col = 0;
      }
      col += value.length - lastIdx;
      const end = { line, col };

      if (!options[type]?.skip) {
        tokens.push(new Token(type, value, { start, end }));
      }
    }

    return tokens;
  };
}
