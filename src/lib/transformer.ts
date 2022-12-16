
export function transform(
  ast: any,
  spec: any,
  path: Array<string | number> = [],
  context?: any,
  isRoot = true,
) {
  if (isRoot && !context) {
    context = { ast };
  }

  if (Array.isArray(ast)) {
    ast = [...ast];
    for (let index = 0; index < ast.length; index++) {
      ast[index] = transform(
        ast[index],
        spec,
        path.concat([index]),
        context,
        false,
      );
    }
  } else if (typeof ast === 'object') {
    ast = { ...ast };
    for (const key in ast) {
      const children = transform(
        ast[key],
        spec,
        path.concat([key]),
        context,
        false,
      );
      ast[key] = !spec[key] ? children : spec[key](children, path, context);
    }
  }
  return isRoot ? spec.$(ast) : ast;
}

/**
 * create an interpreter/transpiler from a parser and a spec
 * @see src/examples/calculator.ts
 *
 * @param parser a function that produce an AST from source
 * @param spec an object used to interpret/transpile the AST by reducing the tree
 * @param createContext create a shared context
 * @returns an interpreter/transpiler
 */
export function createTransformer(
  parser: (source: string) => any,
  spec: any,
  createContext: (ast: any) => any = (ast) => ({ ast }),
) {
  return (source: string) => {
    const ast = parser(source);
    return transform(ast, spec, [], createContext(ast));
  };
}
