// Composition : scaffold + catalogue → contexte de templates et liste des fichiers à rendre.
// Composition additive uniquement (CLAUDE.md §2) : une contribution qui contredit une autre
// est un conflit, jamais une surcharge silencieuse.
import { evaluateCondition, parseCondition } from '../catalog/condition.js';
import type { Catalog, CatalogSource, OptionCatalog, ProfileCatalog } from '../catalog/load.js';
import {
  BASE_PACKAGE_PLACEHOLDER,
  type EnvVar,
  type FileEntry,
  type MavenBom,
  type MavenContribution,
  type MavenDependency,
  type PropertiesContribution,
  type PropertyTree,
} from '../catalog/schema.js';
import { pickText } from '../catalog/text.js';
import { resolveOptionIds, type Scaffold } from '../config/schema.js';
import { PrepworkError } from '../errors.js';
import {
  javaTypeFor,
  liquibaseTypeFor,
  PINNED_VERSIONS,
  sqlTypeFor,
  toClassName,
  yamlText,
  type ComposeExtras,
  type MavenContext,
  type PropertiesContext,
  type TemplateContext,
} from './context.js';
import { createTemplateEngine, type TemplateEngine } from './templates.js';

export interface PlannedTemplate {
  /** Étiquette de la source : `core`, `profiles/layered`, `options/docker`. */
  source: string;
  entry: FileEntry;
  /** Chemin cible rendu, relatif à la racine du projet. */
  target: string;
  template: string;
  owner: 'generated' | 'team';
}

export interface Composition {
  scaffold: Scaffold;
  catalog: Catalog;
  profile: ProfileCatalog;
  options: OptionCatalog[];
  context: TemplateContext;
  files: PlannedTemplate[];
}

export interface ComposeOptions {
  toolVersion: string;
  /** Date du jour (AAAA-MM-JJ) ; par défaut la date courante. */
  today?: string | undefined;
  extras?: ComposeExtras | undefined;
  engine?: TemplateEngine | undefined;
}

function conflict(message: string): PrepworkError {
  return new PrepworkError('COMPOSITION_CONFLICT', message);
}

function sourceLabel(source: CatalogSource): string {
  return source.kind === 'core' ? 'core' : `${source.kind}s/${source.id}`;
}

// ---------------------------------------------------------------------------
// Agrégats additifs
// ---------------------------------------------------------------------------

function mergeMaven(
  contributions: readonly [string, MavenContribution | undefined][],
  conditionContext: Record<string, unknown>,
): MavenContext {
  const boms = new Map<string, [string, MavenBom]>();
  const dependencies = new Map<string, [string, MavenDependency]>();
  const properties = new Map<string, [string, string]>();
  for (const [label, contribution] of contributions) {
    if (!contribution) continue;
    for (const bom of contribution.boms) {
      const key = `${bom.group_id}:${bom.artifact_id}`;
      const previous = boms.get(key);
      if (previous && previous[1].version !== bom.version) {
        throw conflict(
          `BOM \`${key}\` : version \`${previous[1].version}\` (${previous[0]}) vs \`${bom.version}\` (${label})`,
        );
      }
      boms.set(key, [label, bom]);
    }
    for (const dep of contribution.dependencies) {
      if (dep.when !== undefined && !evaluateCondition(dep.when, conditionContext)) continue;
      const key = `${dep.group_id}:${dep.artifact_id}`;
      const previous = dependencies.get(key);
      if (previous) {
        const same =
          previous[1].version === dep.version &&
          (previous[1].scope ?? 'compile') === (dep.scope ?? 'compile') &&
          (previous[1].optional ?? false) === (dep.optional ?? false);
        if (!same) {
          throw conflict(
            `dépendance \`${key}\` déclarée différemment par ${previous[0]} et ${label}`,
          );
        }
        continue;
      }
      dependencies.set(key, [label, dep]);
    }
    for (const [key, value] of Object.entries(contribution.properties)) {
      const previous = properties.get(key);
      if (previous && previous[1] !== value) {
        throw conflict(
          `propriété Maven \`${key}\` : \`${previous[1]}\` (${previous[0]}) vs \`${value}\` (${label})`,
        );
      }
      properties.set(key, [label, value]);
    }
  }
  return {
    boms: [...boms.values()].map(([, b]) => b),
    dependencies: [...dependencies.values()].map(([, d]) => d),
    properties: Object.fromEntries([...properties.entries()].map(([k, [, v]]) => [k, v])),
  };
}

function isPlainObject(value: unknown): value is PropertyTree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(target: PropertyTree, source: PropertyTree, path: string, label: string): void {
  for (const [key, value] of Object.entries(source)) {
    const fullPath = path === '' ? key : `${path}.${key}`;
    const existing = target[key];
    if (existing === undefined) {
      target[key] = isPlainObject(value) ? deepClone(value) : value;
    } else if (isPlainObject(existing) && isPlainObject(value)) {
      deepMerge(existing, value, fullPath, label);
    } else if (JSON.stringify(existing) !== JSON.stringify(value)) {
      throw conflict(
        `propriété Spring \`${fullPath}\` : déjà définie avec une autre valeur (contribution de ${label})`,
      );
    }
  }
}

function deepClone(tree: PropertyTree): PropertyTree {
  return JSON.parse(JSON.stringify(tree)) as PropertyTree;
}

function mergeProperties(
  contributions: readonly [string, PropertiesContribution | undefined][],
): PropertiesContext {
  const result: PropertiesContext = { main: {}, test: {}, profiles: {} };
  for (const [label, contribution] of contributions) {
    if (!contribution) continue;
    for (const [document, tree] of Object.entries(contribution)) {
      if (document === 'main') deepMerge(result.main, tree, '', label);
      else if (document === 'test') deepMerge(result.test, tree, '', label);
      else {
        result.profiles[document] ??= {};
        deepMerge(result.profiles[document], tree, '', label);
      }
    }
  }
  return result;
}

function mergeEnv(contributions: readonly [string, readonly EnvVar[]][]): EnvVar[] {
  const vars = new Map<string, [string, EnvVar]>();
  for (const [label, list] of contributions) {
    for (const variable of list) {
      const previous = vars.get(variable.name);
      if (previous && previous[1].example !== variable.example) {
        throw conflict(
          `variable \`${variable.name}\` : exemples différents entre ${previous[0]} et ${label}`,
        );
      }
      if (!previous) vars.set(variable.name, [label, variable]);
    }
  }
  return [...vars.values()].map(([, v]) => v);
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

function resolveProfile(catalog: Catalog, scaffold: Scaffold): ProfileCatalog {
  const profile = catalog.profiles.get(scaffold.profile);
  if (!profile) {
    throw new PrepworkError(
      'CATALOG_NOT_FOUND',
      `profil \`${scaffold.profile}\` absent du catalogue (disponibles : ${[...catalog.profiles.keys()].join(', ')})`,
    );
  }
  return profile;
}

function resolveOptions(catalog: Catalog, scaffold: Scaffold): OptionCatalog[] {
  return resolveOptionIds(scaffold).map((id) => {
    const option = catalog.options.get(id);
    if (!option) {
      throw new PrepworkError(
        'CATALOG_NOT_FOUND',
        `option \`${id}\` absente du catalogue (disponibles : ${[...catalog.options.keys()].join(', ')})`,
      );
    }
    return option;
  });
}

export function buildContext(
  scaffold: Scaffold,
  profile: ProfileCatalog,
  options: readonly OptionCatalog[],
  toolVersion: string,
  extras: ComposeExtras,
  today: string,
): TemplateContext {
  const basePackage = scaffold.project.base_package;
  const docs = scaffold.language.docs;
  const comments = scaffold.language.comments;
  const database = scaffold.stack.database;
  const p = profile.profile;

  const conditionContext: Record<string, unknown> = {
    project: { name: scaffold.project.name, basePackage },
    stack: { java: scaffold.stack.java, database, migrations: scaffold.stack.migrations ?? null },
    profile: profile.id,
    options: scaffold.options,
    optionIds: options.map((o) => o.id),
    git: { agentTrailer: scaffold.git.agent_trailer },
    language: { comments, docs },
  };
  const maven = mergeMaven(
    [
      [`profiles/${profile.id}`, p.maven],
      ...options.map((o): [string, MavenContribution | undefined] => [
        `options/${o.id}`,
        o.option.maven,
      ]),
    ],
    conditionContext,
  );
  const properties = mergeProperties([
    [`profiles/${profile.id}`, p.application_properties],
    ...options.map((o): [string, PropertiesContribution | undefined] => [
      `options/${o.id}`,
      o.option.application_properties,
    ]),
  ]);
  const env = mergeEnv(
    options.map((o): [string, readonly EnvVar[]] => [`options/${o.id}`, o.option.env]),
  );

  return {
    project: {
      name: scaffold.project.name,
      description: scaffold.project.description,
      basePackage,
      basePackagePath: basePackage.replace(/\./g, '/'),
      className: toClassName(scaffold.project.name),
      groupId: basePackage,
      artifactId: scaffold.project.name,
      dbName: scaffold.project.name.replace(/-/g, '_'),
    },
    stack: {
      java: scaffold.stack.java,
      database,
      migrations: scaffold.stack.migrations ?? null,
    },
    profile: profile.id,
    profileInfo: {
      id: p.meta.id,
      version: p.meta.version,
      summary: pickText(p.meta.summary, docs),
      whenToUse: p.meta.when_to_use.map((t) => pickText(t, docs)),
      whenNotToUse: p.meta.when_not_to_use.map((t) => pickText(t, docs)),
    },
    options: scaffold.options,
    optionIds: options.map((o) => o.id),
    git: { author: scaffold.git.author, agentTrailer: scaffold.git.agent_trailer },
    language: { comments, docs },
    maven,
    properties,
    env,
    tables: p.reference_example.tables,
    layers: p.architecture.layers.map((l) => ({
      id: l.id,
      package: l.package.split(BASE_PACKAGE_PLACEHOLDER).join(basePackage),
      mayDependOn: [...l.may_depend_on],
    })),
    toolVersion,
    today,
    versions: PINNED_VERSIONS,
    extras,
    t: (fr, en) => (comments === 'fr' ? fr : en),
    d: (fr, en) => (docs === 'fr' ? fr : en),
    text: (value) => pickText(value, docs),
    yaml: yamlText,
    merge: (base, contribution) => {
      const result = deepClone(base);
      deepMerge(result, contribution, '', 'template');
      return result;
    },
    sqlType: (column) => sqlTypeFor(column, database),
    javaType: javaTypeFor,
    liquibaseType: liquibaseTypeFor,
  };
}

function planFiles(
  sources: readonly CatalogSource[],
  context: TemplateContext,
  engine: TemplateEngine,
): PlannedTemplate[] {
  const planned = new Map<string, PlannedTemplate>();
  const conditionContext = context as unknown as Record<string, unknown>;
  for (const source of sources) {
    const label = sourceLabel(source);
    for (const entry of source.files) {
      if (entry.when !== undefined) {
        let included: boolean;
        try {
          included = evaluateCondition(entry.when, conditionContext, parseCondition(entry.when));
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          throw new PrepworkError('CATALOG_INVALID', `${label}/files.yaml : ${detail}`, {
            cause: error,
          });
        }
        if (!included) continue;
      }
      const template = source.templates.get(entry.source);
      if (template === undefined) {
        throw new PrepworkError(
          'CATALOG_INVALID',
          `${label}/files.yaml : template \`${entry.source}\` introuvable`,
        );
      }
      const target = engine.render(entry.target, context, `${label}:${entry.target}`).trim();
      const previous = planned.get(target);
      if (previous) {
        throw conflict(`fichier \`${target}\` généré à la fois par ${previous.source} et ${label}`);
      }
      planned.set(target, { source: label, entry, target, template, owner: entry.owner });
    }
  }
  return [...planned.values()];
}

export function compose(
  catalog: Catalog,
  scaffold: Scaffold,
  options: ComposeOptions,
): Composition {
  const profile = resolveProfile(catalog, scaffold);
  const resolvedOptions = resolveOptions(catalog, scaffold);
  const context = buildContext(
    scaffold,
    profile,
    resolvedOptions,
    options.toolVersion,
    options.extras ?? {},
    options.today ?? new Date().toISOString().slice(0, 10),
  );
  const engine = options.engine ?? createTemplateEngine();
  const files = planFiles([catalog.core, profile, ...resolvedOptions], context, engine);
  return { scaffold, catalog, profile, options: resolvedOptions, context, files };
}
