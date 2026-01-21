// Assemblage de la CLI (commander). Les commandes sont fines : chargement du catalogue,
// appel du moteur, rapport. Toutes les dépendances sont injectées pour les tests.
import { Command } from 'commander';
import { defaultContentRoot, loadCatalog, validateCatalog } from '../catalog/index.js';
import type { Catalog } from '../catalog/load.js';
import { pickText } from '../catalog/text.js';
import { parseScaffold, readScaffoldText, readStackTarget, SCAFFOLD_FILE } from '../config/io.js';
import { runCheck, runInit, runSync, type EngineDeps } from '../engine/index.js';
import { formatDiagnostic, hasErrors, PrepworkError } from '../errors.js';
import type { FileSystem } from '../fs/types.js';
import { joinPath, toPosix } from '../fs/types.js';
import { getPack, PACK_IDS } from '../packs/index.js';
import type { QuestionnaireInput, StackPack } from '../packs/types.js';
import type { Prompter } from '../questionnaire/prompter.js';
import { readGlobalGitIdentity, setupGitRepository, type CommandRunner } from './git.js';
import { createConsoleReporter, isClean, reportPlan, type Reporter } from './report.js';

export interface CliDeps {
  fs: FileSystem;
  /** Fabrique du prompteur interactif (appelée seulement si `init` a besoin du questionnaire). */
  prompter: () => Prompter;
  commands: CommandRunner;
  reporter?: Reporter | undefined;
  toolVersion: string;
  /** Racine du catalogue ; par défaut le `content/` livré. */
  contentRoot?: string | undefined;
  /** Répertoire de travail servant de base aux chemins relatifs. */
  cwd: string;
  /** Date injectable (tests). */
  today?: string | undefined;
}

export interface CliResult {
  exitCode: number;
}

async function loadValidatedCatalog(
  deps: CliDeps,
  reporter: Reporter,
  pack: StackPack,
): Promise<Catalog> {
  const catalog = await loadCatalog(deps.fs, deps.contentRoot ?? defaultContentRoot(), pack);
  const diagnostics = validateCatalog(catalog, pack);
  for (const d of diagnostics)
    (d.level === 'error' ? reporter.error : reporter.warn)(formatDiagnostic(d));
  if (hasErrors(diagnostics)) {
    throw new PrepworkError(
      'CATALOG_INVALID',
      'le catalogue content/ est incohérent (voir ci-dessus)',
    );
  }
  return catalog;
}

function resolveDir(deps: CliDeps, dir: string | undefined): string {
  const target = dir ?? '.';
  const posix = toPosix(target);
  const absolute = /^([a-zA-Z]:)?\//.test(posix);
  return absolute ? posix : joinPath(deps.cwd, posix);
}

function profileChoices(catalog: Catalog): QuestionnaireInput['profiles'] {
  return [...catalog.profiles.values()].map((p) => ({
    id: p.id,
    summary: pickText(p.profile.meta.summary, 'fr'),
    whenToUse: p.profile.meta.when_to_use.map((t) => pickText(t, 'fr')),
  }));
}

export function createProgram(deps: CliDeps): { program: Command; result: CliResult } {
  const reporter = deps.reporter ?? createConsoleReporter();
  const result: CliResult = { exitCode: 0 };
  const program = new Command();
  program
    .name('prepwork')
    .description(
      `Prépare un projet (${PACK_IDS.join(', ')}) : squelette, conventions et spécifications pour l'agent.`,
    )
    .version(deps.toolVersion)
    .exitOverride()
    .configureOutput({
      writeErr: (s) => {
        reporter.error(s.trimEnd());
      },
      writeOut: (s) => {
        reporter.info(s.trimEnd());
      },
    });

  const engineDeps = (catalog: Catalog, pack: StackPack): EngineDeps => ({
    fs: deps.fs,
    catalog,
    pack,
    toolVersion: deps.toolVersion,
    today: deps.today,
  });

  /** Pack d'un projet existant : lu dans son `scaffold.yaml` (absence = `spring-boot`). */
  const packOfProject = async (projectDir: string): Promise<StackPack> =>
    getPack(readStackTarget(await readScaffoldText(deps.fs, projectDir), SCAFFOLD_FILE));

  program
    .command('init')
    .description('Questionnaire, scaffold.yaml et génération complète dans un répertoire vide')
    .argument('[dir]', 'répertoire cible (créé si absent)', '.')
    .option('--scaffold <file>', 'utiliser ce scaffold.yaml au lieu du questionnaire')
    .option('--stack <id>', `stack cible (${PACK_IDS.join(', ')})`)
    .option('--dry-run', 'calculer le plan sans rien écrire', false)
    .option('--no-git', 'ne pas initialiser ni configurer le dépôt git')
    .action(
      async (
        dir: string,
        options: { scaffold?: string; stack?: string; dryRun: boolean; git: boolean },
      ) => {
        const projectDir = resolveDir(deps, dir);

        let scaffold;
        let extras;
        let pack: StackPack;
        let catalog: Catalog;
        if (options.scaffold) {
          const path = resolveDir(deps, options.scaffold);
          const text = await deps.fs.readText(path);
          if (text === undefined)
            throw new PrepworkError('SCAFFOLD_NOT_FOUND', `${path} introuvable`);
          pack = getPack(options.stack ?? readStackTarget(text, path));
          catalog = await loadValidatedCatalog(deps, reporter, pack);
          scaffold = parseScaffold(text, pack, path);
        } else {
          pack = getPack(options.stack);
          catalog = await loadValidatedCatalog(deps, reporter, pack);
          if (pack.runQuestionnaire === undefined) {
            throw new PrepworkError(
              'UNKNOWN_STACK',
              `la stack \`${pack.id}\` n'a pas encore de questionnaire : utiliser --scaffold`,
            );
          }
          const identity = await readGlobalGitIdentity(deps.commands);
          const answers = await pack.runQuestionnaire(deps.prompter(), {
            profiles: profileChoices(catalog),
            gitIdentity: identity,
          });
          scaffold = answers.scaffold;
          extras = answers.extras;
        }

        const outcome = await runInit(engineDeps(catalog, pack), {
          projectDir,
          scaffold,
          extras,
          dryRun: options.dryRun,
        });
        reportPlan(reporter, outcome.plan, {
          verb: options.dryRun ? 'Plan (dry-run)' : 'Généré',
          executed: !options.dryRun,
        });
        if (options.dryRun) return;

        reporter.info(`scaffold.yaml et .scaffold/manifest.json écrits dans ${projectDir}`);
        if (options.git) {
          const hasGitDir = await deps.fs.exists(joinPath(projectDir, '.git'));
          const git = await setupGitRepository(
            deps.commands,
            projectDir,
            scaffold.git.author,
            hasGitDir,
          );
          if (git.problem !== undefined) {
            reporter.warn(
              `git non configuré (${git.problem}) : lancer \`git init\` et \`git config core.hooksPath .githooks\` à la main`,
            );
          } else {
            reporter.info(
              `git ${git.initialized ? 'initialisé' : 'existant'} : auteur et hooks (.githooks) configurés`,
            );
          }
        }
        reporter.info(
          "Le hook pre-commit exige gitleaks (https://github.com/gitleaks/gitleaks#installing) : sans lui, aucun commit n'est possible.",
        );
        const first = pack.presentation
          .initialCommands()
          .map((command) => `\`${command}\``)
          .join(', puis ');
        reporter.info(`Prochaine étape : ${first}, puis un premier commit par l'équipe.`);
      },
    );

  program
    .command('check')
    .description(
      "Calcule le plan de génération et le rapporte, sans rien écrire (code 1 si le projet n'est pas à jour)",
    )
    .argument('[dir]', 'répertoire du projet', '.')
    .option('--dry-run', "sans effet : check n'écrit jamais", false)
    .action(async (dir: string) => {
      const projectDir = resolveDir(deps, dir);
      const pack = await packOfProject(projectDir);
      const catalog = await loadValidatedCatalog(deps, reporter, pack);
      const outcome = await runCheck(engineDeps(catalog, pack), projectDir);
      reportPlan(reporter, outcome.plan, { verb: 'Plan', executed: false });
      if (isClean(outcome.plan)) reporter.info('Projet à jour.');
      else result.exitCode = 1;
    });

  program
    .command('sync')
    .description('Met à jour les fichiers générés intacts, signale les autres')
    .argument('[dir]', 'répertoire du projet', '.')
    .option('--dry-run', 'calculer le plan sans rien écrire', false)
    .action(async (dir: string, options: { dryRun: boolean }) => {
      const projectDir = resolveDir(deps, dir);
      const pack = await packOfProject(projectDir);
      const catalog = await loadValidatedCatalog(deps, reporter, pack);
      const outcome = await runSync(engineDeps(catalog, pack), projectDir, {
        dryRun: options.dryRun,
      });
      reportPlan(reporter, outcome.plan, {
        verb: options.dryRun ? 'Plan (dry-run)' : 'Synchronisé',
        executed: !options.dryRun,
      });
      if (isClean(outcome.plan)) reporter.info('Projet déjà à jour.');
    });

  return { program, result };
}

/** Exécute la CLI sur `argv` (sans node/script) et retourne le code de sortie. */
export async function runCli(deps: CliDeps, argv: readonly string[]): Promise<number> {
  const reporter = deps.reporter ?? createConsoleReporter();
  const { program, result } = createProgram({ ...deps, reporter });
  try {
    await program.parseAsync([...argv], { from: 'user' });
    return result.exitCode;
  } catch (error) {
    if (error instanceof PrepworkError) {
      if (error.code === 'CANCELLED') {
        reporter.warn(error.message);
        return 130;
      }
      reporter.error(`[${error.code}] ${error.message}`);
      return 1;
    }
    if (
      typeof error === 'object' &&
      error !== null &&
      'exitCode' in error &&
      typeof error.exitCode === 'number'
    ) {
      // commander : --help, --version, erreur d'usage
      return error.exitCode;
    }
    throw error;
  }
}
