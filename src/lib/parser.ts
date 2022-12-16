import { Token } from './Token';
import { Cursor } from './Cursor';
import { Helpers } from './Helpers';
import { Rule } from './types';

/**
 * create a parser from a lexer and a grammar
 *
 * @see src/examples/json.ts
 * @param lexer
 * @param grammar generate the grammar
 * @returns a parser
 */
export function createParser<X extends string, R>(
  lexer: (input: string) => Array<Token<X>>,
  grammar: (helpers: Helpers<X>) => Rule<R>,
) {
  const root = grammar(new Helpers());

  return (input: string) => {
    const tokens = lexer(input);
    const cursor = new Cursor();
    const result = root.consume(tokens, cursor);
    if (result instanceof Error) {
      throw result;
    }
    if (cursor.position < tokens.length) {
      const unexpectedToken = tokens[cursor.position + 1];
      throw new Error(
        `unexpected token '${
          unexpectedToken.value
        }' ${unexpectedToken.displayPosition()}`,
      );
    }
    return result;
  };
}
