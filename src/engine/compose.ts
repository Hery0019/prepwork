// Composition : scaffold + catalogue → contexte de templates et liste des fichiers à rendre.
// Composition additive uniquement (CLAUDE.md §2) : une contribution qui contredit une autre est
// un conflit, jamais une surcharge silencieuse. Ce qui est propre à une stack (Maven, propriétés
// Spring, aides de typage) est apporté par le pack via `pack.buildContext`.
import { evaluateCondition, parseCondition } from '../catalog/condition.js';
import type { Catalog, CatalogSource, OptionCatalog, ProfileCatalog } from '../catalog/load.js';
import type { EnvVar, FileEntry } from '../catalog/schema.js';
import { pickText } from '../catalog/text.js';
import type { BaseScaffold } from '../config/schema.js';
import { PrepworkError } from '../errors.js';
import type { StackPack } from '../packs/types.js';
import {
  toClassName,
  yamlText,
  type BaseTemplateContext,
  type ComposeExtras,
  type TemplateContext,
} from './context.js';
import { createTemplateEngine, type TemplateEngine } from './templates.js';
import { cloneTree, mergeTree } from './tree.js';

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
  scaffold: BaseScaffold;
  catalog: Catalog;
  pack: StackPack;
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

/** Variables d'environnement contribuées par les options : additives, exemples identiques. */
export function mergeEnv(contributions: readonly [string, readonly EnvVar[]][]): EnvVar[] {
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

function resolveProfile(catalog: Catalog, scaffold: BaseScaffold): ProfileCatalog {
  const profile = catalog.profiles.get(scaffold.profile);
  if (!profile) {
    throw new PrepworkError(
      'CATALOG_NOT_FOUND',
      `profil \`${scaffold.profile}\` absent du catalogue (disponibles : ${[...catalog.profiles.keys()].join(', ')})`,
    );
  }
  return profile;
}

function resolveOptions(
  catalog: Catalog,
  scaffold: BaseScaffold,
  pack: StackPack,
): OptionCatalog[] {
  return pack.resolveOptionIds(scaffold).map((id) => {
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

/**
 * Le questionnaire indexe ses exemples par le nom déclaré au catalogue ; le template les cherche
 * par le nom final. Sans cette réindexation, une valeur saisie serait silencieusement ignorée.
 */
function renameOverrides(
  overrides: Record<string, string> | undefined,
  options: readonly OptionCatalog[],
  pack: StackPack,
  scaffold: BaseScaffold,
): Record<string, string> | undefined {
  if (!overrides) return undefined;
  const declared = new Map(options.flatMap((o) => o.option.env).map((v) => [v.name, v]));
  return Object.fromEntries(
    Object.entries(overrides).map(([name, value]) => {
      const variable = declared.get(name);
      return [variable ? pack.presentation.envName(scaffold, variable) : name, value];
    }),
  );
}

export function buildContext(
  scaffold: BaseScaffold,
  profile: ProfileCatalog,
  options: readonly OptionCatalog[],
  pack: StackPack,
  toolVersion: string,
  extras: ComposeExtras,
  today: string,
): TemplateContext {
  const docs = scaffold.language.docs;
  const comments = scaffold.language.comments;
  const meta = profile.profile.meta;

  const base: BaseTemplateContext = {
    project: {
      name: scaffold.project.name,
      description: scaffold.project.description,
      className: toClassName(scaffold.project.name),
    },
    profile: profile.id,
    profileInfo: {
      id: meta.id,
      version: meta.version,
      summary: pickText(meta.summary, docs),
      whenToUse: meta.when_to_use.map((t) => pickText(t, docs)),
      whenNotToUse: meta.when_not_to_use.map((t) => pickText(t, docs)),
    },
    optionIds: options.map((o) => o.id),
    git: { author: scaffold.git.author, agentTrailer: scaffold.git.agent_trailer },
    language: { comments, docs },
    // Le nom final passe par le pack : une option déclare `AUTH_LOGIN_PATH`, le pack rend
    // `VITE_AUTH_LOGIN_PATH` ou `NEXT_PUBLIC_AUTH_LOGIN_PATH` selon le profil. Les exemples
    // saisis au questionnaire sont indexés par le nom déclaré : ils suivent la même règle.
    env: mergeEnv(
      options.map((o): [string, readonly EnvVar[]] => [`options/${o.id}`, o.option.env]),
    ).map((variable) => ({ ...variable, name: pack.presentation.envName(scaffold, variable) })),
    toolVersion,
    today,
    extras: {
      ...extras,
      envOverrides: renameOverrides(extras.envOverrides, options, pack, scaffold),
    },
    t: (fr, en) => (comments === 'fr' ? fr : en),
    d: (fr, en) => (docs === 'fr' ? fr : en),
    text: (value) => pickText(value, docs),
    yaml: yamlText,
    merge: (tree, contribution) => {
      const result = cloneTree(tree);
      mergeTree(result, contribution, '', 'template');
      return result;
    },
  };

  return pack.buildContext(base, { scaffold, profile, options });
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
  scaffold: BaseScaffold,
  pack: StackPack,
  options: ComposeOptions,
): Composition {
  const profile = resolveProfile(catalog, scaffold);
  const resolvedOptions = resolveOptions(catalog, scaffold, pack);
  const context = buildContext(
    scaffold,
    profile,
    resolvedOptions,
    pack,
    options.toolVersion,
    options.extras ?? {},
    options.today ?? new Date().toISOString().slice(0, 10),
  );
  const engine = options.engine ?? createTemplateEngine();
  const files = planFiles([catalog.core, profile, ...resolvedOptions], context, engine);
  return { scaffold, catalog, pack, profile, options: resolvedOptions, context, files };
}
