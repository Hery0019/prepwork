// Mini-langage des conditions `when` de `files.yaml`. Volontairement minuscule :
//   expr       := term ('||' term)*
//   term       := factor ('&&' factor)*
//   factor     := '!' factor | '(' expr ')' | comparison
//   comparison := path (('==' | '!=') literal)?
//   literal    := 'texte' | nombre | true | false
//   path       := ident ('.' ident)*
// Un chemin inconnu dans le contexte est une erreur, jamais un `false` silencieux.
import { PrepworkError } from '../errors.js';

type Token =
  | { kind: 'op'; value: '||' | '&&' | '!' | '(' | ')' | '==' | '!=' }
  | { kind: 'path'; value: string }
  | { kind: 'literal'; value: string | number | boolean };

export type ConditionNode =
  | { kind: 'or'; left: ConditionNode; right: ConditionNode }
  | { kind: 'and'; left: ConditionNode; right: ConditionNode }
  | { kind: 'not'; operand: ConditionNode }
  | { kind: 'compare'; path: string; operator: '==' | '!='; literal: string | number | boolean }
  | { kind: 'truthy'; path: string };

const PATH_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*/;

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const rest = source.slice(i);
    const ws = /^\s+/.exec(rest);
    if (ws) {
      i += ws[0].length;
      continue;
    }
    const twoChar = rest.slice(0, 2);
    if (twoChar === '||' || twoChar === '&&' || twoChar === '==' || twoChar === '!=') {
      tokens.push({ kind: 'op', value: twoChar });
      i += 2;
      continue;
    }
    const oneChar = rest[0];
    if (oneChar === '!' || oneChar === '(' || oneChar === ')') {
      tokens.push({ kind: 'op', value: oneChar });
      i += 1;
      continue;
    }
    if (oneChar === "'") {
      const end = rest.indexOf("'", 1);
      if (end === -1) throw syntaxError(source, 'chaîne non terminée');
      tokens.push({ kind: 'literal', value: rest.slice(1, end) });
      i += end + 1;
      continue;
    }
    const number = /^-?\d+(\.\d+)?/.exec(rest);
    if (number) {
      tokens.push({ kind: 'literal', value: Number(number[0]) });
      i += number[0].length;
      continue;
    }
    const path = PATH_PATTERN.exec(rest);
    if (path) {
      const value = path[0];
      if (value === 'true' || value === 'false') {
        tokens.push({ kind: 'literal', value: value === 'true' });
      } else {
        tokens.push({ kind: 'path', value });
      }
      i += value.length;
      continue;
    }
    throw syntaxError(source, `caractère inattendu \`${oneChar ?? ''}\``);
  }
  return tokens;
}

function syntaxError(source: string, detail: string): PrepworkError {
  return new PrepworkError('CATALOG_INVALID', `condition invalide \`${source}\` : ${detail}`);
}

export function parseCondition(source: string): ConditionNode {
  const tokens = tokenize(source);
  let position = 0;

  const peek = (): Token | undefined => tokens[position];
  const isOp = (value: string): boolean => {
    const token = peek();
    return token?.kind === 'op' && token.value === value;
  };
  const expect = (value: string): void => {
    if (!isOp(value)) throw syntaxError(source, `\`${value}\` attendu`);
    position += 1;
  };

  const parseExpr = (): ConditionNode => {
    let left = parseTerm();
    while (isOp('||')) {
      position += 1;
      left = { kind: 'or', left, right: parseTerm() };
    }
    return left;
  };
  const parseTerm = (): ConditionNode => {
    let left = parseFactor();
    while (isOp('&&')) {
      position += 1;
      left = { kind: 'and', left, right: parseFactor() };
    }
    return left;
  };
  const parseFactor = (): ConditionNode => {
    if (isOp('!')) {
      position += 1;
      return { kind: 'not', operand: parseFactor() };
    }
    if (isOp('(')) {
      position += 1;
      const inner = parseExpr();
      expect(')');
      return inner;
    }
    const token = peek();
    if (token?.kind !== 'path') throw syntaxError(source, 'chemin attendu');
    position += 1;
    if (isOp('==') || isOp('!=')) {
      const operatorToken = tokens[position];
      position += 1;
      const literal = tokens[position];
      if (literal?.kind !== 'literal')
        throw syntaxError(source, 'littéral attendu après comparaison');
      position += 1;
      const operator = operatorToken?.kind === 'op' && operatorToken.value === '!=' ? '!=' : '==';
      return { kind: 'compare', path: token.value, operator, literal: literal.value };
    }
    return { kind: 'truthy', path: token.value };
  };

  const node = parseExpr();
  if (position !== tokens.length) throw syntaxError(source, "jetons en trop en fin d'expression");
  return node;
}

/** Chemins référencés par une condition (pour les vérifications d'orthogonalité). */
export function conditionPaths(node: ConditionNode): string[] {
  switch (node.kind) {
    case 'or':
    case 'and':
      return [...conditionPaths(node.left), ...conditionPaths(node.right)];
    case 'not':
      return conditionPaths(node.operand);
    case 'compare':
    case 'truthy':
      return [node.path];
  }
}

function lookup(context: Record<string, unknown>, path: string, source: string): unknown {
  let current: unknown = context;
  for (const segment of path.split('.')) {
    if (typeof current !== 'object' || current === null || !(segment in current)) {
      throw new PrepworkError(
        'CATALOG_INVALID',
        `condition \`${source}\` : chemin inconnu \`${path}\` dans le contexte`,
      );
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function evaluateCondition(
  source: string,
  context: Record<string, unknown>,
  parsed: ConditionNode = parseCondition(source),
): boolean {
  const evaluate = (node: ConditionNode): boolean => {
    switch (node.kind) {
      case 'or':
        return evaluate(node.left) || evaluate(node.right);
      case 'and':
        return evaluate(node.left) && evaluate(node.right);
      case 'not':
        return !evaluate(node.operand);
      case 'compare': {
        const actual = lookup(context, node.path, source);
        return node.operator === '==' ? actual === node.literal : actual !== node.literal;
      }
      case 'truthy':
        return Boolean(lookup(context, node.path, source));
    }
  };
  return evaluate(parsed);
}
