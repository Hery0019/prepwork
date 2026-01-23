// `scaffold.yaml` du pack `react` (ADR 0007 §7). Épinglés par l'outil, donc absents d'ici :
// pnpm, TypeScript strict, React, Vite, Tailwind, Vitest.
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
import { DESIGN_PRESET_IDS } from './design.js';

export const STACK_TARGET = 'react';

export const ProfileIdSchema = z.enum(['spa-feature']);
export const DataSchema = z.enum(['tanstack-query', 'none']);
export const FormsSchema = z.enum(['rhf', 'none']);
export const StateSchema = z.enum(['zustand', 'context']);
export const SecuritySchema = z.enum(['none', 'oidc-bff', 'session']);
export const CiSchema = z.enum(['github', 'gitlab', 'none']);
export const PresetSchema = z.enum([...DESIGN_PRESET_IDS]);

export const ScaffoldSchema = z
  .object({
    scaffold_version: ScaffoldVersionSchema,
    project: z.object({ name: ProjectNameSchema, description: ProjectDescriptionSchema }).strict(),
    stack: z
      .object({
        /** Absent dans un scaffold écrit à la main : la valeur par défaut désigne ce pack. */
        target: z.literal(STACK_TARGET).default(STACK_TARGET),
        /** Bibliothèque de données : elle change l'écriture de chaque feature, comme la base côté back. */
        data: DataSchema,
        /** Bibliothèque de formulaires, pour la même raison. */
        forms: FormsSchema,
      })
      .strict(),
    profile: ProfileIdSchema,
    renderer: RendererIdSchema,
    options: z
      .object({
        state: StateSchema,
        security: SecuritySchema,
        i18n: z.boolean(),
        e2e: z.boolean(),
        docker: z.boolean(),
        ci: CiSchema,
      })
      .strict(),
    /** Contrat visuel : preset de tokens et thème sombre (ADR 0007 §6). */
    design: z.object({ preset: PresetSchema, dark: z.boolean() }).strict(),
    git: GitSchema,
    language: LanguagesSchema,
  })
  .strict();

export type Scaffold = z.infer<typeof ScaffoldSchema>;
export type Data = z.infer<typeof DataSchema>;
export type Forms = z.infer<typeof FormsSchema>;
export type State = z.infer<typeof StateSchema>;
export type Security = z.infer<typeof SecuritySchema>;
export type Ci = z.infer<typeof CiSchema>;
export type Preset = z.infer<typeof PresetSchema>;

/**
 * Le pack ne reçoit du cœur que des scaffolds qu'il a lui-même validés : la conversion est sûre
 * et reste confinée ici.
 */
export function asReactScaffold(scaffold: BaseScaffold): Scaffold {
  return scaffold as unknown as Scaffold;
}

/** Identifiants d'options du catalogue résolus à partir du scaffold (CLAUDE.md §2). */
export function resolveOptionIds(scaffold: BaseScaffold): string[] {
  const { stack, options } = asReactScaffold(scaffold);
  const ids = [
    `data-${stack.data}`,
    `forms-${stack.forms}`,
    `state-${options.state}`,
    `security-${options.security}`,
  ];
  if (options.i18n) ids.push('i18n');
  if (options.e2e) ids.push('e2e-playwright');
  if (options.docker) ids.push('docker');
  if (options.ci !== 'none') ids.push(`ci-${options.ci}`);
  ids.push('git');
  return ids;
}
