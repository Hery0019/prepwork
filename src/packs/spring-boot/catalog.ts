// Ce que le pack `spring-boot` ajoute aux schémas du catalogue : contributions Maven,
// propriétés Spring, tables de l'exemple de référence, et la forme d'une cible de couche
// (un package Java exprimé à partir de `{{basePackage}}`).
import { z } from 'zod';
import {
  LocalizedTextSchema,
  PropertyTreeSchema,
  type CatalogSchemaSpec,
} from '../../catalog/schema.js';
// L'import local est nécessaire : `export … from` ne lie pas le nom dans ce module.
import { TableSchema } from '../sql.js';

/** Placeholder textuel unique autorisé dans les données du catalogue (voir CLAUDE.md §3). */
export const BASE_PACKAGE_PLACEHOLDER = '{{basePackage}}';

export const ENFORCED_BY = [
  'archunit',
  'spotless',
  'commitlint',
  'gitleaks',
  'modulith',
  'flyway',
  'liquibase',
  'dependency-check',
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
export const TEST_BACKED_ENFORCERS = ['archunit', 'modulith'] as const;

export const MavenDependencySchema = z
  .object({
    group_id: z.string().min(1),
    artifact_id: z.string().min(1),
    /** Absent quand la version est gérée par le BOM Spring Boot. */
    version: z.string().min(1).optional(),
    scope: z.enum(['compile', 'runtime', 'test', 'provided']).optional(),
    /** Dépendance optionnelle Maven (outillage de dev qui ne doit pas se propager). */
    optional: z.boolean().optional(),
    /** Condition d'inclusion (même mini-langage que files.yaml), pour les dépendances liées à la stack. */
    when: z.string().min(1).optional(),
    purpose: LocalizedTextSchema,
  })
  .strict();
export type MavenDependency = z.infer<typeof MavenDependencySchema>;

export const MavenBomSchema = z
  .object({
    group_id: z.string().min(1),
    artifact_id: z.string().min(1),
    version: z.string().min(1),
  })
  .strict();
export type MavenBom = z.infer<typeof MavenBomSchema>;

export const MavenContributionSchema = z
  .object({
    boms: z.array(MavenBomSchema).default([]),
    dependencies: z.array(MavenDependencySchema).default([]),
    /** Propriétés `<properties>` du pom ; une clé déjà définie avec une autre valeur est un conflit. */
    properties: z.record(z.string(), z.string()).default({}),
  })
  .strict();
export type MavenContribution = z.infer<typeof MavenContributionSchema>;

/**
 * Propriétés Spring par document : `main` pour le document sans profil, `test` pour
 * `application-test.yaml`, tout autre nom pour un document `spring.config.activate.on-profile`.
 */
export const PropertiesContributionSchema = z.record(
  z.string().regex(/^[a-z][a-z0-9-]*$/),
  PropertyTreeSchema,
);
export type PropertiesContribution = z.infer<typeof PropertiesContributionSchema>;

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

/** Cible d'une couche : un package Java exprimé à partir du placeholder. */
export const LayerTargetSchema = z.string().regex(/^\{\{basePackage\}\}(\.[a-z][a-z0-9]*)*$/);

export const CATALOG_SPEC: CatalogSchemaSpec = {
  enforcedBy: [...ENFORCED_BY] as [string, ...string[]],
  skills: [...SKILL_NAMES] as [string, ...string[]],
  layerTarget: LayerTargetSchema,
  architectureExtras: { base_package: z.literal(BASE_PACKAGE_PLACEHOLDER) },
  referenceExampleExtras: { tables: z.array(TableSchema).default([]) },
  profileExtras: {
    maven: MavenContributionSchema.optional(),
    application_properties: PropertiesContributionSchema.optional(),
  },
  optionExtras: {
    maven: MavenContributionSchema.optional(),
    application_properties: PropertiesContributionSchema.optional(),
  },
};

/** Contributions Maven d'un profil ou d'une option, lues depuis les champs libres du catalogue. */
export function mavenOf(source: Record<string, unknown>): MavenContribution | undefined {
  return source.maven as MavenContribution | undefined;
}

export function propertiesOf(source: Record<string, unknown>): PropertiesContribution | undefined {
  return source.application_properties as PropertiesContribution | undefined;
}
