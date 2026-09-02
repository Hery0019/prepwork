import { describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog, type Catalog } from '../../src/catalog/load.js';
import { parseScaffold } from '../../src/config/io.js';
import { MANIFEST_PATH, readManifest } from '../../src/engine/manifest.js';
import { runCheck, runInit, runSync, type EngineDeps } from '../../src/engine/index.js';
import type { PrepworkError } from '../../src/errors.js';
import { createMemoryFileSystem, type MemoryFileSystem } from '../../src/fs/memory.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import { SAMPLE_SCAFFOLD } from '../helpers/fixtures.js';

let cached: Catalog | undefined;
async function deps(fs: MemoryFileSystem): Promise<EngineDeps> {
  cached ??= await loadCatalog(createNodeFileSystem(), defaultContentRoot());
  return { fs, catalog: cached, toolVersion: '0.1.0', today: '2026-09-02' };
}

describe('runInit', () => {
  it('generates the project, scaffold.yaml and the manifest in an empty directory', async () => {
    const fs = createMemoryFileSystem();
    const result = await runInit(await deps(fs), { projectDir: 'proj', scaffold: SAMPLE_SCAFFOLD });
    expect(result.execution?.dryRun).toBe(false);
    expect(result.plan.summary.create).toBe(result.plan.operations.length);

    const files = Object.keys(fs.snapshot());
    expect(files).toContain('proj/scaffold.yaml');
    expect(files).toContain(`proj/${MANIFEST_PATH}`);
    expect(files).toContain('proj/pom.xml');
    expect(files).toContain('proj/CLAUDE.md');
    expect(parseScaffold(fs.snapshot()['proj/scaffold.yaml'] ?? '')).toEqual(SAMPLE_SCAFFOLD);

    const manifest = await readManifest(fs, 'proj');
    expect(manifest?.profile_version).toBe('1.0.0');
    const manifestPaths = manifest?.files.map((f) => f.path) ?? [];
    expect(manifestPaths).toContain('pom.xml');
    expect(manifestPaths).toContain('CLAUDE.md');
    // Fichiers d'équipe et scaffold.yaml : jamais dans le manifeste.
    expect(manifestPaths).not.toContain('docs/adr/0001-architecture-profile.md');
    expect(manifestPaths).not.toContain('.env.example');
    expect(manifestPaths).not.toContain('scaffold.yaml');
  });

  it('tolerates a fresh .git directory but refuses any other content', async () => {
    const withGit = createMemoryFileSystem({ 'proj/.git/HEAD': 'ref: refs/heads/main' });
    await expect(
      runInit(await deps(withGit), { projectDir: 'proj', scaffold: SAMPLE_SCAFFOLD }),
    ).resolves.toBeDefined();

    const dirty = createMemoryFileSystem({ 'proj/README.md': 'hello' });
    const error = await runInit(await deps(dirty), {
      projectDir: 'proj',
      scaffold: SAMPLE_SCAFFOLD,
    }).catch((e: unknown) => e);
    expect((error as PrepworkError).code).toBe('TARGET_NOT_EMPTY');
    expect(dirty.snapshot()).toEqual({ 'proj/README.md': 'hello' });
  });

  it('writes nothing in dry-run mode', async () => {
    const fs = createMemoryFileSystem();
    const result = await runInit(await deps(fs), {
      projectDir: 'proj',
      scaffold: SAMPLE_SCAFFOLD,
      dryRun: true,
    });
    expect(result.execution?.dryRun).toBe(true);
    expect(fs.snapshot()).toEqual({});
  });

  it('substitutes questionnaire extras into .env.example only', async () => {
    const fs = createMemoryFileSystem();
    await runInit(await deps(fs), {
      projectDir: 'proj',
      scaffold: SAMPLE_SCAFFOLD,
      extras: { envOverrides: { APP_CORS_ALLOWED_ORIGINS: 'https://app.example.com' } },
    });
    expect(fs.snapshot()['proj/.env.example']).toContain(
      'APP_CORS_ALLOWED_ORIGINS=https://app.example.com',
    );
    expect(fs.snapshot()['proj/scaffold.yaml']).not.toContain('app.example.com');
  });
});

describe('runCheck and runSync', () => {
  it('reports a clean project after init, then updates only intact files after a scaffold change', async () => {
    const fs = createMemoryFileSystem();
    const d = await deps(fs);
    await runInit(d, { projectDir: 'proj', scaffold: SAMPLE_SCAFFOLD });

    const clean = await runCheck(d, 'proj');
    expect(clean.plan.summary).toMatchObject({
      create: 0,
      update: 0,
      delete: 0,
      conflict: 0,
      'skip-modified': 0,
    });
    expect(clean.execution).toBeUndefined();

    // L'équipe modifie un fichier généré, en supprime un autre, et change le scaffold (CI → gitlab absent, donc none).
    await fs.writeText(
      'proj/src/main/java/mg/solumada/payflow/web/NoteController.java',
      '// modified by team',
    );
    await fs.remove('proj/Dockerfile');
    await fs.writeText(
      'proj/scaffold.yaml',
      (fs.snapshot()['proj/scaffold.yaml'] ?? '')
        .replace('ci: github', 'ci: none')
        .replace('description: Payment flows', 'description: Payment flows v2'),
    );

    const check = await runCheck(d, 'proj');
    const kinds = Object.fromEntries(
      check.plan.operations.filter((o) => o.kind !== 'unchanged').map((o) => [o.path, o.kind]),
    );
    expect(kinds['src/main/java/mg/solumada/payflow/web/NoteController.java']).toBe(
      'skip-modified',
    );
    expect(kinds.Dockerfile).toBe('skip-modified');
    expect(kinds['.github/workflows/ci.yaml']).toBe('delete');
    expect(kinds['pom.xml']).toBe('update');
    expect(kinds['docs/adr/0006-ci.md']).toBeUndefined();

    const before = fs.snapshot();
    const dry = await runSync(d, 'proj', { dryRun: true });
    expect(dry.execution?.dryRun).toBe(true);
    expect(fs.snapshot()).toEqual(before);

    const sync = await runSync(d, 'proj');
    expect(sync.execution?.written).toContain('pom.xml');
    expect(sync.execution?.deleted).toEqual(['.github/workflows/ci.yaml']);
    const after = fs.snapshot();
    expect(after['proj/src/main/java/mg/solumada/payflow/web/NoteController.java']).toBe(
      '// modified by team',
    );
    expect(after['proj/Dockerfile']).toBeUndefined();
    expect(after['proj/.github/workflows/ci.yaml']).toBeUndefined();
    expect(after['proj/pom.xml']).toContain('Payment flows v2');
    expect(after['proj/docs/adr/0006-ci.md']).toContain('GitHub Actions');

    const again = await runCheck(d, 'proj');
    expect(again.plan.summary).toMatchObject({
      create: 0,
      update: 0,
      delete: 0,
      conflict: 0,
      'skip-modified': 2,
    });
  });
});
