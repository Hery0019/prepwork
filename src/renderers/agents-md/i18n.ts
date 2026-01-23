// Prose de liaison du renderer `agents-md`. Les règles viennent du catalogue ; ici uniquement
// titres, légendes et libellés. Ce qui nomme la stack vient du pack, jamais d'ici.
import type { Language } from '../../catalog/schema.js';

export interface Strings {
  generatedHeader: (toolVersion: string) => string;
  colon: string;
  intro: string;
  howToRead: string;
  howToReadLegend: string;
  guidanceLegend: string;
  project: string;
  projectName: string;
  profile: string;
  languages: string;
  commentsAndDocs: (comments: string, docs: string) => string;
  no: string;
  permanentRules: string;
  permanentRulesIntro: string;
  topicsIntro: string;
  coreSection: string;
  profileSection: (id: string) => string;
  optionSection: (id: string) => string;
  rules: string;
  antiPatterns: string;
  why: string;
  instead: string;
  guidance: string;
  noRules: string;
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
  envVars: string;
  envVarColumn: string;
  envExampleColumn: string;
  envCommentColumn: string;
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
  settings: string;
  settingComments: string;
  settingDocs: string;
}

const fr: Strings = {
  colon: ' : ',
  generatedHeader: (v) =>
    `Généré par prepwork ${v} depuis \`scaffold.yaml\`. Ne pas éditer : modifier la source, puis \`prepwork sync\`.`,
  intro:
    "Ce fichier est le contrat de travail de l'agent pour ce dépôt. Il rassemble les conventions du projet ; chaque règle porte un identifiant stable à citer dans les plans et les revues.",
  howToRead: 'Comment lire une règle',
  howToReadLegend:
    "Chaque règle est une phrase vérifiable, suivie de sa raison. Le marqueur après l'identifiant dit qui la fait respecter :",
  guidanceLegend:
    "`guidance` : règle de conduite pour l'agent, vérifiée en revue, sans outil derrière.",
  project: 'Projet',
  projectName: 'Nom',
  profile: "Profil d'architecture",
  languages: 'Langues',
  commentsAndDocs: (c, d) => `commentaires en ${c}, documentation en ${d}`,
  no: 'non',
  permanentRules: 'Règles permanentes',
  permanentRulesIntro:
    "Ces règles s'appliquent à chaque intervention, quel que soit le fichier touché.",
  topicsIntro:
    'Lire la section concernée avant de toucher au code correspondant ; les sections suivent le même découpage que les sujets du projet.',
  coreSection: 'Règles de base',
  profileSection: (id) => `Profil \`${id}\``,
  optionSection: (id) => `Option \`${id}\``,
  rules: 'Règles',
  antiPatterns: 'Anti-patterns',
  why: 'Pourquoi',
  instead: 'À la place',
  guidance: 'guidance',
  noRules: 'Aucune règle spécifique pour ce sujet dans cette source.',
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
  envVars: "Variables d'environnement attendues",
  envVarColumn: 'Variable',
  envExampleColumn: 'Exemple',
  envCommentColumn: 'Rôle',
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
  settings: 'Réglages du projet',
  settingComments: 'Langue des commentaires',
  settingDocs: 'Langue de la documentation',
};

const en: Strings = {
  colon: ': ',
  generatedHeader: (v) =>
    `Generated by prepwork ${v} from \`scaffold.yaml\`. Do not edit: change the source, then run \`prepwork sync\`.`,
  intro:
    "This file is the agent's working contract for this repository. It gathers the project conventions; every rule carries a stable identifier to quote in plans and reviews.",
  howToRead: 'How to read a rule',
  howToReadLegend:
    'Each rule is one verifiable sentence followed by its rationale. The marker after the identifier says who enforces it:',
  guidanceLegend:
    '`guidance`: a rule of conduct for the agent, checked in review, with no tool behind it.',
  project: 'Project',
  projectName: 'Name',
  profile: 'Architecture profile',
  languages: 'Languages',
  commentsAndDocs: (c, d) => `comments in ${c}, documentation in ${d}`,
  no: 'no',
  permanentRules: 'Permanent rules',
  permanentRulesIntro: 'These rules apply to every intervention, whatever the file.',
  topicsIntro:
    'Read the relevant section before touching the corresponding code; the sections follow the same split as the project topics.',
  coreSection: 'Base rules',
  profileSection: (id) => `Profile \`${id}\``,
  optionSection: (id) => `Option \`${id}\``,
  rules: 'Rules',
  antiPatterns: 'Anti-patterns',
  why: 'Why',
  instead: 'Instead',
  guidance: 'guidance',
  noRules: 'No rule specific to this topic in this source.',
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
  envVars: 'Expected environment variables',
  envVarColumn: 'Variable',
  envExampleColumn: 'Example',
  envCommentColumn: 'Purpose',
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
  settings: 'Project settings',
  settingComments: 'Comments language',
  settingDocs: 'Documentation language',
};

export const STRINGS: Record<Language, Strings> = { fr, en };

export const LANGUAGE_LABEL: Record<Language, Record<Language, string>> = {
  fr: { fr: 'français', en: 'anglais' },
  en: { fr: 'French', en: 'English' },
};
