// Matrice de génération (CLAUDE.md §8) : écrit un scaffold.yaml pour une combinaison
// profil × sécurité × migrations × base, puis rend le projet. La CI lance ensuite `mvn verify`.
// Usage : pnpm matrix <outDir> <profile> <security> <migrations|none> [database]
import { defaultContentRoot, loadCatalog } from '../src/catalog/index.js';
import { serializeScaffold } from '../src/config/io.js';
import { ScaffoldSchema, type Scaffold } from '../src/config/schema.js';
import { compose } from '../src/engine/compose.js';
import { renderProject } from '../src/engine/render.js';
import { PrepworkError } from '../src/errors.js';
import { createNodeFileSystem } from '../src/fs/node.js';
import { joinPath } from '../src/fs/types.js';
import { claudeCodeRenderer } from '../src/renderers/index.js';

const [outDir, profile, security, migrations, database = 'postgresql'] = process.argv.slice(2);
if (!outDir || !profile || !security || !migrations) {
  console.error('usage: pnpm matrix <outDir> <profile> <security> <migrations|none> [database]');
  process.exit(2);
}

try {
  const noDb = migrations === 'none' || database === 'none';
  const scaffold: Scaffold = ScaffoldSchema.parse({
    scaffold_version: '1.0.0',
    project: {
      name: `matrix-${profile}`,
      base_package: `mg.solumada.matrix.${profile.replace(/-/g, '')}`,
      description: `Generation matrix: ${profile} / ${security} / ${migrations} / ${database}`,
    },
    stack: noDb ? { java: 21, database: 'none' } : { java: 21, database, migrations },
    profile,
    options: { security, docker: true, ci: 'github' },
    git: { author: { name: 'prepwork-ci', email: 'ci@example.com' }, agent_trailer: true },
    language: { comments: 'fr', docs: 'fr' },
  });
  const fs = createNodeFileSystem();
  const catalog = await loadCatalog(fs, defaultContentRoot());
  const files = renderProject(
    compose(catalog, scaffold, { toolVersion: 'matrix' }),
    claudeCodeRenderer,
  );
  await fs.writeText(joinPath(outDir, 'scaffold.yaml'), serializeScaffold(scaffold));
  for (const file of files) await fs.writeText(joinPath(outDir, file.path), file.content);
  console.log(
    `${files.length + 1} fichiers écrits dans ${outDir} (${scaffold.project.description})`,
  );
} catch (error) {
  if (error instanceof PrepworkError) {
    console.error(`[${error.code}] ${error.message}`);
    process.exit(1);
  }
  throw error;
}
