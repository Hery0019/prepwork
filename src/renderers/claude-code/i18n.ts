// Prose de liaison du renderer claude-code, dans la langue de la documentation.
// Les règles elles-mêmes viennent du catalogue ; ici uniquement titres, légendes, libellés.
import type { Language, SkillName } from '../../catalog/schema.js';

export interface Strings {
  generatedHeader: (toolVersion: string) => string;
  /** Séparateur libellé/valeur : espace avant les deux-points en français. */
  colon: string;
  claudeMd: {
    intro: string;
    projectSection: string;
    projectName: string;
    basePackage: string;
    java: string;
    database: string;
    noDatabase: string;
    migrations: string;
    profile: string;
    security: string;
    docker: string;
    ci: string;
    languages: string;
    commentsAndDocs: (comments: string, docs: string) => string;
    yes: string;
    no: string;
    none: string;
    permanentRules: string;
    permanentRulesIntro: string;
    skillsSection: string;
    skillsIntro: string;
    skillColumn: string;
    contentColumn: string;
    fileColumn: string;
    readingRules: string;
    readingRulesLegend: string;
    enforcedLegend: string;
    guidanceLegend: string;
    commands: string;
    commandVerify: string;
    commandRun: string;
    commandFormat: string;
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
    description: Record<SkillName, string>;
    title: Record<SkillName, string>;
    intro: Record<SkillName, string>;
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
    packageColumn: string;
    mayDependOn: string;
    nothing: string;
    referenceExample: string;
    referenceFiles: string;
    referenceDemonstrates: string;
    referenceTables: string;
    columnName: string;
    columnType: string;
    columnNullable: string;
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
    basePackage: 'Package de base',
    java: 'Java',
    database: 'Base de données',
    noDatabase: 'aucune',
    migrations: 'migrations',
    profile: "Profil d'architecture",
    security: 'Sécurité',
    docker: 'Docker',
    ci: 'CI',
    languages: 'Langues',
    commentsAndDocs: (c, d) => `commentaires en ${c}, documentation en ${d}`,
    yes: 'oui',
    no: 'non',
    none: 'aucune',
    permanentRules: 'Règles permanentes',
    permanentRulesIntro:
      "Ces règles s'appliquent à chaque intervention, quel que soit le fichier touché. Le détail et les anti-patterns sont dans le skill `workflow`.",
    skillsSection: 'Skills',
    skillsIntro:
      'Un skill par sujet. Chaque règle y porte un identifiant stable (`LAY-002`) à citer dans les plans et les revues.',
    skillColumn: 'Skill',
    contentColumn: 'Contenu',
    fileColumn: 'Fichier',
    readingRules: 'Comment lire une règle',
    readingRulesLegend:
      "Chaque règle est une phrase vérifiable, suivie de sa raison. Le marqueur après l'identifiant dit qui la fait respecter :",
    enforcedLegend:
      '`archunit`, `spotless`, `commitlint`, `gitleaks`, `modulith`, `dependency-check` : contrainte outillée, le build ou le commit échoue si elle est violée.',
    guidanceLegend:
      "`guidance` : règle de conduite pour l'agent, vérifiée en revue, sans outil derrière.",
    commands: 'Commandes',
    commandVerify: 'compile, tests des trois niveaux, règles ArchUnit',
    commandRun: "lance l'application avec le profil `dev`",
    commandFormat: 'formate le code (à lancer avant chaque commit)',
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
    gitForbidden:
      "Interdit à l'agent : `git push`, `git reset --hard`, `git clean`, suppression d'une migration.",
  },
  skill: {
    description: {
      architecture:
        'Couches, packages, sens des dépendances et exemple de référence du projet. À lire avant de créer ou déplacer une classe.',
      db: 'Entités, repositories, transactions et migrations. À lire avant de toucher au schéma ou à la persistance.',
      api: "Contrôleurs REST, DTO, erreurs RFC 9457, pagination et versionnement. À lire avant d'exposer ou modifier un endpoint.",
      testing:
        "Les trois niveaux de test, Testcontainers, nommage. À lire avant d'écrire ou modifier un test.",
      workflow:
        "Plan, commits, dépendances, langue et commandes interdites. Le contrat de travail de l'agent.",
      security:
        "Secrets, Actuator, CORS, en-têtes, analyse des dépendances et option de sécurité du projet. À lire avant de toucher à la configuration ou à l'authentification.",
    },
    title: {
      architecture: 'Architecture',
      db: 'Base de données et persistance',
      api: 'API et erreurs',
      testing: 'Tests',
      workflow: "Workflow de l'agent",
      security: 'Sécurité',
    },
    intro: {
      architecture:
        "Le profil d'architecture dicte le squelette, les règles ArchUnit et l'exemple de référence. Une classe qui ne trouve pas sa place dans une couche est un signal : s'arrêter et demander.",
      db: 'La persistance est un détail du domaine, pas son centre. Le schéma évolue uniquement par migration.',
      api: "Une seule forme d'erreur, des DTO explicites, des URL versionnées : le contrat de l'API est stable par construction.",
      testing:
        'Trois niveaux, pas un de plus. Le bon niveau est le moins coûteux qui exerce réellement le comportement.',
      workflow:
        "Ces règles décrivent comment l'agent travaille dans ce dépôt : avant de coder, en codant, en commitant.",
      security: "La sécurité de base s'applique quel que soit le mode d'authentification choisi.",
    },
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
    packageColumn: 'Package',
    mayDependOn: 'Peut dépendre de',
    nothing: 'rien',
    referenceExample: 'Exemple de référence',
    referenceFiles: 'Fichiers',
    referenceDemonstrates: 'Règles illustrées',
    referenceTables: 'Tables',
    columnName: 'Colonne',
    columnType: 'Type',
    columnNullable: 'Nullable',
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
    basePackage: 'Base package',
    java: 'Java',
    database: 'Database',
    noDatabase: 'none',
    migrations: 'migrations',
    profile: 'Architecture profile',
    security: 'Security',
    docker: 'Docker',
    ci: 'CI',
    languages: 'Languages',
    commentsAndDocs: (c, d) => `comments in ${c}, documentation in ${d}`,
    yes: 'yes',
    no: 'no',
    none: 'none',
    permanentRules: 'Permanent rules',
    permanentRulesIntro:
      'These rules apply to every intervention, whatever the file. Details and anti-patterns are in the `workflow` skill.',
    skillsSection: 'Skills',
    skillsIntro:
      'One skill per topic. Every rule carries a stable identifier (`LAY-002`) to quote in plans and reviews.',
    skillColumn: 'Skill',
    contentColumn: 'Covers',
    fileColumn: 'File',
    readingRules: 'How to read a rule',
    readingRulesLegend:
      'Each rule is one verifiable sentence followed by its rationale. The marker after the identifier says who enforces it:',
    enforcedLegend:
      '`archunit`, `spotless`, `commitlint`, `gitleaks`, `modulith`, `dependency-check`: tooled constraint, the build or the commit fails when it is violated.',
    guidanceLegend:
      '`guidance`: a rule of conduct for the agent, checked in review, with no tool behind it.',
    commands: 'Commands',
    commandVerify: 'compiles, runs the three test levels and the ArchUnit rules',
    commandRun: 'runs the application with the `dev` profile',
    commandFormat: 'formats the code (run before every commit)',
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
    gitForbidden:
      'Forbidden to the agent: `git push`, `git reset --hard`, `git clean`, deleting a migration.',
  },
  skill: {
    description: {
      architecture:
        'Layers, packages, dependency direction and the reference example of the project. Read before creating or moving a class.',
      db: 'Entities, repositories, transactions and migrations. Read before touching the schema or persistence.',
      api: 'REST controllers, DTOs, RFC 9457 errors, pagination and versioning. Read before exposing or changing an endpoint.',
      testing:
        'The three test levels, Testcontainers, naming. Read before writing or changing a test.',
      workflow:
        "Plan, commits, dependencies, language and forbidden commands. The agent's working contract.",
      security:
        'Secrets, Actuator, CORS, headers, dependency scanning and the security option of the project. Read before touching configuration or authentication.',
    },
    title: {
      architecture: 'Architecture',
      db: 'Database and persistence',
      api: 'API and errors',
      testing: 'Testing',
      workflow: 'Agent workflow',
      security: 'Security',
    },
    intro: {
      architecture:
        'The architecture profile dictates the skeleton, the ArchUnit rules and the reference example. A class that fits no layer is a signal: stop and ask.',
      db: 'Persistence is a detail of the domain, not its centre. The schema changes only through migrations.',
      api: 'One error shape, explicit DTOs, versioned URLs: the API contract is stable by construction.',
      testing:
        'Three levels, not one more. The right level is the cheapest one that genuinely exercises the behaviour.',
      workflow:
        'These rules describe how the agent works in this repository: before coding, while coding, when committing.',
      security: 'Baseline security applies whatever the chosen authentication mode.',
    },
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
    packageColumn: 'Package',
    mayDependOn: 'May depend on',
    nothing: 'nothing',
    referenceExample: 'Reference example',
    referenceFiles: 'Files',
    referenceDemonstrates: 'Rules illustrated',
    referenceTables: 'Tables',
    columnName: 'Column',
    columnType: 'Type',
    columnNullable: 'Nullable',
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
