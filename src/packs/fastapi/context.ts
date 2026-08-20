// Contexte de templates du pack `fastapi` : agrégats additifs des contributions (dépendances PyPI,
// modules, réglages d'outillage), couches, tables, versions épinglées.
import { evaluateCondition } from '../../catalog/condition.js';
import type { BaseTemplateContext, TemplateContext } from '../../engine/context.js';
import { PrepworkError } from '../../errors.js';
import { tablesOf, type Table } from '../sql.js';
import type { PackContextInput } from '../types.js';
import {
  PACKAGE_NAME_PLACEHOLDER,
  pythonOf,
  type ModuleRole,
  type PyPiPackage,
  type PythonContribution,
  type PythonModule,
} from './catalog.js';
import { asFastapiScaffold } from './scaffold.js';

/**
 * Versions épinglées par l'outil (ADR 0011 §4 : jamais demandées). Les dépendances du projet
 * généré sont déclarées dans le catalogue ; ce bloc ne porte que ce dont les templates ont besoin
 * directement.
 */
export const PINNED_VERSIONS = {
  /** Écrite dans `.python-version` et lue par `uv` comme par la CI. */
  python: '3.13',
  /** Image de base du Dockerfile ; elle doit suivre `python`. */
  pythonImage: '3.13-slim',
  /** Version d'`uv` installée dans l'étape de build. */
  uv: '0.9.9',
} as const;
export type PinnedVersions = typeof PINNED_VERSIONS;

export interface PythonContext {
  /** Dépendances d'exécution, triées, telles qu'écrites dans `[project.dependencies]`. */
  dependencies: PyPiPackage[];
  /** Dépendances d'outillage, triées, écrites dans le groupe `dev`. */
  devDependencies: PyPiPackage[];
  toolSettings: Record<string, string>;
}

function conflict(message: string): PrepworkError {
  return new PrepworkError('COMPOSITION_CONFLICT', message);
}

export function mergePython(
  contributions: readonly [string, PythonContribution | undefined][],
  conditionContext: Record<string, unknown>,
): PythonContext {
  const packages = new Map<string, [string, PyPiPackage]>();
  const settings = new Map<string, [string, string]>();
  for (const [label, contribution] of contributions) {
    if (!contribution) continue;
    for (const pkg of contribution.packages) {
      if (pkg.when !== undefined && !evaluateCondition(pkg.when, conditionContext)) continue;
      const previous = packages.get(pkg.id);
      if (previous) {
        if (previous[1].version !== pkg.version) {
          throw conflict(
            `paquet \`${pkg.id}\` : \`${previous[1].version}\` (${previous[0]}) vs \`${pkg.version}\` (${label})`,
          );
        }
        // Un paquet demandé en `main` par une source et en `dev` par une autre part en `main` :
        // il doit être présent en production, et l'outillage l'y trouvera aussi.
        if (previous[1].group === 'dev' && pkg.group === 'main') packages.set(pkg.id, [label, pkg]);
        continue;
      }
      packages.set(pkg.id, [label, pkg]);
    }
    for (const [key, value] of Object.entries(contribution.tool_settings)) {
      const previous = settings.get(key);
      if (previous && previous[1] !== value) {
        throw conflict(
          `réglage d'outillage \`${key}\` : \`${previous[1]}\` (${previous[0]}) vs \`${value}\` (${label})`,
        );
      }
      settings.set(key, [label, value]);
    }
  }
  const all = [...packages.values()].map(([, pkg]) => pkg);
  const byId = (a: PyPiPackage, b: PyPiPackage): number => a.id.localeCompare(b.id);
  return {
    dependencies: all.filter((p) => p.group === 'main').sort(byId),
    devDependencies: all.filter((p) => p.group === 'dev').sort(byId),
    toolSettings: Object.fromEntries(
      [...settings.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, [, v]]) => [k, v]),
    ),
  };
}

/** Un module du paquet, une fois le nom du paquet substitué. */
export interface ModuleInfo {
  id: string;
  /** Chemin relatif à `src/` : `pay_flow/domain`. */
  dir: string;
  /** Module importable : `pay_flow.domain`. */
  module: string;
  roles: ModuleRole[];
}

/** Clés du contexte propres au pack, ajoutées à la base commune. */
export interface FastapiTemplateContext extends BaseTemplateContext {
  stack: { target: 'fastapi'; database: string };
  options: { security: string; docker: boolean; ci: string };
  project: BaseTemplateContext['project'] & { packageName: string };
  python: PythonContext;
  modules: ModuleInfo[];
  /** Module portant un rôle donné ; lève si le profil n'en déclare aucun. */
  moduleFor: (role: ModuleRole) => ModuleInfo;
  layers: { id: string; module: string; mayDependOn: string[] }[];
  tables: Table[];
  versions: PinnedVersions;
  [key: string]: unknown;
}

export function buildFastapiContext(
  base: BaseTemplateContext,
  input: PackContextInput,
): TemplateContext {
  const scaffold = asFastapiScaffold(input.scaffold);
  const { profile, options } = input;
  const p = profile.profile;
  const packageName = scaffold.project.package_name;

  const conditionContext: Record<string, unknown> = {
    project: { name: scaffold.project.name, packageName },
    stack: { target: scaffold.stack.target, database: scaffold.stack.database },
    profile: profile.id,
    options: scaffold.options,
    optionIds: options.map((o) => o.id),
    git: { agentTrailer: scaffold.git.agent_trailer },
    language: scaffold.language,
  };

  const python = mergePython(
    [
      [`profiles/${profile.id}`, pythonOf(p)],
      ...options.map((o): [string, PythonContribution | undefined] => [
        `options/${o.id}`,
        pythonOf(o.option),
      ]),
    ],
    conditionContext,
  );

  const declared: PythonModule[] = pythonOf(p)?.modules ?? [];
  const modules: ModuleInfo[] = declared.map((m) => ({
    id: m.id,
    dir: `${packageName}/${m.path}`,
    module: `${packageName}.${m.path}`,
    roles: [...m.roles],
  }));

  const context: FastapiTemplateContext = {
    ...base,
    project: { ...base.project, packageName },
    stack: { target: 'fastapi', database: scaffold.stack.database },
    options: scaffold.options,
    python,
    modules,
    moduleFor: (role) => {
      const found = modules.find((m) => m.roles.includes(role));
      if (!found) {
        throw new PrepworkError(
          'COMPOSITION_CONFLICT',
          `le profil \`${profile.id}\` ne déclare aucun module portant le rôle \`${role}\``,
        );
      }
      return found;
    },
    layers: p.architecture.layers.map((l) => ({
      id: l.id,
      module: l.target.split(PACKAGE_NAME_PLACEHOLDER).join(packageName),
      mayDependOn: [...l.may_depend_on],
    })),
    tables: tablesOf(p.reference_example),
    versions: PINNED_VERSIONS,
  };
  return context;
}
