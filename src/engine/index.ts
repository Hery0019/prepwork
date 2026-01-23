// API haut niveau du moteur : composition → rendu → plan → exécution, pour les trois commandes.
//   init  : plan sur un répertoire vide, exécution complète, écriture de scaffold.yaml
//   check : plan calculé et rapporté, zéro écriture
//   sync  : plan contre le manifeste, exécution des seules opérations sûres
import type { Catalog } from '../catalog/load.js';
import { readScaffold, SCAFFOLD_FILE, serializeScaffold } from '../config/io.js';
import type { BaseScaffold } from '../config/schema.js';
import type { StackPack } from '../packs/types.js';
import { PrepworkError } from '../errors.js';
import type { FileSystem } from '../fs/types.js';
import { joinPath } from '../fs/types.js';
import { getRenderer } from '../renderers/index.js';
import { compose, type Composition } from './compose.js';
import type { ComposeExtras } from './context.js';
import { executePlan, type ExecutionResult } from './execute.js';
import { readManifest } from './manifest.js';
import { buildPlan, type Plan } from './plan.js';
import { renderProject } from './render.js';

export { compose, type Composition } from './compose.js';
export type { ComposeExtras, TemplateContext } from './context.js';
export { executePlan, type ExecutionResult } from './execute.js';
export { hashContent } from './hash.js';
export { MANIFEST_PATH, readManifest, serializeManifest, type Manifest } from './manifest.js';
export {
  buildPlan,
  OPERATION_KINDS,
  type Operation,
  type OperationKind,
  type Plan,
} from './plan.js';
export { renderProject, type GeneratedFile } from './render.js';

export interface EngineDeps {
  fs: FileSystem;
  catalog: Catalog;
  /** Pack de la stack du projet, cohérent avec le catalogue chargé. */
  pack: StackPack;
  toolVersion: string;
  /** Date injectable pour des rendus déterministes (tests). */
  today?: string | undefined;
}

export interface InitRequest {
  projectDir: string;
  scaffold: BaseScaffold;
  extras?: ComposeExtras | undefined;
  dryRun?: boolean | undefined;
}

export interface EngineResult {
  composition: Composition;
  plan: Plan;
  /** Absent pour `check` et pour les plans non exécutés. */
  execution?: ExecutionResult | undefined;
}

/** Entrées tolérées dans un répertoire cible d'`init` (dépôt git fraîchement créé). */
const TOLERATED_IN_EMPTY_DIR = new Set(['.git']);

async function renderAndPlan(
  deps: EngineDeps,
  projectDir: string,
  scaffold: BaseScaffold,
  extras: ComposeExtras | undefined,
): Promise<{ composition: Composition; plan: Plan }> {
  const composition = compose(deps.catalog, scaffold, deps.pack, {
    toolVersion: deps.toolVersion,
    extras,
    today: deps.today,
  });
  const files = renderProject(composition, getRenderer(scaffold.renderer));
  const previous = await readManifest(deps.fs, projectDir);
  const plan = await buildPlan(deps.fs, projectDir, files, previous, {
    scaffoldVersion: scaffold.scaffold_version,
    profileVersion: composition.profile.profile.meta.version,
  });
  return { composition, plan };
}

export async function runInit(deps: EngineDeps, request: InitRequest): Promise<EngineResult> {
  const { fs } = deps;
  const entries = await fs.list(request.projectDir);
  const blocking = entries.filter((e) => !TOLERATED_IN_EMPTY_DIR.has(e.name)).map((e) => e.name);
  if (blocking.length > 0) {
    throw new PrepworkError(
      'TARGET_NOT_EMPTY',
      `${request.projectDir} n'est pas vide (${blocking.slice(0, 5).join(', ')}${blocking.length > 5 ? ', …' : ''}) : \`init\` exige un répertoire vide`,
    );
  }
  const { composition, plan } = await renderAndPlan(
    deps,
    request.projectDir,
    request.scaffold,
    request.extras,
  );
  if (plan.summary.conflict > 0 || plan.summary['skip-modified'] > 0) {
    throw new PrepworkError(
      'PLAN_CONFLICT',
      'plan inattendu sur un répertoire vide : conflits détectés',
    );
  }
  if (request.dryRun)
    return { composition, plan, execution: { written: [], deleted: [], dryRun: true } };

  await fs.writeText(
    joinPath(request.projectDir, SCAFFOLD_FILE),
    serializeScaffold(request.scaffold),
  );
  const execution = await executePlan(fs, request.projectDir, plan);
  return { composition, plan, execution };
}

export async function runCheck(deps: EngineDeps, projectDir: string): Promise<EngineResult> {
  const scaffold = await readScaffold(deps.fs, projectDir, deps.pack);
  const { composition, plan } = await renderAndPlan(deps, projectDir, scaffold, undefined);
  return { composition, plan };
}

export async function runSync(
  deps: EngineDeps,
  projectDir: string,
  options: { dryRun?: boolean | undefined } = {},
): Promise<EngineResult> {
  const scaffold = await readScaffold(deps.fs, projectDir, deps.pack);
  const { composition, plan } = await renderAndPlan(deps, projectDir, scaffold, undefined);
  const execution = await executePlan(deps.fs, projectDir, plan, {
    dryRun: options.dryRun ?? false,
  });
  return { composition, plan, execution };
}
