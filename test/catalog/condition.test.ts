import { describe, expect, it } from 'vitest';
import { conditionPaths, evaluateCondition, parseCondition } from '../../src/catalog/condition.js';
import { PrepworkError } from '../../src/errors.js';

const context = {
  stack: { database: 'postgresql', java: 21 },
  options: { docker: true, ci: 'github' },
  profile: 'layered',
};

describe('condition mini-language', () => {
  it('evaluates comparisons and truthiness', () => {
    expect(evaluateCondition("stack.database != 'none'", context)).toBe(true);
    expect(evaluateCondition("stack.database == 'mysql'", context)).toBe(false);
    expect(evaluateCondition('options.docker', context)).toBe(true);
    expect(evaluateCondition('!options.docker', context)).toBe(false);
    expect(evaluateCondition('stack.java == 21', context)).toBe(true);
    expect(evaluateCondition('options.docker == true', context)).toBe(true);
  });

  it('combines with && and || and honours parentheses and precedence', () => {
    expect(evaluateCondition("options.docker && options.ci == 'github'", context)).toBe(true);
    expect(evaluateCondition("options.docker && options.ci == 'gitlab'", context)).toBe(false);
    expect(evaluateCondition("options.ci == 'gitlab' || options.docker", context)).toBe(true);
    // && lie plus fort que || : (false && true) || true
    expect(
      evaluateCondition("options.ci == 'gitlab' && options.docker || options.docker", context),
    ).toBe(true);
    expect(evaluateCondition("!(options.docker && options.ci == 'github')", context)).toBe(false);
  });

  it('rejects unknown paths instead of returning false', () => {
    expect(() => evaluateCondition('options.kubernetes', context)).toThrow(PrepworkError);
    expect(() => evaluateCondition("stack.db == 'x'", context)).toThrow(/chemin inconnu/);
  });

  it('reports syntax errors', () => {
    expect(() => parseCondition("stack.database == 'none")).toThrow(/non terminée/);
    expect(() => parseCondition('stack.database ==')).toThrow(PrepworkError);
    expect(() => parseCondition('(options.docker')).toThrow(/attendu/);
    expect(() => parseCondition('options.docker options.ci')).toThrow(/jetons en trop/);
    expect(() => parseCondition('options.docker # x')).toThrow(/inattendu/);
  });

  it('lists the paths a condition depends on', () => {
    const node = parseCondition("!(stack.database != 'none') || options.docker && profile == 'x'");
    expect(conditionPaths(node)).toEqual(['stack.database', 'options.docker', 'profile']);
  });
});
