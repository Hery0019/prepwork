// Rendu du pack `fastapi` (ADR 0011). Les golden files figent la spécification relue ; les
// assertions qui les accompagnent tiennent ce qu'un golden ne montre pas d'un coup d'œil : le
// contrat de couches, ce que la base de données change et où atterrissent les contributions.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog, type Catalog } from '../../src/catalog/load.js';
import { compose } from '../../src/engine/compose.js';
import { renderProject } from '../../src/engine/render.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import { fastapiPack } from '../../src/packs/fastapi/index.js';
import { ScaffoldSchema } from '../../src/packs/fastapi/scaffold.js';
import { claudeCodeRenderer } from '../../src/renderers/index.js';
import { expectGolden } from '../helpers/golden.js';

const goldenRoot = join(import.meta.dirname, 'golden');
const COMPOSE_OPTIONS = { toolVersion: '0.1.0', today: '2026-09-09' };

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog(createNodeFileSystem(), defaultContentRoot(), fastapiPack);
  return cached;
}

const POSTGRES = ScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: { name: 'pay-flow', package_name: 'pay_flow', description: 'Flux de paiement' },
  stack: { target: 'fastapi', database: 'postgresql' },
  profile: 'layered',
  renderer: 'claude-code',
  options: { security: 'none', docker: true, ci: 'github' },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
});

const MYSQL_OAUTH2 = ScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: { name: 'back-office', package_name: 'back_office', description: 'Back office' },
  stack: { target: 'fastapi', database: 'mysql' },
  profile: 'layered',
  renderer: 'claude-code',
  options: { security: 'oauth2-resource-server', docker: false, ci: 'gitlab' },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
});

const NO_DATABASE_SESSION = ScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: { name: 'edge-api', package_name: 'edge_api', description: 'Stateless edge API' },
  stack: { target: 'fastapi', database: 'none' },
  profile: 'layered',
  renderer: 'claude-code',
  options: { security: 'session', docker: false, ci: 'none' },
  git: { author: { name: 'Jane', email: 'jane@example.com' }, agent_trailer: false },
  language: { comments: 'en', docs: 'en' },
});

describe('fastapi project rendering (layered)', () => {
  it('renders the PostgreSQL variant — golden', async () => {
    const composition = compose(await catalog(), POSTGRES, fastapiPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'fastapi-layered-postgresql-fr'), files);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('src/pay_flow/api/app.py');
    expect(paths, 'le paquet est typé, sinon mypy ignore ses annotations').toContain(
      'src/pay_flow/py.typed',
    );
    expect(paths, 'la migration initiale est livrée, pas laissée à faire').toContain(
      'alembic/versions/0001_initial.py',
    );
  });

  it('puts the layer contract in the profile, not in pyproject.toml', async () => {
    const composition = compose(await catalog(), POSTGRES, fastapiPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);

    // Python n'a pas de compilateur : ce fichier est la seule chose qui tient les frontières.
    const contract = files.find((f) => f.path === '.importlinter')?.content ?? '';
    expect(contract).toContain('name = PY_001 layers');
    expect(contract, 'sans cette ligne les contrats externes ne sont pas vérifiés').toContain(
      'include_external_packages = True',
    );
    // PY-003 autorise `domain` à porter son mapping : sans cela, PY-005 serait rompu par
    // construction, toute couche atteignant `sqlalchemy` à travers l'entité.
    expect(contract).toContain('allow_indirect_imports = True');

    const pyproject = files.find((f) => f.path === 'pyproject.toml')?.content ?? '';
    expect(pyproject, 'le contrat vit dans son propre fichier').not.toContain('importlinter');
  });

  it('renders the MySQL variant with OAuth2 — golden', async () => {
    const composition = compose(await catalog(), MYSQL_OAUTH2, fastapiPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'fastapi-layered-mysql-oauth2-fr'), files);

    const env = files.find((f) => f.path === '.env.example')?.content ?? '';
    expect(env, "le pilote fait partie de l'URL et suit la base choisie").toContain(
      'mysql+asyncmy',
    );
    expect(env).not.toContain('asyncpg');
    const pyproject = files.find((f) => f.path === 'pyproject.toml')?.content ?? '';
    expect(pyproject).toContain('asyncmy');
    expect(pyproject).toContain('pyjwt');
  });

  it('renders the variant without a database — golden', async () => {
    const composition = compose(await catalog(), NO_DATABASE_SESSION, fastapiPack, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'fastapi-layered-nodb-session-en'), files);

    const paths = files.map((f) => f.path);
    expect(paths, 'sans base, ni session SQLAlchemy ni migration').not.toContain(
      'src/edge_api/repository/session.py',
    );
    expect(paths.some((path) => path.startsWith('alembic/'))).toBe(false);
    expect(paths, 'sans base, pas de niveau intégration').not.toContain(
      'tests/integration/conftest.py',
    );

    const pyproject = files.find((f) => f.path === 'pyproject.toml')?.content ?? '';
    expect(pyproject, "l'option session pose ses paquets sans toucher à la persistance").toContain(
      'itsdangerous',
    );
    expect(pyproject).not.toContain('sqlalchemy');
  });
});
