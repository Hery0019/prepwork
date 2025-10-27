import { describe, expect, it } from 'vitest';
import { parseScaffold, readScaffold, serializeScaffold } from '../../src/config/io.js';
import { basePackageProblem, resolveOptionIds, ScaffoldSchema } from '../../src/config/schema.js';
import type { PrepworkError } from '../../src/errors.js';
import { createMemoryFileSystem } from '../../src/fs/memory.js';
import { SAMPLE_SCAFFOLD } from '../helpers/fixtures.js';

describe('scaffold.yaml schema', () => {
  it('accepts the documented example', () => {
    expect(ScaffoldSchema.parse(SAMPLE_SCAFFOLD)).toEqual(SAMPLE_SCAFFOLD);
  });

  it('ties migrations to the presence of a database', () => {
    const noDb = {
      ...SAMPLE_SCAFFOLD,
      stack: { java: 21, database: 'none', migrations: 'flyway' },
    };
    expect(ScaffoldSchema.safeParse(noDb).success).toBe(false);
    const noMigrations = { ...SAMPLE_SCAFFOLD, stack: { java: 21, database: 'mysql' } };
    expect(ScaffoldSchema.safeParse(noMigrations).success).toBe(false);
    const consistent = { ...SAMPLE_SCAFFOLD, stack: { java: 17, database: 'none' } };
    expect(ScaffoldSchema.safeParse(consistent).success).toBe(true);
  });

  it('validates project name, base package and unknown keys', () => {
    expect(
      ScaffoldSchema.safeParse({
        ...SAMPLE_SCAFFOLD,
        project: { ...SAMPLE_SCAFFOLD.project, name: 'PayFlow' },
      }).success,
    ).toBe(false);
    expect(basePackageProblem('mg.solumada.payflow')).toBeUndefined();
    expect(basePackageProblem('payflow')).toMatch(/deux segments/);
    expect(basePackageProblem('mg.Solumada')).toMatch(/minuscules/);
    expect(basePackageProblem('mg.solumada.package')).toMatch(/mot réservé/);
    expect(ScaffoldSchema.safeParse({ ...SAMPLE_SCAFFOLD, extra: 1 }).success).toBe(false);
  });

  it('resolves option ids from the scaffold', () => {
    expect(resolveOptionIds(SAMPLE_SCAFFOLD)).toEqual([
      'migrations-flyway',
      'security-none',
      'docker',
      'ci-github',
      'git',
    ]);
    expect(
      resolveOptionIds({
        ...SAMPLE_SCAFFOLD,
        stack: { java: 21, database: 'none' },
        options: { security: 'oauth2-resource-server', docker: false, ci: 'none' },
      }),
    ).toEqual(['security-oauth2-resource-server', 'git']);
  });
});

describe('scaffold.yaml I/O', () => {
  it('round-trips through serialize and parse', () => {
    const text = serializeScaffold(SAMPLE_SCAFFOLD);
    expect(text.startsWith('# Généré par prepwork')).toBe(true);
    expect(parseScaffold(text)).toEqual(SAMPLE_SCAFFOLD);
  });

  it('reads from a project directory and reports missing or invalid files', async () => {
    const fs = createMemoryFileSystem({ 'proj/scaffold.yaml': serializeScaffold(SAMPLE_SCAFFOLD) });
    expect(await readScaffold(fs, 'proj')).toEqual(SAMPLE_SCAFFOLD);

    const missing = await readScaffold(fs, 'other').catch((e: unknown) => e);
    expect((missing as PrepworkError).code).toBe('SCAFFOLD_NOT_FOUND');

    await fs.writeText('proj/scaffold.yaml', 'profile: hexagonal\n');
    const invalid = await readScaffold(fs, 'proj').catch((e: unknown) => e);
    expect((invalid as PrepworkError).code).toBe('SCAFFOLD_INVALID');
    expect((invalid as PrepworkError).message).toMatch(/profile/);
  });
});
