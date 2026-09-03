// Contrat d'un pack de stack (ADR 0007). Un pack apporte tout ce qui est propre à une
// technologie cible : la forme de `scaffold.yaml`, les valeurs de `enforced_by` et de skills,
// les contributions d'un profil ou d'une option, le contexte de templates, le post-traitement
// des fichiers rendus et la prose du renderer qui nomme la stack.
//
// Règle de garde : le cœur ne teste jamais `pack.id`. Une différence de stack qui ne s'exprime
// pas par un de ces points d'extension est un défaut de découpage.
import type { ZodError, ZodType } from 'zod';
import type { CatalogSchemaSpec, CatalogSchemas, Option, Profile } from '../catalog/schema.js';
import type { OptionCatalog, ProfileCatalog } from '../catalog/load.js';
import type { BaseScaffold } from '../config/schema.js';
import type { BaseTemplateContext, TemplateContext } from '../engine/context.js';
import type { Prompter } from '../questionnaire/prompter.js';
import type { QuestionnaireResult } from '../questionnaire/types.js';

/** Résultat de `safeParse`, réduit à ce dont le cœur a besoin (covariant sur les données). */
export interface ScaffoldParser {
  safeParse(
    value: unknown,
  ): { success: true; data: BaseScaffold } | { success: false; error: ZodError };
}

/** Entrées de la construction du contexte, une fois profil et options résolus. */
export interface PackContextInput {
  scaffold: BaseScaffold;
  profile: ProfileCatalog;
  options: readonly OptionCatalog[];
}

/** Une ligne de la table « Projet » de `CLAUDE.md`. */
export interface SummaryRow {
  label: string;
  value: string;
}

/** Un skill du pack, dans l'ordre où le renderer doit le présenter. */
export interface SkillPresentation {
  id: string;
  title: string;
  description: string;
  intro: string;
}

/** Sections supplémentaires d'un skill, en Markdown déjà rendu. */
export interface SkillSections {
  /** Placée avant les règles de la source. */
  before?: string | undefined;
  /** Placée après. */
  after?: string | undefined;
}

/** Prose et libellés que le renderer ne peut pas connaître : ils nomment la stack. */
export interface PackPresentation {
  /** Skills du pack, dans l'ordre d'affichage, dans la langue de la documentation. */
  skills(language: string): SkillPresentation[];
  /**
   * Lignes de la table « Projet » de `CLAUDE.md`, réparties autour de la ligne du profil que
   * le renderer insère (il est le seul à connaître le résumé du profil).
   */
  projectRows(
    scaffold: BaseScaffold,
    language: string,
  ): { beforeProfile: SummaryRow[]; afterProfile: SummaryRow[] };
  /** Légende des valeurs de `enforced_by` outillées. */
  enforcedLegend(language: string): string;
  /** Commandes du projet : `[commande, rôle]`. */
  commands(language: string): [string, string][];
  /** Premières commandes à lancer dans le projet fraîchement généré. */
  initialCommands(): string[];
  /** En-tête de la colonne qui porte la cible d'une couche (`Package`, `Chemin`…). */
  layerTargetColumn(language: string): string;
  /** Remplace les placeholders du catalogue par leur valeur concrète (`{{basePackage}}`…). */
  substitute(scaffold: BaseScaffold, value: string): string;
  /** Sections propres à la stack dans un skill : tables SQL du `db`, par exemple. */
  skillSections(
    skillId: string,
    context: {
      scaffold: BaseScaffold;
      profile: Profile;
      options: readonly Option[];
      language: string;
    },
  ): SkillSections | undefined;
}

export interface StackPack {
  /** Identifiant, valeur de `stack.target` dans `scaffold.yaml`. */
  id: string;
  /** Sous-répertoire de `content/` qui porte le catalogue du pack. */
  contentDir: string;
  /** Schéma complet de `scaffold.yaml` pour ce pack. */
  scaffoldSchema: ScaffoldParser;
  /** Schémas du catalogue, construits depuis la déclaration du pack. */
  catalogSchemas: CatalogSchemas;
  /** Valeurs déclarées par le pack, pour composer un schéma valable pour tous. */
  catalogSpecValues: Pick<CatalogSchemaSpec, 'enforcedBy' | 'skills'>;
  /** Applications dont `check:content` vérifie qu'un test porte l'id de la règle. */
  testBackedEnforcers: readonly string[];
  /** Template pouvant porter la preuve d'une règle outillée (test, configuration de lint). */
  carriesRuleEvidence(templatePath: string): boolean;
  /** Forme sous laquelle l'identifiant d'une règle apparaît dans cette preuve. */
  ruleEvidenceToken(ruleId: string): string;
  /** Segments d'identifiants d'option trop génériques pour servir de marqueur d'orthogonalité. */
  genericOptionWords: readonly string[];
  /**
   * Conditions `when` portées par les contributions d'un profil ou d'une option (dépendances
   * Maven, paquets npm…). `check:content` vérifie qu'elles respectent l'orthogonalité des axes.
   */
  contributionConditions(source: Profile | Option): { where: string; when: string }[];
  /** Options du catalogue à composer, déduites du scaffold. */
  resolveOptionIds(scaffold: BaseScaffold): string[];
  /** Contexte de templates : le pack complète la base commune avec ses propres clés. */
  buildContext(base: BaseTemplateContext, input: PackContextInput): TemplateContext;
  /** Post-traitement d'un fichier rendu (tri d'imports, formatage, fins de ligne). */
  postProcess(path: string, content: string): string;
  presentation: PackPresentation;
  /** Questionnaire du pack ; absent tant qu'il n'est pas écrit. */
  runQuestionnaire?(prompter: Prompter, input: QuestionnaireInput): Promise<QuestionnaireResult>;
  /** Schémas JSON publiés pour l'autocomplétion IDE, par nom de fichier. */
  jsonSchemas(): Record<string, { schema: ZodType; title: string }>;
}

/** Ce que la CLI fournit au questionnaire d'un pack. */
export interface QuestionnaireInput {
  profiles: {
    id: string;
    summary: string;
    whenToUse: string[];
  }[];
  gitIdentity?: { name?: string | undefined; email?: string | undefined } | undefined;
}
