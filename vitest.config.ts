import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
    // Les tests comparent des fichiers "golden" : pas de parallélisme intra-fichier
    // pour garder les rapports lisibles.
    fileParallelism: true,
  },
});
