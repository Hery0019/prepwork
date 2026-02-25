// Rendu du pack `aspnet` (ADR 0010). Les golden files figent la spécification relue ; les
// assertions qui les accompagnent tiennent ce qu'un golden ne montre pas d'un coup d'œil :
// le graphe de projets, les chemins relatifs et ce que la base de données change.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog, type Catalog } from '../../src/catalog/load.js';
import { compose } from '../../src/engine/compose.js';
import { renderProject } from '../../src/engine/render.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import { aspnetPack } from '../../src/packs/aspnet/index.js';
import { ScaffoldSchema } from '../../src/packs/aspnet/scaffold.js';
import { claudeCodeRenderer } from '../../src/renderers/index.js';
import { expectGolden } from '../helpers/golden.js';

const goldenRoot = join(import.meta.dirname, 'golden');
const COMPOSE_OPTIONS = { toolVersion: '0.1.0', today: '2026-09-03' };

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog(createNodeFileSystem(), defaultContentRoot(), aspnetPack);
  return cached;
}

const POSTGRES = ScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: {
    name: 'pay-flow',
    root_namespace: 'Solumada.PayFlow',
    description: 'Flux de paiement',
  },
  stack: { target: 'aspnet', database: 'postgresql' },
  profile: 'layered',
  renderer: 'claude-code',
  options: { security: 'none', docker: true, ci: 'github' },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
});

const SQLSERVER_COOKIE = ScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: { name: 'back-office', root_namespace: 'BackOffice', description: 'Back office' },
  stack: { target: 'aspnet', database: 'sqlserver' },
  profile: 'layered',
  renderer: 'claude-code',
  options: { security: 'cookie', docker: false, ci: 'gitlab' },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
});

const NO_DATABASE_JWT = ScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: { name: 'edge-api', root_namespace: 'Edge.Api', description: 'Stateless edge API' },
  stack: { target: 'aspnet', database: 'none' },
  profile: 'layered',
  renderer: 'claude-code',
  options: { security: 'jwt-bearer', docker: false, ci: 'none' },
  git: { author: { name: 'Jane', email: 'jane@example.com' }, agent_trailer: false },
  language: { comments: 'en', docs: 'en' },
});

describe('aspnet project rendering (layered)', () => {
  it('renders the PostgreSQL variant — golden', async () => {
    const composition = compose(await catalog(), POSTGRES, aspnetPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'aspnet-layered-postgresql-fr'), files);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('Solumada.PayFlow.slnx');
    expect(paths).toContain('src/Solumada.PayFlow.Api/Program.cs');
    expect(paths).toContain('tests/Solumada.PayFlow.Tests/Architecture/LayeredArchitectureTest.cs');
    expect(paths, 'la migration initiale est livrée, pas laissée à faire').toContain(
      'src/Solumada.PayFlow.Infrastructure/Migrations/20260903000000_InitialSchema.cs',
    );
  });

  it('points a test project at the sources through the right relative path', async () => {
    const composition = compose(await catalog(), POSTGRES, aspnetPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    const tests =
      files.find((f) => f.path === 'tests/Solumada.PayFlow.Tests/Solumada.PayFlow.Tests.csproj')
        ?.content ?? '';

    // Les projets ne sont pas frères : `tests/` remonte de deux crans avant d'entrer dans `src/`.
    expect(tests).toContain('"../../src/Solumada.PayFlow.Api/Solumada.PayFlow.Api.csproj"');
    const api =
      files.find((f) => f.path === 'src/Solumada.PayFlow.Api/Solumada.PayFlow.Api.csproj')
        ?.content ?? '';
    expect(api).toContain('"../Solumada.PayFlow.Domain/Solumada.PayFlow.Domain.csproj"');
  });

  it('renders the SQL Server variant with cookie authentication — golden', async () => {
    const composition = compose(await catalog(), SQLSERVER_COOKIE, aspnetPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'aspnet-layered-sqlserver-cookie-fr'), files);

    const persistence =
      files.find(
        (f) => f.path === 'src/BackOffice.Infrastructure/Persistence/PersistenceServices.cs',
      )?.content ?? '';
    expect(persistence, 'le provider suit la base choisie').toContain('UseSqlServer');
    const security =
      files.find((f) => f.path === 'src/BackOffice.Api/Security/ApiSecurity.cs')?.content ?? '';
    expect(security).toContain('AddCookie');
    expect(security, 'une API ne redirige pas vers une page de connexion').toContain(
      'Status401Unauthorized',
    );
  });

  it('renders the variant without a database — golden', async () => {
    const composition = compose(await catalog(), NO_DATABASE_JWT, aspnetPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'aspnet-layered-nodb-jwt-en'), files);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('src/Edge.Api.Infrastructure/Notes/InMemoryNoteRepository.cs');
    expect(paths, 'sans base, ni DbContext ni migration').not.toContain(
      'src/Edge.Api.Infrastructure/Persistence/AppDbContext.cs',
    );
    expect(paths.some((path) => path.includes('/Migrations/'))).toBe(false);
    expect(paths, 'sans base, pas de fixture Testcontainers').not.toContain(
      'tests/Edge.Api.Tests/Support/DatabaseFixture.cs',
    );

    const api = files.find((f) => f.path === 'src/Edge.Api.Api/Edge.Api.Api.csproj')?.content ?? '';
    expect(api, "l'option jwt pose son paquet sur le projet qui porte le rôle `host`").toContain(
      'Microsoft.AspNetCore.Authentication.JwtBearer',
    );
  });

  it('keeps the composition root out of the layer that the rule protects', async () => {
    const composition = compose(await catalog(), POSTGRES, aspnetPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    const program = files.find((f) => f.path === 'src/Solumada.PayFlow.Api/Program.cs')?.content;

    // `Program` n'a pas d'espace de noms : c'est ce qui le place hors de la sélection de NET-003.
    expect(program).toBeDefined();
    expect(program).not.toMatch(/^namespace /m);
    expect(program).toContain('public partial class Program;');
  });
});
