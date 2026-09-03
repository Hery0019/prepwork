// Prose de liaison du renderer claude-code, dans la langue de la documentation.
// Les règles elles-mêmes viennent du catalogue ; ici uniquement titres, légendes, libellés.
import type { Language } from '../../catalog/schema.js';

export interface Strings {
  generatedHeader: (toolVersion: string) => string;
  /** Séparateur libellé/valeur : espace avant les deux-points en français. */
  colon: string;
  claudeMd: {
    intro: string;
    projectSection: string;
    projectName: string;
    profile: string;
    languages: string;
    commentsAndDocs: (comments: string, docs: string) => string;
    no: string;
    permanentRules: string;
    permanentRulesIntro: string;
    skillsSection: string;
    skillsIntro: (exampleRuleId: string) => string;
    skillColumn: string;
    contentColumn: string;
    fileColumn: string;
    readingRules: string;
    readingRulesLegend: string;
    guidanceLegend: string;
    commands: string;
    commandSync: string;
    ownership: string;
    ownershipGenerated: string;
    ownershipTeam: string;
    ownershipSource: string;
    git: string;
    gitAuthor: string;
    gitTrailer: string;
    gitNoTrailer: string;
    gitForbidden: string;
  };
  skill: {
    legend: string;
    coreSection: string;
    profileSection: (id: string) => string;
    optionSection: (id: string) => string;
    rules: string;
    antiPatterns: string;
    why: string;
    instead: string;
    guidance: string;
    whenToUse: string;
    whenNotToUse: string;
    layers: string;
    layerColumn: string;
    mayDependOn: string;
    nothing: string;
    referenceExample: string;
    referenceFiles: string;
    referenceDemonstrates: string;
    dependencies: string;
    allowedDependencies: string;
    forbiddenDependencies: string;
    addProcedure: string;
    artifactColumn: string;
    purposeColumn: string;
    rationaleColumn: string;
    settings: string;
    settingComments: string;
    settingDocs: string;
    settingAuthor: string;
    settingTrailer: string;
    envVars: string;
    envVarColumn: string;
    envExampleColumn: string;
    envCommentColumn: string;
    noRules: string;
  };
}

const fr: Strings = {
  colon: ' : ',
  generatedHeader: (v) =>
    `Généré par prepwork ${v} depuis \`scaffold.yaml\`. Ne pas éditer : modifier la source, puis \`prepwork sync\`.`,
  claudeMd: {
    intro:
      "Ce fichier est l'index des conventions du projet pour l'agent. Les détails sont dans les skills listés plus bas ; lire le skill concerné avant de toucher au code correspondant.",
    projectSection: 'Projet',
    projectName: 'Nom',
    profile: "Profil d'architecture",
    languages: 'Langues',
    commentsAndDocs: (c, d) => `commentaires en ${c}, documentation en ${d}`,
    no: 'non',
    permanentRules: 'Règles permanentes',
    permanentRulesIntro:
      "Ces règles s'appliquent à chaque intervention, quel que soit le fichier touché. Le détail et les anti-patterns sont dans le skill `workflow`.",
    skillsSection: 'Skills',
    skillsIntro: (id) =>
      `Un skill par sujet. Chaque règle y porte un identifiant stable (\`${id}\`) à citer dans les plans et les revues.`,
    skillColumn: 'Skill',
    contentColumn: 'Contenu',
    fileColumn: 'Fichier',
    readingRules: 'Comment lire une règle',
    readingRulesLegend:
      "Chaque règle est une phrase vérifiable, suivie de sa raison. Le marqueur après l'identifiant dit qui la fait respecter :",
    guidanceLegend:
      "`guidance` : règle de conduite pour l'agent, vérifiée en revue, sans outil derrière.",
    commands: 'Commandes',
    commandSync: 'met à jour les fichiers générés après un changement de `scaffold.yaml`',
    ownership: 'Propriété des fichiers',
    ownershipGenerated:
      'Les fichiers listés dans `.scaffold/manifest.json` sont générés : ne pas les éditer, ils seraient écrasés ou signalés par `prepwork sync`.',
    ownershipTeam:
      "`docs/adr/`, `docs/glossary.md` et tout le code métier appartiennent à l'équipe et ne sont jamais dans le manifeste.",
    ownershipSource:
      "L'exemple de référence (`Note`) est généré ; le supprimer ou le modifier est un choix d'équipe, `sync` le signale sans le recréer.",
    git: 'Git',
    gitAuthor: 'Auteur des commits',
    gitTrailer:
      "Chaque commit de l'agent porte le trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.",
    gitNoTrailer: "Les commits de l'agent ne portent pas de trailer de co-auteur.",
    gitForbidden: "Interdit à l'agent : `git push`, `git reset --hard`, `git clean`.",
  },
  skill: {
    legend:
      "Marqueur après l'identifiant : nom d'outil = contrainte outillée (le build ou le commit échoue) ; `guidance` = règle de conduite vérifiée en revue.",
    coreSection: 'Règles de base',
    profileSection: (id) => `Profil \`${id}\``,
    optionSection: (id) => `Option \`${id}\``,
    rules: 'Règles',
    antiPatterns: 'Anti-patterns',
    why: 'Pourquoi',
    instead: 'À la place',
    guidance: 'guidance',
    whenToUse: 'Quand ce profil convient',
    whenNotToUse: 'Quand il ne convient pas',
    layers: 'Couches',
    layerColumn: 'Couche',
    mayDependOn: 'Peut dépendre de',
    nothing: 'rien',
    referenceExample: 'Exemple de référence',
    referenceFiles: 'Fichiers',
    referenceDemonstrates: 'Règles illustrées',
    dependencies: 'Dépendances',
    allowedDependencies: 'Autorisées sans discussion',
    forbiddenDependencies: 'Interdites',
    addProcedure: 'Procédure pour ajouter une dépendance',
    artifactColumn: 'Artefact',
    purposeColumn: 'Rôle',
    rationaleColumn: 'Raison',
    settings: 'Réglages du projet',
    settingComments: 'Langue des commentaires',
    settingDocs: 'Langue de la documentation',
    settingAuthor: 'Auteur des commits',
    settingTrailer: 'Trailer de co-auteur',
    envVars: "Variables d'environnement attendues",
    envVarColumn: 'Variable',
    envExampleColumn: 'Exemple',
    envCommentColumn: 'Rôle',
    noRules: 'Aucune règle spécifique pour ce skill dans cette source.',
  },
};

const en: Strings = {
  colon: ': ',
  generatedHeader: (v) =>
    `Generated by prepwork ${v} from \`scaffold.yaml\`. Do not edit: change the source, then run \`prepwork sync\`.`,
  claudeMd: {
    intro:
      'This file is the index of the project conventions for the agent. Details live in the skills listed below; read the relevant skill before touching the corresponding code.',
    projectSection: 'Project',
    projectName: 'Name',
    profile: 'Architecture profile',
    languages: 'Languages',
    commentsAndDocs: (c, d) => `comments in ${c}, documentation in ${d}`,
    no: 'no',
    permanentRules: 'Permanent rules',
    permanentRulesIntro:
      'These rules apply to every intervention, whatever the file. Details and anti-patterns are in the `workflow` skill.',
    skillsSection: 'Skills',
    skillsIntro: (id) =>
      `One skill per topic. Every rule carries a stable identifier (\`${id}\`) to quote in plans and reviews.`,
    skillColumn: 'Skill',
    contentColumn: 'Covers',
    fileColumn: 'File',
    readingRules: 'How to read a rule',
    readingRulesLegend:
      'Each rule is one verifiable sentence followed by its rationale. The marker after the identifier says who enforces it:',
    guidanceLegend:
      '`guidance`: a rule of conduct for the agent, checked in review, with no tool behind it.',
    commands: 'Commands',
    commandSync: 'updates generated files after a change to `scaffold.yaml`',
    ownership: 'File ownership',
    ownershipGenerated:
      'Files listed in `.scaffold/manifest.json` are generated: do not edit them, they would be overwritten or reported by `prepwork sync`.',
    ownershipTeam:
      '`docs/adr/`, `docs/glossary.md` and all business code belong to the team and are never in the manifest.',
    ownershipSource:
      'The reference example (`Note`) is generated; deleting or changing it is a team choice, `sync` reports it and never recreates it.',
    git: 'Git',
    gitAuthor: 'Commit author',
    gitTrailer:
      'Every agent commit carries the trailer `Co-Authored-By: Claude <noreply@anthropic.com>`.',
    gitNoTrailer: 'Agent commits carry no co-author trailer.',
    gitForbidden: 'Forbidden to the agent: `git push`, `git reset --hard`, `git clean`.',
  },
  skill: {
    legend:
      'Marker after the identifier: a tool name = tooled constraint (the build or the commit fails); `guidance` = rule of conduct checked in review.',
    coreSection: 'Base rules',
    profileSection: (id) => `Profile \`${id}\``,
    optionSection: (id) => `Option \`${id}\``,
    rules: 'Rules',
    antiPatterns: 'Anti-patterns',
    why: 'Why',
    instead: 'Instead',
    guidance: 'guidance',
    whenToUse: 'When this profile fits',
    whenNotToUse: 'When it does not',
    layers: 'Layers',
    layerColumn: 'Layer',
    mayDependOn: 'May depend on',
    nothing: 'nothing',
    referenceExample: 'Reference example',
    referenceFiles: 'Files',
    referenceDemonstrates: 'Rules illustrated',
    dependencies: 'Dependencies',
    allowedDependencies: 'Allowed without discussion',
    forbiddenDependencies: 'Forbidden',
    addProcedure: 'Procedure to add a dependency',
    artifactColumn: 'Artifact',
    purposeColumn: 'Purpose',
    rationaleColumn: 'Rationale',
    settings: 'Project settings',
    settingComments: 'Comments language',
    settingDocs: 'Documentation language',
    settingAuthor: 'Commit author',
    settingTrailer: 'Co-author trailer',
    envVars: 'Expected environment variables',
    envVarColumn: 'Variable',
    envExampleColumn: 'Example',
    envCommentColumn: 'Purpose',
    noRules: 'No rule specific to this skill in this source.',
  },
};

export const STRINGS: Record<Language, Strings> = { fr, en };

export const LANGUAGE_LABEL: Record<Language, Record<Language, string>> = {
  fr: { fr: 'français', en: 'anglais' },
  en: { fr: 'French', en: 'English' },
};
