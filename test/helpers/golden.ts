// Comparaison avec des fichiers "golden" commités. `UPDATE_GOLDEN=1 pnpm test` les réécrit.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { expect } from 'vitest';

export interface GoldenFile {
  path: string;
  content: string;
}

export async function expectGolden(goldenDir: string, files: readonly GoldenFile[]): Promise<void> {
  const update = process.env.UPDATE_GOLDEN === '1';
  for (const file of files) {
    const target = join(goldenDir, file.path);
    if (update) {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, file.content, 'utf8');
      continue;
    }
    const expected = await readFile(target, 'utf8').catch(() => undefined);
    expect(expected, `golden manquant : ${target} (UPDATE_GOLDEN=1 pour le créer)`).toBeDefined();
    expect(file.content, `écart avec ${target}`).toBe(expected);
  }
}
