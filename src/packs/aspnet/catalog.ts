// Ce que le pack `aspnet` ajoute aux schémas du catalogue : graphe de projets, paquets NuGet,
// `appsettings`, et la forme d'une cible de couche — un espace de noms C# exprimé à partir de
// `{{rootNamespace}}`.
//
// Une particularité .NET : un paquet ne s'ajoute pas « au projet », il s'ajoute à *un* `csproj`.
// Un profil nomme le projet visé, puisqu'il les définit ; une option n'a pas ce droit — elle
// viserait une couche, donc le profil. Elle nomme un **rôle** (`host`, `persistence`, `tests`),
// vocabulaire du pack que chaque profil rattache à ses propres projets. C'est le seul langage
// commun entre les deux axes (ADR 0010).
import { z } from 'zod';
import {
  LocalizedTextSchema,
  PropertyTreeSchema,
  type CatalogSchemaSpec,
} from '../../catalog/schema.js';
// L'import local est nécessaire : `export … from` ne lie pas le nom dans ce module.
import { TableSchema } from '../sql.js';

/** La description des tables est commune aux packs à base relationnelle (`packs/sql.ts`). */
export {
  ColumnSchema,
  ColumnTypeSchema,
  TableSchema,
  tablesOf,
  type Column,
  type ColumnType,
  type Table,
} from '../sql.js';

/** Placeholder textuel unique autorisé dans les données du catalogue (voir CLAUDE.md §3). */
export const ROOT_NAMESPACE_PLACEHOLDER = '{{rootNamespace}}';

export const ENFORCED_BY = [
  /** La référence de projet n'existe pas : le build échoue. Aucun test à écrire (ADR 0010 §1). */
  'compiler',
  'arch-test',
  'analyzer',
  'format',
  'ef-migrations',
  'nuget-audit',
  'commitlint',
  'gitleaks',
  'none',
] as const;

export const SKILL_NAMES = [
  'architecture',
  'db',
  'api',
  'testing',
  'workflow',
  'security',
] as const;

/** Applications dont `check:content` vérifie qu'un test porte l'identifiant de la règle. */
export const TEST_BACKED_ENFORCERS = ['arch-test'] as const;

/**
 * Rôles qu'un profil attribue à ses projets ; seul vocabulaire qu'une option peut viser, et par
 * lequel le socle désigne un projet sans connaître les couches.
 *
 * `kernel` : le projet que tous les autres peuvent référencer (exceptions du domaine, types
 * partagés). `host` : le point d'entrée web. `persistence` : celui qui porte le `DbContext` et
 * les migrations. `tests` : le projet de tests.
 */
export const PROJECT_ROLES = ['kernel', 'host', 'persistence', 'tests'] as const;
export const ProjectRoleSchema = z.enum(PROJECT_ROLES);
export type ProjectRole = z.infer<typeof ProjectRoleSchema>;

const KEBAB = /^[a-z][a-z0-9-]*$/;

export const DotnetProjectSchema = z
  .object({
    /** Identifiant local ; celui d'une couche quand le projet en porte une. */
    id: z.string().regex(KEBAB),
    /** Suffixe du nom d'assembly : `Api` donne `<RootNamespace>.Api`. */
    suffix: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
    kind: z.enum(['web', 'library', 'test']),
    /** Projets référencés, par identifiant local. */
    references: z.array(z.string().regex(KEBAB)).default([]),
    roles: z.array(ProjectRoleSchema).default([]),
  })
  .strict();
export type DotnetProject = z.infer<typeof DotnetProjectSchema>;

export const NuGetPackageSchema = z
  .object({
    id: z.string().min(1),
    /** Toujours épinglée : le pack ne laisse pas NuGet choisir (ADR 0010 §5). */
    version: z.string().min(1),
    /** Projet visé — réservé au profil, qui les déclare. */
    project: z.string().regex(KEBAB).optional(),
    /** Rôle visé — seule désignation permise à une option. */
    role: ProjectRoleSchema.optional(),
    /** Outillage de conception qui ne doit pas se propager aux consommateurs. */
    private_assets: z.boolean().default(false),
    /** Condition d'inclusion (même mini-langage que files.yaml). */
    when: z.string().min(1).optional(),
    purpose: LocalizedTextSchema,
  })
  .strict()
  .refine((p) => (p.project === undefined) !== (p.role === undefined), {
    message: 'un paquet vise soit un `project` (profil), soit un `role` (option), jamais les deux',
  });
export type NuGetPackage = z.infer<typeof NuGetPackageSchema>;

export const DotnetContributionSchema = z
  .object({
    projects: z.array(DotnetProjectSchema).default([]),
    packages: z.array(NuGetPackageSchema).default([]),
    /** Propriétés MSBuild communes, écrites dans `Directory.Build.props`. */
    properties: z.record(z.string(), z.string()).default({}),
  })
  .strict();
export type DotnetContribution = z.infer<typeof DotnetContributionSchema>;

/**
 * `appsettings` par document : `main` pour `appsettings.json`, tout autre nom pour
 * `appsettings.<Environnement>.json`.
 */
export const AppSettingsContributionSchema = z.record(z.string().regex(KEBAB), PropertyTreeSchema);
export type AppSettingsContribution = z.infer<typeof AppSettingsContributionSchema>;

/** Cible d'une couche : un espace de noms C# exprimé à partir du placeholder. */
export const LayerTargetSchema = z.string().regex(/^\{\{rootNamespace\}\}(\.[A-Z][A-Za-z0-9]*)*$/);

export const CATALOG_SPEC: CatalogSchemaSpec = {
  enforcedBy: [...ENFORCED_BY] as [string, ...string[]],
  skills: [...SKILL_NAMES] as [string, ...string[]],
  layerTarget: LayerTargetSchema,
  architectureExtras: { root_namespace: z.literal(ROOT_NAMESPACE_PLACEHOLDER) },
  referenceExampleExtras: { tables: z.array(TableSchema).default([]) },
  profileExtras: {
    dotnet: DotnetContributionSchema.optional(),
    app_settings: AppSettingsContributionSchema.optional(),
  },
  optionExtras: {
    dotnet: DotnetContributionSchema.optional(),
    app_settings: AppSettingsContributionSchema.optional(),
  },
};

export function dotnetOf(source: Record<string, unknown>): DotnetContribution | undefined {
  return source.dotnet as DotnetContribution | undefined;
}

export function appSettingsOf(
  source: Record<string, unknown>,
): AppSettingsContribution | undefined {
  return source.app_settings as AppSettingsContribution | undefined;
}
