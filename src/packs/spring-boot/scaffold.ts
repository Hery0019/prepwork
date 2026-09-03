// `scaffold.yaml` du pack `spring-boot` (CLAUDE.md §5). Les fragments communs viennent de
// `config/schema.ts` ; tout ce qui est Java ou Spring vit ici.
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

export const STACK_TARGET = 'spring-boot';

export const JavaVersionSchema = z.union([z.literal(21), z.literal(17)]);
export const DatabaseSchema = z.enum(['postgresql', 'mysql', 'oracle', 'none']);
export const MigrationsSchema = z.enum(['flyway', 'liquibase']);
export const ProfileIdSchema = z.enum(['layered', 'modular']);
export const SecuritySchema = z.enum(['none', 'session', 'oauth2-resource-server']);
export const CiSchema = z.enum(['github', 'gitlab', 'none']);

export const ScaffoldSchema = z
  .object({
    scaffold_version: ScaffoldVersionSchema,
    project: z
      .object({
        name: ProjectNameSchema,
        base_package: z.string().refine((v) => basePackageProblem(v) === undefined, {
          message: 'package Java invalide',
        }),
        description: ProjectDescriptionSchema,
      })
      .strict(),
    stack: z
      .object({
        /** Absent dans les scaffolds écrits par la v1 : `parseScaffold` le complète. */
        target: z.literal(STACK_TARGET).default(STACK_TARGET),
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
export type Migrations = z.infer<typeof MigrationsSchema>;
export type ProfileId = z.infer<typeof ProfileIdSchema>;
export type Security = z.infer<typeof SecuritySchema>;
export type Ci = z.infer<typeof CiSchema>;
export type JavaVersion = z.infer<typeof JavaVersionSchema>;

/**
 * Le pack ne reçoit du cœur que des scaffolds qu'il a lui-même validés : la conversion est sûre
 * et reste confinée ici.
 */
export function asSpringScaffold(scaffold: BaseScaffold): Scaffold {
  return scaffold as unknown as Scaffold;
}

/** Identifiants d'options du catalogue résolus à partir du scaffold (CLAUDE.md §2). */
export function resolveOptionIds(scaffold: BaseScaffold): string[] {
  const s = asSpringScaffold(scaffold);
  const ids: string[] = [];
  if (s.stack.migrations !== undefined) ids.push(`migrations-${s.stack.migrations}`);
  ids.push(`security-${s.options.security}`);
  if (s.options.docker) ids.push('docker');
  if (s.options.ci !== 'none') ids.push(`ci-${s.options.ci}`);
  ids.push('git');
  return ids;
}
