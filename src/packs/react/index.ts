// Le pack `react` : SPA Vite, profil `spa-feature` (ADR 0007).
import { createCatalogSchemas, FilesSchema } from '../../catalog/schema.js';
import type { StackPack } from '../types.js';
import { CATALOG_SPEC, npmOf, TEST_BACKED_ENFORCERS } from './catalog.js';
import { buildReactContext } from './context.js';
import { reactPresentation } from './presentation.js';
import { runQuestionnaire } from './questionnaire.js';
import { resolveOptionIds, ScaffoldSchema, STACK_TARGET } from './scaffold.js';

const schemas = createCatalogSchemas(CATALOG_SPEC);

export const reactPack: StackPack = {
  id: STACK_TARGET,
  contentDir: STACK_TARGET,
  scaffoldSchema: ScaffoldSchema,
  catalogSchemas: schemas,
  catalogSpecValues: { enforcedBy: CATALOG_SPEC.enforcedBy, skills: CATALOG_SPEC.skills },
  testBackedEnforcers: TEST_BACKED_ENFORCERS,
  /** Les frontières sont outillées par une configuration nommée, pas par un test unitaire. */
  carriesRuleEvidence: (path) =>
    path.includes('eslint') || path.includes('dependency-cruiser') || path.includes('.test.'),
  /** Une règle de lint porte l'identifiant tel quel : `SPA-002-no-cross-feature-import`. */
  ruleEvidenceToken: (id) => id,
  genericOptionWords: ['data', 'forms', 'state', 'security', 'ci', 'none', 'git', 'i18n', 'e2e'],
  // Vite et Next n'exposent au navigateur que ce qui porte leur préfixe : il suit le profil.
  reservedEnvPrefixes: ['VITE_', 'NEXT_PUBLIC_'],

  contributionConditions(source) {
    const dependencies = npmOf(source)?.dependencies ?? [];
    return dependencies.flatMap((dep) =>
      dep.when === undefined ? [] : [{ where: `npm.dependencies (${dep.name})`, when: dep.when }],
    );
  },

  resolveOptionIds,
  buildContext: buildReactContext,

  /** Rien à retoucher après le rendu : Prettier passe sur le projet généré (étape 10). */
  postProcess: (_path, content) => content,

  presentation: reactPresentation,
  runQuestionnaire,

  jsonSchemas: () => ({
    scaffold: { schema: ScaffoldSchema, title: 'prepwork scaffold.yaml (react)' },
    profile: { schema: schemas.ProfileSchema, title: 'prepwork profile.yaml (react)' },
    option: { schema: schemas.OptionSchema, title: 'prepwork option.yaml (react)' },
    core: { schema: schemas.CoreRuleSetSchema, title: 'prepwork core rule set (react)' },
    files: { schema: FilesSchema, title: 'prepwork files.yaml' },
  }),
};
