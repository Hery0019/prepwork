// Schéma de `scaffold.yaml` : la seule entrée de `sync` et `check`. Il ne contient rien
// d'inférable ni de secret (CLAUDE.md §5).
import { z } from 'zod';

export const SCAFFOLD_VERSION = '1.0.0';

export const PROJECT_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
export const BASE_PACKAGE_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

/** Mots réservés Java : interdits comme segment de package. */
const JAVA_KEYWORDS = new Set([
  'abstract',
  'assert',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extends',
  'final',
  'finally',
  'float',
  'for',
  'goto',
  'if',
  'implements',
  'import',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'strictfp',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'void',
  'volatile',
  'while',
  'true',
  'false',
  'null',
]);

export function basePackageProblem(value: string): string | undefined {
  if (!BASE_PACKAGE_PATTERN.test(value)) {
    return 'package Java attendu, en minuscules, avec au moins deux segments (ex. mg.solumada.payflow)';
  }
  const keyword = value.split('.').find((segment) => JAVA_KEYWORDS.has(segment));
  if (keyword !== undefined) return `\`${keyword}\` est un mot réservé Java`;
  return undefined;
}

export const JavaVersionSchema = z.union([z.literal(21), z.literal(17)]);
export const DatabaseSchema = z.enum(['postgresql', 'mysql', 'oracle', 'none']);
export const MigrationsSchema = z.enum(['flyway', 'liquibase']);
export const ProfileIdSchema = z.enum(['layered', 'modular']);
export const SecuritySchema = z.enum(['none', 'session', 'oauth2-resource-server']);
export const CiSchema = z.enum(['github', 'gitlab', 'none']);
export const LanguageSchema = z.enum(['fr', 'en']);

export const ScaffoldSchema = z
  .object({
    scaffold_version: z.string().regex(/^\d+\.\d+\.\d+$/),
    project: z
      .object({
        name: z.string().regex(PROJECT_NAME_PATTERN, 'nom de projet en kebab-case'),
        base_package: z.string().refine((v) => basePackageProblem(v) === undefined, {
          message: 'package Java invalide',
        }),
        description: z.string().min(1).max(200),
      })
      .strict(),
    stack: z
      .object({
        java: JavaVersionSchema,
        database: DatabaseSchema,
        migrations: MigrationsSchema.optional(),
      })
      .strict()
      .refine((s) => (s.database === 'none') === (s.migrations === undefined), {
        message: '`migrations` est requis avec une base de données et absent sans',
        path: ['migrations'],
      }),
    profile: ProfileIdSchema,
    options: z
      .object({
        security: SecuritySchema,
        docker: z.boolean(),
        ci: CiSchema,
      })
      .strict(),
    git: z
      .object({
        author: z.object({ name: z.string().min(1), email: z.email() }).strict(),
        agent_trailer: z.boolean(),
      })
      .strict(),
    language: z.object({ comments: LanguageSchema, docs: LanguageSchema }).strict(),
  })
  .strict();

export type Scaffold = z.infer<typeof ScaffoldSchema>;
export type Database = z.infer<typeof DatabaseSchema>;
export type Migrations = z.infer<typeof MigrationsSchema>;
export type ProfileId = z.infer<typeof ProfileIdSchema>;
export type Security = z.infer<typeof SecuritySchema>;
export type Ci = z.infer<typeof CiSchema>;
export type JavaVersion = z.infer<typeof JavaVersionSchema>;

/** Identifiants d'options du catalogue résolus à partir du scaffold (CLAUDE.md §2). */
export function resolveOptionIds(scaffold: Scaffold): string[] {
  const ids: string[] = [];
  if (scaffold.stack.migrations !== undefined) ids.push(`migrations-${scaffold.stack.migrations}`);
  ids.push(`security-${scaffold.options.security}`);
  if (scaffold.options.docker) ids.push('docker');
  if (scaffold.options.ci !== 'none') ids.push(`ci-${scaffold.options.ci}`);
  ids.push('git');
  return ids;
}
