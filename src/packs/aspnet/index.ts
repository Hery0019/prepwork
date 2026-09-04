// Le pack `aspnet` : tout ce que le cœur ne sait pas de C#, du SDK .NET et d'ASP.NET Core.
import { createCatalogSchemas, FilesSchema } from '../../catalog/schema.js';
import type { StackPack } from '../types.js';
import { CATALOG_SPEC, dotnetOf, TEST_BACKED_ENFORCERS } from './catalog.js';
import { buildAspnetContext } from './context.js';
import { sortUsings } from './csharp-format.js';
import { aspnetPresentation } from './presentation.js';
import { runQuestionnaire } from './questionnaire.js';
import { resolveOptionIds, ScaffoldSchema, STACK_TARGET } from './scaffold.js';

const CRLF_EXTENSIONS = ['.cmd', '.bat', '.ps1'];

const schemas = createCatalogSchemas(CATALOG_SPEC);

export const aspnetPack: StackPack = {
  id: STACK_TARGET,
  contentDir: STACK_TARGET,
  scaffoldSchema: ScaffoldSchema,
  catalogSchemas: schemas,
  catalogSpecValues: { enforcedBy: CATALOG_SPEC.enforcedBy, skills: CATALOG_SPEC.skills },
  testBackedEnforcers: TEST_BACKED_ENFORCERS,
  carriesRuleEvidence: (path) => path.includes('tests/'),
  /** Un test NetArchTest porte l'identifiant en soulignés : `NET_002_api_only_references`. */
  ruleEvidenceToken: (id) => id.replace(/-/g, '_'),
  /**
   * `persistence` et `ef` viennent de l'option `persistence-ef` : ce sont des mots du domaine
   * (« attribut de persistance », « EF Core ») qu'un profil emploie légitimement. Le vrai garde-fou
   * de l'orthogonalité reste l'interdiction faite aux templates d'un profil de lire `it.options`.
   */
  genericOptionWords: ['security', 'ci', 'none', 'git', 'jwt', 'bearer', 'persistence', 'ef'],
  /** Aucune variable n'est réécrite : côté serveur, un nom d'option est le nom final. */
  reservedEnvPrefixes: [],

  contributionConditions(source) {
    const packages = dotnetOf(source)?.packages ?? [];
    return packages.flatMap((pkg) =>
      pkg.when === undefined ? [] : [{ where: `dotnet.packages (${pkg.id})`, when: pkg.when }],
    );
  },

  resolveOptionIds,
  buildContext: buildAspnetContext,

  /** `using` triés comme `dotnet format` les attend, scripts Windows en CRLF. */
  postProcess(path, content) {
    if (path.endsWith('.cs')) return sortUsings(content);
    if (CRLF_EXTENSIONS.some((ext) => path.endsWith(ext))) {
      return content.split('\r\n').join('\n').split('\n').join('\r\n');
    }
    return content;
  },

  presentation: aspnetPresentation,
  runQuestionnaire,

  jsonSchemas: () => ({
    scaffold: { schema: ScaffoldSchema, title: 'prepwork scaffold.yaml (aspnet)' },
    profile: { schema: schemas.ProfileSchema, title: 'prepwork profile.yaml (aspnet)' },
    option: { schema: schemas.OptionSchema, title: 'prepwork option.yaml (aspnet)' },
    core: { schema: schemas.CoreRuleSetSchema, title: 'prepwork core rule set (aspnet)' },
    files: { schema: FilesSchema, title: 'prepwork files.yaml' },
  }),
};
