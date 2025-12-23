// Partie générique de `scaffold.yaml` : ce que le cœur connaît de tout projet, quelle que soit
// la stack (CLAUDE.md §2 et §5). Chaque pack compose son schéma complet à partir de ces
// fragments et ajoute les siens (`stack`, `options`, et pour Spring `project.base_package`).
import { z } from 'zod';

/** Version du format. 1.1.0 : ajout de `stack.target` (ADR 0007). */
export const SCAFFOLD_VERSION = '1.1.0';

/** Valeur de `stack.target` supposée quand le champ est absent (scaffold écrit par la v1). */
export const DEFAULT_STACK_TARGET = 'spring-boot';

export const PROJECT_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

export const LanguageSchema = z.enum(['fr', 'en']);
export type Language = z.infer<typeof LanguageSchema>;

export const ScaffoldVersionSchema = z.string().regex(SEMVER_PATTERN);

export const ProjectNameSchema = z
  .string()
  .regex(PROJECT_NAME_PATTERN, 'nom de projet en kebab-case');

export const ProjectDescriptionSchema = z.string().min(1).max(200);

export const GitSchema = z
  .object({
    author: z.object({ name: z.string().min(1), email: z.email() }).strict(),
    agent_trailer: z.boolean(),
  })
  .strict();

export const LanguagesSchema = z
  .object({ comments: LanguageSchema, docs: LanguageSchema })
  .strict();

/**
 * Ce que le cœur lit dans un `scaffold.yaml`, quel que soit le pack. Le schéma Zod complet
 * appartient au pack : il produit un objet qui satisfait cette forme et porte ses propres champs.
 */
export interface BaseScaffold {
  scaffold_version: string;
  project: { name: string; description: string };
  stack: { target: string };
  profile: string;
  git: { author: { name: string; email: string }; agent_trailer: boolean };
  language: { comments: Language; docs: Language };
}
