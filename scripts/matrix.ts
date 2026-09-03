// Matrice de génération (CLAUDE.md §8) : écrit un scaffold.yaml pour une combinaison, puis rend
// le projet. La CI lance ensuite l'outillage du projet généré (`mvn verify` côté Spring,
// `pnpm lint && pnpm test && pnpm build` côté React).
//
// Usage :
//   pnpm matrix spring-boot <outDir> <profile> <security> <migrations|none> [database]
//   pnpm matrix react       <outDir> <data> <forms> <security> [preset]
import { defaultContentRoot, loadCatalog } from '../src/catalog/index.js';
import { serializeScaffold } from '../src/config/io.js';
import type { BaseScaffold } from '../src/config/schema.js';
import { compose } from '../src/engine/compose.js';
import { renderProject } from '../src/engine/render.js';
import { PrepworkError } from '../src/errors.js';
import { createNodeFileSystem } from '../src/fs/node.js';
import { joinPath } from '../src/fs/types.js';
import { getPack } from '../src/packs/index.js';
import { ScaffoldSchema as ReactScaffoldSchema } from '../src/packs/react/scaffold.js';
import { ScaffoldSchema as SpringScaffoldSchema } from '../src/packs/spring-boot/scaffold.js';
import { claudeCodeRenderer } from '../src/renderers/index.js';

const USAGE = [
  'usage:',
  '  pnpm matrix spring-boot <outDir> <profile> <security> <migrations|none> [database]',
  '  pnpm matrix react       <outDir> <profile> <data> <forms> <security> [preset]',
].join('\n');

function springScaffold(args: readonly string[]): BaseScaffold {
  const [profile, security, migrations, database = 'postgresql'] = args;
  if (!profile || !security || !migrations) throw new PrepworkError('SCAFFOLD_INVALID', USAGE);
  const noDb = migrations === 'none' || database === 'none';
  return SpringScaffoldSchema.parse({
    scaffold_version: '1.1.0',
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
}

function reactScaffold(args: readonly string[]): BaseScaffold {
  const [profile, data, forms, security, preset = 'app-sober'] = args;
  if (!profile || !data || !forms || !security) throw new PrepworkError('SCAFFOLD_INVALID', USAGE);
  return ReactScaffoldSchema.parse({
    scaffold_version: '1.1.0',
    project: {
      name: 'matrix-spa',
      description: `Generation matrix: ${profile} / ${data} / ${forms} / ${security} / ${preset}`,
    },
    stack: { data, forms },
    profile,
    options: { state: 'zustand', security, i18n: true, e2e: true, docker: true, ci: 'github' },
    design: { preset, dark: true },
    git: { author: { name: 'prepwork-ci', email: 'ci@example.com' }, agent_trailer: true },
    language: { comments: 'fr', docs: 'fr' },
  });
}

const [stack, outDir, ...rest] = process.argv.slice(2);
if (!stack || !outDir) {
  console.error(USAGE);
  process.exit(2);
}

try {
  const pack = getPack(stack);
  const scaffold = stack === 'react' ? reactScaffold(rest) : springScaffold(rest);
  const fs = createNodeFileSystem();
  const catalog = await loadCatalog(fs, defaultContentRoot(), pack);
  const files = renderProject(
    compose(catalog, scaffold, pack, { toolVersion: 'matrix' }),
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
