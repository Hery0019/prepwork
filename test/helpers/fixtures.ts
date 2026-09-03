// Fabriques de contenu minimal valide pour tester le catalogue sans toucher à content/.
import { stringify } from 'yaml';
import { springBootPack } from '../../src/packs/spring-boot/index.js';
import type { Scaffold } from '../../src/packs/spring-boot/scaffold.js';

export const CONTENT_ROOT = 'content';
/** Pack utilisé par les tests du cœur : le seul livré en v1. */
export const TEST_PACK = springBootPack;
export const PACK_ROOT = `${CONTENT_ROOT}/${TEST_PACK.contentDir}`;

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

export function minimalProfile(overrides: Record<string, unknown> = {}): Record<string, unknown> {
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
        { id: 'web', target: '{{basePackage}}.web', may_depend_on: ['service'] },
        { id: 'service', target: '{{basePackage}}.service', may_depend_on: [] },
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

export function minimalOption(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    meta: { id: 'docker', version: '1.0.0', rule_prefix: 'DOCK', summary: 'Docker files' },
    skill: 'workflow',
    rules: [{ id: 'DOCK-001', statement: 'S', rationale: 'R', enforced_by: 'none' }],
    ...overrides,
  };
}

function metaValue(value: unknown): string {
  return typeof value === 'string' ? value : 'unknown';
}

function metaId(value: Record<string, unknown>): string {
  const meta = value.meta;
  const id = typeof meta === 'object' && meta !== null ? (meta as { id?: unknown }).id : undefined;
  return typeof id === 'string' ? id : 'unknown';
}

export interface CatalogFixture {
  core?: Record<string, unknown>[];
  profiles?: Record<string, unknown>[];
  options?: Record<string, unknown>[];
  /** Ensembles de règles communs à tous les packs (`content/common/core`). */
  common?: Record<string, unknown>[];
  /** Fichiers supplémentaires (chemin relatif au contenu du pack → contenu). */
  extra?: Record<string, string>;
}

/** Fichiers d'un catalogue minimal, prêts pour `createMemoryFileSystem`. */
export function catalogFiles(fixture: CatalogFixture = {}): Record<string, string> {
  const files: Record<string, string> = {};
  const core = fixture.core ?? [minimalCoreRuleSet()];
  for (const ruleSet of core) {
    files[`${PACK_ROOT}/core/${metaValue(ruleSet.id)}.yaml`] = stringify(ruleSet);
  }
  for (const ruleSet of fixture.common ?? []) {
    files[`${CONTENT_ROOT}/common/core/${metaValue(ruleSet.id)}.yaml`] = stringify(ruleSet);
  }
  for (const profile of fixture.profiles ?? [minimalProfile()]) {
    files[`${PACK_ROOT}/profiles/${metaId(profile)}/profile.yaml`] = stringify(profile);
  }
  for (const option of fixture.options ?? []) {
    files[`${PACK_ROOT}/options/${metaId(option)}/option.yaml`] = stringify(option);
  }
  for (const [path, content] of Object.entries(fixture.extra ?? {})) {
    files[`${PACK_ROOT}/${path}`] = content;
  }
  return files;
}

/** Scaffold de référence (exemple de CLAUDE.md §5). */
export const SAMPLE_SCAFFOLD: Scaffold = {
  scaffold_version: '1.2.0',
  project: { name: 'pay-flow', base_package: 'mg.solumada.payflow', description: 'Payment flows' },
  stack: { target: 'spring-boot', java: 21, database: 'postgresql', migrations: 'flyway' },
  profile: 'layered',
  renderer: 'claude-code',
  options: { security: 'none', docker: true, ci: 'github' },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
};
