// Manifeste des fichiers générés : `.scaffold/manifest.json` (CLAUDE.md §6).
// Tout fichier listé est « généré, ne pas éditer » ; sa présence et son empreinte pilotent `sync`.
import { z } from 'zod';
import { PrepworkError } from '../errors.js';
import type { FileSystem } from '../fs/types.js';
import { joinPath } from '../fs/types.js';

export const MANIFEST_PATH = '.scaffold/manifest.json';

export const ManifestEntrySchema = z
  .object({ path: z.string().min(1), hash: z.string().regex(/^sha256:[0-9a-f]{64}$/) })
  .strict();

export const ManifestSchema = z
  .object({
    scaffold_version: z.string().regex(/^\d+\.\d+\.\d+$/),
    profile_version: z.string().regex(/^\d+\.\d+\.\d+$/),
    files: z.array(ManifestEntrySchema),
  })
  .strict();

export type Manifest = z.infer<typeof ManifestSchema>;
export type ManifestEntry = z.infer<typeof ManifestEntrySchema>;

export function parseManifest(text: string, source = MANIFEST_PATH): Manifest {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new PrepworkError('MANIFEST_INVALID', `${source} : JSON invalide`, { cause: error });
  }
  const result = ManifestSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.map(String).join('.') || '(racine)'} : ${i.message}`)
      .join('\n');
    throw new PrepworkError('MANIFEST_INVALID', `${source} : schéma invalide\n${details}`);
  }
  return result.data;
}

/** `undefined` quand le projet n'a pas encore de manifeste. */
export async function readManifest(
  fs: FileSystem,
  projectDir: string,
): Promise<Manifest | undefined> {
  const path = joinPath(projectDir, MANIFEST_PATH);
  const text = await fs.readText(path);
  return text === undefined ? undefined : parseManifest(text, path);
}

export function serializeManifest(manifest: Manifest): string {
  const sorted: Manifest = {
    scaffold_version: manifest.scaffold_version,
    profile_version: manifest.profile_version,
    files: [...manifest.files].sort((a, b) => a.path.localeCompare(b.path)),
  };
  return `${JSON.stringify(sorted, null, 2)}\n`;
}

export function manifestIndex(manifest: Manifest | undefined): Map<string, string> {
  return new Map((manifest?.files ?? []).map((entry) => [entry.path, entry.hash]));
}
