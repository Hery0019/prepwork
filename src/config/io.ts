import { parse, stringify } from 'yaml';
import { PrepworkError } from '../errors.js';
import type { FileSystem } from '../fs/types.js';
import { joinPath } from '../fs/types.js';
import { ScaffoldSchema, type Scaffold } from './schema.js';

export const SCAFFOLD_FILE = 'scaffold.yaml';

export function parseScaffold(text: string, source = SCAFFOLD_FILE): Scaffold {
  let raw: unknown;
  try {
    raw = parse(text, { uniqueKeys: true });
  } catch (error) {
    throw new PrepworkError('SCAFFOLD_INVALID', `${source} : YAML invalide`, { cause: error });
  }
  const result = ScaffoldSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.map(String).join('.') || '(racine)'} : ${i.message}`)
      .join('\n');
    throw new PrepworkError('SCAFFOLD_INVALID', `${source} : schéma invalide\n${details}`);
  }
  return result.data;
}

export async function readScaffold(fs: FileSystem, projectDir: string): Promise<Scaffold> {
  const path = joinPath(projectDir, SCAFFOLD_FILE);
  const text = await fs.readText(path);
  if (text === undefined) {
    throw new PrepworkError(
      'SCAFFOLD_NOT_FOUND',
      `${path} introuvable : lancez \`prepwork init\` d'abord`,
    );
  }
  return parseScaffold(text, path);
}

/** Sérialisation canonique : ordre des clés du schéma, sans ancre ni alias. */
export function serializeScaffold(scaffold: Scaffold): string {
  const header = '# Généré par prepwork. Seule entrée de `prepwork sync` et `prepwork check`.\n';
  return header + stringify(scaffold, { lineWidth: 0 });
}
