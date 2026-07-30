// Le pack `spring-boot` : tout ce que le cœur ne sait pas de Java, Maven et Spring.
import { createCatalogSchemas, FilesSchema } from '../../catalog/schema.js';
import type { StackPack } from '../types.js';
import { CATALOG_SPEC, mavenOf, TEST_BACKED_ENFORCERS } from './catalog.js';
import { buildSpringContext } from './context.js';
import { sortJavaImports } from './java-format.js';
import { springPresentation } from './presentation.js';
import { runQuestionnaire } from './questionnaire.js';
import { resolveOptionIds, ScaffoldSchema, STACK_TARGET } from './scaffold.js';

const CRLF_EXTENSIONS = ['.cmd', '.bat'];

const schemas = createCatalogSchemas(CATALOG_SPEC);

export const springBootPack: StackPack = {
  id: STACK_TARGET,
  contentDir: STACK_TARGET,
  scaffoldSchema: ScaffoldSchema,
  catalogSchemas: schemas,
  catalogSpecValues: { enforcedBy: CATALOG_SPEC.enforcedBy, skills: CATALOG_SPEC.skills },
  testBackedEnforcers: TEST_BACKED_ENFORCERS,
  carriesRuleEvidence: (path) => path.includes('src/test/'),
  /** Un test ArchUnit porte l'identifiant en soulignés : `LAY_002_web_does_not_depend`. */
  ruleEvidenceToken: (id) => id.replace(/-/g, '_'),
  genericOptionWords: ['migrations', 'security', 'ci', 'none', 'git', 'resource', 'server'],
  /** Aucune variable n'est réécrite : côté serveur, un nom d'option est le nom final. */
  reservedEnvPrefixes: [],

  contributionConditions(source) {
    const dependencies = mavenOf(source)?.dependencies ?? [];
    return dependencies.flatMap((dep) =>
      dep.when === undefined
        ? []
        : [{ where: `maven.dependencies (${dep.artifact_id})`, when: dep.when }],
    );
  },

  resolveOptionIds,
  buildContext: buildSpringContext,

  /** Imports Java triés comme palantir-java-format les attend, scripts Windows en CRLF. */
  postProcess(path, content) {
    if (path.endsWith('.java')) return sortJavaImports(content);
    if (CRLF_EXTENSIONS.some((ext) => path.endsWith(ext))) {
      return content.split('\r\n').join('\n').split('\n').join('\r\n');
    }
    return content;
  },

  presentation: springPresentation,
  runQuestionnaire,

  jsonSchemas: () => ({
    scaffold: { schema: ScaffoldSchema, title: 'prepwork scaffold.yaml (spring-boot)' },
    profile: { schema: schemas.ProfileSchema, title: 'prepwork profile.yaml (spring-boot)' },
    option: { schema: schemas.OptionSchema, title: 'prepwork option.yaml (spring-boot)' },
    core: { schema: schemas.CoreRuleSetSchema, title: 'prepwork core rule set (spring-boot)' },
    files: { schema: FilesSchema, title: 'prepwork files.yaml' },
  }),
};
