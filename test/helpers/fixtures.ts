// Fabriques de contenu minimal valide pour tester le catalogue sans toucher à content/.
import { stringify } from 'yaml';
import type { OptionInput, ProfileInput } from '../../src/catalog/schema.js';
import type { Scaffold } from '../../src/config/schema.js';

export const CONTENT_ROOT = 'content';

export function minimalCoreRuleSet(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'workflow',
    skill: 'workflow',
    title: 'Workflow',
    rules: [{ id: 'CORE-001', statement: 'S', rationale: 'R', enforced_by: 'none' }],
    ...overrides,
  };
}

export function minimalProfile(overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    meta: {
      id: 'layered',
      version: '1.0.0',
      rule_prefix: 'LAY',
      summary: 'Layered',
      when_to_use: ['small team'],
      when_not_to_use: ['many domains'],
    },
    architecture: {
      base_package: '{{basePackage}}',
      layers: [
        { id: 'web', package: '{{basePackage}}.web', may_depend_on: ['service'] },
        { id: 'service', package: '{{basePackage}}.service', may_depend_on: [] },
      ],
    },
    rules: [{ id: 'LAY-001', statement: 'S', rationale: 'R', enforced_by: 'none' }],
    anti_patterns: [],
    dependencies: { allowed: [], forbidden: [], add_procedure: ['ask first'] },
    reference_example: { feature: 'Note', files: [], demonstrates: ['LAY-001'] },
    skills: { architecture: ['LAY-001'] },
    ...overrides,
  };
}

export function minimalOption(overrides: Partial<OptionInput> = {}): OptionInput {
  return {
    meta: { id: 'docker', version: '1.0.0', rule_prefix: 'DOCK', summary: 'Docker files' },
    skill: 'workflow',
    rules: [{ id: 'DOCK-001', statement: 'S', rationale: 'R', enforced_by: 'none' }],
    ...overrides,
  };
}

export interface CatalogFixture {
  core?: Record<string, unknown>[];
  profiles?: ProfileInput[];
  options?: OptionInput[];
  /** Fichiers supplémentaires (chemin relatif à content/ → contenu). */
  extra?: Record<string, string>;
}

/** Fichiers d'un catalogue minimal, prêts pour `createMemoryFileSystem`. */
export function catalogFiles(fixture: CatalogFixture = {}): Record<string, string> {
  const files: Record<string, string> = {};
  const core = fixture.core ?? [minimalCoreRuleSet()];
  for (const ruleSet of core) {
    files[`${CONTENT_ROOT}/core/${String(ruleSet.id)}.yaml`] = stringify(ruleSet);
  }
  for (const profile of fixture.profiles ?? [minimalProfile()]) {
    files[`${CONTENT_ROOT}/profiles/${profile.meta.id}/profile.yaml`] = stringify(profile);
  }
  for (const option of fixture.options ?? []) {
    files[`${CONTENT_ROOT}/options/${option.meta.id}/option.yaml`] = stringify(option);
  }
  for (const [path, content] of Object.entries(fixture.extra ?? {})) {
    files[`${CONTENT_ROOT}/${path}`] = content;
  }
  return files;
}

/** Scaffold de référence (exemple de CLAUDE.md §5). */
export const SAMPLE_SCAFFOLD: Scaffold = {
  scaffold_version: '1.0.0',
  project: { name: 'pay-flow', base_package: 'mg.solumada.payflow', description: 'Payment flows' },
  stack: { java: 21, database: 'postgresql', migrations: 'flyway' },
  profile: 'layered',
  options: { security: 'none', docker: true, ci: 'github' },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
};
