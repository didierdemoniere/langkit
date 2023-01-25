import { Token } from './Token';
import { Cursor } from './Cursor';
import { Rule, ExtractedValues, ExtractedValue } from './types';
import { TerminalError } from './TerminalError';

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
            return ast;
          }
          cursor.position += types.length;
          return ast;
        }
        return new Error(
          `unable to parse '${tokens
            .slice(cursor.position, cursor.position + types.length)
            .map((t) => t.value)
            .join('')}' ${tokens[cursor.position]?.displayPosition()}`,
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
          return endResult;
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
        for (const subRule of self.subRules) {
          const result = subRule.consume(tokens, localCursor);
          if (result instanceof TerminalError) {
            return result;
          }
          if (result instanceof Error) {
            localCursor.position = cursor.position;
            continue;
          }
          cursor.position = localCursor.position;
          return result;
        }
        return new Error(
          `unable to parse '${tokens[cursor.position]?.value}'... ${tokens[
            cursor.position
          ]?.displayPosition()}`,
        );
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
        const result = subRule.consume(tokens, cursor.clone());
        return result instanceof TerminalError ? result.cause : result;
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
            return values.length > 0 && !(ast instanceof TerminalError)
              ? new TerminalError(ast)
              : ast;
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
