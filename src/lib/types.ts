import { Token } from './Token';
import { Cursor } from './Cursor';

type Without<T, U> = U extends T ? never : U;

export interface Rule<T = any, X extends string = any> {
  consume: (tokens: Token<X>[], cursor: Cursor) => T | Error;
}

export type ExtractedValue<T extends Rule> = Without<
  Error,
  ReturnType<T['consume']>
>;

export type ExtractedValues<T extends [Rule, ...Array<Rule>]> = {
  [K in keyof T]: ExtractedValue<T[K]>;
} & { length: T['length'] };

export type Reducer<T, R> = (
  children: Array<R>,
  value: T,
  path: Array<string | number>,
  parent?: T,
) => R | undefined;
