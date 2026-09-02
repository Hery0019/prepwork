import type { FileSystem } from './types.js';
import { joinPath } from './types.js';

/** Liste récursive des fichiers sous `dir`, en chemins relatifs POSIX triés ; `[]` si absent. */
export async function walkFiles(fs: FileSystem, dir: string): Promise<string[]> {
  const result: string[] = [];
  const visit = async (relative: string): Promise<void> => {
    const entries = await fs.list(relative === '' ? dir : joinPath(dir, relative));
    for (const entry of entries) {
      const child = relative === '' ? entry.name : `${relative}/${entry.name}`;
      if (entry.kind === 'directory') await visit(child);
      else result.push(child);
    }
  };
  await visit('');
  return result.sort((a, b) => a.localeCompare(b));
}
