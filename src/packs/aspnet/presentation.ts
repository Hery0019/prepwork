// Prose du renderer propre au pack `aspnet` : elle nomme la stack (.NET, EF Core, NetArchTest,
// projets et références), donc elle ne peut pas vivre dans le renderer, qui est agnostique.
import { blocks, table } from '../../renderers/markdown.js';
import type { PackPresentation, SkillPresentation, SummaryRow } from '../types.js';
import { dotnetOf, ROOT_NAMESPACE_PLACEHOLDER, tablesOf } from './catalog.js';
import { asAspnetScaffold } from './scaffold.js';

const DATABASE_LABEL: Record<string, string> = {
  postgresql: 'PostgreSQL',
  sqlserver: 'SQL Server',
};
const CI_LABEL: Record<string, string> = { github: 'GitHub Actions', gitlab: 'GitLab CI' };

interface PackStrings {
  rootNamespace: string;
  dotnet: string;
  database: string;
  noDatabase: string;
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
  projectsTitle: string;
  projectsIntro: string;
  projectColumn: string;
  referencesColumn: string;
  migrationTitle: string;
  migrationIntro: string;
  enforcedLegend: string;
  commands: [string, string][];
  skills: SkillPresentation[];
}

const fr: PackStrings = {
  rootNamespace: 'Espace de noms racine',
  dotnet: '.NET',
  database: 'Base de données',
  noDatabase: 'aucune',
  security: 'Sécurité',
  docker: 'Docker',
  ci: 'CI',
  yes: 'oui',
  no: 'non',
  none: 'aucune',
  layerTargetColumn: 'Espace de noms',
  referenceTables: 'Tables',
  columnName: 'Colonne',
  columnType: 'Type',
  columnNullable: 'Nullable',
  projectsTitle: 'Projets et références',
  projectsIntro:
    "Une flèche absente de ce tableau ne compile pas : la `ProjectReference` n'existe pas. Ajouter une référence pour contourner une règle est un changement d'architecture, pas un détail d'implémentation.",
  projectColumn: 'Projet',
  referencesColumn: 'Référence',
  migrationTitle: 'Ajouter une migration',
  migrationIntro: 'Depuis la racine du dépôt :',
  enforcedLegend:
    "`compiler` : la référence de projet n'existe pas, le build échoue. `arch-test`, `analyzer`, `format`, `ef-migrations`, `nuget-audit`, `commitlint`, `gitleaks` : contrainte outillée, le build ou le commit échoue si elle est violée.",
  commands: [
    ['dotnet build', 'compile la solution, analyseurs compris'],
    ['dotnet test', 'les trois niveaux de test et les règles NetArchTest'],
    ['dotnet test --filter Category!=Integration', 'les mêmes, sans Docker'],
    ['dotnet format', 'formate le code (à lancer avant chaque commit)'],
  ],
  skills: [
    {
      id: 'architecture',
      title: 'Architecture',
      description:
        "Projets, espaces de noms, sens des dépendances et exemple de référence du projet. À lire avant de créer une classe ou d'ajouter une référence.",
      intro:
        "Le profil d'architecture dicte le graphe de projets, les règles NetArchTest et l'exemple de référence. Une classe qui ne trouve pas sa place dans un projet est un signal : s'arrêter et demander.",
    },
    {
      id: 'db',
      title: 'Base de données et persistance',
      description:
        'Entités, `DbContext`, dépôts, transactions et migrations EF Core. À lire avant de toucher au schéma ou à la persistance.',
      intro:
        'La persistance est un détail du domaine, pas son centre. Le schéma évolue uniquement par migration.',
    },
    {
      id: 'api',
      title: 'API et erreurs',
      description:
        "Contrôleurs, DTO, `ProblemDetails`, pagination et versionnement. À lire avant d'exposer ou modifier un endpoint.",
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
        "Secrets, points de terminaison de santé, CORS, en-têtes, analyse des dépendances et option de sécurité du projet. À lire avant de toucher à la configuration ou à l'authentification.",
      intro: "La sécurité de base s'applique quel que soit le mode d'authentification choisi.",
    },
  ],
};

const en: PackStrings = {
  rootNamespace: 'Root namespace',
  dotnet: '.NET',
  database: 'Database',
  noDatabase: 'none',
  security: 'Security',
  docker: 'Docker',
  ci: 'CI',
  yes: 'yes',
  no: 'no',
  none: 'none',
  layerTargetColumn: 'Namespace',
  referenceTables: 'Tables',
  columnName: 'Column',
  columnType: 'Type',
  columnNullable: 'Nullable',
  projectsTitle: 'Projects and references',
  projectsIntro:
    'An arrow missing from this table does not compile: the `ProjectReference` does not exist. Adding a reference to work around a rule is an architecture change, not an implementation detail.',
  projectColumn: 'Project',
  referencesColumn: 'References',
  migrationTitle: 'Adding a migration',
  migrationIntro: 'From the root of the repository:',
  enforcedLegend:
    '`compiler`: the project reference does not exist, the build fails. `arch-test`, `analyzer`, `format`, `ef-migrations`, `nuget-audit`, `commitlint`, `gitleaks`: tooled constraint, the build or the commit fails when it is violated.',
  commands: [
    ['dotnet build', 'compiles the solution, analyzers included'],
    ['dotnet test', 'the three test levels and the NetArchTest rules'],
    ['dotnet test --filter Category!=Integration', 'the same, without Docker'],
    ['dotnet format', 'formats the code (run before every commit)'],
  ],
  skills: [
    {
      id: 'architecture',
      title: 'Architecture',
      description:
        'Projects, namespaces, dependency direction and the reference example of the project. Read before creating a class or adding a reference.',
      intro:
        'The architecture profile dictates the project graph, the NetArchTest rules and the reference example. A class that fits no project is a signal: stop and ask.',
    },
    {
      id: 'db',
      title: 'Database and persistence',
      description:
        'Entities, `DbContext`, repositories, transactions and EF Core migrations. Read before touching the schema or persistence.',
      intro:
        'Persistence is a detail of the domain, not its centre. The schema changes only through migrations.',
    },
    {
      id: 'api',
      title: 'API and errors',
      description:
        'Controllers, DTOs, `ProblemDetails`, pagination and versioning. Read before exposing or changing an endpoint.',
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
        'Secrets, health endpoints, CORS, headers, dependency scanning and the security option of the project. Read before touching configuration or authentication.',
      intro: 'Baseline security applies whatever the chosen authentication mode.',
    },
  ],
};

const STRINGS: Record<string, PackStrings> = { fr, en };

function strings(language: string): PackStrings {
  return STRINGS[language] ?? en;
}

export const aspnetPresentation: PackPresentation = {
  skills: (language) => strings(language).skills,

  projectRows(scaffold, language) {
    const s = strings(language);
    const value = asAspnetScaffold(scaffold);
    const beforeProfile: SummaryRow[] = [
      { label: s.rootNamespace, value: `\`${value.project.root_namespace}\`` },
      { label: s.dotnet, value: '10' },
      {
        label: s.database,
        value:
          value.stack.database === 'none'
            ? s.noDatabase
            : (DATABASE_LABEL[value.stack.database] ?? value.stack.database),
      },
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
  initialCommands: () => ['dotnet test'],

  /** Aucun préfixe côté serveur : le nom déclaré par une option est le nom final. */
  envName: (_scaffold, variable) => variable.name,

  substitute(scaffold, value) {
    const rootNamespace = asAspnetScaffold(scaffold).project.root_namespace;
    return value.split(ROOT_NAMESPACE_PLACEHOLDER).join(rootNamespace);
  },

  /**
   * Skill `architecture` : le graphe de projets, que le tableau des couches ne montre pas — c'est
   * lui qui porte les frontières tenues par le compilateur.
   * Skill `db` : les tables de l'exemple de référence et la commande de migration.
   */
  skillSections(skillId, context) {
    const s = strings(context.language);
    const rootNamespace = asAspnetScaffold(context.scaffold).project.root_namespace;

    if (skillId === 'architecture') {
      const projects = dotnetOf(context.profile)?.projects ?? [];
      if (projects.length === 0) return undefined;
      const nameOf = (suffix: string): string => `${rootNamespace}.${suffix}`;
      const bySuffix = new Map(projects.map((p) => [p.id, p.suffix] as const));
      return {
        after: blocks(
          `### ${s.projectsTitle}`,
          s.projectsIntro,
          table(
            [s.projectColumn, s.referencesColumn],
            projects.map((project) => [
              `\`${nameOf(project.suffix)}\``,
              project.references.length === 0
                ? s.none
                : project.references
                    .map((id) => `\`${nameOf(bySuffix.get(id) ?? id)}\``)
                    .join(', '),
            ]),
          ),
        ),
      };
    }

    if (skillId !== 'db') return undefined;
    const tables = tablesOf(context.profile.reference_example);
    if (tables.length === 0) return undefined;
    const dotnet = dotnetOf(context.profile);
    const persistence = dotnet?.projects.find((p) => p.roles.includes('persistence'));
    const host = dotnet?.projects.find((p) => p.roles.includes('host'));
    const migration =
      persistence && host
        ? blocks(
            `### ${s.migrationTitle}`,
            s.migrationIntro,
            [
              '```bash',
              `dotnet ef migrations add <Nom> \\`,
              `  --project src/${rootNamespace}.${persistence.suffix} \\`,
              `  --startup-project src/${rootNamespace}.${host.suffix}`,
              '```',
            ].join('\n'),
          )
        : undefined;
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
        ...(migration ? [migration] : []),
      ),
    };
  },
};
