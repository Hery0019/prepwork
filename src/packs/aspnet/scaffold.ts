// `scaffold.yaml` du pack `aspnet` (ADR 0010). Les fragments communs viennent de
// `config/schema.ts` ; tout ce qui est C#, .NET ou ASP.NET Core vit ici.
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
 * Espace de noms racine : segments PascalCase séparés par des points. Un seul segment est
 * légitime en .NET (`PayFlow`), contrairement au package Java qui exige un domaine inversé.
 *
 * Aucun contrôle de mot réservé n'accompagne ce motif : les mots-clés C# sont tous en
 * minuscules, l'initiale majuscule exigée ici les exclut par construction.
 */
export const ROOT_NAMESPACE_PATTERN = /^[A-Z][A-Za-z0-9]*(\.[A-Z][A-Za-z0-9]*)*$/;

export function rootNamespaceProblem(value: string): string | undefined {
  if (!ROOT_NAMESPACE_PATTERN.test(value)) {
    return 'espace de noms C# attendu, segments PascalCase séparés par des points (ex. Solumada.PayFlow)';
  }
  return undefined;
}

/** `pay-flow` → `PayFlow` : proposition par défaut au questionnaire. */
export function defaultRootNamespace(projectName: string): string {
  return projectName
    .split('-')
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

export const STACK_TARGET = 'aspnet';

export const DatabaseSchema = z.enum(['postgresql', 'sqlserver', 'none']);
export const ProfileIdSchema = z.enum(['layered']);
export const SecuritySchema = z.enum(['none', 'cookie', 'jwt-bearer']);
export const CiSchema = z.enum(['github', 'gitlab', 'none']);

export const ScaffoldSchema = z
  .object({
    scaffold_version: ScaffoldVersionSchema,
    project: z
      .object({
        name: ProjectNameSchema,
        root_namespace: z.string().refine((v) => rootNamespaceProblem(v) === undefined, {
          message: 'espace de noms C# invalide',
        }),
        description: ProjectDescriptionSchema,
      })
      .strict(),
    stack: z
      .object({
        target: z.literal(STACK_TARGET),
        /** La version du SDK est épinglée par l'outil, jamais demandée (ADR 0010 §5). */
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
export function asAspnetScaffold(scaffold: BaseScaffold): Scaffold {
  return scaffold as unknown as Scaffold;
}

/** Identifiants d'options du catalogue résolus à partir du scaffold (CLAUDE.md §2). */
export function resolveOptionIds(scaffold: BaseScaffold): string[] {
  const s = asAspnetScaffold(scaffold);
  const ids: string[] = [];
  // EF Core n'est pas un choix — c'est le seul outil de migration du pack (ADR 0010 §3) — mais
  // ses règles n'ont aucun sens sans base : l'option porte les unes et suit l'autre.
  if (s.stack.database !== 'none') ids.push('persistence-ef');
  ids.push(`security-${s.options.security}`);
  if (s.options.docker) ids.push('docker');
  if (s.options.ci !== 'none') ids.push(`ci-${s.options.ci}`);
  ids.push('git');
  return ids;
}
