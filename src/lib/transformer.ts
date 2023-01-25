import { Reducer } from './types';
const toString = Object.prototype.toString;

/**
 * checks if the value is a plain object
 * @param value
 * @returns true if the value is a plain object
 */
export function isPlainObject(value?: any): value is object {
  return toString.call(value) === `[object Object]`;
}

/**
 * recursively folds over an ast
 * @param reducer
 * @param ast
 * @param path
 * @param parent
 * @returns
 */
export function fold<T, R>(
  reducer: Reducer<T, R>,
  ast: T,
  path: Array<string | number> = [],
  parent?: T,
): R {
  return reducer(
    (Array.isArray(ast)
      ? ast.map((child, i) => fold(reducer, child, path.concat([i]), ast))
      : isPlainObject(ast)
      ? Object.keys(ast).map((key) =>
          fold(reducer, (ast as any)[key], path.concat([key]), ast),
        )
      : []
    ).filter((child) => child !== undefined),
    ast,
    path,
    parent,
  ) as R;
}

/**
 * create an interpreter/transpiler from a parser and a reducer
 * @see src/examples/calculator.ts
 *
 * @param parser a function that produce an AST from source
 * @param function used to interpret/transpile the AST by reducing the tree
 * @returns an interpreter/transpiler
 */
export function createTransformer<T, R>(
  parser: (source: string) => T,
  reducer: Reducer<T, R>,
) {
  return (source: string) => {
    const ast = parser(source);
    return fold(reducer, ast);
  };
}
