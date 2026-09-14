// L'entité de l'exemple de référence et la table du catalogue sont écrites à la main, séparément.
// Elles ont divergé une fois — `body` nullable dans l'entité, `NOT NULL` dans la migration
// engendrée depuis le catalogue — et seul `alembic check` l'a rattrapé, c'est-à-dire en CI, avec
// Docker, après un aller-retour. Ce test ferme la classe de bugs sans Docker et en une seconde.
import { beforeAll, describe, expect, it } from 'vitest';
import { defaultContentRoot } from '../../src/catalog/content-root.js';
import { loadCatalog, type Catalog } from '../../src/catalog/load.js';
import { compose } from '../../src/engine/compose.js';
import { renderProject } from '../../src/engine/render.js';
import { createNodeFileSystem } from '../../src/fs/node.js';
import { fastapiPack } from '../../src/packs/fastapi/index.js';
import { ScaffoldSchema } from '../../src/packs/fastapi/scaffold.js';
import { tablesOf, type Table } from '../../src/packs/sql.js';
import { claudeCodeRenderer } from '../../src/renderers/index.js';

const SCAFFOLD = ScaffoldSchema.parse({
  scaffold_version: '1.2.0',
  project: { name: 'pay-flow', package_name: 'pay_flow', description: 'Flux de paiement' },
  stack: { target: 'fastapi', database: 'postgresql' },
  profile: 'layered',
  renderer: 'claude-code',
  options: { security: 'none', docker: false, ci: 'none' },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
});

let catalog: Catalog;
let files: { path: string; content: string }[];
let tables: Table[];

beforeAll(async () => {
  catalog = await loadCatalog(createNodeFileSystem(), defaultContentRoot(), fastapiPack);
  const composition = compose(catalog, SCAFFOLD, fastapiPack, { toolVersion: '0.1.0' });
  files = renderProject(composition, claudeCodeRenderer).map((f) => ({
    path: f.path,
    content: f.content,
  }));
  const profile = catalog.profiles.get('layered');
  tables = tablesOf(
    profile?.profile.reference_example ?? { feature: '', files: [], demonstrates: [] },
  );
});

function content(path: string): string {
  const file = files.find((f) => f.path === path);
  expect(file, `${path} doit être rendu`).toBeDefined();
  return file?.content ?? '';
}

/** `body: Mapped[str | None] = mapped_column(Text, nullable=True)` → true. */
function entityNullability(source: string, column: string): boolean | undefined {
  const line = source.split('\n').find((l) => l.trim().startsWith(`${column}: Mapped[`));
  if (line === undefined) return undefined;
  // Deux marqueurs indépendants dans la même ligne : le type et l'argument. Les deux comptent,
  // parce qu'une entité qui les contredirait tromperait le lecteur autant que mypy.
  const optionalType = /Mapped\[[^\]]*\|\s*None\s*\]/.test(line);
  const nullableArg = line.includes('nullable=True');
  const primaryKey = line.includes('primary_key=True');
  expect(
    optionalType,
    `${column} : le type \`Mapped[...]\` et l'argument \`nullable\` se contredisent`,
  ).toBe(nullableArg);
  return primaryKey ? false : nullableArg;
}

/** Bloc `sa.Column("body", …, nullable=True,)` → true. */
function migrationNullability(source: string, column: string): boolean | undefined {
  const block = new RegExp(`"${column}",[\\s\\S]*?nullable=(True|False)`).exec(source);
  return block ? block[1] === 'True' : undefined;
}

describe('fastapi reference example: the catalogue, the entity and the migration agree', () => {
  it('declares the same nullability in all three places', () => {
    const entity = content('src/pay_flow/domain/note.py');
    const migration = content('alembic/versions/0001_initial.py');
    expect(tables.length, 'le profil doit décrire au moins une table').toBeGreaterThan(0);

    for (const table of tables) {
      for (const column of table.columns) {
        // `identity` est la clé primaire : jamais nullable, quoi que dise le catalogue.
        const expected = column.type === 'identity' ? false : column.nullable;

        expect(
          entityNullability(entity, column.name),
          `${table.name}.${column.name} : l'entité contredit le catalogue`,
        ).toBe(expected);

        expect(
          migrationNullability(migration, column.name),
          `${table.name}.${column.name} : la migration contredit le catalogue`,
        ).toBe(expected);
      }
    }
  });

  it('describes every catalogue column, and no other', () => {
    const entity = content('src/pay_flow/domain/note.py');
    const declared = tables.flatMap((t) => t.columns.map((c) => c.name));
    const mapped = [...entity.matchAll(/^ {4}(\w+): Mapped\[/gm)].map((m) => m[1]);

    // Une colonne ajoutée au catalogue sans être mappée produirait une migration que le modèle
    // ne connaît pas : exactement la dérive que `alembic check` signale, mais un tour plus tôt.
    expect(mapped.sort()).toEqual(declared.sort());
  });
});
