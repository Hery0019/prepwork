// Le pack `fastapi` : tout ce que le cœur ne sait pas de Python, d'uv et de FastAPI.
import { createCatalogSchemas, FilesSchema } from '../../catalog/schema.js';
import type { StackPack } from '../types.js';
import { CATALOG_SPEC, pythonOf, TEST_BACKED_ENFORCERS } from './catalog.js';
import { buildFastapiContext } from './context.js';
import { fastapiPresentation } from './presentation.js';
import { resolveOptionIds, ScaffoldSchema, STACK_TARGET } from './scaffold.js';

const schemas = createCatalogSchemas(CATALOG_SPEC);

export const fastapiPack: StackPack = {
  id: STACK_TARGET,
  contentDir: STACK_TARGET,
  scaffoldSchema: ScaffoldSchema,
  catalogSchemas: schemas,
  catalogSpecValues: { enforcedBy: CATALOG_SPEC.enforcedBy, skills: CATALOG_SPEC.skills },
  testBackedEnforcers: TEST_BACKED_ENFORCERS,
  /**
   * Deux porteurs de preuve, parce que le pack a deux outils : le contrat `import-linter` vit dans
   * `pyproject.toml`, les règles que le contrat ne sait pas dire vivent dans `tests/`.
   */
  carriesRuleEvidence: (path) => path.includes('tests/') || path.includes('pyproject.toml'),
  /**
   * L'identifiant apparaît tel quel : `name = "PY-001-layers"` dans le contrat, et
   * `test_PY_006_session_is_injected` dans un test — pytest n'acceptant pas le tiret dans un nom
   * de fonction, la forme soulignée est aussi reconnue.
   */
  ruleEvidenceToken: (id) => id,
  /**
   * `persistence` et `security` viennent d'identifiants d'options, mais ce sont aussi des mots du
   * domaine qu'un profil emploie légitimement. Le vrai garde-fou de l'orthogonalité reste
   * l'interdiction faite aux templates d'un profil de lire `it.options`.
   */
  genericOptionWords: [
    'security',
    'ci',
    'none',
    'git',
    'docker',
    'session',
    'oauth2',
    'resource',
    'server',
    'persistence',
    'sqlalchemy',
  ],

  contributionConditions(source) {
    const packages = pythonOf(source)?.packages ?? [];
    return packages.flatMap((pkg) =>
      pkg.when === undefined ? [] : [{ where: `python.packages (${pkg.id})`, when: pkg.when }],
    );
  },

  resolveOptionIds,
  buildContext: buildFastapiContext,

  /** Rien à post-traiter : `ruff format` est lancé par le projet, pas par l'outil. */
  postProcess: (_path, content) => content,

  presentation: fastapiPresentation,

  jsonSchemas: () => ({
    scaffold: { schema: ScaffoldSchema, title: 'prepwork scaffold.yaml (fastapi)' },
    profile: { schema: schemas.ProfileSchema, title: 'prepwork profile.yaml (fastapi)' },
    option: { schema: schemas.OptionSchema, title: 'prepwork option.yaml (fastapi)' },
    core: { schema: schemas.CoreRuleSetSchema, title: 'prepwork core rule set (fastapi)' },
    files: { schema: FilesSchema, title: 'prepwork files.yaml' },
  }),
};
