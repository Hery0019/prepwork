// Contexte de templates du pack `aspnet` : résolution du graphe de projets, agrégats additifs
// des contributions (paquets NuGet, `appsettings`), aides de typage SQL/C#, versions épinglées.
import { evaluateCondition } from '../../catalog/condition.js';
import { PrepworkError } from '../../errors.js';
import type { BaseTemplateContext, TemplateContext } from '../../engine/context.js';
import { cloneTree, mergeTree } from '../../engine/tree.js';
import type { Column, Table } from '../sql.js';
import { tablesOf } from '../sql.js';
import type { PackContextInput } from '../types.js';
import {
  appSettingsOf,
  dotnetOf,
  ROOT_NAMESPACE_PLACEHOLDER,
  type AppSettingsContribution,
  type DotnetContribution,
  type DotnetProject,
  type NuGetPackage,
} from './catalog.js';
import { asAspnetScaffold, type Database } from './scaffold.js';

/** Versions épinglées par l'outil (ADR 0010 §5 : la version du SDK n'est pas demandée). */
export const PINNED_VERSIONS = {
  /** `net10.0` : valeur de `<TargetFramework>`. */
  targetFramework: 'net10.0',
  /** Version exacte du SDK exigée par `global.json`. */
  sdk: '10.0.400',
  /** Politique de `global.json` : un SDK plus récent de la même bande majeure convient. */
  rollForward: 'latestFeature',
} as const;
export type PinnedVersions = typeof PINNED_VERSIONS;

/** Un projet résolu : ce que les templates `csproj` et `sln` consomment. */
export interface ProjectContext {
  id: string;
  /** Nom d'assembly et de répertoire : `Solumada.PayFlow.Api`. */
  name: string;
  /** Chemin du répertoire depuis la racine du dépôt. */
  dir: string;
  /** Chemin du `csproj` depuis la racine du dépôt. */
  csproj: string;
  kind: DotnetProject['kind'];
  namespace: string;
  roles: string[];
  /** Références de projet, chemin relatif depuis ce `csproj`. */
  references: { id: string; name: string; path: string }[];
  packages: NuGetPackage[];
}

export interface AppSettingsContext {
  main: Record<string, unknown>;
  /** Documents `appsettings.<Environnement>.json`, par nom d'environnement en minuscules. */
  environments: Record<string, Record<string, unknown>>;
}

function conflict(message: string): PrepworkError {
  return new PrepworkError('COMPOSITION_CONFLICT', message);
}

/** Répertoire d'un projet : les tests vivent sous `tests/`, le reste sous `src/`. */
function projectDir(project: DotnetProject, name: string): string {
  return `${project.kind === 'test' ? 'tests' : 'src'}/${name}`;
}

/**
 * Chemin de `toFile` vu depuis `fromDir`. Les projets ne sont pas tous frères — les tests vivent
 * sous `tests/` — donc un `../` systématique produirait des références qui ne résolvent pas.
 */
export function relativePath(fromDir: string, toFile: string): string {
  const from = fromDir.split('/');
  const to = toFile.split('/');
  while (from.length > 0 && to.length > 1 && from[0] === to[0]) {
    from.shift();
    to.shift();
  }
  return [...from.map(() => '..'), ...to].join('/');
}

/**
 * Résout le graphe de projets et y répartit les paquets : ceux du profil par `project`, ceux
 * des options par `role`. Un paquet déclaré deux fois pour la même cible dans deux versions est
 * un conflit ; un rôle que personne ne porte aussi.
 */
export function resolveProjects(
  rootNamespace: string,
  contributions: readonly [string, DotnetContribution | undefined][],
  conditionContext: Record<string, unknown>,
): ProjectContext[] {
  const declarations: [string, DotnetProject][] = [];
  for (const [label, contribution] of contributions) {
    for (const project of contribution?.projects ?? []) {
      const previous = declarations.find(([, p]) => p.id === project.id);
      if (previous) {
        throw conflict(`projet \`${project.id}\` déclaré par ${previous[0]} et ${label}`);
      }
      declarations.push([label, project]);
    }
  }
  if (declarations.length === 0) throw conflict('aucun projet .NET déclaré par le profil');

  const nameOf = (project: DotnetProject): string => `${rootNamespace}.${project.suffix}`;
  const byId = new Map(declarations.map(([, p]) => [p.id, p] as const));
  const projects: ProjectContext[] = declarations.map(([label, project]) => {
    const name = nameOf(project);
    const dir = projectDir(project, name);
    return {
      id: project.id,
      name,
      dir,
      csproj: `${dir}/${name}.csproj`,
      kind: project.kind,
      namespace: name,
      roles: [...project.roles],
      references: project.references.map((id) => {
        const target = byId.get(id);
        if (!target) throw conflict(`${label} : le projet \`${project.id}\` référence \`${id}\``);
        const targetName = nameOf(target);
        const targetDir = projectDir(target, targetName);
        return {
          id,
          name: targetName,
          path: relativePath(dir, `${targetDir}/${targetName}.csproj`),
        };
      }),
      packages: [],
    };
  });

  const declaredBy = new Map<string, string>();
  const add = (target: ProjectContext, pkg: NuGetPackage, label: string): void => {
    const key = `${target.id}:${pkg.id}`;
    const previous = declaredBy.get(key);
    if (previous !== undefined) {
      const existing = target.packages.find((p) => p.id === pkg.id);
      if (existing && existing.version !== pkg.version) {
        throw conflict(
          `paquet \`${pkg.id}\` dans \`${target.name}\` : \`${existing.version}\` (${previous}) vs \`${pkg.version}\` (${label})`,
        );
      }
      return;
    }
    declaredBy.set(key, label);
    target.packages.push(pkg);
  };

  for (const [label, contribution] of contributions) {
    for (const pkg of contribution?.packages ?? []) {
      if (pkg.when !== undefined && !evaluateCondition(pkg.when, conditionContext)) continue;
      if (pkg.project !== undefined) {
        const target = projects.find((p) => p.id === pkg.project);
        if (!target) throw conflict(`${label} : paquet \`${pkg.id}\` vers un projet inconnu`);
        add(target, pkg, label);
        continue;
      }
      const targets = projects.filter((p) => p.roles.includes(pkg.role ?? ''));
      if (targets.length === 0) {
        throw conflict(
          `${label} : paquet \`${pkg.id}\` visant le rôle \`${pkg.role ?? ''}\`, qu'aucun projet du profil ne porte`,
        );
      }
      for (const target of targets) add(target, pkg, label);
    }
  }

  for (const project of projects) {
    project.packages.sort((a, b) => a.id.localeCompare(b.id));
  }
  return projects;
}

const APP_SETTING = 'clé `appsettings`';

export function mergeAppSettings(
  contributions: readonly [string, AppSettingsContribution | undefined][],
): AppSettingsContext {
  const result: AppSettingsContext = { main: {}, environments: {} };
  for (const [label, contribution] of contributions) {
    if (!contribution) continue;
    for (const [document, tree] of Object.entries(contribution)) {
      if (document === 'main') mergeTree(result.main, tree, '', label, APP_SETTING);
      else {
        result.environments[document] ??= {};
        mergeTree(result.environments[document], tree, '', label, APP_SETTING);
      }
    }
  }
  return result;
}

/** Propriétés MSBuild communes, fusionnées comme les propriétés Maven. */
export function mergeMsBuildProperties(
  contributions: readonly [string, DotnetContribution | undefined][],
): Record<string, string> {
  const properties = new Map<string, [string, string]>();
  for (const [label, contribution] of contributions) {
    for (const [key, value] of Object.entries(contribution?.properties ?? {})) {
      const previous = properties.get(key);
      if (previous && previous[1] !== value) {
        throw conflict(
          `propriété MSBuild \`${key}\` : \`${previous[1]}\` (${previous[0]}) vs \`${value}\` (${label})`,
        );
      }
      properties.set(key, [label, value]);
    }
  }
  return Object.fromEntries([...properties.entries()].map(([k, [, v]]) => [k, v]));
}

/** Type CLR de la colonne, sans la nullabilité : ce que les migrations écrivent. */
export function clrTypeFor(column: Column): string {
  return {
    identity: 'long',
    string: 'string',
    text: 'string',
    integer: 'int',
    bigint: 'long',
    boolean: 'bool',
    timestamp: 'DateTimeOffset',
    date: 'DateOnly',
    decimal: 'decimal',
  }[column.type];
}

/** Vrai quand le type CLR est une référence : seuls ceux-là portent `IsRequired`. */
export function isReferenceType(column: Column): boolean {
  return column.type === 'string' || column.type === 'text';
}

export function csharpTypeFor(column: Column): string {
  const type = {
    identity: 'long',
    string: 'string',
    text: 'string',
    integer: 'int',
    bigint: 'long',
    boolean: 'bool',
    timestamp: 'DateTimeOffset',
    date: 'DateOnly',
    decimal: 'decimal',
  }[column.type];
  return column.nullable ? `${type}?` : type;
}

/** Type de colonne tel qu'EF Core l'écrit, pour `HasColumnType` et pour la migration. */
export function efColumnTypeFor(column: Column, database: Database): string {
  const length = column.length ?? 255;
  switch (database) {
    case 'postgresql':
      return {
        identity: 'bigint',
        string: `character varying(${length})`,
        text: 'text',
        integer: 'integer',
        bigint: 'bigint',
        boolean: 'boolean',
        timestamp: 'timestamp with time zone',
        date: 'date',
        decimal: 'numeric(19,4)',
      }[column.type];
    case 'sqlserver':
      return {
        identity: 'bigint',
        string: `nvarchar(${length})`,
        text: 'nvarchar(max)',
        integer: 'int',
        bigint: 'bigint',
        boolean: 'bit',
        timestamp: 'datetimeoffset',
        date: 'date',
        decimal: 'decimal(19,4)',
      }[column.type];
    case 'none':
      return '';
  }
}

/** `note_title` → `NoteTitle` : nom de propriété C# d'une colonne. */
export function propertyNameFor(column: Column): string {
  return column.name
    .split('_')
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

/** Clés du contexte propres au pack, ajoutées à la base commune. */
export interface AspnetTemplateContext extends BaseTemplateContext {
  project: BaseTemplateContext['project'] & {
    rootNamespace: string;
    /** Nom de base de données par défaut : `pay-flow` → `pay_flow`. */
    dbName: string;
  };
  stack: { database: Database };
  options: { security: string; docker: boolean; ci: string };
  projects: ProjectContext[];
  /** Projet portant un rôle donné, pour les templates qui n'ont pas à connaître les couches. */
  projectFor: (role: string) => ProjectContext;
  appSettings: AppSettingsContext;
  msbuild: Record<string, string>;
  tables: Table[];
  layers: { id: string; namespace: string; mayDependOn: string[] }[];
  versions: PinnedVersions;
  csharpType: (column: Column) => string;
  clrType: (column: Column) => string;
  isReferenceType: (column: Column) => boolean;
  efColumnType: (column: Column) => string;
  propertyName: (column: Column) => string;
  /** Le contexte reste ouvert : les templates lisent des clés que le cœur ne connaît pas. */
  [key: string]: unknown;
}

export function buildAspnetContext(
  base: BaseTemplateContext,
  input: PackContextInput,
): TemplateContext {
  const scaffold = asAspnetScaffold(input.scaffold);
  const { profile, options } = input;
  const p = profile.profile;
  const rootNamespace = scaffold.project.root_namespace;
  const database = scaffold.stack.database;

  // Contexte réduit servant à évaluer les conditions des paquets, avant que le contexte
  // complet n'existe.
  const conditionContext: Record<string, unknown> = {
    project: { name: scaffold.project.name, rootNamespace },
    stack: { database },
    profile: profile.id,
    options: scaffold.options,
    optionIds: options.map((o) => o.id),
    git: { agentTrailer: scaffold.git.agent_trailer },
    language: { comments: scaffold.language.comments, docs: scaffold.language.docs },
  };

  const dotnetContributions: [string, DotnetContribution | undefined][] = [
    [`profiles/${profile.id}`, dotnetOf(p)],
    ...options.map((o): [string, DotnetContribution | undefined] => [
      `options/${o.id}`,
      dotnetOf(o.option),
    ]),
  ];
  const projects = resolveProjects(rootNamespace, dotnetContributions, conditionContext);
  const appSettings = mergeAppSettings([
    [`profiles/${profile.id}`, appSettingsOf(p)],
    ...options.map((o): [string, AppSettingsContribution | undefined] => [
      `options/${o.id}`,
      appSettingsOf(o.option),
    ]),
  ]);

  const context: AspnetTemplateContext = {
    ...base,
    project: {
      ...base.project,
      rootNamespace,
      dbName: scaffold.project.name.replace(/-/g, '_'),
    },
    stack: { database },
    options: scaffold.options,
    projects,
    projectFor: (role) => {
      const found = projects.find((project) => project.roles.includes(role));
      if (!found) throw conflict(`aucun projet ne porte le rôle \`${role}\``);
      return found;
    },
    appSettings,
    msbuild: mergeMsBuildProperties(dotnetContributions),
    tables: tablesOf(p.reference_example),
    layers: p.architecture.layers.map((l) => ({
      id: l.id,
      namespace: l.target.split(ROOT_NAMESPACE_PLACEHOLDER).join(rootNamespace),
      mayDependOn: [...l.may_depend_on],
    })),
    versions: PINNED_VERSIONS,
    merge: (tree, contribution) => {
      const result = cloneTree(tree);
      mergeTree(result, contribution, '', 'template', APP_SETTING);
      return result;
    },
    csharpType: csharpTypeFor,
    clrType: clrTypeFor,
    isReferenceType,
    efColumnType: (column) => efColumnTypeFor(column, database),
    propertyName: propertyNameFor,
  };
  return context;
}
