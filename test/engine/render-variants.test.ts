import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog, type Catalog } from '../../src/catalog/load.js';
import type { Scaffold } from '../../src/config/schema.js';
import { compose } from '../../src/engine/compose.js';
import { renderProject } from '../../src/engine/render.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import { claudeCodeRenderer } from '../../src/renderers/index.js';
import { SAMPLE_SCAFFOLD } from '../helpers/fixtures.js';
import { expectGolden } from '../helpers/golden.js';

const goldenRoot = join(import.meta.dirname, 'golden');
const COMPOSE_OPTIONS = { toolVersion: '0.1.0', today: '2026-09-02' };

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog(createNodeFileSystem(), defaultContentRoot());
  return cached;
}

const MODULAR_PG_FR: Scaffold = { ...SAMPLE_SCAFFOLD, profile: 'modular' };

const LAYERED_FULL_OPTIONS_EN: Scaffold = {
  ...SAMPLE_SCAFFOLD,
  project: { name: 'shop-api', base_package: 'org.acme.shop', description: 'Shop API' },
  stack: { java: 21, database: 'mysql', migrations: 'liquibase' },
  options: { security: 'session', docker: true, ci: 'gitlab' },
  language: { comments: 'en', docs: 'en' },
};

const MODULAR_OAUTH2_NO_DB: Scaffold = {
  ...SAMPLE_SCAFFOLD,
  profile: 'modular',
  stack: { java: 17, database: 'none' },
  options: { security: 'oauth2-resource-server', docker: false, ci: 'none' },
};

describe('full project rendering (modular profile and remaining options)', () => {
  it('renders the modular profile with defaults — golden', async () => {
    const files = renderProject(
      compose(await catalog(), MODULAR_PG_FR, COMPOSE_OPTIONS),
      claudeCodeRenderer,
    );
    await expectGolden(join(goldenRoot, 'modular-postgresql-fr'), files);
    const paths = files.map((f) => f.path);
    expect(paths).toContain('src/main/java/mg/solumada/payflow/note/NoteService.java');
    expect(paths).toContain('src/main/java/mg/solumada/payflow/note/internal/NoteController.java');
    expect(paths).toContain(
      'src/main/java/mg/solumada/payflow/audit/internal/NoteCreatedListener.java',
    );
    expect(paths).toContain('src/test/java/mg/solumada/payflow/architecture/ModularityTest.java');
    const pom = files.find((f) => f.path === 'pom.xml')?.content ?? '';
    expect(pom).toContain('spring-modulith-bom');
    expect(pom).toContain('spring-modulith-starter-core');
  });

  it('renders session security, Liquibase and GitLab CI on MySQL — golden', async () => {
    const files = renderProject(
      compose(await catalog(), LAYERED_FULL_OPTIONS_EN, COMPOSE_OPTIONS),
      claudeCodeRenderer,
    );
    await expectGolden(join(goldenRoot, 'layered-mysql-session-liquibase-gitlab-en'), files);
    const paths = files.map((f) => f.path);
    expect(paths).toContain('.gitlab-ci.yml');
    expect(paths).toContain('src/main/resources/db/changelog/db.changelog-master.yaml');
    expect(paths).toContain('src/main/resources/db/changelog/changes/0001-initial-schema.yaml');
    expect(paths).toContain('src/main/java/org/acme/shop/common/SecurityConfig.java');
    expect(paths).toContain('src/test/java/org/acme/shop/common/SecurityConfigTest.java');
    expect(paths).not.toContain('src/main/resources/db/migration/V1__initial_schema.sql');
    const testProps =
      files.find((f) => f.path === 'src/test/resources/application-test.yaml')?.content ?? '';
    expect(testProps).toContain('enabled: false');
    expect(testProps).toContain('SecurityAutoConfiguration');
    const env = files.find((f) => f.path === '.env.example')?.content ?? '';
    expect(env).toContain('APP_ADMIN_USERNAME=admin');
    expect(env).toContain('jdbc:mysql://localhost:3306/shop_api');
  });

  it('renders the OAuth2 resource server without a database and substitutes the issuer — golden', async () => {
    const files = renderProject(
      compose(await catalog(), MODULAR_OAUTH2_NO_DB, {
        ...COMPOSE_OPTIONS,
        extras: { envOverrides: { OAUTH2_ISSUER_URI: 'https://auth.example.com/realms/app' } },
      }),
      claudeCodeRenderer,
    );
    await expectGolden(join(goldenRoot, 'modular-none-oauth2-fr'), files);
    const env = files.find((f) => f.path === '.env.example')?.content ?? '';
    expect(env).toContain('OAUTH2_ISSUER_URI=https://auth.example.com/realms/app');
    const security =
      files.find((f) => f.path.endsWith('.claude/skills/security/SKILL.md'))?.content ?? '';
    expect(security).toContain('SECO-001');
    expect(security).toContain('`OAUTH2_ISSUER_URI`');
  });

  it('keeps every rendered file free of template residue', async () => {
    for (const scaffold of [MODULAR_PG_FR, LAYERED_FULL_OPTIONS_EN, MODULAR_OAUTH2_NO_DB]) {
      const files = renderProject(
        compose(await catalog(), scaffold, COMPOSE_OPTIONS),
        claudeCodeRenderer,
      );
      for (const file of files) {
        expect(file.content, file.path).not.toContain('<%');
        expect(file.content, file.path).not.toContain('{{basePackage}}');
        expect(file.content, file.path).not.toMatch(/\bundefined\b/);
      }
    }
  });
});
