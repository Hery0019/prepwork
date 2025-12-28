// Ce que le pack `react` ajoute aux schémas du catalogue : contributions `package.json`
// (dépendances et scripts), fragments de configuration ESLint, et la forme d'une cible de
// couche — un chemin sous `src/`.
import { z } from 'zod';
import {
  LocalizedTextSchema,
  PropertyTreeSchema,
  type CatalogSchemaSpec,
} from '../../catalog/schema.js';

export const ENFORCED_BY = [
  'eslint-boundaries',
  'dependency-cruiser',
  'typescript',
  'eslint',
  'jsx-a11y',
  'stylelint',
  'prettier',
  'vitest',
  'playwright',
  'commitlint',
  'gitleaks',
  'none',
] as const;

export const SKILL_NAMES = [
  'architecture',
  'ui',
  'a11y',
  'data',
  'testing',
  'workflow',
  'security',
] as const;

/**
 * Applications dont `check:content` vérifie qu'un test ou une règle de lint porte l'identifiant
 * de la règle : les frontières entre couches sont outillées par une configuration nommée, pas
 * par un test unitaire (ADR 0007 §3).
 */
export const TEST_BACKED_ENFORCERS = ['eslint-boundaries', 'dependency-cruiser'] as const;

export const NpmDependencySchema = z
  .object({
    name: z.string().min(1),
    /** Plage semver ; l'outil épingle la version exacte au moment du squelette. */
    version: z.string().min(1),
    scope: z.enum(['prod', 'dev']).default('prod'),
    /** Condition d'inclusion (même mini-langage que files.yaml). */
    when: z.string().min(1).optional(),
    purpose: LocalizedTextSchema,
  })
  .strict();
export type NpmDependency = z.infer<typeof NpmDependencySchema>;

export const NpmContributionSchema = z
  .object({
    dependencies: z.array(NpmDependencySchema).default([]),
    /** Scripts `package.json` ; une clé déjà définie avec une autre valeur est un conflit. */
    scripts: z.record(z.string(), z.string()).default({}),
  })
  .strict();
export type NpmContribution = z.infer<typeof NpmContributionSchema>;

/**
 * Fragments de configuration par outil : `eslint`, `vite`, `vitest`… Chaque contribution est un
 * arbre fusionné additivement, comme les propriétés Spring côté back.
 */
export const ConfigContributionSchema = z.record(
  z.string().regex(/^[a-z][a-z0-9-]*$/),
  PropertyTreeSchema,
);
export type ConfigContribution = z.infer<typeof ConfigContributionSchema>;

/** Cible d'une couche : un chemin sous `src/`, éventuellement générique (`src/features/*`). */
export const LayerTargetSchema = z.string().regex(/^src\/[a-z][a-z0-9-]*(\/[a-z0-9*-]+)*$/);

export const CATALOG_SPEC: CatalogSchemaSpec = {
  enforcedBy: [...ENFORCED_BY] as [string, ...string[]],
  skills: [...SKILL_NAMES] as [string, ...string[]],
  layerTarget: LayerTargetSchema,
  referenceExampleExtras: {
    /** Routes exposées par l'exemple de référence, pour le skill `architecture`. */
    routes: z.array(z.string().min(1)).default([]),
  },
  profileExtras: {
    npm: NpmContributionSchema.optional(),
    config: ConfigContributionSchema.optional(),
  },
  optionExtras: {
    npm: NpmContributionSchema.optional(),
    config: ConfigContributionSchema.optional(),
  },
};

export function npmOf(source: Record<string, unknown>): NpmContribution | undefined {
  return source.npm as NpmContribution | undefined;
}

export function configOf(source: Record<string, unknown>): ConfigContribution | undefined {
  return source.config as ConfigContribution | undefined;
}

export function routesOf(referenceExample: Record<string, unknown>): string[] {
  return (referenceExample.routes as string[] | undefined) ?? [];
}
