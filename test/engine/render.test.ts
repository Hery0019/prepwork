import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog, type Catalog } from '../../src/catalog/load.js';
import type { Scaffold } from '../../src/config/schema.js';
import { compose } from '../../src/engine/compose.js';
import { renderProject } from '../../src/engine/render.js';
import { PrepworkError } from '../../src/errors.js';
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

const NO_DB_EN: Scaffold = {
  ...SAMPLE_SCAFFOLD,
  project: {
    name: 'inventory',
    base_package: 'com.example.inventory',
    description: 'Stock levels',
  },
  stack: { java: 17, database: 'none' },
  options: { security: 'none', docker: false, ci: 'none' },
  git: { author: { name: 'Jane', email: 'jane@example.com' }, agent_trailer: false },
  language: { comments: 'en', docs: 'en' },
};

describe('full project rendering (layered)', () => {
  it('renders the default project (PostgreSQL, Flyway, Docker, GitHub, fr) — golden', async () => {
    const composition = compose(await catalog(), SAMPLE_SCAFFOLD, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'layered-postgresql-fr'), files);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('src/main/java/mg/solumada/payflow/domain/Note.java');
    expect(paths).toContain('src/main/resources/db/migration/V1__initial_schema.sql');
    expect(paths).toContain('src/test/java/mg/solumada/payflow/TestcontainersConfiguration.java');
    expect(paths).toContain('Dockerfile');
    expect(paths).toContain('.github/workflows/ci.yaml');
    expect(paths).toContain('.claude/skills/db/SKILL.md');
    expect(files.find((f) => f.path === 'docs/adr/0001-architecture-profile.md')?.owner).toBe(
      'team',
    );
    expect(files.find((f) => f.path === 'pom.xml')?.owner).toBe('generated');
  });

  it('renders the no-database variant (Java 17, no docker, no CI, en) — golden', async () => {
    const composition = compose(await catalog(), NO_DB_EN, COMPOSE_OPTIONS);
    const files = renderProject(composition, claudeCodeRenderer);
    await expectGolden(join(goldenRoot, 'layered-none-en'), files);

    const paths = files.map((f) => f.path);
    expect(paths).toContain(
      'src/main/java/com/example/inventory/repository/InMemoryNoteRepository.java',
    );
    expect(paths).not.toContain('src/main/resources/db/migration/V1__initial_schema.sql');
    expect(paths).not.toContain('Dockerfile');
    expect(paths.some((p) => p.startsWith('.github/'))).toBe(false);
    const pom = files.find((f) => f.path === 'pom.xml')?.content ?? '';
    expect(pom).toContain('spring-boot-data-commons');
    expect(pom).not.toContain('spring-boot-starter-data-jpa');
  });

  it('leaves no unrendered placeholder or template tag behind', async () => {
    for (const scaffold of [SAMPLE_SCAFFOLD, NO_DB_EN]) {
      const files = renderProject(
        compose(await catalog(), scaffold, COMPOSE_OPTIONS),
        claudeCodeRenderer,
      );
      for (const file of files) {
        expect(file.content, file.path).not.toContain('{{basePackage}}');
        expect(file.content, file.path).not.toContain('<%');
        expect(file.content, file.path).not.toMatch(/\bundefined\b/);
        if (!file.path.endsWith('.cmd')) expect(file.content, file.path).not.toContain('\r');
      }
    }
  });

  it('applies when-conditions on Maven dependencies (Flyway module per database)', async () => {
    const mysql: Scaffold = {
      ...SAMPLE_SCAFFOLD,
      stack: { java: 21, database: 'mysql', migrations: 'flyway' },
    };
    const pom = renderProject(
      compose(await catalog(), mysql, COMPOSE_OPTIONS),
      claudeCodeRenderer,
    ).find((f) => f.path === 'pom.xml')?.content;
    expect(pom).toContain('flyway-mysql');
    expect(pom).not.toContain('flyway-database-postgresql');
    expect(pom).toContain('testcontainers-mysql');
  });

  it('rejects an unknown profile or option', async () => {
    const bad = { ...SAMPLE_SCAFFOLD, profile: 'hexagonal' as Scaffold['profile'] };
    await expect(async () => compose(await catalog(), bad, COMPOSE_OPTIONS)).rejects.toBeInstanceOf(
      PrepworkError,
    );
  });
});
