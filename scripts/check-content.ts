// Vérification de cohérence de content/ (CLAUDE.md §8). Usage : pnpm check:content
// Code de sortie 1 s'il y a au moins une erreur ; les avertissements sont affichés.
import { defaultContentRoot, loadCatalog, validateCatalog } from '../src/catalog/index.js';
import { formatDiagnostic, hasErrors, PrepworkError } from '../src/errors.js';
import { createNodeFileSystem } from '../src/fs/node.js';

try {
  const catalog = await loadCatalog(createNodeFileSystem(), defaultContentRoot());
  const diagnostics = validateCatalog(catalog);
  for (const diagnostic of diagnostics) console.log(formatDiagnostic(diagnostic));
  const errors = diagnostics.filter((d) => d.level === 'error').length;
  const warnings = diagnostics.length - errors;
  console.log(
    `content/ : ${catalog.core.ruleSets.length} ensembles core, ${catalog.profiles.size} profil(s), ${catalog.options.size} option(s) — ${errors} erreur(s), ${warnings} avertissement(s)`,
  );
  process.exitCode = hasErrors(diagnostics) ? 1 : 0;
} catch (error) {
  if (error instanceof PrepworkError) {
    console.error(`[${error.code}] ${error.message}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
