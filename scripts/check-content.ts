// Vérification de cohérence de content/ (CLAUDE.md §8), pack par pack. Usage : pnpm check:content
// Code de sortie 1 s'il y a au moins une erreur ; les avertissements sont affichés.
import { defaultContentRoot, loadCatalog, validateCatalog } from '../src/catalog/index.js';
import { formatDiagnostic, hasErrors, PrepworkError } from '../src/errors.js';
import { createNodeFileSystem } from '../src/fs/node.js';
import { PACKS } from '../src/packs/index.js';

try {
  const fs = createNodeFileSystem();
  const root = defaultContentRoot();
  let failed = false;
  for (const pack of PACKS) {
    const catalog = await loadCatalog(fs, root, pack);
    const diagnostics = validateCatalog(catalog, pack);
    for (const diagnostic of diagnostics) console.log(formatDiagnostic(diagnostic));
    const errors = diagnostics.filter((d) => d.level === 'error').length;
    const warnings = diagnostics.length - errors;
    console.log(
      `content/${pack.contentDir} : ${catalog.core.ruleSets.length} ensembles core, ${catalog.profiles.size} profil(s), ${catalog.options.size} option(s) — ${errors} erreur(s), ${warnings} avertissement(s)`,
    );
    failed = failed || hasErrors(diagnostics);
  }
  process.exitCode = failed ? 1 : 0;
} catch (error) {
  if (error instanceof PrepworkError) {
    console.error(`[${error.code}] ${error.message}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
