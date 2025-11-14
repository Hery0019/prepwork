import { describe, expect, it } from 'vitest';
import type { PrepworkError } from '../../src/errors.js';
import { createMemoryFileSystem } from '../../src/fs/memory.js';
import { executePlan } from '../../src/engine/execute.js';
import { hashContent } from '../../src/engine/hash.js';
import {
  MANIFEST_PATH,
  parseManifest,
  readManifest,
  serializeManifest,
  type Manifest,
} from '../../src/engine/manifest.js';
import { buildPlan } from '../../src/engine/plan.js';
import type { GeneratedFile } from '../../src/engine/render.js';

const META = { scaffoldVersion: '1.0.0', profileVersion: '1.0.0' };

function generated(
  path: string,
  content: string,
  owner: 'generated' | 'team' = 'generated',
): GeneratedFile {
  return { path, content, owner, source: 'test' };
}

function manifestOf(...files: [string, string][]): Manifest {
  return {
    ...META,
    scaffold_version: META.scaffoldVersion,
    profile_version: META.profileVersion,
    files: files.map(([path, content]) => ({ path, hash: hashContent(content) })),
  };
}

describe('hashContent', () => {
  it('ignores line ending differences', () => {
    expect(hashContent('a\nb\n')).toBe(hashContent('a\r\nb\r\n'));
    expect(hashContent('a')).not.toBe(hashContent('b'));
    expect(hashContent('x')).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

describe('manifest', () => {
  it('round-trips and sorts entries', () => {
    const manifest = manifestOf(['b', '2'], ['a', '1']);
    const parsed = parseManifest(serializeManifest(manifest));
    expect(parsed.files.map((f) => f.path)).toEqual(['a', 'b']);
  });

  it('reports invalid manifests', async () => {
    const fs = createMemoryFileSystem({ [`p/${MANIFEST_PATH}`]: '{ not json' });
    const error = await readManifest(fs, 'p').catch((e: unknown) => e);
    expect((error as PrepworkError).code).toBe('MANIFEST_INVALID');
    await fs.writeText(`p/${MANIFEST_PATH}`, JSON.stringify({ files: [] }));
    await expect(readManifest(fs, 'p')).rejects.toThrow(/schéma invalide/);
    expect(await readManifest(fs, 'elsewhere')).toBeUndefined();
  });
});

describe('buildPlan', () => {
  it('creates everything on an empty directory and builds the manifest from generated files only', async () => {
    const fs = createMemoryFileSystem();
    const plan = await buildPlan(
      fs,
      'p',
      [generated('pom.xml', '<pom/>'), generated('docs/adr/0001.md', 'adr', 'team')],
      undefined,
      META,
    );
    expect(plan.operations.map((o) => [o.path, o.kind])).toEqual([
      ['docs/adr/0001.md', 'create'],
      ['pom.xml', 'create'],
    ]);
    expect(plan.manifest.files.map((f) => f.path)).toEqual(['pom.xml']);
    expect(plan.summary.create).toBe(2);
  });

  it('updates intact files, skips modified ones, never touches team files', async () => {
    const previous = manifestOf(['pom.xml', 'v1'], ['README-gen.md', 'old']);
    const fs = createMemoryFileSystem({
      'p/pom.xml': 'v1',
      'p/README-gen.md': 'edited by team',
      'p/docs/adr/0001.md': 'team wrote this',
    });
    const plan = await buildPlan(
      fs,
      'p',
      [
        generated('pom.xml', 'v2'),
        generated('README-gen.md', 'new'),
        generated('docs/adr/0001.md', 'regenerated', 'team'),
      ],
      previous,
      META,
    );
    const kinds = Object.fromEntries(plan.operations.map((o) => [o.path, o.kind]));
    expect(kinds).toEqual({
      'pom.xml': 'update',
      'README-gen.md': 'skip-modified',
      'docs/adr/0001.md': 'unchanged',
    });
    // Le fichier modifié garde son ancienne empreinte : il sera encore signalé au prochain sync.
    expect(plan.manifest.files).toContainEqual({ path: 'README-gen.md', hash: hashContent('old') });
    expect(plan.manifest.files).toContainEqual({ path: 'pom.xml', hash: hashContent('v2') });
  });

  it('reports unchanged files, conflicts with unknown files, and adopts identical ones', async () => {
    const previous = manifestOf(['pom.xml', 'same']);
    const fs = createMemoryFileSystem({
      'p/pom.xml': 'same',
      'p/Dockerfile': 'hand-written',
      'p/.gitignore': 'target/',
    });
    const plan = await buildPlan(
      fs,
      'p',
      [
        generated('pom.xml', 'same'),
        generated('Dockerfile', 'FROM x'),
        generated('.gitignore', 'target/'),
      ],
      previous,
      META,
    );
    const kinds = Object.fromEntries(plan.operations.map((o) => [o.path, o.kind]));
    expect(kinds).toEqual({
      'pom.xml': 'unchanged',
      Dockerfile: 'conflict',
      '.gitignore': 'unchanged',
    });
    expect(plan.manifest.files.map((f) => f.path).sort()).toEqual(['.gitignore', 'pom.xml']);
  });

  it('respects a deletion by the team and cleans up files no longer generated', async () => {
    const previous = manifestOf(
      ['pom.xml', 'v1'],
      ['.github/ci.yaml', 'gh'],
      ['old-modified.txt', 'orig'],
      ['gone.txt', 'x'],
    );
    const fs = createMemoryFileSystem({
      'p/.github/ci.yaml': 'gh',
      'p/old-modified.txt': 'changed',
    });
    const plan = await buildPlan(fs, 'p', [generated('pom.xml', 'v1')], previous, META);
    const byPath = Object.fromEntries(
      plan.operations.map((o) => [o.path, `${o.kind}${o.reason ? ` (${o.reason})` : ''}`]),
    );
    expect(byPath).toEqual({
      'pom.xml': 'skip-modified (deleted by team)',
      '.github/ci.yaml': 'delete (no longer generated)',
      'old-modified.txt': 'skip-modified (no longer generated, modified by team)',
      'gone.txt': 'unchanged (no longer generated, already absent)',
    });
    expect(plan.manifest.files.map((f) => f.path).sort()).toEqual(['old-modified.txt', 'pom.xml']);
  });
});

describe('executePlan', () => {
  it('writes creates and updates, deletes orphans, then the manifest; dry-run writes nothing', async () => {
    const previous = manifestOf(['pom.xml', 'v1'], ['orphan.txt', 'o']);
    const files = [
      generated('pom.xml', 'v2'),
      generated('new.txt', 'n'),
      generated('docs/glossary.md', 'g', 'team'),
    ];
    const make = () => createMemoryFileSystem({ 'p/pom.xml': 'v1', 'p/orphan.txt': 'o' });

    const dry = make();
    const dryPlan = await buildPlan(dry, 'p', files, previous, META);
    const dryResult = await executePlan(dry, 'p', dryPlan, { dryRun: true });
    expect(dryResult).toEqual({
      written: ['docs/glossary.md', 'new.txt', 'pom.xml'],
      deleted: ['orphan.txt'],
      dryRun: true,
    });
    expect(dry.snapshot()).toEqual({ 'p/orphan.txt': 'o', 'p/pom.xml': 'v1' });

    const real = make();
    const plan = await buildPlan(real, 'p', files, previous, META);
    await executePlan(real, 'p', plan);
    expect(real.snapshot()).toEqual({
      'p/.scaffold/manifest.json': serializeManifest(plan.manifest),
      'p/docs/glossary.md': 'g',
      'p/new.txt': 'n',
      'p/pom.xml': 'v2',
    });
    expect((await readManifest(real, 'p'))?.files.map((f) => f.path)).toEqual([
      'new.txt',
      'pom.xml',
    ]);
  });
});
