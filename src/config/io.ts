// Lecture et écriture de `scaffold.yaml`. Le fichier désigne son pack par `stack.target` ;
// son absence vaut `spring-boot` (scaffolds écrits avant l'ADR 0007).
import { parse, stringify } from 'yaml';
import { PrepworkError } from '../errors.js';
import type { FileSystem } from '../fs/types.js';
import { joinPath } from '../fs/types.js';
import type { ScaffoldParser } from '../packs/types.js';
import { DEFAULT_STACK_TARGET, type BaseScaffold } from './schema.js';

export const SCAFFOLD_FILE = 'scaffold.yaml';

/** Ce dont `parseScaffold` a besoin d'un pack : son schéma. */
export interface ScaffoldPack {
  scaffoldSchema: ScaffoldParser;
}

function parseYamlText(text: string, source: string): unknown {
  try {
    return parse(text, { uniqueKeys: true });
  } catch (error) {
    throw new PrepworkError('SCAFFOLD_INVALID', `${source} : YAML invalide`, { cause: error });
  }
}

/** Identifiant du pack déclaré par un `scaffold.yaml`, sans le valider entièrement. */
export function readStackTarget(text: string, source = SCAFFOLD_FILE): string {
  const raw = parseYamlText(text, source);
  if (typeof raw !== 'object' || raw === null) return DEFAULT_STACK_TARGET;
  const stack = (raw as { stack?: unknown }).stack;
  if (typeof stack !== 'object' || stack === null) return DEFAULT_STACK_TARGET;
  const target = (stack as { target?: unknown }).target;
  return typeof target === 'string' ? target : DEFAULT_STACK_TARGET;
}

export function parseScaffold(
  text: string,
  pack: ScaffoldPack,
  source = SCAFFOLD_FILE,
): BaseScaffold {
  const raw = parseYamlText(text, source);
  const result = pack.scaffoldSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.map(String).join('.') || '(racine)'} : ${i.message}`)
      .join('\n');
    throw new PrepworkError('SCAFFOLD_INVALID', `${source} : schéma invalide\n${details}`);
  }
  return result.data;
}

/** Texte de `scaffold.yaml` d'un projet, ou une erreur typée s'il est absent. */
export async function readScaffoldText(fs: FileSystem, projectDir: string): Promise<string> {
  const path = joinPath(projectDir, SCAFFOLD_FILE);
  const text = await fs.readText(path);
  if (text === undefined) {
    throw new PrepworkError(
      'SCAFFOLD_NOT_FOUND',
      `${path} introuvable : lancez \`prepwork init\` d'abord`,
    );
  }
  return text;
}

export async function readScaffold(
  fs: FileSystem,
  projectDir: string,
  pack: ScaffoldPack,
): Promise<BaseScaffold> {
  const text = await readScaffoldText(fs, projectDir);
  return parseScaffold(text, pack, joinPath(projectDir, SCAFFOLD_FILE));
}

/** Sérialisation canonique : ordre des clés du schéma, sans ancre ni alias. */
export function serializeScaffold(scaffold: BaseScaffold): string {
  const header = '# Généré par prepwork. Seule entrée de `prepwork sync` et `prepwork check`.\n';
  return header + stringify(scaffold, { lineWidth: 0 });
}
