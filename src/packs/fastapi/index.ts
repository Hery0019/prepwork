// Le pack `fastapi` : tout ce que le cœur ne sait pas de Python, d'uv et de FastAPI.
import { createCatalogSchemas, FilesSchema } from '../../catalog/schema.js';
import type { StackPack } from '../types.js';
import { CATALOG_SPEC, pythonOf, TEST_BACKED_ENFORCERS } from './catalog.js';
import { buildFastapiContext } from './context.js';
import { fastapiPresentation } from './presentation.js';
import { runQuestionnaire } from './questionnaire.js';
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
   * Deux porteurs de preuve, parce que le pack a deux outils : les contrats `import-linter` et les
   * tests. Les contrats vivent dans un `.importlinter` dédié, et non dans `pyproject.toml`, parce
   * que la preuve est cherchée **dans les templates de la source qui porte la règle** : les
   * contrats de couches appartiennent au profil, exactement comme les tests ArchUnit côté Spring,
   * alors que `pyproject.toml` est un fichier du socle.
   */
  carriesRuleEvidence: (path) => path.includes('tests/') || path.includes('.importlinter'),
  /**
   * Un nom de fonction Python n'accepte pas le tiret : l'identifiant apparaît souligné, aussi bien
   * dans un test (`test_PY_006_...`) que dans le nom d'un contrat `import-linter` (`PY_001 layers`).
   * Même convention que NetArchTest côté `aspnet`.
   */
  ruleEvidenceToken: (id) => id.replace(/-/g, '_'),
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
  runQuestionnaire,

  jsonSchemas: () => ({
    scaffold: { schema: ScaffoldSchema, title: 'prepwork scaffold.yaml (fastapi)' },
    profile: { schema: schemas.ProfileSchema, title: 'prepwork profile.yaml (fastapi)' },
    option: { schema: schemas.OptionSchema, title: 'prepwork option.yaml (fastapi)' },
    core: { schema: schemas.CoreRuleSetSchema, title: 'prepwork core rule set (fastapi)' },
    files: { schema: FilesSchema, title: 'prepwork files.yaml' },
  }),
};
