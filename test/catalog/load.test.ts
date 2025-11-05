import { describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog } from '../../src/catalog/load.js';
import { validateCatalog } from '../../src/catalog/validate.js';
import { PrepworkError } from '../../src/errors.js';
import { createMemoryFileSystem } from '../../src/fs/memory.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import {
  CONTENT_ROOT,
  catalogFiles,
  minimalCoreRuleSet,
  minimalOption,
  minimalProfile,
} from '../helpers/fixtures.js';

describe('the shipped content/', () => {
  it('loads and passes the consistency check without errors', async () => {
    const catalog = await loadCatalog(createNodeFileSystem(), defaultContentRoot());
    expect(catalog.core.ruleSets.map((s) => s.id)).toEqual([
      'api',
      'language',
      'security',
      'testing',
      'workflow',
    ]);
    expect([...catalog.profiles.keys()]).toContain('layered');

    const diagnostics = validateCatalog(catalog);
    const errors = diagnostics.filter((d) => d.level === 'error');
    expect(errors, errors.map((e) => `${e.source}: ${e.message}`).join('\n')).toEqual([]);
  });

  it('describes the layered profile as in CLAUDE.md', async () => {
    const catalog = await loadCatalog(createNodeFileSystem(), defaultContentRoot());
    const layered = catalog.profiles.get('layered');
    expect(layered?.profile.architecture.layers.map((l) => l.id)).toEqual([
      'web',
      'service',
      'repository',
      'domain',
    ]);
    expect(layered?.profile.rules.find((r) => r.id === 'LAY-002')?.enforced_by).toBe('archunit');
    expect(layered?.profile.reference_example.tables[0]?.name).toBe('note');
  });
});

describe('loadCatalog on an in-memory catalog', () => {
  it('loads core, profiles, options and their files/templates', async () => {
    const fs = createMemoryFileSystem(
      catalogFiles({
        options: [minimalOption()],
        extra: {
          'options/docker/files.yaml':
            'files:\n  - source: Dockerfile.eta\n    target: Dockerfile\n',
          'options/docker/templates/Dockerfile.eta': 'FROM x',
        },
      }),
    );
    const catalog = await loadCatalog(fs, CONTENT_ROOT);
    expect(catalog.core.ruleSets[0]?.id).toBe('workflow');
    expect(catalog.profiles.get('layered')?.profile.meta.rule_prefix).toBe('LAY');
    const docker = catalog.options.get('docker');
    expect(docker?.files).toEqual([
      { source: 'Dockerfile.eta', target: 'Dockerfile', owner: 'generated' },
    ]);
    expect(docker?.templates.get('Dockerfile.eta')).toBe('FROM x');
    expect(validateCatalog(catalog)).toEqual([]);
  });

  it('reports invalid YAML and schema violations with the file path', async () => {
    const broken = createMemoryFileSystem(
      catalogFiles({ extra: { 'core/workflow.yaml': 'id: workflow\nrules: [\n' } }),
    );
    await expect(loadCatalog(broken, CONTENT_ROOT)).rejects.toThrow(
      /core\/workflow\.yaml : YAML invalide/,
    );

    const invalid = createMemoryFileSystem(
      catalogFiles({ core: [minimalCoreRuleSet({ skill: 'devops' })] }),
    );
    const error = await loadCatalog(invalid, CONTENT_ROOT).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PrepworkError);
    expect((error as PrepworkError).code).toBe('CATALOG_INVALID');
    expect((error as PrepworkError).message).toMatch(/skill/);
  });

  it('requires ids to match directory and file names', async () => {
    const fs = createMemoryFileSystem(
      catalogFiles({
        profiles: [minimalProfile({ meta: { ...minimalProfile().meta, id: 'other' } })],
      }),
    );
    // Le fichier est écrit sous profiles/other/ mais l'id de test reste cohérent ; on force l'écart.
    await fs.writeText(
      `${CONTENT_ROOT}/profiles/other/profile.yaml`,
      (await fs.readText(`${CONTENT_ROOT}/profiles/other/profile.yaml`))?.replace(
        'id: other',
        'id: layered',
      ) ?? '',
    );
    await expect(loadCatalog(fs, CONTENT_ROOT)).rejects.toThrow(
      /meta.id `layered` différent du répertoire `other`/,
    );
  });

  it('fails when the root is missing or core is empty', async () => {
    await expect(loadCatalog(createMemoryFileSystem(), 'nowhere')).rejects.toThrow(/introuvable/);
    const noCore = createMemoryFileSystem({
      [`${CONTENT_ROOT}/profiles/layered/profile.yaml`]: 'meta: {}',
    });
    await expect(loadCatalog(noCore, CONTENT_ROOT)).rejects.toThrow(/aucun ensemble de règles/);
  });
});

describe('validateCatalog', () => {
  it('flags duplicate ids and prefixes that do not match the source', async () => {
    const fs = createMemoryFileSystem(
      catalogFiles({
        core: [
          minimalCoreRuleSet(),
          minimalCoreRuleSet({
            id: 'api',
            skill: 'api',
            rules: [
              { id: 'CORE-001', statement: 'S', rationale: 'R', enforced_by: 'none' },
              { id: 'LAY-099', statement: 'S', rationale: 'R', enforced_by: 'none' },
            ],
          }),
        ],
      }),
    );
    const diagnostics = validateCatalog(await loadCatalog(fs, CONTENT_ROOT));
    // core/api.yaml est chargé avant core/workflow.yaml (ordre alphabétique).
    expect(diagnostics.map((d) => d.message)).toEqual([
      'id `LAY-099` : préfixe attendu `CORE-`',
      'id `CORE-001` déjà déclaré dans core',
    ]);
  });

  it('flags a profile ↔ option cross-dependency in texts', async () => {
    const fs = createMemoryFileSystem(
      catalogFiles({
        profiles: [
          minimalProfile({
            rules: [
              {
                id: 'LAY-001',
                statement: 'Docker images are built by the profile.',
                rationale: 'R',
                enforced_by: 'none',
              },
            ],
          }),
        ],
        options: [
          minimalOption({
            rules: [
              {
                id: 'DOCK-001',
                statement: 'S',
                rationale: 'Only for the layered profile.',
                enforced_by: 'none',
              },
            ],
          }),
        ],
      }),
    );
    const diagnostics = validateCatalog(await loadCatalog(fs, CONTENT_ROOT));
    expect(diagnostics.map((d) => `${d.source} ${d.message}`)).toEqual([
      expect.stringMatching(/options\/docker mentionne le profil `layered`/),
      expect.stringMatching(/profiles\/layered mentionne l'option `docker`/),
    ]);
  });

  it('flags files.yaml problems: missing template, bad target, cross-axis condition', async () => {
    const fs = createMemoryFileSystem(
      catalogFiles({
        options: [minimalOption()],
        extra: {
          'profiles/layered/files.yaml': [
            'files:',
            '  - source: missing.eta',
            '    target: ../x',
            '    when: options.docker',
          ].join('\n'),
          'options/docker/files.yaml': [
            'files:',
            '  - source: a.eta',
            '    target: a',
            "    when: profile == 'layered'",
            '  - source: a.eta',
            '    target: a',
            '  - source: a.eta',
            '    target: b',
            '    when: stack.database ==',
          ].join('\n'),
          'options/docker/templates/a.eta': 'x',
        },
      }),
    );
    const diagnostics = validateCatalog(await loadCatalog(fs, CONTENT_ROOT));
    const messages = diagnostics.map((d) => d.message);
    expect(messages).toContainEqual(expect.stringMatching(/template `missing.eta` introuvable/));
    expect(messages).toContainEqual(expect.stringMatching(/cible `..\/x` doit être relative/));
    expect(messages).toContainEqual(
      expect.stringMatching(/condition sur `options.docker` — un profil ne connaît pas/),
    );
    expect(messages).toContainEqual(
      expect.stringMatching(/condition sur `profile` — une option ne connaît pas/),
    );
    expect(messages).toContainEqual(
      expect.stringMatching(/cible `a` déclarée deux fois sans condition/),
    );
    expect(messages).toContainEqual(expect.stringMatching(/condition invalide/));
  });

  it('flags templates that reach across axes', async () => {
    const fs = createMemoryFileSystem(
      catalogFiles({
        options: [minimalOption()],
        extra: {
          'profiles/layered/templates/x.eta': '<%= it.options.docker %>',
          'options/docker/templates/y.eta': '<%= it.profile %>',
        },
      }),
    );
    const diagnostics = validateCatalog(await loadCatalog(fs, CONTENT_ROOT));
    expect(diagnostics.map((d) => d.source)).toEqual(['profiles/layered', 'options/docker']);
  });

  it('requires a test carrying the rule id for archunit rules once templates exist', async () => {
    const rule = {
      id: 'LAY-001',
      statement: 'S',
      rationale: 'R',
      enforced_by: 'archunit' as const,
    };
    const noTemplates = createMemoryFileSystem(
      catalogFiles({ profiles: [minimalProfile({ rules: [rule] })] }),
    );
    const pending = validateCatalog(await loadCatalog(noTemplates, CONTENT_ROOT));
    expect(pending).toHaveLength(1);
    expect(pending[0]?.level).toBe('warning');
    expect(pending[0]?.source).toBe('profiles/layered');
    expect(pending[0]?.message).toMatch(/sans test nommé `LAY_001`/);

    const withTemplates = createMemoryFileSystem(
      catalogFiles({
        profiles: [minimalProfile({ rules: [rule] })],
        extra: { 'profiles/layered/templates/src/main/java/App.java.eta': 'class App {}' },
      }),
    );
    const missing = validateCatalog(await loadCatalog(withTemplates, CONTENT_ROOT));
    expect(missing[0]?.level).toBe('error');

    const withTest = createMemoryFileSystem(
      catalogFiles({
        profiles: [minimalProfile({ rules: [rule] })],
        extra: {
          'profiles/layered/templates/src/test/java/ArchTest.java.eta':
            'void LAY_001_web_does_not_depend() {}',
        },
      }),
    );
    expect(validateCatalog(await loadCatalog(withTest, CONTENT_ROOT))).toEqual([]);
  });
});
