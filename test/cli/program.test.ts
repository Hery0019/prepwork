import { describe, expect, it } from 'vitest';
import type { CommandRunner } from '../../src/cli/git.js';
import { runCli, type CliDeps } from '../../src/cli/program.js';
import type { Reporter } from '../../src/cli/report.js';
import { serializeScaffold } from '../../src/config/io.js';
import { createMemoryFileSystem, type MemoryFileSystem } from '../../src/fs/memory.js';
import { createScriptedPrompter, type ScriptedAnswer } from '../../src/questionnaire/scripted.js';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { walkFiles } from '../../src/fs/walk.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import { joinPath } from '../../src/fs/types.js';
import { SAMPLE_SCAFFOLD } from '../helpers/fixtures.js';

interface Harness {
  fs: MemoryFileSystem;
  lines: string[];
  commands: string[];
  deps: CliDeps;
}

/** Le catalogue livré est copié dans le système de fichiers en mémoire, sous `content/`. */
let contentSnapshot: Record<string, string> | undefined;
async function shippedContent(): Promise<Record<string, string>> {
  if (contentSnapshot) return contentSnapshot;
  const node = createNodeFileSystem();
  const root = defaultContentRoot();
  const files: Record<string, string> = {};
  for (const relative of await walkFiles(node, root)) {
    files[`content/${relative}`] = (await node.readText(joinPath(root, relative))) ?? '';
  }
  contentSnapshot = files;
  return files;
}

async function harness(
  initial: Record<string, string> = {},
  answers: ScriptedAnswer[] = [],
): Promise<Harness> {
  const fs = createMemoryFileSystem({ ...(await shippedContent()), ...initial });
  const lines: string[] = [];
  const commands: string[] = [];
  const reporter: Reporter = {
    info: (m) => lines.push(`I ${m}`),
    warn: (m) => lines.push(`W ${m}`),
    error: (m) => lines.push(`E ${m}`),
  };
  const runner: CommandRunner = {
    run(command, args) {
      commands.push([command, ...args].join(' '));
      if (args[0] === 'config' && args[1] === '--global')
        return Promise.resolve(args[3] === 'user.name' ? 'Global Name' : 'global@example.com');
      return Promise.resolve('');
    },
  };
  const deps: CliDeps = {
    fs,
    prompter: () => createScriptedPrompter(answers),
    commands: runner,
    reporter,
    toolVersion: '0.1.0',
    contentRoot: 'content',
    cwd: '/work',
    today: '2026-09-02',
  };
  return { fs, lines, commands, deps };
}

describe('prepwork CLI', () => {
  it('init --scaffold generates the project, then configures git', async () => {
    const h = await harness({ '/work/s.yaml': serializeScaffold(SAMPLE_SCAFFOLD) });
    const code = await runCli(h.deps, ['init', 'pay-flow', '--scaffold', 's.yaml']);
    expect(code).toBe(0);
    expect(h.fs.snapshot()['/work/pay-flow/pom.xml']).toContain(
      '<artifactId>pay-flow</artifactId>',
    );
    expect(h.fs.snapshot()['/work/pay-flow/scaffold.yaml']).toBeDefined();
    expect(h.commands).toEqual([
      'git init --initial-branch=main',
      'git config user.name Hery',
      'git config user.email hery@example.com',
      'git config core.hooksPath .githooks',
    ]);
    expect(h.lines.some((l) => l.startsWith('I Généré :'))).toBe(true);
    expect(h.lines.some((l) => l.includes('git initialisé'))).toBe(true);
  });

  it('init runs the questionnaire when no scaffold is given and honours --no-git and --dry-run', async () => {
    const answers: ScriptedAnswer[] = [
      'pay-flow',
      'mg.solumada.payflow',
      'Payment flows',
      21,
      'postgresql',
      'flyway',
      'layered',
      'none',
      true,
      'github',
      '',
      '',
      true,
      'fr',
      'fr',
      true,
    ];
    const h = await harness({}, answers);
    const code = await runCli(h.deps, ['init', 'out', '--no-git']);
    expect(code).toBe(0);
    expect(h.fs.snapshot()['/work/out/scaffold.yaml']).toContain('name: Global Name');
    expect(h.commands.filter((c) => c.startsWith('git init'))).toEqual([]);

    const dry = await harness({}, answers);
    expect(await runCli(dry.deps, ['init', 'out', '--dry-run', '--no-git'])).toBe(0);
    expect(Object.keys(dry.fs.snapshot()).some((p) => p.startsWith('/work/out/'))).toBe(false);
    expect(dry.lines.some((l) => l.startsWith('I Plan (dry-run)'))).toBe(true);
  });

  it('check exits 1 when the project is out of date and 0 when clean; sync repairs', async () => {
    const h = await harness({ '/work/s.yaml': serializeScaffold(SAMPLE_SCAFFOLD) });
    await runCli(h.deps, ['init', 'p', '--scaffold', 's.yaml', '--no-git']);
    expect(await runCli(h.deps, ['check', 'p'])).toBe(0);
    expect(h.lines.at(-1)).toBe('I Projet à jour.');

    await h.fs.writeText(
      '/work/p/scaffold.yaml',
      (h.fs.snapshot()['/work/p/scaffold.yaml'] ?? '').replace('docker: true', 'docker: false'),
    );
    expect(await runCli(h.deps, ['check', 'p'])).toBe(1);
    expect(h.lines.some((l) => l.includes('à supprimer  Dockerfile'))).toBe(true);

    expect(await runCli(h.deps, ['sync', 'p'])).toBe(0);
    expect(h.fs.snapshot()['/work/p/Dockerfile']).toBeUndefined();
    expect(await runCli(h.deps, ['check', 'p'])).toBe(0);
  });

  it('reports typed errors with their code and refuses a non-empty directory', async () => {
    const h = await harness({
      '/work/busy/file.txt': 'x',
      '/work/s.yaml': serializeScaffold(SAMPLE_SCAFFOLD),
    });
    expect(await runCli(h.deps, ['init', 'busy', '--scaffold', 's.yaml'])).toBe(1);
    expect(h.lines.at(-1)).toMatch(/^E \[TARGET_NOT_EMPTY\]/);

    expect(await runCli(h.deps, ['check', 'nowhere'])).toBe(1);
    expect(h.lines.at(-1)).toMatch(/^E \[SCAFFOLD_NOT_FOUND\]/);

    expect(await runCli(h.deps, ['init', 'x', '--scaffold', 'missing.yaml'])).toBe(1);
    expect(h.lines.at(-1)).toMatch(/^E \[SCAFFOLD_NOT_FOUND\]/);
  });

  it('returns 130 when the questionnaire is cancelled and prints help/version through commander', async () => {
    const h = await harness({}, [
      'pay-flow',
      'mg.solumada.payflow',
      'Desc',
      21,
      'none',
      'layered',
      'none',
      false,
      'none',
      'A',
      'a@b.co',
      false,
      'en',
      'en',
      false,
    ]);
    expect(await runCli(h.deps, ['init', 'out', '--no-git'])).toBe(130);
    expect(await runCli(h.deps, ['--version'])).toBe(0);
    expect(h.lines.some((l) => l.includes('0.1.0'))).toBe(true);
  });
});
