// Ce que le pack `fastapi` ajoute aux schémas du catalogue : modules du paquet, dépendances PyPI,
// et la forme d'une cible de couche — un module Python exprimé à partir de `{{packageName}}`.
//
// Une différence avec `aspnet` : il n'y a qu'une distribution, donc un paquet PyPI ne vise pas un
// projet mais un **groupe** de dépendances (`main` ou `dev`). Les rôles subsistent malgré tout,
// parce que le socle doit placer un fichier — les exceptions du domaine, l'enveloppe de
// pagination — sans connaître les couches du profil (ADR 0011 §3).
import { z } from 'zod';
import { LocalizedTextSchema, type CatalogSchemaSpec } from '../../catalog/schema.js';
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
export const PACKAGE_NAME_PLACEHOLDER = '{{packageName}}';

export const ENFORCED_BY = [
  /** Contrat de couches déclaré dans `pyproject.toml`, vérifié par `lint-imports` (ADR 0011 §1). */
  'import-linter',
  /**
   * Le substitut de compilateur du pack (ADR 0011 §2). Première valeur outillée dont la sanction
   * est une étape de pipeline et non un artefact du build : la légende le dit.
   */
  'mypy',
  'ruff',
  'format',
  'alembic',
  'pip-audit',
  'pytest',
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

/**
 * Applications dont `check:content` vérifie qu'un identifiant de règle apparaît dans une preuve.
 * Pour `import-linter` cette preuve est le `name` d'un contrat de `pyproject.toml`, pour `pytest`
 * le nom d'une fonction de test : deux fichiers, une même convention.
 */
export const TEST_BACKED_ENFORCERS = ['import-linter', 'pytest'] as const;

/**
 * Rôles qu'un profil attribue à ses modules ; seul vocabulaire qu'une option peut viser, et par
 * lequel le socle désigne un module sans connaître les couches.
 *
 * `kernel` : le module que tous les autres peuvent importer (exceptions du domaine, types
 * partagés). `host` : celui qui assemble l'application. `persistence` : celui qui porte la session
 * et les dépôts.
 */
export const MODULE_ROLES = ['kernel', 'host', 'persistence'] as const;
export const ModuleRoleSchema = z.enum(MODULE_ROLES);
export type ModuleRole = z.infer<typeof ModuleRoleSchema>;

const SNAKE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

export const PythonModuleSchema = z
  .object({
    /** Identifiant local ; celui d'une couche quand le module en porte une. */
    id: z.string().regex(SNAKE),
    /** Chemin du module sous `src/<packageName>/`. */
    path: z.string().regex(SNAKE),
    roles: z.array(ModuleRoleSchema).default([]),
  })
  .strict();
export type PythonModule = z.infer<typeof PythonModuleSchema>;

/** Groupe de dépendances `uv` : `main` part en production, `dev` reste à l'outillage. */
export const DependencyGroupSchema = z.enum(['main', 'dev']);
export type DependencyGroup = z.infer<typeof DependencyGroupSchema>;

export const PyPiPackageSchema = z
  .object({
    id: z.string().min(1),
    /** Toujours épinglée : le pack ne laisse pas le résolveur choisir (ADR 0011 §4). */
    version: z.string().min(1),
    group: DependencyGroupSchema,
    /** Condition d'inclusion (même mini-langage que files.yaml). */
    when: z.string().min(1).optional(),
    purpose: LocalizedTextSchema,
  })
  .strict();
export type PyPiPackage = z.infer<typeof PyPiPackageSchema>;

export const PythonContributionSchema = z
  .object({
    modules: z.array(PythonModuleSchema).default([]),
    packages: z.array(PyPiPackageSchema).default([]),
    /** Réglages d'outillage fusionnés dans `pyproject.toml` (`[tool.ruff]`, `[tool.mypy]`…). */
    tool_settings: z.record(z.string(), z.string()).default({}),
  })
  .strict();
export type PythonContribution = z.infer<typeof PythonContributionSchema>;

/** Cible d'une couche : un module Python exprimé à partir du placeholder. */
export const LayerTargetSchema = z.string().regex(/^\{\{packageName\}\}(\.[a-z][a-z0-9_]*)*$/);

export const CATALOG_SPEC: CatalogSchemaSpec = {
  enforcedBy: [...ENFORCED_BY] as [string, ...string[]],
  skills: [...SKILL_NAMES] as [string, ...string[]],
  layerTarget: LayerTargetSchema,
  architectureExtras: { package_name: z.literal(PACKAGE_NAME_PLACEHOLDER) },
  referenceExampleExtras: { tables: z.array(TableSchema).default([]) },
  profileExtras: { python: PythonContributionSchema.optional() },
  optionExtras: { python: PythonContributionSchema.optional() },
};

export function pythonOf(source: Record<string, unknown>): PythonContribution | undefined {
  return source.python as PythonContribution | undefined;
}
