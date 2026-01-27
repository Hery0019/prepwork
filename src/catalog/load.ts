// Chargement de `content/` : YAML → objets validés par Zod, templates lus en mémoire.
// Le catalogue est chargé pour un pack donné (ADR 0007) : les ensembles de règles communs de
// `content/common/core` sont fusionnés avec ceux du pack. Aucune interprétation ici : la
// cohérence globale est vérifiée par `validate.ts`.
import { parse } from 'yaml';
import type { ZodError, ZodType } from 'zod';
import { PrepworkError } from '../errors.js';
import type { FileSystem } from '../fs/types.js';
import { joinPath } from '../fs/types.js';
import { walkFiles } from '../fs/walk.js';
import {
  FilesSchema,
  type CatalogSchemas,
  type CoreRuleSet,
  type FileEntry,
  type Option,
  type Profile,
} from './schema.js';

/** Contenu partagé par tous les packs (workflow de l'agent, ADR 0007 §9). */
export const COMMON_DIR = 'common';
export const CORE_DIR = 'core';
export const PROFILES_DIR = 'profiles';
export const OPTIONS_DIR = 'options';
export const TEMPLATES_DIR = 'templates';
export const FILES_FILE = 'files.yaml';
export const PROFILE_FILE = 'profile.yaml';
export const OPTION_FILE = 'option.yaml';

/** Ce que le chargeur attend d'un pack : où lire, et avec quels schémas valider. */
export interface CatalogPack {
  id: string;
  contentDir: string;
  catalogSchemas: CatalogSchemas;
}

/** Templates d'une source : chemin relatif à `templates/` → contenu. */
export type TemplateMap = ReadonlyMap<string, string>;

interface SourceBase {
  /** Répertoire de la source, relatif à la racine du catalogue. */
  dir: string;
  files: FileEntry[];
  templates: TemplateMap;
}

export interface CoreCatalog extends SourceBase {
  kind: 'core';
  id: 'core';
  ruleSets: CoreRuleSet[];
}

export interface ProfileCatalog extends SourceBase {
  kind: 'profile';
  id: string;
  profile: Profile;
}

export interface OptionCatalog extends SourceBase {
  kind: 'option';
  id: string;
  option: Option;
}

export type CatalogSource = CoreCatalog | ProfileCatalog | OptionCatalog;

export interface Catalog {
  rootDir: string;
  /** Identifiant du pack dont ce catalogue est le contenu. */
  packId: string;
  core: CoreCatalog;
  profiles: ReadonlyMap<string, ProfileCatalog>;
  options: ReadonlyMap<string, OptionCatalog>;
}

export function catalogSources(catalog: Catalog): CatalogSource[] {
  return [catalog.core, ...catalog.profiles.values(), ...catalog.options.values()];
}

export function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.map(String).join('.') || '(racine)'} : ${issue.message}`)
    .join('\n');
}

async function readYaml<T>(fs: FileSystem, path: string, schema: ZodType<T>): Promise<T> {
  const text = await fs.readText(path);
  if (text === undefined) throw new PrepworkError('CATALOG_NOT_FOUND', `${path} introuvable`);
  return parseYaml(text, path, schema);
}

export function parseYaml<T>(text: string, path: string, schema: ZodType<T>): T {
  let raw: unknown;
  try {
    raw = parse(text, { uniqueKeys: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new PrepworkError('CATALOG_INVALID', `${path} : YAML invalide\n  ${detail}`, {
      cause: error,
    });
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new PrepworkError(
      'CATALOG_INVALID',
      `${path} : schéma invalide\n${formatZodError(result.error)}`,
    );
  }
  return result.data;
}

async function readFilesList(fs: FileSystem, dir: string): Promise<FileEntry[]> {
  const path = joinPath(dir, FILES_FILE);
  if (!(await fs.exists(path))) return [];
  return (await readYaml(fs, path, FilesSchema)).files;
}

async function readTemplates(fs: FileSystem, dir: string): Promise<TemplateMap> {
  const templatesDir = joinPath(dir, TEMPLATES_DIR);
  const templates = new Map<string, string>();
  for (const relative of await walkFiles(fs, templatesDir)) {
    const content = await fs.readText(joinPath(templatesDir, relative));
    if (content !== undefined) templates.set(relative, content);
  }
  return templates;
}

async function loadCoreRuleSets(
  fs: FileSystem,
  dir: string,
  schemas: CatalogSchemas,
  required: boolean,
): Promise<CoreRuleSet[]> {
  if (!(await fs.exists(dir))) {
    if (required) throw new PrepworkError('CATALOG_NOT_FOUND', `${dir} introuvable`);
    return [];
  }
  const entries = await fs.list(dir);
  const ruleSetFiles = entries
    .filter((e) => e.kind === 'file' && e.name.endsWith('.yaml') && e.name !== FILES_FILE)
    .map((e) => e.name);
  if (required && ruleSetFiles.length === 0) {
    throw new PrepworkError('CATALOG_NOT_FOUND', `${dir} : aucun ensemble de règles core/*.yaml`);
  }
  const ruleSets: CoreRuleSet[] = [];
  for (const name of ruleSetFiles) {
    const ruleSet = await readYaml(fs, joinPath(dir, name), schemas.CoreRuleSetSchema);
    const expectedId = name.replace(/\.yaml$/, '');
    if (ruleSet.id !== expectedId) {
      throw new PrepworkError(
        'CATALOG_INVALID',
        `${joinPath(dir, name)} : id \`${ruleSet.id}\` différent du nom de fichier \`${expectedId}\``,
      );
    }
    ruleSets.push(ruleSet);
  }
  return ruleSets;
}

/**
 * `core/` d'un pack : les ensembles communs (`content/common/core`) puis ceux du pack, triés par
 * identifiant pour que l'ordre du rendu ne dépende pas du système de fichiers.
 */
async function loadCore(
  fs: FileSystem,
  contentRoot: string,
  packRoot: string,
  schemas: CatalogSchemas,
): Promise<CoreCatalog> {
  const commonDir = joinPath(joinPath(contentRoot, COMMON_DIR), CORE_DIR);
  const packDir = joinPath(packRoot, CORE_DIR);
  const ruleSets = [
    ...(await loadCoreRuleSets(fs, commonDir, schemas, false)),
    ...(await loadCoreRuleSets(fs, packDir, schemas, true)),
  ].sort((a, b) => a.id.localeCompare(b.id));

  const seen = new Set<string>();
  for (const set of ruleSets) {
    if (seen.has(set.id)) {
      throw new PrepworkError(
        'CATALOG_INVALID',
        `ensemble de règles \`${set.id}\` déclaré deux fois (common/ et pack)`,
      );
    }
    seen.add(set.id);
  }

  return {
    kind: 'core',
    id: 'core',
    dir: CORE_DIR,
    ruleSets,
    files: await readFilesList(fs, packDir),
    templates: await readTemplates(fs, packDir),
  };
}

async function listSubdirectories(fs: FileSystem, dir: string): Promise<string[]> {
  return (await fs.list(dir)).filter((e) => e.kind === 'directory').map((e) => e.name);
}

async function loadProfiles(
  fs: FileSystem,
  packRoot: string,
  schemas: CatalogSchemas,
): Promise<Map<string, ProfileCatalog>> {
  const profiles = new Map<string, ProfileCatalog>();
  const base = joinPath(packRoot, PROFILES_DIR);
  for (const name of await listSubdirectories(fs, base)) {
    const dir = joinPath(base, name);
    const profile = await readYaml(fs, joinPath(dir, PROFILE_FILE), schemas.ProfileSchema);
    if (profile.meta.id !== name) {
      throw new PrepworkError(
        'CATALOG_INVALID',
        `${joinPath(dir, PROFILE_FILE)} : meta.id \`${profile.meta.id}\` différent du répertoire \`${name}\``,
      );
    }
    profiles.set(name, {
      kind: 'profile',
      id: name,
      dir: joinPath(PROFILES_DIR, name),
      profile,
      files: await readFilesList(fs, dir),
      templates: await readTemplates(fs, dir),
    });
  }
  if (profiles.size === 0) {
    throw new PrepworkError('CATALOG_NOT_FOUND', `${base} : aucun profil`);
  }
  return profiles;
}

async function loadOptionsFrom(
  fs: FileSystem,
  base: string,
  dirPrefix: string,
  schemas: CatalogSchemas,
  options: Map<string, OptionCatalog>,
): Promise<void> {
  if (!(await fs.exists(base))) return;
  for (const name of await listSubdirectories(fs, base)) {
    const dir = joinPath(base, name);
    const option = await readYaml(fs, joinPath(dir, OPTION_FILE), schemas.OptionSchema);
    if (option.meta.id !== name) {
      throw new PrepworkError(
        'CATALOG_INVALID',
        `${joinPath(dir, OPTION_FILE)} : meta.id \`${option.meta.id}\` différent du répertoire \`${name}\``,
      );
    }
    if (options.has(name)) {
      throw new PrepworkError(
        'CATALOG_INVALID',
        `option \`${name}\` déclarée deux fois (common/ et pack)`,
      );
    }
    options.set(name, {
      kind: 'option',
      id: name,
      dir: joinPath(dirPrefix, name),
      option,
      files: await readFilesList(fs, dir),
      templates: await readTemplates(fs, dir),
    });
  }
}

/**
 * Options d'un pack : celles de `content/common/options` (valables pour toute stack) puis celles
 * du pack. Un identifiant déclaré des deux côtés est une erreur, pas une surcharge.
 */
async function loadOptions(
  fs: FileSystem,
  contentRoot: string,
  packRoot: string,
  schemas: CatalogSchemas,
): Promise<Map<string, OptionCatalog>> {
  const options = new Map<string, OptionCatalog>();
  await loadOptionsFrom(
    fs,
    joinPath(joinPath(contentRoot, COMMON_DIR), OPTIONS_DIR),
    joinPath(COMMON_DIR, OPTIONS_DIR),
    schemas,
    options,
  );
  await loadOptionsFrom(fs, joinPath(packRoot, OPTIONS_DIR), OPTIONS_DIR, schemas, options);
  return options;
}

/** Charge et valide structurellement le catalogue d'un pack. Ne vérifie pas la cohérence globale. */
export async function loadCatalog(
  fs: FileSystem,
  contentRoot: string,
  pack: CatalogPack,
): Promise<Catalog> {
  if (!(await fs.exists(contentRoot))) {
    throw new PrepworkError('CATALOG_NOT_FOUND', `catalogue introuvable : ${contentRoot}`);
  }
  const packRoot = joinPath(contentRoot, pack.contentDir);
  if (!(await fs.exists(packRoot))) {
    throw new PrepworkError(
      'CATALOG_NOT_FOUND',
      `contenu du pack \`${pack.id}\` introuvable : ${packRoot}`,
    );
  }
  const schemas = pack.catalogSchemas;
  const [core, profiles, options] = await Promise.all([
    loadCore(fs, contentRoot, packRoot, schemas),
    loadProfiles(fs, packRoot, schemas),
    loadOptions(fs, contentRoot, packRoot, schemas),
  ]);
  return { rootDir: packRoot, packId: pack.id, core, profiles, options };
}
