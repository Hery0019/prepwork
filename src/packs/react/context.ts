// Contexte de templates du pack `react` : agrégats additifs des contributions (`package.json`,
// fragments de configuration), tokens du preset visuel, versions épinglées.
import { evaluateCondition } from '../../catalog/condition.js';
import type { BaseTemplateContext, TemplateContext } from '../../engine/context.js';
import { cloneTree, mergeTree } from '../../engine/tree.js';
import { PrepworkError } from '../../errors.js';
import type { PackContextInput } from '../types.js';
import {
  configOf,
  npmOf,
  routesOf,
  type ConfigContribution,
  type NpmContribution,
  type NpmDependency,
} from './catalog.js';
import { designPreset, type DesignPreset } from './design.js';
import { asReactScaffold } from './scaffold.js';

/**
 * Versions épinglées par l'outil (CLAUDE.md §5 : jamais demandées), figées sur la résolution
 * réelle d'un `pnpm install`. Les dépendances du projet généré sont déclarées dans le catalogue ;
 * ce bloc ne porte que ce dont les templates ont besoin directement.
 */
export const PINNED_VERSIONS = {
  node: '22',
  /** Image Playwright de la CI GitLab : elle doit suivre la version du paquet. */
  playwright: '1.62.1',
} as const;
export type PinnedVersions = typeof PINNED_VERSIONS;

export interface NpmContext {
  dependencies: NpmDependency[];
  devDependencies: NpmDependency[];
  scripts: Record<string, string>;
}

function conflict(message: string): PrepworkError {
  return new PrepworkError('COMPOSITION_CONFLICT', message);
}

export function mergeNpm(
  contributions: readonly [string, NpmContribution | undefined][],
  conditionContext: Record<string, unknown>,
): NpmContext {
  const packages = new Map<string, [string, NpmDependency]>();
  const scripts = new Map<string, [string, string]>();
  for (const [label, contribution] of contributions) {
    if (!contribution) continue;
    for (const dep of contribution.dependencies) {
      if (dep.when !== undefined && !evaluateCondition(dep.when, conditionContext)) continue;
      const previous = packages.get(dep.name);
      if (previous) {
        if (previous[1].version !== dep.version || previous[1].scope !== dep.scope) {
          throw conflict(
            `paquet \`${dep.name}\` déclaré différemment par ${previous[0]} et ${label}`,
          );
        }
        continue;
      }
      packages.set(dep.name, [label, dep]);
    }
    for (const [name, command] of Object.entries(contribution.scripts)) {
      const previous = scripts.get(name);
      if (previous && previous[1] !== command) {
        throw conflict(
          `script \`${name}\` : \`${previous[1]}\` (${previous[0]}) vs \`${command}\` (${label})`,
        );
      }
      scripts.set(name, [label, command]);
    }
  }
  const all = [...packages.values()].map(([, dep]) => dep);
  const byName = (a: NpmDependency, b: NpmDependency): number => a.name.localeCompare(b.name);
  return {
    dependencies: all.filter((d) => d.scope === 'prod').sort(byName),
    devDependencies: all.filter((d) => d.scope === 'dev').sort(byName),
    scripts: Object.fromEntries(
      [...scripts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, [, v]]) => [k, v]),
    ),
  };
}

const CONFIG_FRAGMENT = 'fragment de configuration';

export function mergeConfig(
  contributions: readonly [string, ConfigContribution | undefined][],
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const [label, contribution] of contributions) {
    if (!contribution) continue;
    for (const [tool, tree] of Object.entries(contribution)) {
      result[tool] ??= {};
      mergeTree(result[tool], tree, '', label, CONFIG_FRAGMENT);
    }
  }
  return result;
}

/** Clés du contexte propres au pack, ajoutées à la base commune. */
export interface ReactTemplateContext extends BaseTemplateContext {
  stack: { target: 'react'; node: string; data: string; forms: string };
  options: {
    state: string;
    security: string;
    i18n: boolean;
    e2e: boolean;
    docker: boolean;
    ci: string;
  };
  design: { preset: DesignPreset; dark: boolean };
  npm: NpmContext;
  config: Record<string, Record<string, unknown>>;
  layers: { id: string; path: string; mayDependOn: string[] }[];
  routes: string[];
  versions: PinnedVersions;
  [key: string]: unknown;
}

export function buildReactContext(
  base: BaseTemplateContext,
  input: PackContextInput,
): TemplateContext {
  const scaffold = asReactScaffold(input.scaffold);
  const { profile, options } = input;
  const p = profile.profile;

  const conditionContext: Record<string, unknown> = {
    project: { name: scaffold.project.name },
    stack: {
      target: scaffold.stack.target,
      node: PINNED_VERSIONS.node,
      data: scaffold.stack.data,
      forms: scaffold.stack.forms,
    },
    profile: profile.id,
    options: scaffold.options,
    optionIds: options.map((o) => o.id),
    design: { preset: scaffold.design.preset, dark: scaffold.design.dark },
    git: { agentTrailer: scaffold.git.agent_trailer },
    language: scaffold.language,
  };

  const npm = mergeNpm(
    [
      [`profiles/${profile.id}`, npmOf(p)],
      ...options.map((o): [string, NpmContribution | undefined] => [
        `options/${o.id}`,
        npmOf(o.option),
      ]),
    ],
    conditionContext,
  );
  const config = mergeConfig([
    [`profiles/${profile.id}`, configOf(p)],
    ...options.map((o): [string, ConfigContribution | undefined] => [
      `options/${o.id}`,
      configOf(o.option),
    ]),
  ]);

  const context: ReactTemplateContext = {
    ...base,
    stack: {
      target: 'react',
      node: PINNED_VERSIONS.node,
      data: scaffold.stack.data,
      forms: scaffold.stack.forms,
    },
    options: scaffold.options,
    design: { preset: designPreset(scaffold.design.preset), dark: scaffold.design.dark },
    npm,
    config,
    layers: p.architecture.layers.map((l) => ({
      id: l.id,
      path: l.target,
      mayDependOn: [...l.may_depend_on],
    })),
    routes: routesOf(p.reference_example),
    versions: PINNED_VERSIONS,
    merge: (tree, contribution) => {
      const result = cloneTree(tree);
      mergeTree(result, contribution, '', 'template', CONFIG_FRAGMENT);
      return result;
    },
  };
  return context;
}
