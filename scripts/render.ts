// Rend un projet complet avec le catalogue livré, sans plan ni manifeste : sert à la
// vérification manuelle (`mvn verify`) de l'étape 3. Usage :
//   pnpm render <répertoire-cible> [scaffold.yaml]
// Sans scaffold, un exemple par défaut (layered, PostgreSQL, Flyway, fr) est utilisé.
import { readFile } from 'node:fs/promises';
import { defaultContentRoot, loadCatalog } from '../src/catalog/index.js';
import { parseScaffold, serializeScaffold } from '../src/config/io.js';
import type { Scaffold } from '../src/config/schema.js';
import { compose } from '../src/engine/compose.js';
import { renderProject } from '../src/engine/render.js';
import { PrepworkError } from '../src/errors.js';
import { createNodeFileSystem } from '../src/fs/node.js';
import { joinPath } from '../src/fs/types.js';
import { claudeCodeRenderer } from '../src/renderers/index.js';

const DEFAULT_SCAFFOLD: Scaffold = {
  scaffold_version: '1.0.0',
  project: { name: 'pay-flow', base_package: 'mg.solumada.payflow', description: 'Payment flows' },
  stack: { java: 21, database: 'postgresql', migrations: 'flyway' },
  profile: 'layered',
  options: { security: 'none', docker: true, ci: 'github' },
  git: { author: { name: 'Hery', email: 'hery@example.com' }, agent_trailer: true },
  language: { comments: 'fr', docs: 'fr' },
};

const [outDir, scaffoldPath] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: pnpm render <répertoire-cible> [scaffold.yaml]');
  process.exit(2);
}

try {
  const fs = createNodeFileSystem();
  const scaffold = scaffoldPath
    ? parseScaffold(await readFile(scaffoldPath, 'utf8'), scaffoldPath)
    : DEFAULT_SCAFFOLD;
  const catalog = await loadCatalog(fs, defaultContentRoot());
  const composition = compose(catalog, scaffold, { toolVersion: '0.1.0-dev' });
  const files = renderProject(composition, claudeCodeRenderer);
  await fs.writeText(joinPath(outDir, 'scaffold.yaml'), serializeScaffold(scaffold));
  for (const file of files) await fs.writeText(joinPath(outDir, file.path), file.content);
  console.log(`${files.length + 1} fichiers écrits dans ${outDir}`);
} catch (error) {
  if (error instanceof PrepworkError) {
    console.error(`[${error.code}] ${error.message}`);
    process.exit(1);
  }
  throw error;
}
