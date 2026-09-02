// Interactions git de la CLI, derrière une interface injectable : lecture de l'identité
// globale (pré-remplissage du questionnaire) et initialisation du dépôt après `init`.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface CommandRunner {
  /** Exécute une commande ; résout avec stdout, rejette si le code de sortie est non nul. */
  run(command: string, args: string[], cwd?: string): Promise<string>;
}

export function createNodeCommandRunner(): CommandRunner {
  return {
    async run(command, args, cwd) {
      const { stdout } = await execFileAsync(command, args, { cwd, windowsHide: true });
      return stdout;
    },
  };
}

export interface GitIdentity {
  name?: string | undefined;
  email?: string | undefined;
}

export async function readGlobalGitIdentity(runner: CommandRunner): Promise<GitIdentity> {
  const read = async (key: string): Promise<string | undefined> => {
    try {
      const value = (await runner.run('git', ['config', '--global', '--get', key])).trim();
      return value.length > 0 ? value : undefined;
    } catch {
      return undefined;
    }
  };
  return { name: await read('user.name'), email: await read('user.email') };
}

export interface GitSetupResult {
  initialized: boolean;
  configured: boolean;
  /** Message d'erreur si git n'est pas disponible ; la génération reste valide. */
  problem?: string | undefined;
}

/**
 * Après `init` : dépôt git créé s'il n'existe pas, auteur et hooks configurés localement.
 * Jamais de commit ni de push : c'est à l'équipe.
 */
export async function setupGitRepository(
  runner: CommandRunner,
  projectDir: string,
  author: { name: string; email: string },
  hasGitDir: boolean,
): Promise<GitSetupResult> {
  try {
    let initialized = false;
    if (!hasGitDir) {
      await runner.run('git', ['init', '--initial-branch=main'], projectDir);
      initialized = true;
    }
    await runner.run('git', ['config', 'user.name', author.name], projectDir);
    await runner.run('git', ['config', 'user.email', author.email], projectDir);
    await runner.run('git', ['config', 'core.hooksPath', '.githooks'], projectDir);
    return { initialized, configured: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message.split('\n')[0] : String(error);
    return { initialized: false, configured: false, problem: detail };
  }
}
