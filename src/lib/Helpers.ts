import { Token } from './Token';
import { Cursor } from './Cursor';
import { Rule, ExtractedValues, ExtractedValue } from './types';
import { ParseError } from './ParseError';
export class Helpers<T extends string> {
  /**
   * create a rule that match a sequence of tokens
   * @param types sequence of token types to match
   * @param transform turn the list of tokens into AST node
   * @returns Rule
   */
  fromTokens<R = void>(
    types: Array<Token<T>['type']>,
    transform: (tokens: Array<Token<T>>) => R | Error = (() => {
      /** empty */
    }) as any,
  ): Rule<R, T> {
    return {
      consume: (tokens: Array<Token<T>>, cursor: Cursor) => {
        if (
          tokens.length - cursor.position >= types.length &&
          types.every(
            (type, index) => tokens[cursor.position + index].type === type,
          )
        ) {
          const ast = transform(
            tokens.slice(cursor.position, cursor.position + types.length),
          );
          if (ast instanceof Error) {
            return new ParseError(ast.message, tokens[cursor.position]);
          }
          cursor.position += types.length;
          return ast;
        }
        return new ParseError(
          `unable to parse '${tokens
            .slice(cursor.position, cursor.position + types.length)
            .map((t) => t.value)
            .join('')}' ${tokens[cursor.position]?.displayPosition()}`,
          tokens[cursor.position],
        );
      },
    };
  }

  /**
   * create a rule that match a sequence of rule
   * @param getSubRules list of rules to match in order
   * @param transform turn the list of AST node into AST
   * @returns Rule
   */
  rule<R, X extends [Rule, ...Array<Rule>]>(
    getSubRules: (self: Rule<R>) => X,
    transform: (values: ExtractedValues<X>) => R | Error,
  ): Rule<R> & { subRules: X } {
    const self: Rule<R> & { subRules: X } = {} as any;

    Object.assign(self, {
      consume: (tokens: Token[], cursor: Cursor) => {
        const localCursor = cursor.clone();
        const values: ExtractedValues<X> = [] as any;
        for (let index = 0; index < self.subRules.length; index++) {
          const ast = self.subRules[index].consume(tokens, localCursor);
          if (ast instanceof Error) {
            return ast;
          }
          values.push(ast);
        }
        const endResult = transform(values);
        if (endResult instanceof Error) {
          return new ParseError(
            endResult.message,
            tokens[localCursor.position],
          );
        }
        cursor.position = localCursor.position;
        return endResult;
      },
    });

    self.subRules = getSubRules(self);

    return self;
  }

  /**
   * create an "OR" Rule where multiple rules may apply
   * @param getSubRules list of rules to try (from first to last)
   * @returns Rule
   */
  or<X extends [Rule, ...Array<Rule>]>(
    getSubRules: (self: X[number]) => X,
  ): Rule<ExtractedValue<X[number]>> & { subRules: X } {
    const self: Rule<ExtractedValue<X[number]>> & { subRules: X } = {} as any;

    Object.assign(self, {
      consume: (tokens: Token[], cursor: Cursor) => {
        const localCursor = cursor.clone();
        let error: ParseError | undefined = undefined;

        for (const subRule of self.subRules) {
          localCursor.position = cursor.position;
          const result = subRule.consume(tokens, localCursor);
          if (result instanceof ParseError) {
            if (
              typeof error === 'undefined' ||
              (result.token &&
                (result.token.pos.start.line > error.token.pos.start.line ||
                  (result.token.pos.start.line === error.token.pos.start.line &&
                    result.token.pos.start.col > error.token.pos.start.col)))
            ) {
              error = result;
            }
            continue;
          }
          cursor.position = localCursor.position;
          return result;
        }

        return error;
      },
    });

    self.subRules = getSubRules(self);

    return self;
  }

  /**
   * turn a rule optional
   * @returns Rule
   */
  optional<R>(subRule: Rule<R>): Rule<R | void> & { subRule: Rule<R> } {
    return {
      consume: (tokens: Token[], cursor: Cursor) => {
        const localCursor = cursor.clone();
        const result = subRule.consume(tokens, localCursor);
        if (result instanceof Error) {
          return;
        }
        cursor.position = localCursor.position;
        return result;
      },
      subRule,
    };
  }

  /**
   * test if subRule match without consuming its tokens
   * @param subRule
   * @returns Rule
   */
  lookahead<R>(subRule: Rule<R>): Rule<R> & { subRule: Rule<R> } {
    return {
      consume: (tokens: Token[], cursor: Cursor) => {
        return subRule.consume(tokens, cursor.clone());
      },
      subRule,
    };
  }

  /**
   * create rule of repeated sub rule separated by delimiter
   * @param subRule repeated rule
   * @param delimiter delimiter token
   * @returns Rule
   */
  list<R>(subRule: Rule<R>, delimiter: T): Rule<R[]> & { subRule: Rule<R> } {
    return {
      consume: (tokens: Token[], cursor: Cursor) => {
        const localCursor = new Cursor(cursor.position - 1);
        const values: R[] = [];
        do {
          localCursor.position++;
          const ast = subRule.consume(tokens, localCursor);
          if (ast instanceof Error) {
            return ast;
          }
          values.push(ast);
        } while (tokens[localCursor.position]?.type === delimiter);

        cursor.position = localCursor.position;
        return values;
      },
      subRule,
    };
  }
}
