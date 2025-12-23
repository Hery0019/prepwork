// Prose du renderer propre au pack `spring-boot` : elle nomme la stack (Java, base de données,
// Maven, ArchUnit…), donc elle ne peut pas vivre dans le renderer, qui est agnostique.
import { blocks, table } from '../../renderers/markdown.js';
import type { PackPresentation, SkillPresentation, SummaryRow } from '../types.js';
import { BASE_PACKAGE_PLACEHOLDER, tablesOf } from './catalog.js';
import { asSpringScaffold } from './scaffold.js';

const DATABASE_LABEL: Record<string, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  oracle: 'Oracle',
};
const MIGRATIONS_LABEL: Record<string, string> = { flyway: 'Flyway', liquibase: 'Liquibase' };
const CI_LABEL: Record<string, string> = { github: 'GitHub Actions', gitlab: 'GitLab CI' };

interface PackStrings {
  basePackage: string;
  java: string;
  database: string;
  noDatabase: string;
  migrations: string;
  security: string;
  docker: string;
  ci: string;
  yes: string;
  no: string;
  none: string;
  layerTargetColumn: string;
  referenceTables: string;
  columnName: string;
  columnType: string;
  columnNullable: string;
  enforcedLegend: string;
  commands: [string, string][];
  skills: SkillPresentation[];
}

const fr: PackStrings = {
  basePackage: 'Package de base',
  java: 'Java',
  database: 'Base de données',
  noDatabase: 'aucune',
  migrations: 'migrations',
  security: 'Sécurité',
  docker: 'Docker',
  ci: 'CI',
  yes: 'oui',
  no: 'non',
  none: 'aucune',
  layerTargetColumn: 'Package',
  referenceTables: 'Tables',
  columnName: 'Colonne',
  columnType: 'Type',
  columnNullable: 'Nullable',
  enforcedLegend:
    '`archunit`, `spotless`, `commitlint`, `gitleaks`, `modulith`, `flyway`, `liquibase`, `dependency-check` : contrainte outillée, le build ou le commit échoue si elle est violée.',
  commands: [
    ['./mvnw verify', 'compile, tests des trois niveaux, règles ArchUnit'],
    [
      './mvnw spring-boot:run -Dspring-boot.run.profiles=dev',
      "lance l'application avec le profil `dev`",
    ],
    ['./mvnw spotless:apply', 'formate le code (à lancer avant chaque commit)'],
  ],
  skills: [
    {
      id: 'architecture',
      title: 'Architecture',
      description:
        'Couches, packages, sens des dépendances et exemple de référence du projet. À lire avant de créer ou déplacer une classe.',
      intro:
        "Le profil d'architecture dicte le squelette, les règles ArchUnit et l'exemple de référence. Une classe qui ne trouve pas sa place dans une couche est un signal : s'arrêter et demander.",
    },
    {
      id: 'db',
      title: 'Base de données et persistance',
      description:
        'Entités, repositories, transactions et migrations. À lire avant de toucher au schéma ou à la persistance.',
      intro:
        'La persistance est un détail du domaine, pas son centre. Le schéma évolue uniquement par migration.',
    },
    {
      id: 'api',
      title: 'API et erreurs',
      description:
        "Contrôleurs REST, DTO, erreurs RFC 9457, pagination et versionnement. À lire avant d'exposer ou modifier un endpoint.",
      intro:
        "Une seule forme d'erreur, des DTO explicites, des URL versionnées : le contrat de l'API est stable par construction.",
    },
    {
      id: 'testing',
      title: 'Tests',
      description:
        "Les trois niveaux de test, Testcontainers, nommage. À lire avant d'écrire ou modifier un test.",
      intro:
        'Trois niveaux, pas un de plus. Le bon niveau est le moins coûteux qui exerce réellement le comportement.',
    },
    {
      id: 'workflow',
      title: "Workflow de l'agent",
      description:
        "Plan, commits, dépendances, langue et commandes interdites. Le contrat de travail de l'agent.",
      intro:
        "Ces règles décrivent comment l'agent travaille dans ce dépôt : avant de coder, en codant, en commitant.",
    },
    {
      id: 'security',
      title: 'Sécurité',
      description:
        "Secrets, Actuator, CORS, en-têtes, analyse des dépendances et option de sécurité du projet. À lire avant de toucher à la configuration ou à l'authentification.",
      intro: "La sécurité de base s'applique quel que soit le mode d'authentification choisi.",
    },
  ],
};

const en: PackStrings = {
  basePackage: 'Base package',
  java: 'Java',
  database: 'Database',
  noDatabase: 'none',
  migrations: 'migrations',
  security: 'Security',
  docker: 'Docker',
  ci: 'CI',
  yes: 'yes',
  no: 'no',
  none: 'none',
  layerTargetColumn: 'Package',
  referenceTables: 'Tables',
  columnName: 'Column',
  columnType: 'Type',
  columnNullable: 'Nullable',
  enforcedLegend:
    '`archunit`, `spotless`, `commitlint`, `gitleaks`, `modulith`, `flyway`, `liquibase`, `dependency-check`: tooled constraint, the build or the commit fails when it is violated.',
  commands: [
    ['./mvnw verify', 'compiles, runs the three test levels and the ArchUnit rules'],
    [
      './mvnw spring-boot:run -Dspring-boot.run.profiles=dev',
      'runs the application with the `dev` profile',
    ],
    ['./mvnw spotless:apply', 'formats the code (run before every commit)'],
  ],
  skills: [
    {
      id: 'architecture',
      title: 'Architecture',
      description:
        'Layers, packages, dependency direction and the reference example of the project. Read before creating or moving a class.',
      intro:
        'The architecture profile dictates the skeleton, the ArchUnit rules and the reference example. A class that fits no layer is a signal: stop and ask.',
    },
    {
      id: 'db',
      title: 'Database and persistence',
      description:
        'Entities, repositories, transactions and migrations. Read before touching the schema or persistence.',
      intro:
        'Persistence is a detail of the domain, not its centre. The schema changes only through migrations.',
    },
    {
      id: 'api',
      title: 'API and errors',
      description:
        'REST controllers, DTOs, RFC 9457 errors, pagination and versioning. Read before exposing or changing an endpoint.',
      intro:
        'One error shape, explicit DTOs, versioned URLs: the API contract is stable by construction.',
    },
    {
      id: 'testing',
      title: 'Testing',
      description:
        'The three test levels, Testcontainers, naming. Read before writing or changing a test.',
      intro:
        'Three levels, not one more. The right level is the cheapest one that genuinely exercises the behaviour.',
    },
    {
      id: 'workflow',
      title: 'Agent workflow',
      description:
        "Plan, commits, dependencies, language and forbidden commands. The agent's working contract.",
      intro:
        'These rules describe how the agent works in this repository: before coding, while coding, when committing.',
    },
    {
      id: 'security',
      title: 'Security',
      description:
        'Secrets, Actuator, CORS, headers, dependency scanning and the security option of the project. Read before touching configuration or authentication.',
      intro: 'Baseline security applies whatever the chosen authentication mode.',
    },
  ],
};

const STRINGS: Record<string, PackStrings> = { fr, en };

function strings(language: string): PackStrings {
  return STRINGS[language] ?? en;
}

export const springPresentation: PackPresentation = {
  skills: (language) => strings(language).skills,

  projectRows(scaffold, language) {
    const s = strings(language);
    const value = asSpringScaffold(scaffold);
    const database =
      value.stack.database === 'none'
        ? s.noDatabase
        : (DATABASE_LABEL[value.stack.database] ?? value.stack.database) +
          (value.stack.migrations
            ? ` (${s.migrations} ${MIGRATIONS_LABEL[value.stack.migrations] ?? value.stack.migrations})`
            : '');
    const beforeProfile: SummaryRow[] = [
      { label: s.basePackage, value: `\`${value.project.base_package}\`` },
      { label: s.java, value: String(value.stack.java) },
      { label: s.database, value: database },
    ];
    const afterProfile: SummaryRow[] = [
      { label: s.security, value: `\`${value.options.security}\`` },
      { label: s.docker, value: value.options.docker ? s.yes : s.no },
      {
        label: s.ci,
        value:
          value.options.ci === 'none' ? s.none : (CI_LABEL[value.options.ci] ?? value.options.ci),
      },
    ];
    return { beforeProfile, afterProfile };
  },

  enforcedLegend: (language) => strings(language).enforcedLegend,
  commands: (language) => strings(language).commands,
  layerTargetColumn: (language) => strings(language).layerTargetColumn,

  substitute(scaffold, value) {
    const basePackage = asSpringScaffold(scaffold).project.base_package;
    const replacement = value.includes('/') ? basePackage.replace(/\./g, '/') : basePackage;
    return value.split(BASE_PACKAGE_PLACEHOLDER).join(replacement);
  },

  /** Skill `db` : les tables de l'exemple de référence, après les règles du profil. */
  skillSections(skillId, context) {
    if (skillId !== 'db') return undefined;
    const tables = tablesOf(context.profile.reference_example);
    if (tables.length === 0) return undefined;
    const s = strings(context.language);
    return {
      after: blocks(
        `### ${s.referenceTables}`,
        ...tables.map((t) =>
          blocks(
            `\`${t.name}\``,
            table(
              [s.columnName, s.columnType, s.columnNullable],
              t.columns.map((c) => [
                `\`${c.name}\``,
                c.length !== undefined ? `${c.type}(${c.length})` : c.type,
                c.nullable ? s.yes : s.no,
              ]),
            ),
          ),
        ),
      ),
    };
  },
};
