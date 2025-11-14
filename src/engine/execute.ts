// Exécution d'un plan : n'écrit que les opérations sûres (`create`, `update`, `delete`),
// puis le manifeste. `skip-modified` et `conflict` restent des rapports.
import type { FileSystem } from '../fs/types.js';
import { joinPath } from '../fs/types.js';
import { MANIFEST_PATH, serializeManifest } from './manifest.js';
import type { Operation, Plan } from './plan.js';

export interface ExecutionResult {
  written: string[];
  deleted: string[];
  /** Vrai quand rien n'a été écrit (`dryRun`). */
  dryRun: boolean;
}

export function isWriteOperation(operation: Operation): boolean {
  return operation.kind === 'create' || operation.kind === 'update';
}

export async function executePlan(
  fs: FileSystem,
  projectDir: string,
  plan: Plan,
  options: { dryRun?: boolean | undefined } = {},
): Promise<ExecutionResult> {
  const dryRun = options.dryRun ?? false;
  const written: string[] = [];
  const deleted: string[] = [];
  for (const operation of plan.operations) {
    if (isWriteOperation(operation) && operation.content !== undefined) {
      if (!dryRun) await fs.writeText(joinPath(projectDir, operation.path), operation.content);
      written.push(operation.path);
    } else if (operation.kind === 'delete') {
      if (!dryRun) await fs.remove(joinPath(projectDir, operation.path));
      deleted.push(operation.path);
    }
  }
  if (!dryRun)
    await fs.writeText(joinPath(projectDir, MANIFEST_PATH), serializeManifest(plan.manifest));
  return { written, deleted, dryRun };
}
