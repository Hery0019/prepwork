// Schémas Zod du catalogue (`content/`). Zod est la source de vérité : le JSON Schema servi aux
// IDE est généré depuis ce fichier (scripts/generate-schemas.ts), jamais écrit à la main.
//
// Ce module ne connaît aucune stack : les valeurs de `enforced_by`, les noms de skills, la cible
// d'une couche et les contributions d'un profil ou d'une option sont déclarées par le pack
// (ADR 0007) et passées ici sous forme de `CatalogSchemaSpec`.
import { z, type ZodRawShape, type ZodType } from 'zod';

// ---------------------------------------------------------------------------
// Briques de base
// ---------------------------------------------------------------------------

export const RULE_ID_PATTERN = /^[A-Z]{2,5}-\d{3}$/;
export const ANTI_PATTERN_ID_PATTERN = /^[A-Z]{2,5}-AP-\d{3}$/;
const ANY_ID_PATTERN = /^[A-Z]{2,5}-(AP-)?\d{3}$/;
const RULE_PREFIX_PATTERN = /^[A-Z]{2,5}$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const KEBAB_ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const ENV_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const SINGLE_LINE_PATTERN = /^[^\n]+$/;

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

/** Arbre de configuration arbitraire (YAML/JSON), utilisé par les contributions des packs. */
export const PropertyTreeSchema = z.record(z.string(), z.unknown());
export type PropertyTree = z.infer<typeof PropertyTreeSchema>;

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
// Formes vues par le cœur (le pack ajoute ses propres champs)
// ---------------------------------------------------------------------------

export interface Rule {
  id: string;
  statement: LocalizedText;
  rationale: LocalizedText;
  enforced_by: string;
}

export interface AntiPattern extends Rule {
  instead: LocalizedText;
}

export interface CoreRuleSet {
  id: string;
  skill: string;
  title: LocalizedText;
  rules: Rule[];
  anti_patterns: AntiPattern[];
}

export interface Layer {
  id: string;
  /** Cible de la couche : package Java, chemin de dossier… la forme appartient au pack. */
  target: string;
  may_depend_on: string[];
}

export interface ProfileMeta {
  id: string;
  version: string;
  rule_prefix: string;
  summary: LocalizedText;
  when_to_use: LocalizedText[];
  when_not_to_use: LocalizedText[];
}

export interface Profile {
  meta: ProfileMeta;
  architecture: { layers: Layer[] } & Record<string, unknown>;
  rules: Rule[];
  anti_patterns: AntiPattern[];
  dependencies: {
    allowed: { artifact: string; purpose: LocalizedText }[];
    forbidden: { artifact: string; rationale: LocalizedText }[];
    add_procedure: LocalizedText[];
  };
  reference_example: {
    feature: LocalizedText;
    files: string[];
    demonstrates: string[];
  } & Record<string, unknown>;
  /** Identifiants de règles rattachés à chaque skill du pack. */
  skills: Record<string, string[]>;
  /** Contributions du pack (`maven`, `application_properties`, `package_json`…). */
  [key: string]: unknown;
}

export interface OptionMeta {
  id: string;
  version: string;
  rule_prefix: string;
  /** Groupe d'exclusivité (`migrations`, `security`, `ci`) ; absent pour une option isolée. */
  group?: string | undefined;
  summary: LocalizedText;
}

export interface Option {
  meta: OptionMeta;
  skill: string;
  rules: Rule[];
  anti_patterns: AntiPattern[];
  env: EnvVar[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Fabrique : les schémas d'un pack
// ---------------------------------------------------------------------------

/** Ce qu'un pack déclare pour que le catalogue sache valider son contenu. */
export interface CatalogSchemaSpec {
  /** Valeurs autorisées de `enforced_by`, `none` compris. */
  enforcedBy: readonly [string, ...string[]];
  /** Noms de skills, dans l'ordre d'affichage. */
  skills: readonly [string, ...string[]];
  /** Forme de la cible d'une couche (`architecture.layers[].target`). */
  layerTarget: ZodType<string>;
  /** Champs supplémentaires du bloc `architecture`. */
  architectureExtras?: ZodRawShape | undefined;
  /** Champs supplémentaires du bloc `reference_example`. */
  referenceExampleExtras?: ZodRawShape | undefined;
  /** Contributions déclarées par un profil. */
  profileExtras?: ZodRawShape | undefined;
  /** Contributions déclarées par une option. */
  optionExtras?: ZodRawShape | undefined;
}

export interface CatalogSchemas {
  RuleSchema: ZodType<Rule>;
  AntiPatternSchema: ZodType<AntiPattern>;
  CoreRuleSetSchema: ZodType<CoreRuleSet>;
  ProfileSchema: ZodType<Profile>;
  OptionSchema: ZodType<Option>;
}

function idList(): ZodType<string[]> {
  return z.array(z.string().regex(ANY_ID_PATTERN));
}

export function createCatalogSchemas(spec: CatalogSchemaSpec): CatalogSchemas {
  const enforcedBy = z.enum([...spec.enforcedBy]);
  const skillName = z.enum([...spec.skills]);

  const rule = z
    .object({
      id: z.string().regex(RULE_ID_PATTERN, 'id de règle attendu : PREFIX-000'),
      statement: LocalizedTextSchema,
      rationale: LocalizedTextSchema,
      enforced_by: enforcedBy,
    })
    .strict();

  const antiPattern = z
    .object({
      id: z.string().regex(ANTI_PATTERN_ID_PATTERN, "id d'anti-pattern attendu : PREFIX-AP-000"),
      statement: LocalizedTextSchema,
      rationale: LocalizedTextSchema,
      enforced_by: enforcedBy,
      instead: LocalizedTextSchema,
    })
    .strict();

  const coreRuleSet = z
    .object({
      id: z.string().regex(KEBAB_ID_PATTERN),
      skill: skillName,
      title: LocalizedTextSchema,
      rules: z.array(rule).min(1),
      anti_patterns: z.array(antiPattern).default([]),
    })
    .strict();

  const layer = z
    .object({
      id: z.string().regex(KEBAB_ID_PATTERN),
      target: spec.layerTarget,
      may_depend_on: z.array(z.string().regex(KEBAB_ID_PATTERN)),
    })
    .strict();

  const skills = z
    .object(Object.fromEntries(spec.skills.map((name) => [name, idList().default([])])))
    .strict();

  const profile = z
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
        .object({ layers: z.array(layer), ...(spec.architectureExtras ?? {}) })
        .strict(),
      rules: z.array(rule).min(1),
      anti_patterns: z.array(antiPattern).default([]),
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
          demonstrates: idList(),
          ...(spec.referenceExampleExtras ?? {}),
        })
        .strict(),
      skills,
      ...(spec.profileExtras ?? {}),
    })
    .strict()
    .superRefine(checkProfileConsistency);

  const option = z
    .object({
      meta: z
        .object({
          id: z.string().regex(KEBAB_ID_PATTERN),
          version: z.string().regex(SEMVER_PATTERN),
          rule_prefix: z.string().regex(RULE_PREFIX_PATTERN),
          group: z.string().regex(KEBAB_ID_PATTERN).optional(),
          summary: LocalizedTextSchema,
        })
        .strict(),
      skill: skillName,
      rules: z.array(rule).default([]),
      anti_patterns: z.array(antiPattern).default([]),
      env: z.array(EnvVarSchema).default([]),
      ...(spec.optionExtras ?? {}),
    })
    .strict();

  // Les formes sont construites dynamiquement : une conversion unique, ici, redonne au reste
  // du code les types du cœur (`Profile`, `Option`, `CoreRuleSet`).
  return {
    RuleSchema: rule,
    AntiPatternSchema: antiPattern,
    CoreRuleSetSchema: coreRuleSet,
    ProfileSchema: profile,
    OptionSchema: option,
  };
}

// ---------------------------------------------------------------------------
// Cohérence interne d'un profil (indépendante de la stack)
// ---------------------------------------------------------------------------

interface ProfileShape {
  architecture: { layers: Layer[] };
  rules: { id: string }[];
  anti_patterns: { id: string }[];
  skills: Record<string, string[]>;
}

function checkProfileConsistency(value: unknown, ctx: z.RefinementCtx): void {
  const profile = value as ProfileShape;
  const layers = profile.architecture.layers;
  const layerIds = new Set(layers.map((l) => l.id));
  if (layerIds.size !== layers.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['architecture', 'layers'],
      message: 'ids de couches dupliqués',
    });
  }
  for (const layer of layers) {
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
  const cycle = findLayerCycle(layers);
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
}

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
