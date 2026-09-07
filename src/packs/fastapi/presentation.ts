// Prose du renderer propre au pack `fastapi` : elle nomme la stack (Python, uv, import-linter,
// SQLAlchemy, Alembic), donc elle ne peut pas vivre dans le renderer, qui est agnostique.
import { blocks, table } from '../../renderers/markdown.js';
import type { PackPresentation, SkillPresentation, SummaryRow } from '../types.js';
import { tablesOf } from '../sql.js';
import { PACKAGE_NAME_PLACEHOLDER, pythonOf } from './catalog.js';
import { asFastapiScaffold } from './scaffold.js';

const DATABASE_LABEL: Record<string, string> = { postgresql: 'PostgreSQL', mysql: 'MySQL' };
const CI_LABEL: Record<string, string> = { github: 'GitHub Actions', gitlab: 'GitLab CI' };

interface PackStrings {
  packageName: string;
  python: string;
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
  contractTitle: string;
  contractIntro: string;
  migrationTitle: string;
  migrationIntro: string;
  enforcedLegend: string;
  commands: [string, string][];
  skills: SkillPresentation[];
}

const fr: PackStrings = {
  packageName: 'Paquet Python',
  python: 'Python',
  database: 'Base de données',
  noDatabase: 'aucune',
  security: 'Sécurité',
  docker: 'Docker',
  ci: 'CI',
  yes: 'oui',
  no: 'non',
  none: 'aucune',
  layerTargetColumn: 'Module',
  referenceTables: 'Tables',
  columnName: 'Colonne',
  columnType: 'Type',
  columnNullable: 'Nullable',
  contractTitle: 'Le contrat de couches',
  contractIntro:
    "Python n'a pas de compilateur : aucune de ces frontières n'est tenue par le build. C'est ce contrat de `pyproject.toml`, vérifié par `lint-imports`, qui les tient — et rien d'autre. L'ajouter aux `ignore_imports` pour débloquer un build supprime l'architecture en silence.",
  migrationTitle: 'Ajouter une migration',
  migrationIntro: 'Depuis la racine du dépôt :',
  enforcedLegend:
    '`import-linter` : le contrat de couches de `pyproject.toml`, vérifié par `lint-imports`. `mypy` : le typage strict, qui tient ici le rôle du compilateur — la sanction est une étape du pipeline, pas une erreur de build. `ruff`, `format`, `alembic`, `pip-audit`, `pytest`, `commitlint`, `gitleaks` : contrainte outillée, le pipeline ou le commit échoue si elle est violée.',
  commands: [
    ['uv sync', "installe l'environnement depuis `uv.lock`"],
    ['uv run pytest', 'les trois niveaux de test'],
    ['uv run pytest -m "not integration"', 'les mêmes, sans Docker'],
    ['uv run lint-imports', 'vérifie le contrat de couches'],
    ['uv run mypy src tests', 'le typage strict'],
    ['uv run ruff format && uv run ruff check --fix', 'formate et corrige (avant chaque commit)'],
  ],
  skills: [
    {
      id: 'architecture',
      title: 'Architecture',
      description:
        "Couches, modules, sens des imports et exemple de référence du projet. À lire avant de créer un module ou d'ajouter un import.",
      intro:
        "Le profil d'architecture dicte les couches, le contrat `import-linter` et l'exemple de référence. Un module qui ne trouve pas sa couche est un signal : s'arrêter et demander.",
    },
    {
      id: 'db',
      title: 'Base de données et persistance',
      description:
        'Entités SQLAlchemy, session, dépôts, transactions et migrations Alembic. À lire avant de toucher au schéma ou à la persistance.',
      intro:
        'La persistance est un détail du domaine, pas son centre. Le schéma évolue uniquement par migration.',
    },
    {
      id: 'api',
      title: 'API et erreurs',
      description:
        'Routeurs, schémas Pydantic, format des erreurs, pagination et versionnement. À lire avant de créer ou de modifier un endpoint.',
      intro:
        "FastAPI ne fournit pas RFC 9457 : le format d'erreur est du code du squelette, et il est le même pour tous les endpoints.",
    },
    {
      id: 'testing',
      title: 'Tests',
      description:
        "Les trois niveaux, Testcontainers, marqueurs et nommage. À lire avant d'écrire ou de modifier un test.",
      intro:
        'Trois niveaux, pas un de plus. Le bon niveau est le moins coûteux qui exerce réellement le comportement.',
    },
    {
      id: 'workflow',
      title: "Workflow de l'agent",
      description:
        "Plan, commits, dépendances, langue et commandes interdites. Le contrat de travail de l'agent.",
      intro:
        "Ces règles décrivent comment l'agent travaille dans ce dépôt : avant de coder, pendant, au moment de commiter.",
    },
    {
      id: 'security',
      title: 'Sécurité',
      description:
        "Secrets, endpoints de diagnostic, CORS, en-têtes, scan des dépendances et option de sécurité du projet. À lire avant de toucher à la configuration ou à l'authentification.",
      intro: "La sécurité de base s'applique quel que soit le mode d'authentification choisi.",
    },
  ],
};

const en: PackStrings = {
  packageName: 'Python package',
  python: 'Python',
  database: 'Database',
  noDatabase: 'none',
  security: 'Security',
  docker: 'Docker',
  ci: 'CI',
  yes: 'yes',
  no: 'no',
  none: 'none',
  layerTargetColumn: 'Module',
  referenceTables: 'Tables',
  columnName: 'Column',
  columnType: 'Type',
  columnNullable: 'Nullable',
  contractTitle: 'The layer contract',
  contractIntro:
    'Python has no compiler: none of these boundaries is held by the build. This contract in `pyproject.toml`, checked by `lint-imports`, is what holds them — and nothing else. Adding to its `ignore_imports` to unblock a build deletes the architecture quietly.',
  migrationTitle: 'Adding a migration',
  migrationIntro: 'From the repository root:',
  enforcedLegend:
    '`import-linter`: the layer contract of `pyproject.toml`, checked by `lint-imports`. `mypy`: strict typing, which plays the compiler role here — the sanction is a pipeline step, not a build error. `ruff`, `format`, `alembic`, `pip-audit`, `pytest`, `commitlint`, `gitleaks`: tooled constraint, the pipeline or the commit fails when it is violated.',
  commands: [
    ['uv sync', 'installs the environment from `uv.lock`'],
    ['uv run pytest', 'the three test levels'],
    ['uv run pytest -m "not integration"', 'the same ones, without Docker'],
    ['uv run lint-imports', 'checks the layer contract'],
    ['uv run mypy src tests', 'strict typing'],
    ['uv run ruff format && uv run ruff check --fix', 'format and fix (before every commit)'],
  ],
  skills: [
    {
      id: 'architecture',
      title: 'Architecture',
      description:
        'Layers, modules, import direction and the reference example. Read before creating a module or adding an import.',
      intro:
        'The architecture profile dictates the layers, the `import-linter` contract and the reference example. A module that has no layer is a signal: stop and ask.',
    },
    {
      id: 'db',
      title: 'Database and persistence',
      description:
        'SQLAlchemy entities, session, repositories, transactions and Alembic migrations. Read before touching the schema or persistence.',
      intro:
        'Persistence is a detail of the domain, not its centre. The schema only changes through a migration.',
    },
    {
      id: 'api',
      title: 'API and errors',
      description:
        'Routers, Pydantic schemas, error format, pagination and versioning. Read before creating or changing an endpoint.',
      intro:
        'FastAPI does not ship RFC 9457: the error format is skeleton code, and it is the same for every endpoint.',
    },
    {
      id: 'testing',
      title: 'Testing',
      description:
        'The three levels, Testcontainers, markers and naming. Read before writing or changing a test.',
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
        'Secrets, diagnostic endpoints, CORS, headers, dependency scanning and the security option of the project. Read before touching configuration or authentication.',
      intro: 'Baseline security applies whatever the chosen authentication mode.',
    },
  ],
};

const STRINGS: Record<string, PackStrings> = { fr, en };

function strings(language: string): PackStrings {
  return STRINGS[language] ?? en;
}

export const fastapiPresentation: PackPresentation = {
  skills: (language) => strings(language).skills,

  projectRows(scaffold, language) {
    const s = strings(language);
    const value = asFastapiScaffold(scaffold);
    const beforeProfile: SummaryRow[] = [
      { label: s.packageName, value: `\`${value.project.package_name}\`` },
      { label: s.python, value: '3.13' },
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
  initialCommands: () => ['uv sync', 'uv run pytest'],

  substitute(scaffold, value) {
    const packageName = asFastapiScaffold(scaffold).project.package_name;
    return value.split(PACKAGE_NAME_PLACEHOLDER).join(packageName);
  },

  /**
   * Une API n'a pas de bundle client, donc pas de variable publique : le nom déclaré par une
   * option est le nom final. Ce point d'extension est ici l'identité, et c'est en soi un contrôle
   * qu'il généralise (ADR 0011 §8).
   */
  envName: (_scaffold, variable) => variable.name,

  /**
   * Skill `architecture` : le contrat `import-linter`, que le tableau des couches ne montre pas —
   * c'est lui, et lui seul, qui tient les frontières.
   * Skill `db` : les tables de l'exemple de référence et la commande de migration.
   */
  skillSections(skillId, context) {
    const s = strings(context.language);
    const packageName = asFastapiScaffold(context.scaffold).project.package_name;

    if (skillId === 'architecture') {
      const layers = context.profile.architecture.layers;
      if (layers.length === 0) return undefined;
      // Le contrat `layers` se lit de la couche haute vers la basse : l'inverse de l'ordre du
      // catalogue, qui part de celle qui ne dépend de rien.
      const ordered = [...layers].reverse().map((l) => l.id);
      return {
        after: blocks(
          `### ${s.contractTitle}`,
          s.contractIntro,
          [
            '```toml',
            '[[tool.importlinter.contracts]]',
            'name = "PY-001-layers"',
            'type = "layers"',
            `layers = [${ordered.map((id) => `"${id}"`).join(', ')}]`,
            `containers = ["${packageName}"]`,
            '```',
          ].join('\n'),
        ),
      };
    }

    if (skillId !== 'db') return undefined;
    const tables = tablesOf(context.profile.reference_example);
    if (tables.length === 0) return undefined;
    const persistence = pythonOf(context.profile)?.modules.find((m) =>
      m.roles.includes('persistence'),
    );
    const migration = persistence
      ? blocks(
          `### ${s.migrationTitle}`,
          s.migrationIntro,
          ['```bash', 'uv run alembic revision --autogenerate -m "<message>"', '```'].join('\n'),
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
