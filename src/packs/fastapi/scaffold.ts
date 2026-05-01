// `scaffold.yaml` du pack `fastapi` (ADR 0011). Les fragments communs viennent de
// `config/schema.ts` ; tout ce qui est Python, FastAPI ou SQLAlchemy vit ici.
import { z } from 'zod';
import {
  GitSchema,
  LanguagesSchema,
  ProjectDescriptionSchema,
  ProjectNameSchema,
  RendererIdSchema,
  ScaffoldVersionSchema,
  type BaseScaffold,
} from '../../config/schema.js';

/**
 * Nom du paquet Python : un identifiant snake_case. Contrairement à l'espace de noms C#, la
 * vérification des mots réservés est nécessaire — les mots-clés Python sont en minuscules, donc
 * un nom de paquet valide peut en être un.
 */
export const PACKAGE_NAME_PATTERN = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

/**
 * Mots-clés Python (3.13) et valeurs intégrées : `import pay_flow` doit rester analysable.
 * `match`, `case` et `type` sont des mots-clés contextuels, légitimes comme nom de module.
 */
const PYTHON_KEYWORDS = new Set([
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'false',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'none',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'true',
  'try',
  'while',
  'with',
  'yield',
]);

export function packageNameProblem(value: string): string | undefined {
  if (!PACKAGE_NAME_PATTERN.test(value)) {
    return 'identifiant Python attendu, en snake_case (ex. pay_flow)';
  }
  if (PYTHON_KEYWORDS.has(value)) {
    return `\`${value}\` est un mot-clé Python : il ne peut pas nommer un paquet`;
  }
  return undefined;
}

/** `pay-flow` → `pay_flow` : proposition par défaut au questionnaire. */
export function defaultPackageName(projectName: string): string {
  return projectName
    .split('-')
    .filter((segment) => segment.length > 0)
    .join('_');
}

export const STACK_TARGET = 'fastapi';

export const DatabaseSchema = z.enum(['postgresql', 'mysql', 'none']);
export const ProfileIdSchema = z.enum(['layered']);
export const SecuritySchema = z.enum(['none', 'session', 'oauth2-resource-server']);
export const CiSchema = z.enum(['github', 'gitlab', 'none']);

export const ScaffoldSchema = z
  .object({
    scaffold_version: ScaffoldVersionSchema,
    project: z
      .object({
        name: ProjectNameSchema,
        package_name: z.string().refine((v) => packageNameProblem(v) === undefined, {
          message: 'nom de paquet Python invalide',
        }),
        description: ProjectDescriptionSchema,
      })
      .strict(),
    stack: z
      .object({
        target: z.literal(STACK_TARGET),
        /** La version de Python est épinglée par l'outil, jamais demandée (ADR 0011 §4). */
        database: DatabaseSchema,
      })
      .strict(),
    profile: ProfileIdSchema,
    renderer: RendererIdSchema,
    options: z
      .object({
        security: SecuritySchema,
        docker: z.boolean(),
        ci: CiSchema,
      })
      .strict(),
    git: GitSchema,
    language: LanguagesSchema,
  })
  .strict();

export type Scaffold = z.infer<typeof ScaffoldSchema>;
export type Database = z.infer<typeof DatabaseSchema>;
export type ProfileId = z.infer<typeof ProfileIdSchema>;
export type Security = z.infer<typeof SecuritySchema>;
export type Ci = z.infer<typeof CiSchema>;

/**
 * Le pack ne reçoit du cœur que des scaffolds qu'il a lui-même validés : la conversion est sûre
 * et reste confinée ici.
 */
export function asFastapiScaffold(scaffold: BaseScaffold): Scaffold {
  return scaffold as unknown as Scaffold;
}

/** Identifiants d'options du catalogue résolus à partir du scaffold (CLAUDE.md §2). */
export function resolveOptionIds(scaffold: BaseScaffold): string[] {
  const s = asFastapiScaffold(scaffold);
  const ids: string[] = [];
  // Alembic n'est pas un choix — c'est le seul outil de migration du pack (ADR 0011 §5) — mais
  // ses règles n'ont aucun sens sans base : l'option porte les unes et suit l'autre.
  if (s.stack.database !== 'none') ids.push('persistence-sqlalchemy');
  ids.push(`security-${s.options.security}`);
  if (s.options.docker) ids.push('docker');
  if (s.options.ci !== 'none') ids.push(`ci-${s.options.ci}`);
  ids.push('git');
  return ids;
}
