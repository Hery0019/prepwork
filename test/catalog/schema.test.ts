import { describe, expect, it } from 'vitest';
import {
  AntiPatternSchema,
  ColumnSchema,
  LocalizedTextSchema,
  ProfileSchema,
  RuleSchema,
  TableSchema,
} from '../../src/catalog/schema.js';
import { pickText } from '../../src/catalog/text.js';
import { minimalProfile } from '../helpers/fixtures.js';

describe('rule format', () => {
  it('accepts an atomic rule with the four fields', () => {
    const rule = RuleSchema.parse({
      id: 'LAY-002',
      statement: 'No class in `web` imports from `repository`.',
      rationale: 'Controllers must not bypass the service layer.',
      enforced_by: 'archunit',
    });
    expect(rule.enforced_by).toBe('archunit');
  });

  it('rejects multi-line statements, bad ids, unknown fields and unknown enforcers', () => {
    const base = { id: 'LAY-002', statement: 'S', rationale: 'R', enforced_by: 'none' };
    expect(RuleSchema.safeParse({ ...base, statement: 'line 1\nline 2' }).success).toBe(false);
    expect(RuleSchema.safeParse({ ...base, id: 'lay-2' }).success).toBe(false);
    expect(RuleSchema.safeParse({ ...base, id: 'LAY-AP-002' }).success).toBe(false);
    expect(RuleSchema.safeParse({ ...base, enforced_by: 'eslint' }).success).toBe(false);
    expect(RuleSchema.safeParse({ ...base, extra: true }).success).toBe(false);
    expect(
      RuleSchema.safeParse({ id: 'LAY-002', statement: 'S', enforced_by: 'none' }).success,
    ).toBe(false);
  });

  it('anti-patterns require an `instead` field and an AP id', () => {
    const base = { id: 'LAY-AP-001', statement: 'S', rationale: 'R', enforced_by: 'none' };
    expect(AntiPatternSchema.safeParse(base).success).toBe(false);
    expect(AntiPatternSchema.safeParse({ ...base, instead: 'Do this.' }).success).toBe(true);
    expect(AntiPatternSchema.safeParse({ ...base, id: 'LAY-001', instead: 'x' }).success).toBe(
      false,
    );
  });

  it('localized text is a string or an {en, fr} object', () => {
    expect(LocalizedTextSchema.safeParse('hello').success).toBe(true);
    expect(LocalizedTextSchema.safeParse({ en: 'hello', fr: 'bonjour' }).success).toBe(true);
    expect(LocalizedTextSchema.safeParse({ en: 'hello' }).success).toBe(false);
    expect(LocalizedTextSchema.safeParse({ en: 'hello', fr: 'bonjour', de: 'hallo' }).success).toBe(
      false,
    );
    expect(pickText({ en: 'hello', fr: 'bonjour' }, 'fr')).toBe('bonjour');
    expect(pickText('hello', 'fr')).toBe('hello');
  });
});

describe('profile schema', () => {
  it('accepts the minimal profile and applies defaults', () => {
    const profile = ProfileSchema.parse(minimalProfile());
    expect(profile.anti_patterns).toEqual([]);
    expect(profile.skills.db).toEqual([]);
    expect(profile.reference_example.tables).toEqual([]);
  });

  it('rejects an unknown layer dependency and a cycle', () => {
    const unknown = minimalProfile({
      architecture: {
        base_package: '{{basePackage}}',
        layers: [{ id: 'web', package: '{{basePackage}}.web', may_depend_on: ['nope'] }],
      },
    });
    expect(ProfileSchema.safeParse(unknown).error?.issues[0]?.message).toMatch(/inconnue/);

    const cycle = minimalProfile({
      architecture: {
        base_package: '{{basePackage}}',
        layers: [
          { id: 'a', package: '{{basePackage}}.a', may_depend_on: ['b'] },
          { id: 'b', package: '{{basePackage}}.b', may_depend_on: ['c'] },
          { id: 'c', package: '{{basePackage}}.c', may_depend_on: ['a'] },
        ],
      },
    });
    expect(ProfileSchema.safeParse(cycle).error?.issues[0]?.message).toMatch(/cycle/);
  });

  it('requires every rule to be attached to exactly one skill', () => {
    const missing = minimalProfile({ skills: {} });
    expect(ProfileSchema.safeParse(missing).error?.issues[0]?.message).toMatch(/aucun skill/);

    const twice = minimalProfile({ skills: { architecture: ['LAY-001'], db: ['LAY-001'] } });
    expect(ProfileSchema.safeParse(twice).error?.issues[0]?.message).toMatch(/plusieurs skills/);

    const undeclared = minimalProfile({ skills: { architecture: ['LAY-001', 'LAY-002'] } });
    expect(ProfileSchema.safeParse(undeclared).error?.issues[0]?.message).toMatch(/non déclaré/);
  });

  it('only allows the {{basePackage}} placeholder in packages', () => {
    const bad = minimalProfile({
      architecture: {
        base_package: 'mg.solumada' as '{{basePackage}}',
        layers: [],
      },
    });
    expect(ProfileSchema.safeParse(bad).success).toBe(false);
  });
});

describe('reference example tables', () => {
  it('requires exactly one identity column', () => {
    expect(
      TableSchema.safeParse({ name: 'note', columns: [{ name: 'title', type: 'string' }] }).success,
    ).toBe(false);
    expect(
      TableSchema.safeParse({
        name: 'note',
        columns: [
          { name: 'id', type: 'identity' },
          { name: 'title', type: 'string', length: 200 },
        ],
      }).success,
    ).toBe(true);
  });

  it('only allows length on string columns', () => {
    expect(ColumnSchema.safeParse({ name: 'x', type: 'text', length: 10 }).success).toBe(false);
    expect(ColumnSchema.parse({ name: 'x', type: 'text' }).nullable).toBe(false);
  });
});
