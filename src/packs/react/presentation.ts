// Prose du renderer propre au pack `react` : elle nomme la stack (Vite, TanStack Query,
// Tailwind, Playwright…) et affiche le contrat visuel du projet dans le skill `ui`.
import { blocks, table } from '../../renderers/markdown.js';
import type { PackPresentation, SkillPresentation } from '../types.js';
import { designPreset, DESIGN_TOKEN_KEYS } from './design.js';
import { asReactScaffold } from './scaffold.js';

const DATA_LABEL: Record<string, string> = { 'tanstack-query': 'TanStack Query' };
const FORMS_LABEL: Record<string, string> = { rhf: 'react-hook-form + zod' };
const STATE_LABEL: Record<string, string> = { zustand: 'zustand', context: 'React context' };
const SECURITY_LABEL: Record<string, string> = {
  'oidc-bff': 'OIDC (BFF)',
  session: 'session cookie',
};
const CI_LABEL: Record<string, string> = { github: 'GitHub Actions', gitlab: 'GitLab CI' };

interface PackStrings {
  data: string;
  forms: string;
  state: string;
  security: string;
  i18n: string;
  e2e: string;
  docker: string;
  ci: string;
  preset: string;
  darkTheme: string;
  yes: string;
  no: string;
  none: string;
  layerTargetColumn: string;
  visualContract: string;
  visualContractSource: string;
  tokenColumn: string;
  valueColumn: string;
  typography: string;
  scale: string;
  weights: string;
  measure: string;
  spacing: string;
  radius: string;
  colors: string;
  lightColumn: string;
  darkColumn: string;
  enforcedLegend: string;
  commands: [string, string][];
  skills: SkillPresentation[];
}

const fr: PackStrings = {
  data: 'Données',
  forms: 'Formulaires',
  state: 'État client',
  security: 'Authentification',
  i18n: 'i18n',
  e2e: 'Tests e2e',
  docker: 'Docker',
  ci: 'CI',
  preset: 'Preset visuel',
  darkTheme: 'Thème sombre',
  yes: 'oui',
  no: 'non',
  none: 'aucune',
  layerTargetColumn: 'Chemin',
  visualContract: 'Contrat visuel',
  visualContractSource:
    'Ces valeurs viennent du preset et sont générées dans `src/shared/styles/tokens.css`. Pour adapter la marque, redéclarer le token dans `src/shared/styles/tokens.override.css`, qui appartient à l’équipe (CORE-027).',
  tokenColumn: 'Token',
  valueColumn: 'Valeur',
  typography: 'Typographie',
  scale: 'Échelle modulaire',
  weights: 'Graisses autorisées',
  measure: 'Longueur de ligne',
  spacing: "Pas d'espacement",
  radius: 'Rayon',
  colors: 'Couleurs sémantiques',
  lightColumn: 'Clair',
  darkColumn: 'Sombre',
  enforcedLegend:
    '`eslint-boundaries`, `dependency-cruiser`, `typescript`, `eslint`, `jsx-a11y`, `stylelint`, `prettier`, `vitest`, `playwright`, `commitlint`, `gitleaks` : contrainte outillée, le build, le lint ou le commit échoue si elle est violée.',
  commands: [
    ['pnpm dev', 'démarre Vite en développement'],
    ['pnpm build', 'construit le bundle de production'],
    ['pnpm lint', 'ESLint, frontières de couches et accessibilité'],
    ['pnpm test', 'tests unitaires et de composants'],
    ['pnpm e2e', 'parcours de référence dans un navigateur'],
  ],
  skills: [
    {
      id: 'architecture',
      title: 'Architecture',
      description:
        'Couches, frontières entre features, index publics et exemple de référence. À lire avant de créer un fichier ou un dossier.',
      intro:
        "Le profil dicte les couches et le sens des imports. Un fichier qui ne trouve pas sa couche est un signal : s'arrêter et demander.",
    },
    {
      id: 'ui',
      title: 'Composants et style',
      description:
        "Tokens, typographie, variantes et états obligatoires d'un composant. À lire avant d'écrire du JSX ou une classe.",
      intro:
        "Le style passe par les tokens du projet, jamais par des valeurs écrites à la main. Un composant qui n'a pas ses cinq états n'est pas fini.",
    },
    {
      id: 'a11y',
      title: 'Accessibilité',
      description:
        'Rôles, libellés, clavier, contraste et mouvement. À lire avant de toucher au balisage.',
      intro:
        "L'accessibilité se décide au moment du balisage : rattrapée après coup, elle coûte dix fois plus cher.",
    },
    {
      id: 'data',
      title: 'Données et formulaires',
      description:
        "Couche `api`, validation aux frontières, cache et formulaires. À lire avant d'appeler le réseau.",
      intro:
        'Les données entrent par un seul endroit, validées ; le cache appartient à la bibliothèque de requêtes, jamais à un état local.',
    },
    {
      id: 'testing',
      title: 'Tests',
      description:
        "Les trois niveaux, MSW, sélection par rôle. À lire avant d'écrire ou modifier un test.",
      intro:
        'Trois niveaux, pas un de plus. Un test qui interroge le DOM comme un utilisateur survit à une refonte du style.',
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
        "Secrets, contenu injecté, en-têtes et authentification. À lire avant de toucher à la configuration ou à l'authentification.",
      intro:
        'Tout ce qui part dans le bundle est public : la sécurité du front consiste à ne jamais y mettre ce qui doit rester secret.',
    },
  ],
};

const en: PackStrings = {
  data: 'Data',
  forms: 'Forms',
  state: 'Client state',
  security: 'Authentication',
  i18n: 'i18n',
  e2e: 'End-to-end tests',
  docker: 'Docker',
  ci: 'CI',
  preset: 'Design preset',
  darkTheme: 'Dark theme',
  yes: 'yes',
  no: 'no',
  none: 'none',
  layerTargetColumn: 'Path',
  visualContract: 'Visual contract',
  visualContractSource:
    'These values come from the preset and are generated into `src/shared/styles/tokens.css`. To adapt the brand, redeclare the token in `src/shared/styles/tokens.override.css`, which belongs to the team (CORE-027).',
  tokenColumn: 'Token',
  valueColumn: 'Value',
  typography: 'Typography',
  scale: 'Modular scale',
  weights: 'Allowed weights',
  measure: 'Line length',
  spacing: 'Spacing step',
  radius: 'Radius',
  colors: 'Semantic colours',
  lightColumn: 'Light',
  darkColumn: 'Dark',
  enforcedLegend:
    '`eslint-boundaries`, `dependency-cruiser`, `typescript`, `eslint`, `jsx-a11y`, `stylelint`, `prettier`, `vitest`, `playwright`, `commitlint`, `gitleaks`: tooled constraint, the build, the lint or the commit fails when it is violated.',
  commands: [
    ['pnpm dev', 'starts Vite in development'],
    ['pnpm build', 'builds the production bundle'],
    ['pnpm lint', 'ESLint, layer boundaries and accessibility'],
    ['pnpm test', 'unit and component tests'],
    ['pnpm e2e', 'the reference journey in a browser'],
  ],
  skills: [
    {
      id: 'architecture',
      title: 'Architecture',
      description:
        'Layers, boundaries between features, public indexes and the reference example. Read before creating a file or a folder.',
      intro:
        'The profile dictates the layers and the direction of imports. A file that fits no layer is a signal: stop and ask.',
    },
    {
      id: 'ui',
      title: 'Components and style',
      description:
        'Tokens, typography, variants and the mandatory states of a component. Read before writing JSX or a class.',
      intro:
        'Style goes through the project tokens, never through hand-written values. A component without its five states is not finished.',
    },
    {
      id: 'a11y',
      title: 'Accessibility',
      description: 'Roles, labels, keyboard, contrast and motion. Read before touching markup.',
      intro:
        'Accessibility is decided when the markup is written; retrofitted later it costs ten times as much.',
    },
    {
      id: 'data',
      title: 'Data and forms',
      description:
        'The `api` layer, validation at the boundary, caching and forms. Read before calling the network.',
      intro:
        'Data enters through one place, validated; the cache belongs to the query library, never to local state.',
    },
    {
      id: 'testing',
      title: 'Testing',
      description:
        'The three levels, MSW, selection by role. Read before writing or changing a test.',
      intro:
        'Three levels, not one more. A test that queries the DOM the way a user does survives a restyling.',
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
        'Secrets, injected content, headers and authentication. Read before touching configuration or authentication.',
      intro:
        'Everything shipped in the bundle is public: front-end security is about never putting there what must stay secret.',
    },
  ],
};

const STRINGS: Record<string, PackStrings> = { fr, en };

function strings(language: string): PackStrings {
  return STRINGS[language] ?? en;
}

function labelled(map: Record<string, string>, value: string, fallback: string): string {
  return value === 'none' ? fallback : (map[value] ?? value);
}

export const reactPresentation: PackPresentation = {
  skills: (language) => strings(language).skills,

  projectRows(scaffold, language) {
    const s = strings(language);
    const { stack, options, design } = asReactScaffold(scaffold);
    const yesNo = (value: boolean): string => (value ? s.yes : s.no);
    return {
      beforeProfile: [],
      afterProfile: [
        { label: s.data, value: labelled(DATA_LABEL, stack.data, s.none) },
        { label: s.forms, value: labelled(FORMS_LABEL, stack.forms, s.none) },
        { label: s.state, value: labelled(STATE_LABEL, options.state, s.none) },
        { label: s.security, value: labelled(SECURITY_LABEL, options.security, s.none) },
        { label: s.i18n, value: yesNo(options.i18n) },
        { label: s.e2e, value: yesNo(options.e2e) },
        { label: s.docker, value: yesNo(options.docker) },
        { label: s.ci, value: labelled(CI_LABEL, options.ci, s.none) },
        { label: s.preset, value: `\`${design.preset}\`` },
        { label: s.darkTheme, value: yesNo(design.dark) },
      ],
    };
  },

  enforcedLegend: (language) => strings(language).enforcedLegend,
  commands: (language) => strings(language).commands,
  layerTargetColumn: (language) => strings(language).layerTargetColumn,
  initialCommands: () => ['pnpm install', 'pnpm dev'],

  /** Aucun placeholder dans le catalogue react : les chemins sont littéraux. */
  substitute: (_scaffold, value) => value,

  /** Skill `ui` : le contrat visuel du projet, tokens compris, avant les règles du profil. */
  skillSections(skillId, context) {
    if (skillId !== 'ui') return undefined;
    const s = strings(context.language);
    const preset = designPreset(asReactScaffold(context.scaffold).design.preset);
    const typography = table(
      [s.tokenColumn, s.valueColumn],
      [
        [s.typography, `${preset.fonts.heading} · ${preset.fonts.body} · ${preset.fonts.mono}`],
        [s.scale, preset.scaleRatio],
        [s.weights, preset.weights.join(', ')],
        [s.measure, preset.measure],
        [s.spacing, `${preset.spacingBase}px`],
        [s.radius, `${preset.radius}px`],
      ],
    );
    const colors = table(
      [s.tokenColumn, s.lightColumn, s.darkColumn],
      DESIGN_TOKEN_KEYS.map((key) => [
        `\`--color-${key}\``,
        `\`${preset.light[key] ?? ''}\``,
        `\`${preset.dark[key] ?? ''}\``,
      ]),
    );
    return {
      before: blocks(
        `### ${s.visualContract}`,
        s.visualContractSource,
        typography,
        `**${s.colors}**`,
        colors,
      ),
    };
  },
};
