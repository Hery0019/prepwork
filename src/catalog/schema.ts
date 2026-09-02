// Schémas Zod du catalogue (`content/`). Zod est la source de vérité : le JSON Schema
// servi aux IDE est généré depuis ce fichier (scripts/generate-schemas.ts), jamais écrit à la main.
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Briques de base
// ---------------------------------------------------------------------------

export const RULE_ID_PATTERN = /^[A-Z]{2,5}-\d{3}$/;
export const ANTI_PATTERN_ID_PATTERN = /^[A-Z]{2,5}-AP-\d{3}$/;
const ANY_ID_PATTERN = /^[A-Z]{2,5}-(AP-)?\d{3}$/;
const RULE_PREFIX_PATTERN = /^[A-Z]{2,5}$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const KEBAB_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const SNAKE_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const ENV_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const SINGLE_LINE_PATTERN = /^[^\n]+$/;

/** Placeholder textuel unique autorisé dans les données du catalogue (voir CLAUDE.md §3). */
export const BASE_PACKAGE_PLACEHOLDER = '{{basePackage}}';

const singleLine = (what: string) =>
  z
    .string()
    .min(1, `${what}: texte vide`)
    .regex(SINGLE_LINE_PATTERN, `${what}: une seule ligne (pas de paragraphe dans le YAML)`);

/**
 * Texte localisé : une chaîne (anglais) ou un objet `{ en, fr }`.
 * Chaque valeur est une phrase unique : la prose de liaison appartient au renderer.
 */
export const LocalizedTextSchema = z.union([
  singleLine('text'),
  z.object({ en: singleLine('en'), fr: singleLine('fr') }).strict(),
]);
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export const LanguageSchema = z.enum(['fr', 'en']);
export type Language = z.infer<typeof LanguageSchema>;

export const EnforcedBySchema = z.enum([
  'archunit',
  'spotless',
  'commitlint',
  'gitleaks',
  'modulith',
  'flyway',
  'liquibase',
  'dependency-check',
  'none',
]);
export type EnforcedBy = z.infer<typeof EnforcedBySchema>;

export const SkillNameSchema = z.enum([
  'architecture',
  'db',
  'api',
  'testing',
  'workflow',
  'security',
]);
export type SkillName = z.infer<typeof SkillNameSchema>;
export const SKILL_NAMES: readonly SkillName[] = SkillNameSchema.options;

// ---------------------------------------------------------------------------
// Règles et anti-patterns (format fixé, CLAUDE.md §3)
// ---------------------------------------------------------------------------

export const RuleSchema = z
  .object({
    id: z.string().regex(RULE_ID_PATTERN, 'id de règle attendu : PREFIX-000'),
    statement: LocalizedTextSchema,
    rationale: LocalizedTextSchema,
    enforced_by: EnforcedBySchema,
  })
  .strict();
export type Rule = z.infer<typeof RuleSchema>;

export const AntiPatternSchema = z
  .object({
    id: z.string().regex(ANTI_PATTERN_ID_PATTERN, "id d'anti-pattern attendu : PREFIX-AP-000"),
    statement: LocalizedTextSchema,
    rationale: LocalizedTextSchema,
    enforced_by: EnforcedBySchema,
    instead: LocalizedTextSchema,
  })
  .strict();
export type AntiPattern = z.infer<typeof AntiPatternSchema>;

// ---------------------------------------------------------------------------
// Contributions à la génération (Maven, propriétés Spring, variables d'environnement)
// ---------------------------------------------------------------------------

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

/** Fragment YAML de configuration Spring (objet imbriqué arbitraire). */
export const PropertyTreeSchema = z.record(z.string(), z.unknown());
export type PropertyTree = z.infer<typeof PropertyTreeSchema>;

/**
 * Propriétés Spring par document : `main` pour le document sans profil, `test` pour
 * `application-test.yaml`, tout autre nom pour un document `spring.config.activate.on-profile`.
 */
export const PropertiesContributionSchema = z.record(
  z.string().regex(KEBAB_ID_PATTERN),
  PropertyTreeSchema,
);
export type PropertiesContribution = z.infer<typeof PropertiesContributionSchema>;

export const EnvVarSchema = z
  .object({
    name: z.string().regex(ENV_NAME_PATTERN),
    example: z.string(),
    comment: LocalizedTextSchema,
  })
  .strict();
export type EnvVar = z.infer<typeof EnvVarSchema>;

// ---------------------------------------------------------------------------
// Liste de fichiers à générer (`files.yaml` d'une source : core, profil ou option)
// ---------------------------------------------------------------------------

export const FileEntrySchema = z
  .object({
    /** Chemin du template, relatif au répertoire `templates/` de la source. */
    source: z.string().min(1),
    /** Chemin cible dans le projet généré ; peut contenir des expressions Eta. */
    target: z.string().min(1),
    /** Condition d'inclusion (mini-langage : `stack.database != 'none' && options.docker`). */
    when: z.string().min(1).optional(),
    /** `generated` : dans le manifeste, jamais édité à la main. `team` : créé une fois, puis à l'équipe. */
    owner: z.enum(['generated', 'team']).default('generated'),
  })
  .strict();
export type FileEntry = z.infer<typeof FileEntrySchema>;

export const FilesSchema = z.object({ files: z.array(FileEntrySchema) }).strict();

// ---------------------------------------------------------------------------
// `core/` : un fichier = un ensemble de règles rattaché à un skill
// ---------------------------------------------------------------------------

export const CoreRuleSetSchema = z
  .object({
    id: z.string().regex(KEBAB_ID_PATTERN),
    skill: SkillNameSchema,
    title: LocalizedTextSchema,
    rules: z.array(RuleSchema).min(1),
    anti_patterns: z.array(AntiPatternSchema).default([]),
  })
  .strict();
export type CoreRuleSet = z.infer<typeof CoreRuleSetSchema>;

// ---------------------------------------------------------------------------
// Profil (`profile.yaml`)
// ---------------------------------------------------------------------------

export const LayerSchema = z
  .object({
    id: z.string().regex(KEBAB_ID_PATTERN),
    /** Package Java, exprimé à partir du placeholder `{{basePackage}}`. */
    package: z.string().regex(/^\{\{basePackage\}\}(\.[a-z][a-z0-9]*)*$/),
    may_depend_on: z.array(z.string().regex(KEBAB_ID_PATTERN)),
  })
  .strict();
export type Layer = z.infer<typeof LayerSchema>;

export const ColumnTypeSchema = z.enum([
  'identity',
  'string',
  'text',
  'integer',
  'bigint',
  'boolean',
  'timestamp',
  'date',
  'decimal',
]);
export type ColumnType = z.infer<typeof ColumnTypeSchema>;

export const ColumnSchema = z
  .object({
    name: z.string().regex(SNAKE_ID_PATTERN),
    type: ColumnTypeSchema,
    length: z.number().int().positive().optional(),
    nullable: z.boolean().default(false),
  })
  .strict()
  .refine((c) => c.length === undefined || c.type === 'string', {
    message: "`length` ne s'applique qu'au type `string`",
  });
export type Column = z.infer<typeof ColumnSchema>;

export const TableSchema = z
  .object({
    name: z.string().regex(SNAKE_ID_PATTERN),
    columns: z.array(ColumnSchema).min(1),
  })
  .strict()
  .refine((t) => t.columns.filter((c) => c.type === 'identity').length === 1, {
    message: 'chaque table a exactement une colonne `identity`',
  });
export type Table = z.infer<typeof TableSchema>;

const IdListSchema = z.array(z.string().regex(ANY_ID_PATTERN));

export const ProfileSchema = z
  .object({
    meta: z
      .object({
        id: z.string().regex(KEBAB_ID_PATTERN),
        version: z.string().regex(SEMVER_PATTERN),
        rule_prefix: z.string().regex(RULE_PREFIX_PATTERN),
        summary: LocalizedTextSchema,
        when_to_use: z.array(LocalizedTextSchema).min(1),
        when_not_to_use: z.array(LocalizedTextSchema).min(1),
      })
      .strict(),
    architecture: z
      .object({
        base_package: z.literal(BASE_PACKAGE_PLACEHOLDER),
        layers: z.array(LayerSchema),
      })
      .strict(),
    rules: z.array(RuleSchema).min(1),
    anti_patterns: z.array(AntiPatternSchema).default([]),
    dependencies: z
      .object({
        allowed: z.array(
          z.object({ artifact: z.string().min(1), purpose: LocalizedTextSchema }).strict(),
        ),
        forbidden: z.array(
          z.object({ artifact: z.string().min(1), rationale: LocalizedTextSchema }).strict(),
        ),
        add_procedure: z.array(LocalizedTextSchema).min(1),
      })
      .strict(),
    reference_example: z
      .object({
        feature: LocalizedTextSchema,
        files: z.array(z.string().min(1)),
        demonstrates: IdListSchema,
        tables: z.array(TableSchema).default([]),
      })
      .strict(),
    skills: z
      .object({
        architecture: IdListSchema.default([]),
        db: IdListSchema.default([]),
        api: IdListSchema.default([]),
        testing: IdListSchema.default([]),
        workflow: IdListSchema.default([]),
        security: IdListSchema.default([]),
      })
      .strict(),
    maven: MavenContributionSchema.optional(),
    application_properties: PropertiesContributionSchema.optional(),
  })
  .strict()
  .superRefine((profile, ctx) => {
    // Cohérence interne : couches référencées existantes, sans auto-dépendance ni cycle.
    const layerIds = new Set(profile.architecture.layers.map((l) => l.id));
    if (layerIds.size !== profile.architecture.layers.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['architecture', 'layers'],
        message: 'ids de couches dupliqués',
      });
    }
    for (const layer of profile.architecture.layers) {
      for (const dep of layer.may_depend_on) {
        if (!layerIds.has(dep)) {
          ctx.addIssue({
            code: 'custom',
            path: ['architecture', 'layers'],
            message: `la couche \`${layer.id}\` dépend d'une couche inconnue \`${dep}\``,
          });
        }
        if (dep === layer.id) {
          ctx.addIssue({
            code: 'custom',
            path: ['architecture', 'layers'],
            message: `la couche \`${layer.id}\` ne peut pas dépendre d'elle-même`,
          });
        }
      }
    }
    const cycle = findLayerCycle(profile.architecture.layers);
    if (cycle) {
      ctx.addIssue({
        code: 'custom',
        path: ['architecture', 'layers'],
        message: `cycle entre couches : ${cycle.join(' -> ')}`,
      });
    }

    // Chaque règle et anti-pattern du profil est rattaché à exactement un skill.
    const declared = [...profile.rules.map((r) => r.id), ...profile.anti_patterns.map((a) => a.id)];
    const assigned = new Map<string, number>();
    for (const ids of Object.values(profile.skills)) {
      for (const id of ids) assigned.set(id, (assigned.get(id) ?? 0) + 1);
    }
    for (const id of declared) {
      const count = assigned.get(id) ?? 0;
      if (count === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['skills'],
          message: `\`${id}\` n'est rattaché à aucun skill`,
        });
      } else if (count > 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['skills'],
          message: `\`${id}\` est rattaché à plusieurs skills`,
        });
      }
    }
    const declaredSet = new Set(declared);
    for (const id of assigned.keys()) {
      if (!declaredSet.has(id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['skills'],
          message: `\`${id}\` référencé dans skills mais non déclaré dans ce profil`,
        });
      }
    }
  });
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileInput = z.input<typeof ProfileSchema>;

function findLayerCycle(layers: readonly Layer[]): string[] | undefined {
  const graph = new Map(layers.map((l) => [l.id, l.may_depend_on] as const));
  const state = new Map<string, 'visiting' | 'done'>();
  const stack: string[] = [];
  const visit = (id: string): string[] | undefined => {
    const current = state.get(id);
    if (current === 'done') return undefined;
    if (current === 'visiting') return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, 'visiting');
    stack.push(id);
    for (const dep of graph.get(id) ?? []) {
      const found = visit(dep);
      if (found) return found;
    }
    stack.pop();
    state.set(id, 'done');
    return undefined;
  };
  for (const id of graph.keys()) {
    const found = visit(id);
    if (found) return found;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Option (`option.yaml`)
// ---------------------------------------------------------------------------

export const OptionSchema = z
  .object({
    meta: z
      .object({
        id: z.string().regex(KEBAB_ID_PATTERN),
        version: z.string().regex(SEMVER_PATTERN),
        rule_prefix: z.string().regex(RULE_PREFIX_PATTERN),
        /** Groupe d'exclusivité (`migrations`, `security`, `ci`) ; absent pour une option isolée. */
        group: z.string().regex(KEBAB_ID_PATTERN).optional(),
        summary: LocalizedTextSchema,
      })
      .strict(),
    skill: SkillNameSchema,
    rules: z.array(RuleSchema).default([]),
    anti_patterns: z.array(AntiPatternSchema).default([]),
    maven: MavenContributionSchema.optional(),
    application_properties: PropertiesContributionSchema.optional(),
    env: z.array(EnvVarSchema).default([]),
  })
  .strict();
export type Option = z.infer<typeof OptionSchema>;
export type OptionInput = z.input<typeof OptionSchema>;
