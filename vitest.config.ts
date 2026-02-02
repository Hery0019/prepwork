import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Un golden file peut contenir le test d'un projet généré : ce n'est pas un test de l'outil.
    exclude: ['**/node_modules/**', 'test/**/golden/**'],
    environment: 'node',
    passWithNoTests: true,
    // Les tests comparent des fichiers "golden" : pas de parallélisme intra-fichier
    // pour garder les rapports lisibles.
    fileParallelism: true,
  },
});
